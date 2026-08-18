# CADe UFPel — landing page

Página única do Centro Acadêmico de Design da UFPel, migrada de um design Figma. HTML, CSS e JS sem build, framework ou CDN.

**Acesse:** https://cade.diegoruas.com.br

## Stack

- **`index.html`:** HTML e JS (no fim do `<body>`, em IIFEs separadas), sem dependências.
- **CSS dividido em `css/`:** 8 arquivos carregados via `<link>` no `<head>`, na ordem de cascata.
- **Tipografia:** LT Superior, self-hosted em `assets/font/`.
- **Ícones:** SVGs Lucide inline, animados por CSS (`@keyframes`) + IIFE de replay — sem lib de animação.

## Arquivos de estilo

| Arquivo | Conteúdo |
|---|---|
| `css/base.css` | `@font-face`, tokens `:root`, reset, tipografia, estrutura, botões, focus-visible |
| `css/nav.css` · `css/hero.css` · `css/agenda.css` | seções 01, 02 e 03 |
| `css/secoes.css` | 04 quem somos, 05 histórico/galeria, lojinha, 06 guia, 07 oportunidades, 08 FAQ, 09 links, 10 formulários, 11 footer |
| `css/componentes.css` | faixa de fotos, popup de oportunidade, botão voltar ao topo |
| `css/icons.css` | ícones lucide-animated |
| `css/responsivo.css` | todas as `@media` (1180, 900, 720, 400, reduced-motion) |

## Estrutura

Quatro `div.area` com fundo próprio, cada uma com uma `.faixa` colorida no topo:

| Área | id | Seções |
|---|---|---|
| CADe | `#area-cade` | hero, 01 agenda, 02 quem somos, 03 histórico, lojinha |
| Calouros | `#area-calouros` | 04 guia do calouro (foto à esquerda + 4 cards) |
| Dicas | `#area-dicas` | 05 oportunidades, 06 FAQ, 07 atalhos |
| Formulários | `#area-formularios` | 08 fale com a gente (dois forms) |

A nav marca a área ativa via `aria-current="page"`, calculada por listener de scroll.

## Rodando local

Sirva `index.html` estaticamente — por exemplo:

```sh
npx serve
```

Abra o endereço indicado no navegador. O arquivo também abre direto no navegador, mas servir via HTTP evita qualquer comportamento estranho de `file://`.

## Deploy

Hospedado na **Vercel**. O `vercel.json` define:

- `cleanUrls` — URLs sem `.html`.
- `Cache-Control` imutável (`max-age=31536000, immutable`) para as fontes em `assets/font/`.
- `X-Content-Type-Options: nosniff` em todas as respostas.

## Contribuindo

Antes de alterar, leia o [`AGENTS.md`](AGENTS.md) — ele define as convenções do projeto: tokens em `:root`, ids `data-od-id`, breakpoints (1180px, 900px, 720px, 400px) e as regras de hover/focus-visible. A copy oficial vem do Figma e não deve ser inventada.