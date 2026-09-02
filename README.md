# CADe UFPel

Site do Centro Acadêmico de Design da UFPel, migrado de um design Figma. HTML, CSS e JS puros — sem build, framework ou CDN de JS.

**Ao vivo:** [cadeufpel.com](https://cadeufpel.com)

---

## Stack

| Camada | Escolha |
|---|---|
| HTML/JS | `index.html` e `galeria.html`, cada um com seu JS no fim do `<body>` (IIFEs separadas, uma por feature) |
| CSS | dividido em `css/*.css`, carregado via `<link>` no `<head>`, na ordem da cascata |
| Tipografia | LT Superior, self-hosted em `assets/font/` (`.woff2`) |
| Ícones | SVGs Lucide inline, animados por CSS `@keyframes` + IIFE de replay |
| Analytics | Vercel Analytics (`/_vercel/insights/script.js`), sem cookies |
| Backend | `api/enviar.js` — função serverless da Vercel (Node puro, `fetch` direto na REST API do Resend) para os formulários de contato |

## Páginas

- `index.html` — página principal (hero, agenda, quem somos, histórico, lojinha, guia do calouro, oportunidades, FAQ, formulários).
- `galeria.html` — `/galeria`, fotos de eventos e gestões anteriores.

## Arquivos de estilo

| Arquivo | Conteúdo |
|---|---|
| `css/base.css` | `@font-face`, tokens `:root`, reset, tipografia, estrutura, botões, focus-visible |
| `css/nav.css` · `css/hero.css` · `css/agenda.css` | seções 01, 02 e 03 |
| `css/secoes.css` | 04 quem somos, 05 histórico/galeria, lojinha, 06 guia, 07 oportunidades, 08 FAQ, 09 links, 10 formulários, 11 footer |
| `css/galeria.css` | layout de `galeria.html` |
| `css/componentes.css` | faixa de fotos, popup de oportunidade, botão voltar ao topo |
| `css/icons.css` | ícones lucide-animated |
| `css/responsivo.css` | todas as `@media` (1180, 900, 720, 400, reduced-motion) |

## Estrutura da home

Quatro `div.area` com fundo próprio, cada uma com uma `.faixa` colorida no topo:

| Área | id | Seções |
|---|---|---|
| CADe | `#area-cade` | hero, 01 agenda, 02 quem somos, 03 histórico, lojinha |
| Calouros | `#area-calouros` | 04 guia do calouro (foto à esquerda + 4 cards) |
| Dicas | `#area-dicas` | 05 oportunidades, 06 FAQ, 07 atalhos |
| Formulários | `#area-formularios` | 08 fale com a gente (dois forms) |

A nav marca a área ativa via `aria-current="page"`, calculada por listener de scroll.

## Formulário de contato

`api/enviar.js` recebe os dois formulários do site e envia por e-mail via Resend. Env vars (Vercel → Project → Settings → Environment Variables):

| Variável | Obrigatória | Padrão |
|---|---|---|
| `RESEND_API_KEY` | sim | — (nunca commitar) |
| `RESEND_TO` | não | `cadesignufpel@gmail.com` |
| `RESEND_FROM` | não | `CADe UFPel <onboarding@resend.dev>` (sandbox — trocar para domínio verificado) |

## Rodando local

```sh
npx serve
```

Abra o endereço indicado. `index.html` também abre direto no navegador, mas servir via HTTP evita comportamento estranho de `file://` (e é preciso para testar `api/enviar.js` via `vercel dev`).

## Deploy

Hospedado na **Vercel**, deploy automático a cada push em `main`. `vercel.json` define:

- `cleanUrls` — URLs sem `.html`.
- Redirect 301 de `cade.diegoruas.com.br` para `cadeufpel.com`.
- `Cache-Control` imutável (`max-age=31536000, immutable`) para as fontes em `assets/font/`.
- `X-Content-Type-Options: nosniff` em todas as respostas.

## Contribuindo

Antes de alterar, leia o [`AGENTS.md`](AGENTS.md) — convenções do projeto: tokens em `:root`, ids `data-od-id`, breakpoints (1180px, 900px, 720px, 400px), regras de ícones e de hover/focus-visible. A copy oficial vem do Figma e não deve ser inventada.
