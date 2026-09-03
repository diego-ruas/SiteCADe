// Negociação de conteúdo markdown (acceptmarkdown.com) na MESMA URL da página HTML.
//
// Por que middleware e não `rewrites` no vercel.json: os rewrites da Vercel são
// avaliados DEPOIS do filesystem, então um rewrite de "/" nunca dispararia —
// index.html ganha antes. O middleware roda antes do cache e do filesystem.
//
// Sem dependências: só Web APIs (Request/Response/fetch), nada de @vercel/functions.
// A variante HTML recebe `Vary: Accept` pelos headers do vercel.json.

// Página canônica -> arquivo markdown equivalente.
const MD = {
  '/': '/index.md',
  '/index.html': '/index.md',
  '/sobre': '/sobre.md',
  '/sobre.html': '/sobre.md',
  '/contato': '/contato.md',
  '/contato.html': '/contato.md',
  '/privacidade': '/privacidade.md',
  '/privacidade.html': '/privacidade.md',
  '/galeria': '/galeria.md',
  '/galeria.html': '/galeria.md'
};

// RFC 9110 §12.5.1: sem q explícito, q=1. `*/*` não conta como pedido explícito
// de markdown — navegadores mandam `*/*` no fim e continuariam recebendo HTML.
function preferMarkdown(accept) {
  if (!accept) return false;

  const q = {};
  String(accept).split(',').forEach(function (parte) {
    const bits = parte.trim().split(';');
    const tipo = bits.shift().trim().toLowerCase();
    if (!tipo) return;
    let peso = 1;
    bits.forEach(function (p) {
      const m = /^\s*q=([0-9.]+)\s*$/i.exec(p);
      if (m) peso = parseFloat(m[1]);
    });
    if (!(tipo in q)) q[tipo] = isNaN(peso) ? 1 : peso;
  });

  const md = q['text/markdown'];
  if (md === undefined || md === 0) return false;
  const html = q['text/html'];
  return html === undefined ? true : md >= html;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const destino = MD[url.pathname];

  // Não é página negociável, ou o cliente não pediu markdown: segue para o HTML estático.
  if (!destino || !preferMarkdown(request.headers.get('accept'))) return;

  const md = new URL(request.url);
  md.pathname = destino;
  md.search = '';

  const resp = await fetch(md, { headers: { accept: 'text/plain,*/*' } });
  if (!resp.ok) return; // markdown ausente: cai no HTML em vez de dar erro

  return new Response(await resp.text(), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // Sem isto o CDN pode devolver a variante cacheada errada (HTML para quem pediu markdown).
      Vary: 'Accept, Accept-Encoding',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      Link: '<' + url.href + '>; rel="canonical"'
    }
  });
}

export const config = {
  // Só as páginas negociáveis — todo o resto (assets, api, .md direto) pula o middleware.
  matcher: [
    '/',
    '/index.html',
    '/sobre',
    '/sobre.html',
    '/contato',
    '/contato.html',
    '/privacidade',
    '/privacidade.html',
    '/galeria',
    '/galeria.html'
  ]
};

export { preferMarkdown };
