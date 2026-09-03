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
  - `icons.css` — `@font-face` do Material Symbols + classes `.m-icon` / `.brand-icon`.
  - `responsivo.css` — todas as `@media` (1180, 900, 720, 400, reduced-motion).
- `assets/` — SVGs de marca (logos, mascotes, favicon), fontes `.woff2` em `assets/font/` e JPGs de produto exportados do Figma. Sempre referência relativa. Os ícones de UI vêm da fonte `assets/font/material-symbols.woff2` (ver regra de ícones).

Fonte do design: Figma `fFejL7f3oqdLNoPUqCwzD0` (arquivo "CADe - Landing Page"). Os textos oficiais vêm de lá — não invente copy.

## Regras

- **Idioma:** todo texto visível em pt-BR.
- **Tokens:** só as variáveis de `:root` (`--navy`, `--ciano`, `--verde`, `--amarelo`, `--rosa`, `--bg-*`, `--gut`, `--sec-y`, `--r-*`). Nunca hex solto no CSS novo.
- **Tipografia:** LT Superior (self-hosted em `assets/font/`, formato `.woff2`) para tudo.
- **`data-od-id`:** cada seção, heading, CTA, controle e card repetido tem um id kebab-case único. Mantenha ao editar e adicione em elementos novos.
- **Sem dependências.** Nada de build, framework ou CDN de JS. O JS é ES5 em IIFEs separadas, uma por feature. Ícones não animam; não adicione lib de animação.
- **Ícones (Material Symbols):** todo ícone de UI é `<span class="m-icon" aria-hidden="true">&#xNNNN;</span>` — Material Symbols Outlined, self-hosted em `assets/font/material-symbols.woff2` (subset, ~1KB). Use o **codepoint PUA**, não a ligadura de texto: com `font-display:block` a ligadura mostraria o nome cru ("arrow_forward") antes da fonte carregar. Tamanho por `font-size` (`.m-icon` = 20px; modificadores `.m-icon--16`, `.m-icon--18`), nunca `width`/`height`. `aria-hidden` é obrigatório — sem ele o leitor de tela anuncia o caractere PUA. Ícones são estáticos: não há animação de hover/focus. Cor padrão é `currentColor`; cor de marca fixa usa token (ex.: `.faq-icone--mais{color:var(--rosa)}`), nunca hex.
  - **Glifo novo:** o subset só traz os codepoints em uso. Adicionar ícone exige re-subsetar a fonte incluindo o novo codepoint, senão ele renderiza como retângulo vazio.
  - **Logos de marca** (GitHub, Instagram) não existem no Material Symbols: seguem SVG inline com `class="brand-icon"`.
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
