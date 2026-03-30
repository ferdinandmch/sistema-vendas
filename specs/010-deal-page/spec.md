# Feature Specification: Deal Page

**Feature Branch**: `010-deal-page`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Implementar a Deal Page do sistema, exibindo os dados principais do deal, seu histórico de movimentação entre stages e sua lista de activities, consumindo os dados reais já implementados no backend."

## Objective *(mandatory)*

Permitir que o usuário visualize todos os dados relevantes de uma oportunidade em uma página dedicada — informações principais, histórico de movimentação entre stages e lista de interações — sem precisar consultar a API diretamente.

## Clarifications

### Session 2026-03-30

- Q: Como as 3 seções são organizadas visualmente na Deal Page? → A: Layout em dois painéis — dados principais no painel esquerdo (fixo); activities empilhadas acima do histórico de stage no painel direito.

## Context *(mandatory)*

O board visual do pipeline (feature 008) exibe deals como cards em colunas, mas não oferece acesso ao detalhe completo de cada oportunidade. Os dados já existem no backend: o endpoint de detalhe do deal, a lista de activities e o histórico de stage history estão todos implementados e funcionando (features 003, 005 e 006).

Esta feature fecha o gap de navegação: o usuário clica em um deal card no board e acessa uma página completa com todos os dados daquela oportunidade. É a primeira experiência de leitura profunda do sistema.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Navegar do board para a Deal Page (Priority: P1)

O usuário está no board do pipeline, vê um deal card e clica nele para acessar os detalhes completos do deal.

**Why this priority**: Sem esse ponto de entrada, a Deal Page fica inacessível pela UI. É o fluxo de navegação que conecta o board ao detalhe.

**Independent Test**: Acessar `/pipeline`. Clicar em qualquer deal card. Verificar que a URL muda para `/deals/:id` e que a página exibe o nome da empresa corretamente.

**Acceptance Scenarios**:

1. **Given** o usuário autenticado está no board, **When** clica em um deal card, **Then** é redirecionado para a página de detalhes daquele deal em `/deals/:id`.
2. **Given** o usuário acessa diretamente `/deals/:id` de um deal que não lhe pertence, **When** a página carrega, **Then** recebe erro de não encontrado (backend rejeita por ownership).
3. **Given** o usuário acessa `/deals/:id` de um deal inexistente, **When** a página carrega, **Then** recebe feedback claro de que o deal não foi encontrado.

---

### User Story 2 — Visualizar dados principais do deal (Priority: P1)

O usuário acessa a Deal Page e vê, em destaque, todas as informações relevantes da oportunidade: empresa, contato, status, stage atual, próxima ação, notas e metadados.

**Why this priority**: É o conteúdo central da página — sem ele, nada mais faz sentido.

**Independent Test**: Acessar `/deals/:id` de um deal existente. Verificar que todos os campos preenchidos são exibidos corretamente e que campos vazios não quebram o layout.

**Acceptance Scenarios**:

1. **Given** um deal com todos os campos preenchidos, **When** a página carrega, **Then** todos os campos (empresa, contato, status, stage, próxima ação, notas, fonte, data de criação) são exibidos corretamente.
2. **Given** um deal com campos opcionais vazios (sem contactName, sem nextAction, sem notes), **When** a página carrega, **Then** a página permanece útil e organizada, sem espaços quebrados ou erros.
3. **Given** um deal com status `won` ou `lost`, **When** a página carrega, **Then** o status é destacado visualmente de forma distinta do status `active`.

---

### User Story 3 — Acompanhar histórico de stage (Priority: P1)

O usuário visualiza, em ordem cronológica decrescente, todas as movimentações do deal entre stages — de qual stage saiu, para qual foi, e quando.

**Why this priority**: Rastrear a evolução do deal no pipeline é fundamental para análise e tomada de decisão operacional.

**Independent Test**: Acessar `/deals/:id` de um deal que já foi movido entre stages. Verificar que a seção de histórico exibe cada movimentação com stage de origem, stage de destino e data.

**Acceptance Scenarios**:

1. **Given** um deal com histórico de movimentações, **When** o usuário visualiza a seção de histórico, **Then** cada entrada mostra o stage de origem, o stage de destino e a data da movimentação, em ordem cronológica decrescente.
2. **Given** um deal sem histórico de movimentações, **When** o usuário visualiza a seção de histórico, **Then** a seção exibe uma mensagem de estado vazio sem quebrar a página.

---

### User Story 4 — Visualizar activities do deal (Priority: P1)

O usuário visualiza a lista de interações registradas para o deal — notas, ligações, reuniões e follow-ups — em ordem cronológica decrescente.

**Why this priority**: Activities são o registro operacional do relacionamento com o cliente. Sem visibilidade delas, o acompanhamento do deal fica incompleto.

**Independent Test**: Acessar `/deals/:id` de um deal com activities. Verificar que cada activity exibe tipo, conteúdo e data. Acessar um deal sem activities e verificar estado vazio correto.

**Acceptance Scenarios**:

1. **Given** um deal com activities registradas, **When** o usuário visualiza a seção de activities, **Then** cada activity exibe seu tipo (nota, ligação, reunião, follow-up), seu conteúdo e sua data, em ordem cronológica decrescente.
2. **Given** um deal sem activities, **When** o usuário visualiza a seção de activities, **Then** a seção exibe uma mensagem de estado vazio adequada.

---

## Edge Cases

- O que acontece se o deal pertence a outro usuário? O backend rejeita com 404 e a página exibe erro de não encontrado.
- O que acontece se o deal foi removido após o board carregar? A página exibe erro de não encontrado ao tentar carregar.
- O que acontece se uma das queries secundárias (activities ou history) falhar enquanto o deal principal carregou? Cada seção exibe seu próprio erro sem derrubar a página inteira.
- O que acontece se o deal tem notas muito longas? O layout acomoda texto longo sem quebrar.
- O que acontece ao clicar em um deal com status `won` ou `lost`? A navegação funciona normalmente — a Deal Page exibe o deal com seu status destacado.
- O que acontece ao clicar no grip handle de um deal card? O handle ativa o drag — o clique para navegação deve vir de outra área do card.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma página de detalhe acessível em `/deals/:id` para qualquer deal do usuário autenticado.
- **FR-002**: A página DEVE exibir os dados principais do deal: empresa, contato, detalhes de contato, status, stage atual, próxima ação, notas, fonte, perfil ICP e datas relevantes.
- **FR-003**: A página DEVE exibir o histórico completo de movimentação entre stages em ordem cronológica decrescente, com stage de origem, stage de destino e data de cada entrada.
- **FR-004**: A página DEVE exibir a lista de activities do deal em ordem cronológica decrescente, com tipo, conteúdo e data de cada entrada.
- **FR-005**: Cada seção (dados principais, histórico, activities) DEVE tratar independentemente seus estados de loading, vazio e erro.
- **FR-009**: A página DEVE adotar layout em dois painéis: painel esquerdo com os dados principais do deal; painel direito com activities no topo e histórico de stage abaixo, ambos empilhados verticalmente.
- **FR-006**: O deal card no board DEVE ser clicável e navegar para `/deals/:id` do deal correspondente — a área de clique é o card exceto o grip handle.
- **FR-007**: A página NÃO DEVE permitir edição de nenhum campo nesta feature.
- **FR-008**: A página DEVE ser acessível apenas para o usuário autenticado dono do deal — o backend é a única fonte de verdade de ownership.

### Key Entities *(include if feature involves data)*

- **Deal**: Oportunidade de venda. Campos: empresa, contato, detalhes de contato, status (ativo/ganho/perdido), stage atual, próxima ação, notas, fonte, perfil ICP, datas de criação e última movimentação de stage.
- **Activity**: Interação registrada em um deal. Tipos: nota, ligação, reunião, follow-up. Possui conteúdo textual e data de criação.
- **DealStageHistory**: Registro de movimentação de stage. Contém stage de origem, stage de destino e data da movimentação. É append-only e imutável.

## Business Rules *(mandatory)*

- **BR-001**: A Deal Page DEVE consumir exclusivamente os endpoints reais do backend — o frontend não recalcula nem infere dados de ownership.
- **BR-002**: Somente deals pertencentes ao usuário autenticado DEVEM ser acessíveis. O backend rejeita requisições inválidas com 404.
- **BR-003**: O frontend NÃO DEVE alterar nenhum dado do deal nesta feature — a página é estritamente de leitura.
- **BR-004**: O histórico de stage é append-only e imutável — a UI apenas exibe os registros existentes sem filtrar ou reordenar arbitrariamente.
- **BR-005**: Falhas em queries secundárias (activities, history) NÃO DEVEM impedir a exibição dos dados principais do deal.

## Flows *(mandatory)*

### Primary Flow — Acesso à Deal Page via board

1. Usuário autenticado está no board em `/pipeline`.
2. Clica na área de clique de um deal card (exceto o grip handle).
3. O sistema navega para `/deals/:id`.
4. A página busca em paralelo: dados do deal, activities e histórico.
5. Cada seção renderiza conforme os dados chegam.
6. A página completa é exibida com dados reais do backend.

### Failure / Edge Flow — Deal não encontrado ou sem permissão

1. Usuário acessa `/deals/:id` de um deal inexistente ou de outro usuário.
2. O backend retorna 404.
3. A página exibe feedback claro de deal não encontrado.
4. O usuário pode retornar ao board.

### Failure / Edge Flow — Falha em query secundária

1. Dados principais do deal carregam com sucesso.
2. A query de activities ou de histórico falha (rede, erro do servidor).
3. A seção correspondente exibe mensagem de erro independente.
4. O restante da página permanece funcional e legível.

## Dependencies *(mandatory)*

- **Technical Dependencies**: Next.js App Router, shadcn/ui, TanStack Query, Clerk v7.
- **Data Dependencies**: `GET /api/deals/:id` (feature 003), `GET /api/deals/:id/activities` (feature 005), `GET /api/deals/:id/history` (feature 006). Todos já implementados e padronizados (feature 007).
- **Auth Dependencies**: Clerk auth já implementado. Todos os endpoints de detalhe já exigem autenticação e filtram por `owner_id`. Nenhum novo middleware necessário.

## Skills Used *(mandatory)*

- `shadcn-ui`: Composição da Deal Page com Card, Badge, Separator e tipografia shadcn.
- `web-design-guidelines`: Hierarquia visual da página, separação clara entre seções, estados de loading, vazio e erro.
- `next-best-practices`: Rota `/deals/:id` dentro do layout privado existente; queries paralelas com TanStack Query.
- `tanstack-query-best-practices`: Queries paralelas para deal, activities e history com tratamento individual de loading/error por seção.
- `clerk`: Autenticação já em vigor — nenhuma nova lógica necessária, apenas consistência com o padrão existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue acessar a página de detalhe de qualquer deal a partir do board com um único clique.
- **SC-002**: Todos os campos preenchidos do deal são exibidos corretamente na página, sem dados inventados ou calculados pelo frontend.
- **SC-003**: O histórico de stage de um deal com múltiplas movimentações é exibido completo e em ordem cronológica correta.
- **SC-004**: A lista de activities de um deal com interações registradas é exibida completa e em ordem cronológica.
- **SC-005**: Nenhuma falha em query secundária impede a visualização dos dados principais do deal.
- **SC-006**: A página exibe estados de loading, vazio e erro sem quebrar o layout em nenhuma das três seções.

## Validation Criteria *(mandatory)*

- **VC-001**: Acessar `/deals/:id` de um deal existente — todos os campos do backend são exibidos corretamente, nenhum campo inventado pelo frontend.
- **VC-002**: Acessar `/deals/:id` de um deal com histórico — cada entrada mostra stage de origem, stage de destino e data em ordem decrescente.
- **VC-003**: Acessar `/deals/:id` de um deal com activities — tipo, conteúdo e data de cada activity são exibidos corretamente.
- **VC-004**: Acessar `/deals/:id` de um deal de outro usuário — backend retorna 404 e a UI exibe erro de não encontrado.
- **VC-005**: Simular falha na query de activities (DevTools offline após deal carregar) — deal principal permanece visível; seção de activities exibe erro independente.
- **VC-006**: Clicar em um deal card no board — URL muda para `/deals/:id` e a página exibe o deal correto.

## Assumptions

- O usuário está autenticado — Clerk auth já está em vigor em todas as rotas privadas.
- Os três endpoints consumidos (`GET /api/deals/:id`, `GET /api/deals/:id/activities`, `GET /api/deals/:id/history`) já estão implementados, testados e seguem o envelope padrão da feature 007.
- A navegação do board para a Deal Page é feita via clique no card — a área de clique é o card inteiro exceto o grip handle (que ativa o drag da feature 009).
- Criação de activities na Deal Page está fora de escopo nesta feature.
- Edição de qualquer campo do deal está fora de escopo nesta feature.
- A Deal Page é uma rota protegida dentro do layout privado existente (`app/(private)/`).
- Reordenação ou filtragem de activities e histórico está fora de escopo — a UI exibe os dados na ordem retornada pelo backend.
