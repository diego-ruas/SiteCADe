# Remover telemetria e analytics do CADe

## Contexto

Remover a coleta de audiência, eventos de interação e desempenho do site, sem substituir por outro serviço de medição. A investigação confirmou Vercel Web Analytics e Speed Insights em `index.html` e nos quatro HTMLs de `paginas/`, além de texto público descrevendo essa coleta. Preservar serviços que entregam funcionalidades, como formulários e conteúdo externo; remover analytics não significa remover a hospedagem.

## Achados confirmados

- `index.html:1911–2006`: inicializadores `window.va`/`window.vaq`, `window.si`/`window.siq`, coletor `window.cadeMedir`, listeners de cliques/FAQ e scripts `/_vercel/insights/script.js` e `/_vercel/speed-insights/script.js`.
- Os mesmos dois scripts e blocos identificados pelo comentário `Vercel Analytics: eventos fixos, sem dados pessoais` aparecem em `paginas/sobre.html`, `paginas/contato.html`, `paginas/privacidade.html` e `paginas/galeria.html`.
- Os cinco rodapés afirmam `Dados de formulário só para contato · Analytics sem cookies ·` antes do link de privacidade.
- `paginas/privacidade.html:118–121` descreve audiência, categorias de eventos e desempenho. `paginas/privacidade.md:47–57` também descreve medição; as duas versões precisam expressar o mesmo estado após a remoção e preservar o aviso sobre conexões ao Google Drive.
- A tabela de tecnologias em `README.md:29` anuncia Vercel Analytics. `llms.txt:28` usa rastreamento no sentido de crawling por agentes, não telemetria; não remover esse contrato.

## Abordagem

### 1. Eliminar coletores e emissores em um corte completo

Editar no lugar `index.html`, `paginas/sobre.html`, `paginas/contato.html`, `paginas/privacidade.html` e `paginas/galeria.html`. Remover, nas cinco páginas:

- Os scripts externos `/_vercel/insights/script.js` e `/_vercel/speed-insights/script.js`.
- O bloco de inicialização de `window.va`, `window.vaq`, `window.si` e `window.siq`.
- A IIFE inteira sob `Vercel Analytics: eventos fixos, sem dados pessoais`: `medir`, `campos`, `pagina`, mapas de categorias, `destinoDe`, `elementoDe`, atribuição `window.cadeMedir` e listeners dedicados de navegação/FAQ.
- Todas as chamadas a `window.cadeMedir` nas IIFEs funcionais. Localizar o conjunto com a ferramenta `grep`, padrão `cadeMedir`, restrito a `index.html;paginas/*.html`; após o corte não deve haver ocorrências. Não deixar wrappers vazios, flags de desativação, filas ou aliases.

Fazer estes ajustes acoplados no mesmo passo:

| Região | Corte específico | Comportamento a preservar |
|---|---|---|
| Menu nas cinco páginas | Remover `var aberto` somente no listener de `keydown`, onde serve à medição. Manter a variável homônima no clique do botão. | Alternância de estado e `aria-expanded`, Escape, clique fora, retorno do foco e fechamento ao voltar ao desktop. |
| Hero da home | `manual(i, acao)` passa a `manual(i)`; atualizar as três chamadas para `manual(atual - 1)`, `manual(atual + 1)` e `manual(i)`. | `desligado = true`, `ir(i, true)` e listener `pointerdown` que interrompe autoplay. |
| Materiais na home | Remover integralmente o listener de clique de `lista` que apenas mede `.mat-item a`. | Carregamento do Drive, links, modal e foco. |
| Lightbox na home | Remover o ramo de ArrowLeft/ArrowRight que apenas mede `navegar-teclado`. | Escape, abertura, zoom, fechamento e foco; não implementar navegação nova. |
| Formulários na home | Remover `iniciou`, listener `focusin` dedicado e chamadas de início/envio/sucesso/erro. | Manter `TIPO_FORM`, pois também preenche `dados.formulario`; preservar validação, anonimato, POST, feedback, reset e tratamento de erro. |
| Oportunidades na home | Remover integralmente o listener de clique de `ctaEl` que apenas mede `cta`. | Links nativos, cards de `/api/oportunidades`, setas, modal e estados vazio/erro. |
| Lightbox em `/galeria` | `abrir(foto, medirAbertura)` passa a `abrir(foto)`; `abrir(prox, false)` passa a `abrir(prox)`. | Clique continua chamando `abrir(foto)`; preservar navegação real por setas dentro da categoria, zoom, Escape e foco. |

Nas demais ocorrências — voltar ao topo, setas da faixa de fotos, agenda, modais e “ver mais” — apagar somente a expressão de medição, preservando o restante do callback. Remover callbacks exclusivamente analíticos em vez de mantê-los vazios.

Não há servidor LSP configurado nesta investigação. Se houver um na execução, consultar referências antes de remover `window.cadeMedir`; caso contrário, usar o inventário literal completo e ler cada contexto. Nenhuma biblioteca ou utilitário substituto é necessário.

Preservar `data-od-id`, `data-drive-id`, `data-evento`, `data-op`, caches funcionais da galeria e `localStorage['cade:evento']`. Não são coletores. Não bloquear genericamente Google, Vercel, `fetch`, armazenamento ou listeners: isso quebraria funcionalidades. `vercel.json`, `middleware.js` e `api/*.js` não precisam de alteração: manter rotas, negociação Markdown, chamadas funcionais e logs de erro de `api/enviar.js`. Não adicionar CSP para mascarar scripts que deveriam ser excluídos.

### 2. Fazer a informação pública corresponder à remoção

Este passo acompanha o corte anterior; não publicar código e política em revisões separadas.

- Nos cinco rodapés, substituir somente o parágrafo relevante por `<p>Dados de formulário só para contato · <a href="/privacidade">privacidade</a></p>`.
- Em `paginas/privacidade.html`, manter o heading `Cookies e medição de audiência` e substituir os dois parágrafos sobre Web Analytics, eventos e Speed Insights por um parágrafo com o texto exato abaixo.
- Em `paginas/privacidade.md`, substituir o primeiro parágrafo da mesma seção pelo mesmo texto, sem tags. Preservar, em ambas as versões, o parágrafo seguinte sobre Google Drive.

> Este site não usa ferramentas de analytics, não registra eventos de interação para análise de comportamento e não coleta métricas de desempenho dos visitantes. Não usamos cookies de publicidade nem de rastreamento entre sites e não incorporamos pixels de redes sociais.

Atualizar as datas da política nas duas representações para a data efetiva da alteração: formato longo pt-BR no HTML e `AAAA-MM-DD` no Markdown. Não prometer ausência de logs técnicos dos provedores nem apagar os avisos de processamento de formulários.

A atualização documental correspondente deve remover a linha Analytics de `README.md:29`, sem substituí-la por outro serviço. Não alterar o plano histórico `SITECADE_PLAN.md` nem contratos de crawling em `llms.txt`/`robots.txt`.

## Verificação

Executar somente após aprovação, na raiz do repositório. Nesta etapa de planejamento houve leitura de código e configuração, não execução de testes nem alteração do site.

### Runtime e prova de ausência de coleta

1. Iniciar `npx vercel dev --listen 3000` por supervisor de processos, com o vínculo Vercel existente, e aguardar a porta/prontidão. Não publicar produção nem trocar projeto/credenciais. `README.md` documenta esse runtime; disponibilidade da CLI e autenticação não foram verificadas nesta investigação.
2. Abrir um navegador sem extensões/adblock, usando `browser.open`, antes de editar para registrar uma referência visual e confirmar os requests dos dois scripts de analytics. Interceptar somente esses requests na referência anterior para impedir coleta durante a investigação; o registro da tentativa de carregamento é suficiente.
3. Após editar, usar contexto novo e cache desabilitado, com observação de requests e erros JavaScript desde antes da navegação. Não bloquear analytics nesta passagem: ausência de coleta deve resultar do código, não do teste.
4. Visitar `/`, `/sobre`, `/contato`, `/privacidade` e `/galeria`; carregar, interagir conforme os cenários abaixo, aguardar ao menos 10 segundos por página e navegar para a próxima, incluindo a saída da última página. Observar também requests de saída/ocultação da aba, quando beacons de desempenho poderiam ser enviados.
5. Resultado exigido: zero tentativas de carregar scripts ou enviar dados para `/_vercel/insights/` e `/_vercel/speed-insights/`, e nenhuma outra requisição de medição atribuída ao site. Verificar todos os destinos observados, não só esses prefixos. Google Drive/Calendar, fontes/imagens locais e APIs funcionais não devem ser classificados como analytics.
6. Como diagnóstico complementar, confirmar que `window.va`, `window.vaq`, `window.si`, `window.siq` e `window.cadeMedir` não existem nos documentos novos. Não transformar essa checagem de implementação em teste permanente; o contrato é a ausência de coleta com UI funcional.

### Cenários funcionais que atravessam os cortes

| Entrada/ação | Resultado observável |
|---|---|
| Cinco páginas, larguras 1180, 900, 720 e 400 px | Mesma estrutura visual da referência, exceto texto removido; sem scroll horizontal (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`). |
| Menu mobile: abrir, fechar por Escape, clique fora e transição 720→721 px | Estado acessível coerente; Escape retorna foco ao botão; menu não permanece aberto no desktop. |
| Home: setas e bolinhas do hero, depois aguardar mais de 5 segundos sem hover/foco | Slide e bolinha ativa acompanham a navegação; autoplay permanece desativado após interação manual. |
| FAQ: abrir e fechar `details.faq` | Conteúdo expande/recolhe normalmente, sem erros. |
| Agenda: trocar mês; havendo eventos, selecionar dia/evento e usar setas | Mês e painel `#detalhe-*` mudam; persistência funcional continua. Se a API estiver indisponível, verificar o estado de erro existente e registrar seleção de eventos como não exercitada. |
| Home e galeria: abrir uma `.gal-foto`, clicar na imagem e fechar por Escape | Modal abre, zoom alterna, modal fecha e foco retorna. Em `/galeria`, ArrowRight/ArrowLeft troca entre fotos adjacentes da categoria; não exigir essa navegação na home. |
| `/galeria`: “Ver mais”, quando houver lote adicional | Mais fotos aparecem e permanecem interativas. |
| Home: materiais e oportunidade disponível | Modal abre/fecha, links mantêm destinos e foco retorna; setas dos carrosséis ainda navegam. Indisponibilidade de dados deve manter o estado vazio/erro, sem inventar conteúdo de produção. |
| Home e galeria: voltar ao topo após rolar | Página retorna ao topo sem erro JavaScript. |

Exercitar os dois formulários pelo navegador com dados sintéticos, **interceptando todo POST para `/api/enviar` antes de qualquer envio**, sem contatar a caixa postal real:

- Envio inválido: validação impede request.
- `#form-participar` com nome `Teste de remoção` e e-mail `teste@example.invalid`; responder ao POST com HTTP 200 e JSON `{"ok":true}`. Esperado: botão mostra sucesso e depois de aproximadamente 2200 ms volta ao estado disponível com formulário resetado. O request deve continuar levando `formulario:"participar"`.
- `#form-falar`: preencher os campos obrigatórios e marcar `#f-anonimo`. Esperado: `#f-contato` fica desabilitado/limpo; POST continua levando `formulario:"falar"` e `anonimo:true`. Responder com HTTP 200 e `{"ok":true}` e verificar feedback/reset.
- Repetir os dois envios válidos respondendo HTTP 500 com `{"ok":false}`. Esperado: mensagem de erro visível e botão habilitado para nova tentativa.

Essa interceptação prova o frontend alterado, não entrega real de e-mail. Não alterar a API para facilitar o teste. O honeypot existente não é necessário para esses cenários; sua resposta depende de `RESEND_API_KEY` estar configurada antes de chegar à guarda.

### Contratos e conteúdo público

- Executar `node test/agentes.test.js`: deve terminar sem falhas. A suíte existente não exige analytics; não adicionar testes que apenas procurem ausência de strings de código.
- Usar `grep` nos cinco HTMLs com `cadeMedir|window\.(va|vaq|si|siq)\b|/_vercel/(insights|speed-insights)/|medirAbertura`: resultado vazio. Conferir também que os callbacks exclusivamente analíticos não ficaram vazios.
- Comparar `/privacidade` em HTML e Markdown: mesma informação de ausência de analytics, aviso do Google preservado e datas consistentes. Com runtime Vercel ativo, executar `curl.exe -i -H "Accept: text/markdown" http://localhost:3000/privacidade`: esperar HTTP 200, conteúdo Markdown atualizado e `Vary` contendo `Accept`. Conferir também `/privacidade.md`.
- Guardar evidência resumida das URLs, interações, requests observados, console e screenshots; distinguir dados reais, respostas interceptadas e cenários indisponíveis.

## Premissas e contingências

- “Telemetrias, analytics etc” significa aqui coleta de audiência, comportamento e desempenho dos visitantes. Preservar logs de diagnóstico do backend e serviços funcionais. Remover registros técnicos inerentes à hospedagem exigiria outro escopo: a [documentação da Vercel](https://vercel.com/docs/manage-and-optimize-observability) informa que a plataforma cria eventos a partir das requisições, independentemente dos scripts retirados.
- O estado remoto de Web Analytics, Speed Insights, assinaturas e integrações do projeto **não foi verificado — confirmar no painel antes de qualquer ação administrativa**. Este plano não autoriza apagar histórico, cancelar serviços da equipe, alterar outros projetos ou publicar produção. Na entrega, registrar ao responsável a necessidade de conferir/desativar a coleta adicional no projeto CADe, caso habilitada; não afirmar que o painel foi desativado só porque o código foi removido. A documentação atual descreve [downgrade de Speed Insights Plus](https://vercel.com/docs/speed-insights/using-speed-insights#downgrading-from-speed-insights-plus), que não equivale a eliminar a coleta.
- O efeito em produção depende de publicar a revisão sem instrumentação. Depois da publicação pelo fluxo autorizado do projeto, repetir a inspeção de rede nas cinco URLs públicas, sem sessão da toolbar de preview. Deployments antigos e abas já abertas não são reescritos pela edição local.
- Se o runtime Vercel não iniciar por CLI, autenticação ou vínculo indisponível, usar uma URL Preview já disponível da revisão alterada. Sem Preview, confirmar Python com `python --version` e servir os arquivos com `python -m http.server 3000 --bind 127.0.0.1`, via supervisor. Nesse servidor usar `/index.html` e `/paginas/{sobre,contato,privacidade,galeria}.html`, mantendo a interceptação de formulários. Isso prova somente JS/HTML e a ausência de coleta desses arquivos, não rewrites, negociação Markdown ou produção. Se nenhum runtime puder ser iniciado, concluir a leitura/checagens possíveis e relatar o bloqueio de verificação visual, sem alegar prova de navegador.
- Dados externos ausentes não autorizam mudanças de comportamento ou fixtures permanentes no site. Registrar exatamente quais fluxos dependentes não puderam ser exercitados; os cenários independentes, a ausência de coleta e os estados de erro continuam obrigatórios.
