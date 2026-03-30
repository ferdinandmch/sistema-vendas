# Feature Specification: Pipeline UI

**Feature Branch**: `008-pipeline-ui`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Pipeline UI — board com stages como colunas e deals como cards, consumindo APIs já implementadas."

## Clarifications

### Session 2026-03-29

- Q: O board precisa atualizar os dados automaticamente enquanto o usuário está na página, ou os dados são carregados uma única vez e só atualizam com o reload manual? → A: Dados carregados uma vez ao entrar na página; sem refresh automático.
- Q: Quando o usuário clica em um card de deal no board, o que acontece? → A: Nenhuma ação — card não é clicável nesta feature.
- Q: O campo `value` (valor monetário do deal) deve aparecer no card? → A: Sim — exibir `value` no card junto de name, company_name e status.

## Objective *(mandatory)*

Tornar o pipeline de vendas visualmente operacional para o usuário autenticado, apresentando os stages como colunas ordenadas e os deals como cards distribuídos por coluna, de forma que o funil de vendas possa ser lido e compreendido de forma imediata, sem necessidade de operação em planilhas externas ou consulta direta aos dados brutos.

## Context *(mandatory)*

O sistema Fineo Pipeline possui backend completo: autenticação, gestão de stages, gestão de deals, movimentação entre stages, histórico de movimentações, atividades e API padronizada (features 001–007). Nenhuma dessas funcionalidades é acessível visualmente para o usuário final — o produto existe apenas como estrutura de dados.

Esta feature entrega a primeira tela operacional do produto. Ela traduz os dados já persistidos no backend em uma visualização de board (quadro Kanban), que é o padrão reconhecível para acompanhamento de funil de vendas. É também a base estrutural para a feature 009 (Drag & Drop), que exigirá que o board já esteja estabelecido.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visualizar o pipeline com colunas e cards (Priority: P1)

Como usuário autenticado, quero ver todos os meus stages dispostos como colunas e todos os meus deals dispostos como cards dentro da coluna correspondente, para que eu possa enxergar o estado atual do meu funil de vendas de relance.

**Why this priority**: É o objetivo central da feature. Sem isso, nada mais nesta feature tem valor.

**Independent Test**: Criar 3 stages e 5 deals distribuídos entre eles via API. Acessar a página do pipeline. Verificar que 3 colunas aparecem na ordem correta de `position` e que cada deal aparece na coluna com o `stage_id` correspondente.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado e possui stages cadastrados, **When** acessa a página do pipeline, **Then** os stages são exibidos como colunas horizontais na ordem de `position` definida pelo backend.
2. **Given** o usuário possui deals distribuídos em diferentes stages, **When** a página carrega, **Then** cada deal aparece como card dentro da coluna correspondente ao seu `stage_id`.
3. **Given** o usuário possui deals com status `active`, `won` e `lost`, **When** visualiza os cards, **Then** o status de cada deal é visível de forma distinta em cada card.
4. **Given** o usuário possui múltiplos deals em uma mesma coluna, **When** visualiza o board, **Then** todos os deals desta coluna são listados verticalmente dentro dela.

---

### User Story 2 — Board funcional sem deals (Priority: P1)

Como usuário autenticado com stages cadastrados mas sem deals ainda, quero ver o board estruturado com as colunas existentes, para que a ausência de dados não impeça a navegação ou crie uma tela quebrada.

**Why this priority**: Estado vazio é o estado inicial de qualquer usuário novo. Um board quebrado ou em branco total prejudica a percepção de qualidade do produto.

**Independent Test**: Criar 3 stages via API, sem nenhum deal. Acessar a página do pipeline. Verificar que as 3 colunas são exibidas vazias, com sinalização visual de que não há deals.

**Acceptance Scenarios**:

1. **Given** o usuário possui stages mas nenhum deal, **When** acessa a página do pipeline, **Then** as colunas dos stages são exibidas normalmente, cada uma indicando que está vazia.
2. **Given** uma coluna não possui nenhum deal, **When** o usuário visualiza essa coluna, **Then** a ausência de deals é comunicada visualmente (ex: texto informativo ou área vazia explícita), sem erros ou quebra de layout.

---

### User Story 3 — Feedback de carregamento e tratamento de erro (Priority: P2)

Como usuário autenticado, quero ver um indicador visual enquanto os dados carregam e uma mensagem clara se algo falhar, para que eu saiba o estado do sistema a qualquer momento.

**Why this priority**: Carregamento e erro são estados transitórios mas frequentes. Um bom tratamento evita confusão e percepção de produto instável.

**Independent Test**: Simular latência de rede ao carregar o pipeline. Verificar que estado de loading é visível. Simular falha de API. Verificar que erro é exibido de forma clara e não quebra o layout.

**Acceptance Scenarios**:

1. **Given** o usuário acessa o pipeline enquanto os dados ainda não chegaram, **When** aguarda o carregamento, **Then** a interface exibe indicadores de loading no lugar do conteúdo (esqueletos de coluna ou de cards).
2. **Given** a requisição de stages ou deals falha, **When** o erro é recebido, **Then** a interface exibe uma mensagem de erro compreensível sem travar ou exibir conteúdo parcial incoerente.
3. **Given** stages carregam com sucesso mas deals falham, **When** o usuário vê o resultado, **Then** as colunas são exibidas mas com sinalização de falha no carregamento dos deals — o erro não é suprimido silenciosamente.

---

## Edge Cases

- O que acontece quando o usuário não possui stages cadastrados? → O board exibe uma área vazia com mensagem orientando que stages precisam ser criados antes de usar o pipeline.
- O que acontece se um deal tiver um `stage_id` que não corresponde a nenhum stage retornado? → O deal é ignorado na renderização — dado inconsistente não provoca erro de interface.
- O que acontece se a API de stages e a API de deals retornarem em momentos diferentes? → O board renderiza as colunas assim que stages chegam e popula os cards quando deals chegarem, sem bloquear um pelo outro.
- Como o sistema reage a um usuário não autenticado? → Redirecionamento automático para login antes de qualquer renderização do board.
- O que acontece em telas estreitas onde o board horizontal não cabe? → O board mantém layout horizontal com scroll lateral, preservando a estrutura de colunas sem colapsar ou empilhar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir todos os stages do usuário como colunas dispostas horizontalmente, na ordem definida pelo atributo `position` retornado pelo backend.
- **FR-002**: O sistema DEVE exibir todos os deals do usuário como cards individuais, cada um posicionado dentro da coluna correspondente ao seu `stage_id`.
- **FR-003**: Cada card de deal DEVE exibir: o nome do deal (`name`), o nome da empresa (`company_name`), o status atual (`status`) e o valor do deal (`value`).
- **FR-004**: O sistema DEVE exibir estados de carregamento enquanto os dados ainda não foram recebidos, indicando que o conteúdo está sendo buscado.
- **FR-010**: O sistema NÃO DEVE atualizar os dados do board automaticamente enquanto o usuário está na página — os dados são carregados uma única vez ao acessar a rota; qualquer atualização requer reload da página.
- **FR-011**: Cards de deal NÃO são clicáveis nesta feature — nenhuma ação é disparada ao clicar em um card; a estrutura do card deve, no entanto, ser preparada para receber navegação ou handler futuramente (feature 010).
- **FR-005**: O sistema DEVE exibir mensagem de erro clara e não-técnica quando as requisições de dados falharem, sem travar a interface.
- **FR-006**: O sistema DEVE exibir colunas vazias com comunicação visual adequada quando não houver deals em um stage.
- **FR-007**: O sistema DEVE exibir orientação visual quando o usuário não possuir nenhum stage cadastrado.
- **FR-008**: A página do pipeline DEVE exigir autenticação ativa, redirecionando para login se o usuário não estiver autenticado.
- **FR-009**: O layout do board DEVE ser estruturado de forma que a feature de movimentação visual (drag & drop) possa ser acoplada sem necessidade de reestruturação dos componentes de colunas e cards.

### Key Entities *(include if feature involves data)*

- **Pipeline Board**: Representação visual do funil de vendas; composto de colunas (stages) e cards (deals); não possui persistência própria — é derivado dos dados do backend em tempo de carregamento.
- **Coluna (Stage)**: Representa um estágio do funil; exibe o nome do stage e o conjunto de cards dos deals daquele stage; ordenada por `position`.
- **Card (Deal)**: Representa um negócio em andamento; exibido dentro da coluna do seu stage atual; mostra nome, empresa e status.

## Business Rules *(mandatory)*

- **BR-001**: A ordenação das colunas é determinada exclusivamente pelo atributo `position` retornado pelo backend — a UI não reordena, calcula nem interpreta posições.
- **BR-002**: A associação de um deal a uma coluna é determinada exclusivamente pelo `stage_id` retornado pelo backend — a UI não reatribui deals a colunas.
- **BR-003**: A página só é acessível para usuários autenticados; o controle de ownership já está aplicado nas APIs consumidas.
- **BR-004**: A UI não realiza persistência de nenhuma mudança de domínio — qualquer alteração de estado deve ser delegada ao backend via API.
- **BR-005**: Deals com `stage_id` sem correspondência em nenhum stage retornado não são exibidos e não provocam erro de interface.
- **BR-006**: O estado vazio (sem deals ou sem stages) é um estado válido e deve ser tratado como tal, não como falha.

## Flows *(mandatory)*

### Primary Flow

1. Usuário autenticado acessa a página do pipeline.
2. O sistema valida autenticação ativa; caso inválida, redireciona para login.
3. O sistema inicia simultaneamente a busca de stages e deals do usuário via APIs.
4. Enquanto os dados chegam, a interface exibe estados de carregamento por seção.
5. Ao receber os stages, o sistema renderiza as colunas na ordem de `position`.
6. Ao receber os deals, o sistema distribui os cards dentro de suas respectivas colunas por `stage_id`.
7. O board completo é exibido para o usuário.

### Failure / Edge Flow

1. Usuário autenticado acessa o pipeline; uma das requisições (stages ou deals) falha.
2. O sistema exibe a parte que carregou com sucesso (ex: colunas sem cards, ou mensagem de erro onde os cards deveriam estar).
3. Uma mensagem de erro clara e não-técnica é exibida no espaço correspondente à requisição que falhou.
4. Nenhuma falha é silenciada — o erro é visível e compreensível para o usuário.

## Dependencies *(mandatory)*

- **Technical Dependencies**: Next.js App Router, shadcn/ui (Card, Badge, Skeleton), TanStack Query (busca paralela e gerenciamento de estado de servidor).
- **Data Dependencies**: APIs já implementadas — `GET /api/stages`, `GET /api/deals`; contratos de resposta padronizados pela feature 007.
- **Auth Dependencies**: Clerk v7 para autenticação; middleware existente em `proxy.ts`; ownership aplicado pelas APIs (não replicado na UI).

## Skills Used *(mandatory)*

- `shadcn-ui`: componentes Card (deal cards), Badge (status visual), Skeleton (loading states) e estrutura base do board.
- `web-design-guidelines`: garantir que o board respeite acessibilidade, hierarquia visual, estados de loading/vazio/erro e legibilidade em diferentes tamanhos de tela.
- `tanstack-query-best-practices`: busca paralela de stages e deals com query key factories, staleTime adequado, tratamento de erro e loading por query independente.
- `next-best-practices`: RSC boundaries (board como client component), Suspense boundaries para Skeleton loading, padrão `loading.tsx` para a rota do pipeline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário visualiza o pipeline completo (colunas + cards) em no máximo 2 segundos após autenticação, em condições normais de rede.
- **SC-002**: 100% dos deals do usuário aparecem na coluna correta — nenhum deal em coluna errada ou ausente na renderização.
- **SC-003**: O estado de loading é sempre visível antes do conteúdo ou erro aparecer — o usuário nunca vê tela em branco sem feedback.
- **SC-004**: O board renderiza corretamente com 0 deals, 1 deal, e 50+ deals distribuídos em até 10 stages, sem quebra de layout.
- **SC-005**: A estrutura do board permanece intacta após a feature 009 ser acoplada — nenhuma reestruturação de componentes de colunas/cards é necessária para adicionar drag & drop.

## Validation Criteria *(mandatory)*

- **VC-001**: Verificar via inspeção visual que stages aparecem na ordem de `position` retornada pelo backend — reordenar stages no banco e confirmar que o board reflete a nova ordem sem mudança na UI.
- **VC-002**: Verificar que cada deal aparece na coluna do seu `stage_id` — mover um deal via API e confirmar que ele muda de coluna no próximo carregamento.
- **VC-003**: Verificar que a página redireciona para login quando acessada sem autenticação ativa.
- **VC-004**: Verificar que estado de loading é exibido antes dos dados chegarem e que estado de erro é exibido quando a API retorna falha — sem tela em branco silenciosa.
- **VC-005**: Verificar que colunas sem deals exibem estado vazio explícito e que o board sem stages exibe orientação adequada.

## Assumptions

- O usuário já cria stages e deals via APIs existentes; esta feature não adiciona criação de deals ou stages na UI.
- O sistema de design (tokens de cor, tipografia) será configurado junto com shadcn/ui nesta feature se ainda não existir.
- As APIs `GET /api/stages` e `GET /api/deals` já retornam dados filtrados por ownership do usuário autenticado.
- O campo `value` (valor monetário do deal) é exibido em todos os cards — a API já retorna este campo e a decisão foi confirmada na clarificação.
- Drag & drop não faz parte desta feature; o board apenas prepara sua estrutura para receber essa interação futura.
