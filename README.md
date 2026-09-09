<p align="center">
  <img src="assets/logo-cade.svg" alt="CADe UFPel" width="140">
</p>

<h1 align="center">CADe UFPel</h1>

<p align="center">
  <a href="https://cadeufpel.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Fcadeufpel.com&label=site&up_message=online" alt="Status do site"></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/deploy-Vercel-black?logo=vercel" alt="Deploy na Vercel"></a>
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
</p>

Site do Centro Acadêmico de Design da UFPel, migrado de um design Figma. HTML, CSS e JS puros — sem build, framework ou CDN de JS.

**Ao vivo:** [cadeufpel.com](https://cadeufpel.com)

---

## Stack

| Camada | Escolha |
|---|---|
| HTML/JS | `index.html` (raiz) e páginas secundárias em `paginas/*.html` (`/sobre`, `/contato`, `/privacidade`, `/galeria`), cada um com seu JS no fim do `<body>` (IIFEs separadas, uma por feature). Variantes Markdown públicas em `paginas/*.md` |
| CSS | dividido em `css/*.css`, carregado via `<link>` no `<head>`, na ordem da cascata |
| Tipografia | LT Superior, self-hosted em `assets/font/` (`.woff2`) |
| Ícones | Google Material Symbols, self-hosted em `assets/font/material-symbols.woff2` (subset, ~1KB); logos de marca seguem SVG inline |
| Analytics | Vercel Analytics (`/_vercel/insights/script.js`), sem cookies |
| Backend | `api/enviar.js` — função serverless da Vercel para os formulários; `api/oportunidades.js` — lê a planilha CSV de oportunidades |

## Estrutura de pastas

```
api/                  funções serverless (enviar.js, oportunidades.js, 404.js)
assets/
  font/               LT Superior self-hosted (.woff2)
  FotosMembros/       fotos da gestão atual em ASCII/kebab-case (usadas em #o-cade)
  logo-*.svg, mascote-*.svg, favicon.svg, apple-touch-icon.png, og-image.png
  produto-*.webp      fotos da lojinha
  guia-foto.webp      foto do guia do calouro
css/*.css             ver "Arquivos de estilo"
paginas/              páginas secundárias HTML e variantes públicas Markdown
  contato.html, contato.md
  galeria.html, galeria.md
  privacidade.html, privacidade.md
  sobre.html, sobre.md
  index.md
index.html            página principal (raiz)
middleware.js         negociação de conteúdo (Accept: text/markdown)
test/agentes.test.js  testes de rotas e contratos
llms.txt, robots.txt, sitemap.xml, vercel.json
```

## Páginas

- `index.html` — página principal (hero, agenda, quem somos, histórico, lojinha, guia do calouro, oportunidades, FAQ, formulários).
- `paginas/sobre.html` — `/sobre`, quem somos, governança, financiamento e localização.
- `paginas/contato.html` — `/contato`, canais de atendimento, e-mail e Instagram.
- `paginas/privacidade.html` — `/privacidade`, política de privacidade e tratamento de dados dos formulários.
- `paginas/galeria.html` — `/galeria`, histórico e fotos de eventos e gestões anteriores.
- `paginas/*.md` — representações públicas em Markdown servidas via negociação `Accept: text/markdown` ou acessadas diretamente via `/<nome>.md`.
- `llms.txt`, `robots.txt`, `sitemap.xml` — SEO, indexação e instruções para agentes.

## Arquivos de estilo

| Arquivo | Conteúdo |
|---|---|
| `css/base.css` | `@font-face`, tokens `:root`, reset, tipografia, estrutura, botões, focus-visible |
| `css/nav.css` · `css/hero.css` · `css/agenda.css` | seções 01, 02 e 03 |
| `css/secoes.css` | 04 quem somos, 05 histórico/galeria, lojinha, 06 guia, 07 oportunidades, 08 FAQ, 09 links, 10 formulários, 11 footer |
| `css/galeria.css` | layout de `galeria.html` |
| `css/componentes.css` | faixa de fotos, popup de oportunidade, botão voltar ao topo |
| `css/icons.css` | `@font-face` do Material Symbols + classes `.m-icon` / `.brand-icon` |
| `css/responsivo.css` | todas as `@media` (1180, 900, 720, 400, reduced-motion) |

## Estrutura da home

Quatro `div.area` com fundo próprio, cada uma com uma `.faixa` colorida no topo. Numeração das seções conforme os comentários em `css/*.css`:

| Área | id | Seções |
|---|---|---|
| CADe | `#area-cade` | 01 nav, 02 hero, 03 agenda, 04 quem somos (`#o-cade`, com fotos da gestão), 05 histórico/galeria, lojinha |
| Calouros | `#area-calouros` | 06 guia do calouro (`#guia-calouro`, foto à esquerda + 4 cards) |
| Dicas | `#area-dicas` | 07 oportunidades (`#oportunidades`), 08 FAQ (`#faq`), 09 links (`#links`) |
| Formulários | `#area-formularios` | 10 fale com a gente (`#participe`, dois forms) |

11 (`css/secoes.css`) é o footer, fora das `.area`.

A nav marca a área ativa via `aria-current="page"`, calculada por listener de scroll.

## Formulário de contato

`api/enviar.js` recebe os dois formulários do site e envia por e-mail via Resend. Env vars (Vercel → Project → Settings → Environment Variables):

| Variável | Obrigatória | Padrão |
|---|---|---|
| `RESEND_API_KEY` | sim | — (nunca commitar) |
| `RESEND_TO` | não | `cadesignufpel@gmail.com` |
| `RESEND_FROM` | não | `CADe UFPel <onboarding@resend.dev>` (sandbox — trocar para domínio verificado) |

## Publicar uma oportunidade

Os cards de `#oportunidades` vêm da planilha Google publicada em CSV; não edite
cards no `index.html`. O link da planilha é a URL configurada em
`SHEET_OPORTUNIDADES_CSV` no painel da Vercel. Para abrir a planilha, copie essa
URL ou use o link compartilhado pela gestão.

| Coluna | Regra |
|---|---|
| `publicado` | Só `sim`, `s`, `x`, `true` ou `1` publica a linha. |
| `tag` | Pílula do card; vazio vira `OPORTUNIDADE`. |
| `cor` | `verde`, `amarelo` ou `ciano`; inválida vira `verde`. |
| `titulo` | Obrigatório; vazio ignora a linha. |
| `resumo` | Linha opcional do card. |
| `texto` | Texto do popup; vazio usa o resumo. |
| `cta` | Rótulo do botão do popup; vazio usa `Quero essa oportunidade`. |
| `link` | URL `http://`, `https://` ou `mailto:`; inválida abre o Instagram. |
| `expira` | `AAAA-MM-DD` ou `DD/MM/AAAA`; some depois desse dia. |

Na Vercel, configure `SHEET_OPORTUNIDADES_CSV` em **Project → Settings →
Environment Variables**, com a URL CSV de **Arquivo → Compartilhar → Publicar na
web** da aba. Marque Production e Preview. A atualização pode levar até 5 minutos
para aparecer no site por causa do cache do CDN.

## Rodando local

```sh
npx vercel dev
```

Para testar o roteamento completo da Vercel (rewrites para `paginas/`, negociação Markdown via `middleware.js` e funções da `api/`). Para visualização puramente estática, também é possível usar `npx serve`.

## Deploy

Hospedado na **Vercel**, deploy automático a cada push em `main`. `vercel.json` define:

- `cleanUrls` — URLs públicas limpas sem `.html`.
- `rewrites` — roteamento transparente das URLs públicas para os arquivos correspondentes em `paginas/` e catch-all para `/api/404`.
- `redirects` — redirecionamentos permanentes (308) de URLs legadas `.html` para URLs limpas, aliases em inglês e redirecionamento de hosts/domínios para o apex `cadeufpel.com`.
- `Cache-Control` imutável (`max-age=31536000, immutable`) para as fontes em `assets/font/`.
- `X-Content-Type-Options: nosniff`, `Vary: Accept` e links `rel="alternate"` para Markdown.

## Contribuindo

Antes de alterar, leia o [`AGENTS.md`](AGENTS.md) — convenções do projeto: tokens em `:root`, ids `data-od-id`, breakpoints (1180px, 900px, 720px, 400px), regras de ícones e de hover/focus-visible. A copy oficial vem do Figma e não deve ser inventada.

## CodeGraph para agentes

O escopo versionado do grafo está em [`codegraph.config.json`](codegraph.config.json).
Ele inclui HTML, CSS, JavaScript (inclusive `api/` e `test/`) e Markdown, mas exclui
`assets/`, fontes, imagens, binários, `.env*`, caches e saídas locais. Arquivos de
rota (`vercel.json`, `robots.txt` e `sitemap.xml`) são lidos ao vivo quando
necessário; não fazem parte das extensões descobertas. O `.gitignore` continua valendo.

O comando disponível no ambiente deve ser verificado antes de qualquer consulta:

```sh
codegraph version
codegraph --help
```

Na CLI legada (1.6.0), a consulta usa `--path`:

```sh
codegraph status .
codegraph files --path . --format tree --max-depth 3
codegraph query "preferMarkdown" --path . --json
codegraph explore "formulários index api enviar Resend" --path . --max-files 4
```

As consultas estruturais da CLI legada pressupõem índice já criado; sem uma
indexação autorizada, limite-se a `version`/`help` e à leitura direta dos arquivos.

Não execute `init`/`index` em uma tarefa somente de leitura: eles criam ou
atualizam `.codegraph/`. A configuração `codegraph.config.json` só é aplicada
por versões que a anunciam na ajuda; a CLI legada acima ignora esse arquivo.
Após atualização para uma versão compatível, use `--root .` e consultas como
`codegraph orient --root . --budget small --json`, `codegraph links --root . --json`,
`codegraph unresolved --root . --json` e `codegraph deps api/enviar.js --root . --json`.

Para Codex e Claude Code, a configuração MCP pertence ao ambiente do agente,
não ao deploy deste site. Sem gravar configurações externas, pré-visualize:

```sh
codegraph install --print-config codex
codegraph install --print-config claude
codegraph install --target codex,claude --dry-run
```

Use MCP por stdio somente após confirmar a versão compatível e reinicie o
cliente depois de instalar/atualizar o CodeGraph. Não exponha um servidor do
grafo em uma porta pública. Ao interpretar respostas, confira `analysis`/
`freshness` e trate `reduced`, `mixed` ou `stale` como evidência limitada.
