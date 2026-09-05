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
- **Sem dependências.** Nada de build, framework ou CDN de JS. O JavaScript da página é ES5 em IIFEs separadas, uma por feature; `middleware.js` e `api/*.js` usam a sintaxe de módulos/runtime exigida pela Vercel. Ícones não animam; não adicione lib de animação.
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
3. Cheque os breakpoints existentes: 1180px, 900px, 720px e 400px. Sem scroll horizontal no mobile.
4. Estados `hover`/`focus-visible` sempre com par fundo+texto definido; contraste nunca cai.

## CodeGraph para agentes

O repositório inclui `codegraph.config.json` como configuração de descoberta. Ela
mantém no grafo HTML, CSS, JavaScript (incluindo `api/` e `test/`) e Markdown, e
exclui `assets/`, fontes, imagens, binários, `.env*`, `node_modules/`, `.vercel/`,
`.codegraph/` e `scratch/`. O `.gitignore` continua sendo aplicado. Arquivos de
rota como `vercel.json`, `robots.txt` e `sitemap.xml` ficam fora do conjunto de
linguagens descobertas e devem ser lidos ao vivo quando a tarefa precisar deles.

Antes de uma consulta, confirme a versão e a sintaxe realmente instaladas:

```sh
codegraph version
codegraph --help
```

Na CLI legada atualmente observada (`codegraph version` 1.6.0), use o caminho
posicional/`--path` e não invente opções da CLI moderna:

```sh
codegraph status .
codegraph files --path . --format tree --max-depth 3
codegraph query "preferMarkdown" --path . --json
codegraph explore "Accept markdown Vercel 404" --path . --max-files 4
codegraph context "formulários index api enviar Resend" --path . --format json --no-code
```

Essas consultas estruturais pressupõem que o índice já exista; sem indexação
autorizada, limite-se a `version`/`help` e à leitura direta dos arquivos.

Essa CLI legada não reconhece `codegraph.config.json`; não a substitua por
flags diferentes. Depois de atualizar para uma versão que declare esse arquivo
no `codegraph --help`, as consultas equivalentes usam `--root .`, por exemplo:

```sh
codegraph orient --root . --budget small --json
codegraph links --root . --json
codegraph unresolved --root . --json
codegraph deps api/enviar.js --root . --json
codegraph rdeps index.html --root . --json
```

`codegraph init`/`index` criam ou atualizam estado em `.codegraph/`; só execute
isso quando a tarefa pedir indexação. Consultas são somente leitura. Verifique
`analysis.mode`/`backend` (ou `freshness` via MCP) e trate resultados
`reduced`, `mixed` ou `stale` como evidência limitada.

## Codex e Claude Code

A integração MCP de Codex e Claude Code é configuração do ambiente do agente,
não deste site. Não edite arquivos fora do repositório a partir de uma tarefa
do site. Para pré-visualizar a configuração, sem gravar nada:

```sh
codegraph install --print-config codex
codegraph install --print-config claude
```

Se a equipe autorizar a instalação no ambiente do agente, faça primeiro um
dry-run e confirme a versão que oferece essa opção:

```sh
codegraph install --target codex,claude --dry-run
```

Use MCP por stdio para manter o servidor no repositório correto; não exponha
uma porta pública. Reinicie o cliente Codex/Claude após instalar ou atualizar
o CodeGraph. O agente ainda deve ler os arquivos ao vivo para copy e configuração
(`codegraph file`/`get_file` na CLI moderna) antes de tomar decisões.
