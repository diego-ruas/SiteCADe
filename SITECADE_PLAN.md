# Organização enxuta do SiteCADe

## Contexto
O pedido é organizar melhor o projeto sem espalhar arquivos nem aumentar desnecessariamente sua fragmentação. A raiz contém cinco páginas HTML e cinco representações públicas Markdown, além dos arquivos de deploy e descoberta. A reorganização deve preservar o site estático sem build, o JavaScript inline e todas as URLs públicas existentes; `index.html` permanece na raiz conforme o contrato do projeto.

## Achados confirmados
- `vercel.json` usa `cleanUrls: true`, `trailingSlash: false`, aliases institucionais e um rewrite final para `/api/404`. Os headers anunciam `/index.md`, `/sobre.md`, `/contato.md`, `/privacidade.md` e `/galeria.md`; esses endereços são contrato público, não documentação interna.
- `css/` já separa estilos por responsabilidade. `assets/` já contém fontes e fotos de membros em subpastas; não há razão estabelecida para reconstruir a organização de CSS ou extrair JavaScript.
- `.gitignore` já exclui `scratch/`, caches, `node_modules/`, variáveis locais e artefatos. `.vercelignore` contém apenas `AGENTS.md`.
- `codegraph.config.json` inclui HTML e Markdown recursivamente. Mover páginas para uma subpasta não exige ampliar esses globs.
- A CLI CodeGraph observada nesta sessão é 2.3.20. Apenas `version` e `--help` foram executados; nenhum índice foi criado ou atualizado.

- `middleware.js` negocia Markdown pelas URLs públicas e faz `fetch` de `/<nome>.md`, sem ler arquivos em disco. Preservar essas URLs permite manter seu mapa e sua lógica.
- A documentação oficial da Vercel exige destinos HTML sem `.html` nos rewrites quando `cleanUrls` está ativo; portanto o destino de `/sobre` deve ser `/paginas/sobre`, não `/paginas/sobre.html`.
- `scratch/` está vazio e já ignorado; não é necessário apagar nem mover essa pasta.
- Node disponível: v26.7.0. A CLI `vercel` não está instalada no PATH; a verificação do roteamento real exigirá CLI disponibilizada na execução ou uma URL Preview acessível.
## Abordagem

### 1. Concentrar o conteúdo em uma única pasta

Antes de mover arquivos, guardar em memória os conteúdos dos nove arquivos da tabela e obter a referência visual nas larguras da verificação, usando o runtime descrito abaixo. Se o runtime Vercel estiver indisponível, a referência visual pode usar os HTMLs atuais em servidor estático; isso não substitui a prova das rotas após a migração.

Criar somente `paginas/` e mover, sem manter cópias na raiz:

| Origem | Destino |
|---|---|
| `sobre.html` | `paginas/sobre.html` |
| `sobre.md` | `paginas/sobre.md` |
| `contato.html` | `paginas/contato.html` |
| `contato.md` | `paginas/contato.md` |
| `privacidade.html` | `paginas/privacidade.html` |
| `privacidade.md` | `paginas/privacidade.md` |
| `galeria.html` | `paginas/galeria.html` |
| `galeria.md` | `paginas/galeria.md` |
| `index.md` | `paginas/index.md` |

Os pares HTML/Markdown ficam juntos; `paginas/index.md` é a única exceção porque `index.html` precisa permanecer na raiz. Os Markdown são representações públicas do site, não documentação técnica: não colocá-los em `docs/`.

Estrutura final, omitindo apenas os arquivos internos das pastas preservadas:

```text
SiteCADe/
  index.html
  paginas/                quatro HTMLs e cinco Markdown públicos
  css/                    mesmos arquivos e mesma cascata
  assets/                 mesmas mídias, font/ e FotosMembros/
  api/                    mesmos três endpoints
  test/                   agentes.test.js
  middleware.js
  vercel.json
  robots.txt
  sitemap.xml
  llms.txt
  README.md
  AGENTS.md
  codegraph.config.json
  .gitignore
  .vercelignore
```

São nove arquivos a menos na raiz e apenas uma pasta nova, sem aumentar a quantidade de arquivos de produção. Não introduzir `src/`, `public/`, `components/`, um diretório por página, arquivos JS externos ou bundler. Não mover fontes, variantes responsivas de imagens, CSS ou APIs: já estão agrupados, e novos caminhos não ajudam a resolver a mistura da raiz. Não apagar caches, arquivos locais ou `scratch/`.

### 2. Preservar carregamento e navegação das páginas movidas

Executar este passo junto da movimentação e das rotas do passo 3, como uma migração indivisível antes da validação.

Nos quatro HTMLs movidos, prefixar com `../` apenas referências locais que começam por `assets/` ou `css/`, incluindo `href`, `src` e qualquer candidato local de `srcset`. Exemplo: `href="css/base.css"` vira `href="../css/base.css"`; `src="assets/logo-cade.svg"` vira `src="../assets/logo-cade.svg"`. Manter nomes e hashes das fontes e a ordem exata dos `<link>`.

Usar caminhos relativos, conforme a convenção do projeto, sem `<base>` nem URLs absolutas de produção para carregar arquivos locais. `../css/base.css` resolve para `/css/base.css` tanto na URL pública `/sobre` quanto no acesso físico `/paginas/sobre.html`; essa resolução foi exercitada nesta investigação.

Não prefixar URLs já absolutas, `/api/...`, `/_vercel/...`, links para `/`, âncoras ou URLs canônicas. Os endereços de navegação, `canonical`, `alternate`, Open Graph, JSON-LD, `llms.txt`, `sitemap.xml`, `robots.txt` e os links dos cinco Markdown continuam públicos, sem `/paginas/`. Manter copy, ids `data-od-id`, JavaScript inline e estilos sem alterações funcionais. Não criar tratamento de erro novo para recursos: preservar os estados existentes.

### 3. Separar a localização física das URLs públicas

Em `vercel.json`, substituir o array `rewrites` pela lista abaixo, nessa ordem:

```json
[
  { "source": "/sobre", "destination": "/paginas/sobre" },
  { "source": "/contato", "destination": "/paginas/contato" },
  { "source": "/privacidade", "destination": "/paginas/privacidade" },
  { "source": "/galeria", "destination": "/paginas/galeria" },
  { "source": "/index.md", "destination": "/paginas/index.md" },
  { "source": "/sobre.md", "destination": "/paginas/sobre.md" },
  { "source": "/contato.md", "destination": "/paginas/contato.md" },
  { "source": "/privacidade.md", "destination": "/paginas/privacidade.md" },
  { "source": "/galeria.md", "destination": "/paginas/galeria.md" },
  { "source": "/(.*)", "destination": "/api/404" }
]
```

Não criar rewrite para `/`; não usar destino `.html` com `cleanUrls: true`. Reutilizar o catch-all existente, sempre por último. São regras explícitas para nove arquivos, não um roteador genérico nem uma tabela nova compartilhada em produção.

Após os dois redirects condicionados por host, inserir os quatro redirects abaixo; manter os aliases existentes depois deles:

```json
{ "source": "/sobre.html", "destination": "/sobre", "permanent": true },
{ "source": "/contato.html", "destination": "/contato", "permanent": true },
{ "source": "/privacidade.html", "destination": "/privacidade", "permanent": true },
{ "source": "/galeria.html", "destination": "/galeria", "permanent": true }
```

Isso preserva o acesso pelos antigos nomes HTML sem depender de aliases automáticos para arquivos que deixaram a raiz. Manter `cleanUrls`, `trailingSlash`, todos os headers de cache, `Content-Type`, `Vary` e `Link` existentes. Não renomear os endpoints `/api/enviar`, `/api/oportunidades` e `/api/404`.

Manter funcionalmente intactos `middleware.js` e `api/404.js`. O mapa `MD` e `config.matcher` são de URLs públicas: não trocar destinos por `/paginas/*.md` nem adicionar matchers internos. Assim, `fetch('/sobre.md')` continua passando pela rota pública e o fallback atual para HTML em resposta Markdown não-2xx permanece. Não modificar o algoritmo `preferMarkdown` nem a assinatura de exports.

Fundamentação: [rewrites e precedência do filesystem](https://vercel.com/docs/project-configuration/vercel-json#rewrites), [cleanUrls](https://vercel.com/docs/project-configuration/vercel-json#cleanurls) e [rewrites sem alteração da URL visível](https://vercel.com/docs/routing/rewrites).

### 4. Fazer os testes distinguir arquivos de endereços

No arquivo existente `test/agentes.test.js`, manter `ler(p)` relativo à raiz. Substituir `PAGINAS` por objetos com campos `html`, `md`, `url` e `urlMd`:

```js
const PAGINAS = [
  { html: 'index.html', md: 'paginas/index.md', url: '/', urlMd: '/index.md' },
  { html: 'paginas/sobre.html', md: 'paginas/sobre.md', url: '/sobre', urlMd: '/sobre.md' },
  { html: 'paginas/contato.html', md: 'paginas/contato.md', url: '/contato', urlMd: '/contato.md' },
  { html: 'paginas/privacidade.html', md: 'paginas/privacidade.md', url: '/privacidade', urlMd: '/privacidade.md' },
  { html: 'paginas/galeria.html', md: 'paginas/galeria.md', url: '/galeria', urlMd: '/galeria.md' }
];
```

Esse cadastro é restrito ao teste; não exportá-lo nem criar um manifesto em produção. Atualizar consumidores do antigo array: usar `html`/`md` para ler disco e `url`/`urlMd` para contratos públicos. Nunca derivar URL com `replace` no caminho físico.

Migrar também as listas HTML independentes nos testes de canonical/JSON-LD, Organization e anúncios `alternate`/`help` (regiões originais 269–326). Usar o cadastro para selecionar todas as páginas ou as três institucionais, em vez de repetir os caminhos. Imports de `../api/404.js` e `../api/oportunidades.js` não mudam.

Não repinar testes que apenas prendem implementação, tamanho arbitrário ou wording. Remover os blocos intitulados:
- `as duas implementacoes de preferMarkdown sao iguais`;
- `todo .html negociavel tem .md nao vazio`;
- `middleware mapeia exatamente as paginas existentes`;
- `sobre/contato/privacidade passam de 500 caracteres de texto`;
- `paginas novas usam o mesmo shell (css, nav, footer)`;
- `a home traz o nome de marca exato no title`;
- `so usa codepoints de icone presentes no subset da fonte` — compara páginas entre si, não a fonte;
- `llms.txt tem secao de quando usar`;
- `404 responde 404 e oferece caminho de volta` — verifica código-fonte, não resposta.

Preservar os testes comportamentais de Accept, CSV/normalização e seleção de formato do 404, e os contratos declarativos de metadados e rotas. Não criar novos arquivos de teste nem framework. O conteúdo servido, middleware, recursos e 404 serão exercitados de fato na verificação abaixo; uma quantidade menor de checagens não autoriza omitir essa prova.

## Arquivos críticos e âncoras

- `middleware.js:11–22,48–89`: distinção entre URL pública e caminho físico; não alterar por efeito mecânico da mudança.
- `test/agentes.test.js:134–167,269–345`: cadastro e listas independentes que hoje pressupõem arquivos na raiz.
- `galeria.html:25–36,74,129`: preloads, ordem de CSS e logos a ajustar antes/depois da movimentação.
- `README.md:115–121`: `npx serve` é apenas preview estático; não valida rewrites nem negociação. A execução de verificação deve usar runtime Vercel ou Preview.
- `codegraph.config.json:3–12`: os globs já descobrem a nova pasta; não adicionar configuração redundante nem reindexar como parte da organização.

## Verificação

### Preparação e checagem local

Na raiz do repositório, executar `node test/agentes.test.js` após a migração completa. Node v26.7.0 foi encontrado no planejamento; não é necessário instalar dependências do projeto.

Usar um script temporário em memória para conferir as nove movimentações: cada origem ausente, cada destino presente, Markdown byte a byte igual à origem capturada antes da mudança; HTML com a mesma copy e scripts, descontando somente os prefixos de recursos definidos no passo 2. Resolver os recursos locais dos quatro HTMLs usando as duas bases (`/<nome>` e `/paginas/<nome>.html`) e confirmar que apontam a arquivos existentes. Não salvar esse script como ferramenta permanente.

O inventário desta revisão identificou 53 referências locais nos quatro HTMLs: 13 em cada institucional e 14 na galeria, todas em `href`/`src`; não há `srcset` local adicional nesses documentos. Usar esse total como conferência da revisão atual, não como nova asserção permanente. Fontes em `css/base.css` e `css/icons.css` já usam `../assets/font/` e não mudam.

### Prova HTTP do roteamento real

A CLI `vercel` não estava no PATH na investigação. Após aprovação, iniciar `npx --yes vercel dev --listen 3000` por supervisor de processos, na raiz; reutilizar vínculo/credenciais existentes se disponíveis. Não alterar domínio, projeto remoto, variáveis ou publicar produção. Se o runtime local não puder ser iniciado por autenticação/vínculo, usar uma URL Vercel Preview da revisão implementada quando disponível. Não tratar servidor estático ou mocks de rewrites como prova equivalente.

Em PowerShell, definir `$base = 'http://localhost:3000'` ou a URL Preview acessível. Exemplos executáveis:

```powershell
curl.exe -sS -i -H "Accept: text/html" "$base/sobre"
curl.exe -sS -i -H "Accept: text/markdown" "$base/sobre"
curl.exe -sS -i "$base/sobre.md"
curl.exe -sS -i -L -H "Accept: text/markdown" "$base/sobre.html"
curl.exe -sS -i -H "Accept: */*" "$base/rota-inexistente-organizacao"
```

Executar a matriz completa, com asserções em script temporário usando `fetch` quando conveniente:

| Entrada | Resultado observável obrigatório |
|---|---|
| `/`, `/sobre`, `/contato`, `/privacidade`, `/galeria` + `Accept: text/html` | 200, HTML da página correspondente, sem redirect para `/paginas/`; `Vary` inclui `Accept`, `Link` anuncia o `.md` público correto |
| As mesmas cinco URLs + `Accept: text/markdown` | 200, `text/markdown`, corpo igual ao respectivo `paginas/*.md`, `Vary` inclui `Accept`; não aceitar HTML como sucesso |
| `/index.md`, `/sobre.md`, `/contato.md`, `/privacidade.md`, `/galeria.md` | 200, `text/markdown; charset=utf-8`, conteúdo correspondente, sem redirecionar ao diretório físico |
| Os quatro aliases secundários `.html` com Accept HTML | 308 para a URL limpa correspondente e 200 HTML ao seguir; `/index.html` continua chegando à home |
| Os cinco aliases `.html` com Accept Markdown, seguindo redirects | 200 final com Markdown correto; não exigir um salto quando o middleware responder diretamente |
| `/sobre` + `*/*` e `text/markdown;q=0.3,text/html;q=0.9` | HTML em ambos; com `text/markdown,text/html` o empate serve Markdown |
| `/about`, `/contact`, `/privacy`, `/privacy-policy`, `/politica-de-privacidade`, `/gallery` | redirects existentes continuam chegando às páginas públicas corretas |
| `/rota-inexistente-organizacao` e `/inexistente.md` + `*/*` | 404 real, corpo Markdown com links públicos de recuperação |
| `/rota-inexistente-organizacao` + `text/html` | 404 real com página HTML estilizada e links de recuperação navegáveis |

Repetir HTML → Markdown → HTML em `/sobre` para detectar troca indevida de representação. O middleware pode mascarar rewrite ausente caindo silenciosamente no HTML: verificar tipo e corpo, não só status 200. Não enviar formulários nem e-mails reais nesta reorganização.

### Prova no navegador

Abrir o runtime validado com a ferramenta de navegador. Registrar comparação visual antes/depois na mesma largura. Visitar as cinco URLs públicas, seguir os links institucionais do rodapé e o link de retorno da galeria; conferir logos, ícones, fontes e ausência de erros locais de CSS/imagem/fonte.

Nas quatro páginas movidas, verificar larguras 1180, 900, 720 e 400 px, além de 375 px: `scrollWidth <= clientWidth`, conteúdo preservado e menu mobile abrindo/fechando com `aria-expanded` coerente; testar Escape e transição 720↔721 px. Na galeria, conferir o estado de carregamento/resultado real do Drive e, havendo fotos disponíveis, abrir/fechar o lightbox e retornar o foco. Indisponibilidade externa não autoriza inventar imagens nem mudar a feature. Não usar `scrollIntoView`.

Sucesso exige a nova disposição física, os contratos HTTP preservados e a superfície carregando corretamente. Testes Node, sozinhos, não demonstram a configuração Vercel.

## Premissas e contingências

- Prioridade adotada: menos arquivos misturados na raiz, com a menor quantidade de pastas novas. A home fica na raiz por contrato do projeto, não por uma migração incompleta.
- `paginas/` é organização de arquivos publicados, não um diretório privado. Não divulgar suas URLs na navegação ou metadados, nem introduzir bloqueios/redirects internos só para escondê-lo.
- Abrir um HTML físico por servidor estático pode servir para conferir a apresentação, mas navegar pelas URLs limpas após a mudança requer as regras Vercel. Não criar um segundo roteador local para imitar produção.
- Se um destino já existir na execução, não sobrescrever: conteúdo idêntico permite manter o destino e remover apenas a origem duplicada da migração; conteúdo divergente exige preservar ambos até resolver o conflito com o usuário.
- Se não houver CLI autenticada nem Preview acessível, concluir somente as verificações locais possíveis e registrar o bloqueio HTTP/visual com o motivo exato. Não declarar a reorganização validada nem publicar produção para contornar a falta de acesso.
- Se a comparação visual revelar um problema já presente, registrar separadamente e não modificar CSS nesta migração. Em particular, a galeria já carrega `galeria.css` depois de `responsivo.css`; conservar essa ordem, sem atribuir automaticamente um problema anterior de grid à movimentação.

