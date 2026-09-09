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

const { parseCsv, normalizar } = require('../api/oportunidades.js');

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


// --------------------------------------------------------------------------
// 2. Oportunidades editáveis por planilha
// --------------------------------------------------------------------------
console.log('\noportunidades (planilha)');

teste('parseCsv aceita aspas, vírgulas, quebras, CRLF e BOM', () => {
  const linhas = parseCsv('\uFEFFpublicado,titulo\r\nsim,"Vaga, ""Design""\ncom quebra"\r\n');
  assert.deepStrictEqual(linhas, [
    ['publicado', 'titulo'],
    ['sim', 'Vaga, "Design"\ncom quebra']
  ]);
});

teste('normalizar filtra, valida e deduplica oportunidades', () => {
  const linhas = [
    ['publicado', 'tag', 'cor', 'titulo', 'resumo', 'texto', 'cta', 'link', 'expira'],
    ['', 'bolsa', 'verde', 'Rascunho', '', '', '', '', ''],
    ['nao', 'bolsa', 'verde', 'Não publicado', '', '', '', '', ''],
    ['SIM', 'bolsa', 'invalida', 'Título igual', 'Resumo A', '', '', 'sem-esquema', '11/09/2026'],
    ['x', '', 'ciano', 'Título igual', '', 'Texto B', 'Abrir', 'https://exemplo.test', '2026-09-11'],
    ['sim', 'edital', 'amarelo', '', '', '', '', '', ''],
    ['sim', 'edital', 'verde', 'Expirada', '', '', '', '', '2026-09-09']
  ];
  const itens = normalizar(linhas, '2026-09-10');

  assert.strictEqual(itens.length, 2);
  assert.deepStrictEqual(itens.map((item) => item.id), ['titulo-igual', 'titulo-igual-2']);
  assert.strictEqual(itens[0].cor, 'verde');
  assert.strictEqual(itens[0].link, 'https://www.instagram.com/cadesignufpel');
  assert.strictEqual(itens[1].cor, 'ciano');
  assert.strictEqual(itens[1].texto, 'Texto B');
});

teste('normalizar limita a doze oportunidades publicadas', () => {
  const linhas = [['publicado', 'titulo']];
  for (let i = 1; i <= 13; i++) linhas.push(['1', 'Oportunidade ' + i]);
  assert.strictEqual(normalizar(linhas, '2026-09-10').length, 12);
});

// --------------------------------------------------------------------------
// 2. Cada página negociável tem markdown de verdade
// --------------------------------------------------------------------------
console.log('\nvariantes markdown');

const PAGINAS = [
  { html: 'index.html', md: 'paginas/index.md', url: '/', urlMd: '/index.md' },
  { html: 'paginas/sobre.html', md: 'paginas/sobre.md', url: '/sobre', urlMd: '/sobre.md' },
  { html: 'paginas/contato.html', md: 'paginas/contato.md', url: '/contato', urlMd: '/contato.md' },
  { html: 'paginas/privacidade.html', md: 'paginas/privacidade.md', url: '/privacidade', urlMd: '/privacidade.md' },
  { html: 'paginas/galeria.html', md: 'paginas/galeria.md', url: '/galeria', urlMd: '/galeria.md' }
];

teste('markdown das paginas aponta para llms.txt e sitemap', () => {
  PAGINAS.forEach((p) => {
    const t = ler(p.md);
    assert.ok(t.indexOf('/llms.txt') !== -1, p.md + ' nao cita llms.txt');
    assert.ok(t.indexOf('/sitemap.xml') !== -1, p.md + ' nao cita sitemap.xml');
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

teste('paginas novas tem canonical no apex e JSON-LD valido', () => {
  PAGINAS.filter(p => p.url !== '/' && p.url !== '/galeria').forEach((p) => {
    const s = ler(p.html);
    const canon = /<link rel="canonical" href="([^"]+)"/.exec(s);
    assert.ok(canon, p.html + ' sem canonical');
    assert.ok(canon[1].indexOf('https://cadeufpel.com/') === 0, p.html + ' canonical fora do apex');
    assert.ok(canon[1].indexOf('www.') === -1, p.html + ' canonical com www');

    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(s);
    assert.ok(ld, p.html + ' sem JSON-LD');
    JSON.parse(ld[1]); // lanca se invalido
  });
});

// Percorre o JSON-LD e devolve todo no com @type Organization (inclusive aninhado
// em @graph, mainEntity ou publisher).
function organizacoes(json) {
  const achadas = [];
  (function anda(n) {
    if (Array.isArray(n)) return n.forEach(anda);
    if (!n || typeof n !== 'object') return;
    if (n['@type'] === 'Organization') achadas.push(n);
    Object.keys(n).forEach((k) => anda(n[k]));
  })(json);
  return achadas;
}

teste('toda Organization no JSON-LD tem contactPoint e address', () => {
  // O audit le a Organization de cada pagina isoladamente: faltar um dos dois
  // derruba a verificacao de legitimidade mesmo que outra pagina traga o campo.
  PAGINAS.filter(p => p.url !== '/galeria').forEach((p) => {
    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(ler(p.html));
    const orgs = organizacoes(JSON.parse(ld[1]));
    assert.ok(orgs.length, p.html + ' sem Organization no JSON-LD');

    // Referencias por @id ({"@id": "..."}) so apontam para o no completo do @graph.
    orgs.filter((o) => Object.keys(o).length > 2).forEach((org) => {
      assert.ok(org.contactPoint, p.html + ': Organization "' + org.name + '" sem contactPoint');
      const cp = [].concat(org.contactPoint)[0];
      assert.ok(cp.contactType, p.html + ': contactPoint sem contactType');
      assert.ok(cp.email || cp.telephone, p.html + ': contactPoint sem email nem telefone');

      assert.ok(org.address, p.html + ': Organization "' + org.name + '" sem address');
      assert.strictEqual(org.address['@type'], 'PostalAddress', p.html + ': address nao e PostalAddress');
      assert.ok(org.address.addressLocality && org.address.addressCountry, p.html + ': address incompleto');
    });
  });
});

teste('paginas negociaveis anunciam o .md e o llms.txt no head', () => {
  // Sem o rel=help o llms.txt so existia num comentario do robots.txt, que
  // nenhum parser de HTML le.
  PAGINAS.forEach((p) => {
    const s = ler(p.html);
    assert.ok(/<link rel="alternate" type="text\/markdown"/.test(s), p.html + ' sem alternate markdown');
    assert.ok(/<link rel="help"[^>]+llms\.txt/.test(s), p.html + ' sem rel=help para llms.txt');
  });
});


// --------------------------------------------------------------------------
// 5. llms.txt, sitemap e 404
// --------------------------------------------------------------------------
console.log('\narquivos para agentes');


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

teste('no 404, cliente programatico recebe markdown', () => {
  // O achado do audit pede corpo markdown no 404. Checker e curl nao mandam
  // Accept: text/markdown — mandam nada ou */*, e recebiam o shell HTML.
  const { wantsHtml } = require('../api/404.js');
  assert.strictEqual(wantsHtml(undefined), false, 'sem Accept deveria virar markdown');
  assert.strictEqual(wantsHtml(''), false);
  assert.strictEqual(wantsHtml('*/*'), false, 'curl deveria virar markdown');
  assert.strictEqual(wantsHtml('text/markdown'), false);
  assert.strictEqual(wantsHtml('application/json'), false);
  // navegador continua com a pagina estilizada
  assert.strictEqual(
    wantsHtml('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
    true
  );
  // se pedir os dois, o q decide
  assert.strictEqual(wantsHtml('text/markdown;q=0.3, text/html;q=0.9'), true);
  assert.strictEqual(wantsHtml('text/markdown, text/html;q=0.5'), false);
});


console.log('\n' + ok + ' checagens passaram\n');
