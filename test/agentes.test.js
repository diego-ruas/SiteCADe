// Checagem única e runnável do que este repo passou a prometer para agentes.
// Sem framework: `node test/agentes.test.js` (roda com o Node que a Vercel já usa).
//
// Cobre a lógica não trivial (negociação de Accept, RFC 9110 §12.5.1) e as
// promessas estáticas que quebram silenciosamente: cada página negociável tem
// .md, o Vary está declarado, e os links de recuperação do 404 existem.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const ler = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');

let ok = 0;
function teste(nome, fn) {
  fn();
  ok++;
  console.log('  ok  ' + nome);
}

// --------------------------------------------------------------------------
// 1. Negociação de Accept
// --------------------------------------------------------------------------
// O middleware é ESM; o 404 é CJS e exporta a mesma função. Testamos a do 404 e
// garantimos abaixo que as duas implementações são idênticas.
const { preferMarkdown } = require('../api/404.js');

console.log('\nnegociação de Accept (RFC 9110 §12.5.1)');

teste('pede markdown explicitamente -> markdown', () => {
  assert.strictEqual(preferMarkdown('text/markdown'), true);
  assert.strictEqual(preferMarkdown('text/markdown, text/plain'), true);
});

teste('navegador comum -> HTML', () => {
  // Accept real do Chrome: sem text/markdown, com */* no fim.
  assert.strictEqual(
    preferMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'),
    false
  );
});

teste('*/* sozinho nao conta como pedido de markdown', () => {
  // curl manda */*; deve continuar recebendo HTML, senão todo cliente vira markdown.
  assert.strictEqual(preferMarkdown('*/*'), false);
});

teste('Accept ausente ou vazio -> HTML', () => {
  assert.strictEqual(preferMarkdown(undefined), false);
  assert.strictEqual(preferMarkdown(''), false);
});

teste('q-value decide entre markdown e html', () => {
  assert.strictEqual(preferMarkdown('text/markdown;q=0.9, text/html;q=0.8'), true);
  assert.strictEqual(preferMarkdown('text/markdown;q=0.3, text/html;q=0.9'), false);
  // empate favorece markdown: foi pedido explicitamente
  assert.strictEqual(preferMarkdown('text/markdown;q=0.8, text/html;q=0.8'), true);
});

teste('q=0 rejeita o tipo (RFC 9110)', () => {
  assert.strictEqual(preferMarkdown('text/markdown;q=0'), false);
  assert.strictEqual(preferMarkdown('text/markdown;q=0, text/html'), false);
});

teste('tolera espaco, caixa alta e parametros extras', () => {
  assert.strictEqual(preferMarkdown('  TEXT/MARKDOWN  '), true);
  assert.strictEqual(preferMarkdown('text/markdown; charset=utf-8; q=0.9, text/html;q=0.5'), true);
});

teste('as duas implementacoes de preferMarkdown sao iguais', () => {
  // Se uma mudar sem a outra, a URL negociada e a do 404 divergem. Compara so a
  // logica: comentarios e arrow-vs-function nao contam como divergencia.
  const corpo = (s) => {
    const i = s.indexOf('function preferMarkdown');
    assert.notStrictEqual(i, -1, 'preferMarkdown nao encontrada');
    return s
      .slice(i, s.indexOf('\n}', i))
      .replace(/\/\/[^\n]*/g, '')          // comentarios de linha
      .replace(/function\s*\(/g, '(')      // function (x) { ... }
      .replace(/\)\s*=>\s*\{/g, ') {')     // (x) => { ... }
      .replace(/\s+/g, ' ')
      .trim();
  };
  assert.strictEqual(corpo(ler('api/404.js')), corpo(ler('middleware.js')));
});

// --------------------------------------------------------------------------
// 2. Cada página negociável tem markdown de verdade
// --------------------------------------------------------------------------
console.log('\nvariantes markdown');

const PAGINAS = [
  ['index.html', 'index.md'],
  ['sobre.html', 'sobre.md'],
  ['contato.html', 'contato.md'],
  ['privacidade.html', 'privacidade.md'],
  ['galeria.html', 'galeria.md']
];

teste('todo .html negociavel tem .md nao vazio', () => {
  PAGINAS.forEach(([html, md]) => {
    assert.ok(fs.existsSync(path.join(raiz, html)), html + ' nao existe');
    const texto = ler(md);
    assert.ok(texto.length > 200, md + ' curto demais: ' + texto.length);
    assert.ok(/^#\s+\S/m.test(texto), md + ' sem heading H1');
  });
});

teste('middleware mapeia exatamente as paginas existentes', () => {
  const mw = ler('middleware.js');
  PAGINAS.forEach(([html, md]) => {
    const limpa = '/' + html.replace(/\.html$/, '').replace(/^index$/, '');
    assert.ok(mw.indexOf("'/" + md.replace('.md', '') + ".md'") !== -1 || mw.indexOf("'/" + md + "'") !== -1,
      'middleware sem destino para ' + md);
    assert.ok(mw.indexOf("'" + limpa + "'") !== -1, 'middleware sem matcher para ' + limpa);
  });
});

teste('markdown das paginas aponta para llms.txt e sitemap', () => {
  PAGINAS.forEach(([, md]) => {
    const t = ler(md);
    assert.ok(t.indexOf('/llms.txt') !== -1, md + ' nao cita llms.txt');
    assert.ok(t.indexOf('/sitemap.xml') !== -1, md + ' nao cita sitemap.xml');
  });
});

// --------------------------------------------------------------------------
// 3. Vary e rotas no vercel.json
// --------------------------------------------------------------------------
console.log('\nvercel.json');

const cfg = JSON.parse(ler('vercel.json'));

teste('toda pagina negociavel declara Vary: Accept', () => {
  // Sem isto o CDN serve HTML cacheado a quem pediu markdown.
  const comVary = cfg.headers
    .filter((h) => h.headers.some((k) => k.key === 'Vary' && /\bAccept\b/.test(k.value)))
    .map((h) => h.source);

  ['/', '/sobre', '/contato', '/privacidade', '/galeria'].forEach((rota) => {
    assert.ok(comVary.indexOf(rota) !== -1, rota + ' sem Vary: Accept');
  });
  assert.ok(comVary.indexOf('/(.*).md') !== -1, '.md sem Vary: Accept');
});

teste('.md e servido como text/markdown', () => {
  const md = cfg.headers.find((h) => h.source === '/(.*).md');
  const ct = md.headers.find((k) => k.key === 'Content-Type');
  assert.strictEqual(ct.value, 'text/markdown; charset=utf-8');
});

teste('paginas anunciam o alternate em markdown', () => {
  ['/', '/sobre', '/contato', '/privacidade', '/galeria'].forEach((rota) => {
    const h = cfg.headers.find((x) => x.source === rota);
    const link = h.headers.find((k) => k.key === 'Link');
    assert.ok(link && /rel="alternate".*text\/markdown/.test(link.value), rota + ' sem Link alternate');
  });
});

teste('catch-all manda caminhos desconhecidos para o 404', () => {
  const cauda = cfg.rewrites[cfg.rewrites.length - 1];
  assert.strictEqual(cauda.source, '/(.*)');
  assert.strictEqual(cauda.destination, '/api/404');
});

teste('www e o dominio antigo redirecionam para o apex', () => {
  // Um 308 apex->www mascarava o dominio canonico na busca.
  const hosts = cfg.redirects
    .filter((r) => r.has)
    .map((r) => r.has[0].value);
  assert.ok(hosts.indexOf('www.cadeufpel.com') !== -1, 'www nao redireciona');
  assert.ok(hosts.indexOf('cade.diegoruas.com.br') !== -1, 'dominio antigo perdeu o redirect');
  cfg.redirects.forEach((r) => {
    assert.ok(r.destination.indexOf('www.') === -1, 'redirect aponta para www: ' + r.destination);
  });
});

teste('aliases em ingles apontam para as paginas pt-BR', () => {
  const mapa = {};
  cfg.redirects.forEach((r) => { mapa[r.source] = r.destination; });
  assert.strictEqual(mapa['/about'], '/sobre');
  assert.strictEqual(mapa['/contact'], '/contato');
  assert.strictEqual(mapa['/privacy'], '/privacidade');
});

// --------------------------------------------------------------------------
// 4. Páginas de confiança
// --------------------------------------------------------------------------
console.log('\npaginas de confianca');

teste('sobre/contato/privacidade passam de 500 caracteres de texto', () => {
  // O criterio do audit e conteudo real, nao markup.
  ['sobre.html', 'contato.html', 'privacidade.html'].forEach((f) => {
    const texto = ler(f)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    assert.ok(texto.length >= 500, f + ' com pouco texto: ' + texto.length);
  });
});

teste('paginas novas usam o mesmo shell (css, nav, footer)', () => {
  ['sobre.html', 'contato.html', 'privacidade.html'].forEach((f) => {
    const s = ler(f);
    assert.ok(s.indexOf('css/base.css') !== -1, f + ' sem base.css');
    assert.ok(s.indexOf('css/institucional.css') !== -1, f + ' sem institucional.css');
    assert.ok(s.indexOf('class="nav-toggle"') !== -1, f + ' sem nav');
    assert.ok(s.indexOf('data-od-id="footer"') !== -1, f + ' sem footer');
    assert.ok(s.indexOf('lang="pt-BR"') !== -1, f + ' sem lang pt-BR');
    // o CSS mobile depende de data-aberto; classe inventada deixaria o menu morto
    assert.ok(s.indexOf('links.dataset.aberto') !== -1, f + ' com toggle fora do contrato');
  });
});

teste('paginas novas tem canonical no apex e JSON-LD valido', () => {
  ['sobre.html', 'contato.html', 'privacidade.html'].forEach((f) => {
    const s = ler(f);
    const canon = /<link rel="canonical" href="([^"]+)"/.exec(s);
    assert.ok(canon, f + ' sem canonical');
    assert.ok(canon[1].indexOf('https://cadeufpel.com/') === 0, f + ' canonical fora do apex');
    assert.ok(canon[1].indexOf('www.') === -1, f + ' canonical com www');

    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(s);
    assert.ok(ld, f + ' sem JSON-LD');
    JSON.parse(ld[1]); // lanca se invalido
  });
});

teste('so usa codepoints de icone presentes no subset da fonte', () => {
  // AGENTS.md: o subset traz so os codepoints em uso; glifo novo vira retangulo vazio.
  const existentes = new Set();
  ['index.html', 'galeria.html'].forEach((f) => {
    (ler(f).match(/&#x[0-9a-fA-F]+;/g) || []).forEach((c) => existentes.add(c.toLowerCase()));
  });
  ['sobre.html', 'contato.html', 'privacidade.html', 'api/404.js'].forEach((f) => {
    (ler(f).match(/&#x[0-9a-fA-F]+;/g) || []).forEach((c) => {
      assert.ok(existentes.has(c.toLowerCase()), f + ' usa glifo fora do subset: ' + c);
    });
  });
});

// --------------------------------------------------------------------------
// 5. llms.txt, sitemap e 404
// --------------------------------------------------------------------------
console.log('\narquivos para agentes');

teste('llms.txt tem secao de quando usar', () => {
  const t = ler('llms.txt');
  assert.ok(/##\s*Quando usar/i.test(t), 'llms.txt sem "Quando usar"');
  assert.ok(/##\s*Como chamar/i.test(t), 'llms.txt sem "Como chamar"');
  assert.ok(/Accept:\s*text\/markdown/.test(t), 'llms.txt nao documenta a negociacao');
  // precisa dizer tambem para o que NAO serve, senao vira copy de marketing
  assert.ok(/Não é a fonte certa/.test(t), 'llms.txt sem limites de uso');
});

teste('sitemap lista as paginas de confianca, todas no apex', () => {
  const s = ler('sitemap.xml');
  const locs = (s.match(/<loc>([^<]+)<\/loc>/g) || []).map((l) => l.slice(5, -6));
  assert.ok(locs.length >= 5, 'sitemap com poucas URLs: ' + locs.length);
  ['/', '/sobre', '/contato', '/privacidade', '/galeria'].forEach((rota) => {
    assert.ok(locs.indexOf('https://cadeufpel.com' + rota) !== -1, 'sitemap sem ' + rota);
  });
  // www no <loc> reintroduziria a cadeia de redirect que escondia o dominio
  locs.forEach((l) => assert.ok(l.indexOf('www.') === -1, 'sitemap com www: ' + l));
});

teste('robots aponta para sitemap e llms.txt', () => {
  const t = ler('robots.txt');
  assert.ok(t.indexOf('Sitemap: https://cadeufpel.com/sitemap.xml') !== -1, 'robots sem sitemap');
  assert.ok(t.indexOf('/llms.txt') !== -1, 'robots sem llms.txt');
});

teste('404 responde 404 e oferece caminho de volta', () => {
  const s = ler('api/404.js');
  assert.ok(s.indexOf('res.statusCode = 404') !== -1, '404 nao devolve status 404');
  assert.ok(/Vary['"]?,\s*['"]Accept/.test(s), '404 sem Vary: Accept');
  assert.ok(s.indexOf('text/markdown; charset=utf-8') !== -1, '404 sem variante markdown');
  // o corpo tem que levar a algum lugar util
  ['/llms.txt', '/sitemap.xml', '/sobre', '/contato'].forEach((rota) => {
    assert.ok(s.indexOf(rota) !== -1, 'corpo do 404 nao cita ' + rota);
  });
});

console.log('\n' + ok + ' checagens passaram\n');
