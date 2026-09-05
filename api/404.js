// 404 amigável para agentes: sempre status 404, com corpo que ensina o caminho de volta.
// Agentes que pedem markdown (Accept: text/markdown) recebem markdown com links de
// recuperação; navegadores recebem uma página HTML no visual do site.
// Sem dependências — só o runtime Node da Vercel.
//
// Roteado pelo catch-all em vercel.json. Ver também: negociacao.js (Vary: Accept).

const SITE = 'https://cadeufpel.com';

// Prefere markdown quando o cliente pede text/markdown com q maior (ou igual) ao de text/html.
// RFC 9110 §12.5.1: sem q explícito, q=1. `*/*` não conta como pedido explícito de markdown.
function preferMarkdown(accept) {
  if (!accept) return false;

  const q = {};
  String(accept).split(',').forEach((parte) => {
    const bits = parte.trim().split(';');
    const tipo = bits.shift().trim().toLowerCase();
    if (!tipo) return;
    let peso = 1;
    bits.forEach((p) => {
      const m = /^\s*q=([0-9.]+)\s*$/i.exec(p);
      if (m) peso = parseFloat(m[1]);
    });
    // primeiro valor vence se o tipo repetir
    if (!(tipo in q)) q[tipo] = isNaN(peso) ? 1 : peso;
  });

  const md = q['text/markdown'];
  if (md === undefined || md === 0) return false;
  const html = q['text/html'];
  return html === undefined ? true : md >= html;
}

const MARKDOWN = `# 404 — Página não encontrada

Este caminho não existe no site do CADe UFPel. Nada foi movido: a URL pedida
simplesmente nunca existiu.

## Onde procurar

- [Início](${SITE}/) — agenda, quem somos, guia do calouro, oportunidades, FAQ e formulários
- [Sobre o CADe](${SITE}/sobre) — o que é a organização, como a gestão é eleita, onde ficamos
- [Contato](${SITE}/contato) — e-mail, Instagram, formulários e para onde levar cada assunto
- [Privacidade](${SITE}/privacidade) — o que fazemos com os dados dos formulários
- [Galeria](${SITE}/galeria) — fotos de eventos e gestões anteriores

## Arquivos para agentes

- [/llms.txt](${SITE}/llms.txt) — resumo do site, casos de uso e quando recorrer a ele
- [/sitemap.xml](${SITE}/sitemap.xml) — todas as URLs canônicas
- [/robots.txt](${SITE}/robots.txt) — regras de rastreamento

Todas as páginas também respondem em markdown via \`Accept: text/markdown\`.
`;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b6d">
<title>404 — Página não encontrada — CADe UFPel</title>
<meta name="description" content="Este caminho não existe no site do CADe UFPel. Veja onde encontrar o que você procurava.">
<meta name="robots" content="noindex, follow">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/nav.css">
<link rel="stylesheet" href="/css/secoes.css">
<link rel="stylesheet" href="/css/icons.css">
<link rel="stylesheet" href="/css/responsivo.css">
<link rel="stylesheet" href="/css/institucional.css">
</head>
<body>

<header class="nav" data-od-id="nav">
  <div class="wrap nav-inner">
    <a class="nav-marca" href="/" aria-label="CADe UFPel — início" data-od-id="nav-marca">
      <img src="/assets/logo-cade.svg" alt="CADe UFPel" width="75" height="36">
    </a>
    <a class="nav-cta" href="/#form-participar" data-od-id="nav-cta">
      Quero participar
      <span class="m-icon m-icon--16" aria-hidden="true">&#xe5c8;</span>
    </a>
  </div>
</header>

<main id="topo">
<div class="area" id="area-404" style="background:var(--bg-cade)" data-od-id="area-404">
  <section class="sec wrap" data-od-id="erro-404">
    <div class="sec-head">
      <p class="eyebrow">ERRO 404</p>
      <h1 class="h-sec">Essa página não existe.</h1>
      <p class="lead">O endereço que você abriu não corresponde a nenhuma página do site. Talvez o link esteja incompleto ou tenha vindo com um caractere a mais.</p>
    </div>

    <div class="inst-prosa" data-od-id="erro-404-links">
      <h2>Onde procurar</h2>
      <ul class="inst-canais">
        <li><span><b><a href="/">Início</a></b> — agenda de eventos, quem somos, guia do calouro, oportunidades, FAQ e formulários.</span></li>
        <li><span><b><a href="/sobre">Sobre o CADe</a></b> — o que é a organização, como a gestão é eleita e onde ficamos.</span></li>
        <li><span><b><a href="/contato">Contato</a></b> — e-mail, Instagram, formulários e para onde levar cada assunto.</span></li>
        <li><span><b><a href="/privacidade">Privacidade</a></b> — o que fazemos com os dados dos formulários.</span></li>
        <li><span><b><a href="/galeria">Galeria</a></b> — fotos de eventos, festas e gestões anteriores.</span></li>
      </ul>
      <p class="inst-nota">Se você chegou aqui por um link do próprio site, avise a gente pelo <a href="/contato">contato</a> que corrigimos.</p>
    </div>
  </section>
</div>
</main>

</body>
</html>
`;

// No 404 a regra é o inverso da home: HTML é a exceção, não o padrão.
// Quem chega aqui sem pedir text/html (curl, agente, checker — Accept ausente ou `*/*`)
// é cliente programático e precisa do corpo em markdown com os links de recuperação.
// Só navegador, que manda text/html explícito, recebe a página estilizada.
function wantsHtml(accept) {
  if (!accept) return false;
  return preferMarkdown(accept) ? false : /\btext\/html\b/i.test(String(accept));
}

module.exports = (req, res) => {
  const md = !wantsHtml(req.headers && req.headers.accept);

  // Vary: Accept — o corpo muda conforme o Accept, então o CDN não pode reusar uma variante pela outra.
  res.setHeader('Vary', 'Accept, Accept-Encoding');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Link', `<${SITE}/sitemap.xml>; rel="sitemap", <${SITE}/llms.txt>; rel="help"`);
  res.setHeader('Content-Type', md ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8');

  res.statusCode = 404;
  res.end(md ? MARKDOWN : HTML);
};

module.exports.preferMarkdown = preferMarkdown;
module.exports.wantsHtml = wantsHtml;
