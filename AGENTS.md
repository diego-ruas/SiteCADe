# CADe UFPel — landing page

Página única do Centro Acadêmico de Design da UFPel, migrada de um design Figma.

## Arquivos

- `index.html` — **o deliverable**. HTML e JS num só arquivo (`<script>` no fim do body); CSS em `css/*.css` via `<link>` no head. Nome `index.html` para servir na raiz do deploy (Vercel).
- `galeria.html` — página secundária (`/galeria`), fotos de eventos/gestões anteriores. Mesmo padrão de HTML+JS+CSS por link; usa `css/secoes.css` e `css/galeria.css`.
- `css/` — estilos divididos por arquivo (ordem de carga no `<head>` segue a cascata):
  - `base.css` — `@font-face` (LT Superior, self-hosted `.woff2`), `:root`/tokens, reset, tipografia utilitária, estrutura, botões, focus-visible.
  - `nav.css`, `hero.css`, `agenda.css` — seções 01, 02 e 03.
  - `secoes.css` — seções 04 (quem somos), 05 (histórico/galeria), lojinha, 06 (guia), 07 (oportunidades), 08 (FAQ), 09 (links), 10 (formulários) e 11 (footer).
  - `galeria.css` — layout específico de `galeria.html`.
  - `componentes.css` — faixa de fotos, popup de oportunidade, botão voltar ao topo.
  - `icons.css` — ícones lucide-animated.
  - `responsivo.css` — todas as `@media` (1180, 900, 720, 400, reduced-motion).
- `assets/` — SVGs de marca (logos, mascotes, favicon), fontes `.woff2` em `assets/font/` e JPGs de produto exportados do Figma. Sempre referência relativa. Os ícones de UI NÃO ficam aqui: são SVGs inline no `index.html` (ver regra de ícones).

Fonte do design: Figma `fFejL7f3oqdLNoPUqCwzD0` (arquivo "CADe - Landing Page"). Os textos oficiais vêm de lá — não invente copy.

## Regras

- **Idioma:** todo texto visível em pt-BR.
- **Tokens:** só as variáveis de `:root` (`--navy`, `--ciano`, `--verde`, `--amarelo`, `--rosa`, `--bg-*`, `--gut`, `--sec-y`, `--r-*`). Nunca hex solto no CSS novo.
- **Tipografia:** LT Superior (self-hosted em `assets/font/`, formato `.woff2`) para tudo.
- **`data-od-id`:** cada seção, heading, CTA, controle e card repetido tem um id kebab-case único. Mantenha ao editar e adicione em elementos novos.
- **Sem dependências.** Nada de build, framework ou CDN de JS. O JS é ES5 em IIFEs separadas, uma por feature. Animações de ícone são CSS (`@keyframes`) + a IIFE de replay — não adicione lib de animação.
- **Ícones (lucide-animated):** todo ícone de UI é SVG inline (Lucide: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`, `aria-hidden`), não arquivo. Animado no hover/focus se tiver `class="… lucide-icon la-<glifo>"` + `data-la="1"`; a `@keyframes` entra no bloco CSS `Ícones lucide-animated` e o replay é feito pela delegação do IIFE `Ícones lucide-animated` (não crie listener por ícone). `plus` gira 180° por transição (`.la-plus`); `minus` não tem variante animada (fica estático). Cor padrão é `currentColor` (herda do texto); cor de marca fixa usa token no CSS (ex.: `.faq-icone--mais{color:var(--rosa)}`), nunca hex.
- **Não use `scrollIntoView`** — quebra o preview embutido.
- **`body{overflow-x:clip}`** é deliberado: `hidden` mataria o `position:sticky` da nav.

## Estrutura

Quatro `div.area` com fundo próprio, cada uma com uma `.faixa` colorida no topo:

| Área | id | Seções |
|---|---|---|
| CADe | `#area-cade` | hero, 01 agenda, 02 quem somos, 03 histórico, lojinha |
| Calouros | `#area-calouros` | 04 guia do calouro (foto à esquerda + 4 cards) |
| Dicas | `#area-dicas` | 05 oportunidades, 06 FAQ, 07 atalhos |
| Formulários | `#area-formularios` | 08 fale com a gente (dois forms) |

A nav marca a área ativa via `aria-current="page"` (bolinha rosa em `::before`), calculada por listener de scroll com a constante `FOLGA` como margem de erro para áreas curtas.

## Ao alterar

1. Edite o arquivo no lugar; não reconstrua de memória.
2. Mude só o que foi pedido — o resto da copy e dos tokens é contrato.
3. Cheque os breakpoints existentes: 1024px, 900px, 620px. Sem scroll horizontal no mobile.
4. Estados `hover`/`focus-visible` sempre com par fundo+texto definido; contraste nunca cai.
