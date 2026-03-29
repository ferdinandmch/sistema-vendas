# Feature Specification: Historico de Movimentacao de Deals

**Feature Branch**: `006-stage-history`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "Implementar a consulta e exposicao do historico de movimentacao de deals (deal_stage_history), permitindo rastrear todas as mudancas de stage de um deal de forma auditavel."

## Objective *(mandatory)*

Permitir que usuarios autenticados consultem o historico completo de
movimentacao de stages de seus deals, expondo os registros de
deal_stage_history que ja sao criados pela feature 004-stage-movement. Esta
feature transforma dados de auditoria que existem no banco mas sao
inacessiveis em informacao consultavel, habilitando rastreabilidade completa
do pipeline e suportando a futura deal page.

## Context *(mandatory)*

O Fineo ja possui autenticacao (001-clerk-auth), stages (002-pipeline-stages),
gestao de deals (003-deal-management), movimentacao entre stages
(004-stage-movement) e activities (005-deal-activities). A movimentacao de
stage ja cria registros em deal_stage_history com from_stage_id, to_stage_id
e changed_at — mas nao existe endpoint para consultar esses registros.

A constituicao (Principio II) exige que "stage changes MUST always create
history records" e (Principio III) define que "stage history represents the
authoritative transition log". Os registros existem mas nao sao acessiveis
via API. Esta feature fecha essa lacuna.

Sem esta feature, o historico existe no banco mas e invisivel para o usuario,
o sistema perde transparencia operacional, e a futura deal page nao tem dados
de timeline para exibir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar historico de movimentacao de um deal (Priority: P1)

Como usuario autenticado, quero ver o historico completo de movimentacoes de
stage de um deal meu para acompanhar a trajetoria da oportunidade no pipeline
e auditar decisoes passadas.

**Why this priority**: Consulta de historico e a funcionalidade central e unica
desta feature. Sem ela, registros de auditoria existem mas sao inacessiveis.

**Independent Test**: Mover um deal por 3 stages diferentes, entao consultar
o historico e verificar que retorna 3 registros de transicao com from/to
stages e timestamps, ordenados cronologicamente.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal que passou por 3 movimentacoes
   de stage, **When** ele solicita o historico do deal, **Then** o sistema
   retorna 3 registros de transicao contendo from_stage, to_stage e
   changed_at, ordenados da mais antiga para a mais recente.
2. **Given** um usuario autenticado com um deal recem-criado (sem
   movimentacoes), **When** ele solicita o historico do deal, **Then** o
   sistema retorna uma lista vazia.
3. **Given** um usuario autenticado com um deal que possui movimentacoes,
   **When** ele solicita o historico, **Then** cada registro inclui os nomes
   dos stages de origem e destino para contexto legivel.

---

### User Story 2 - Ownership enforcement no historico (Priority: P1)

Como sistema, devo garantir que apenas o proprietario do deal possa consultar
o historico de movimentacao, protegendo a integridade dos dados de cada
usuario.

**Why this priority**: Seguranca de ownership e obrigatoria por constituicao
(Principio IV) e nao pode ser tratada como secundaria.

**Independent Test**: Criar deals para dois usuarios distintos. Tentar
consultar o historico do deal do usuario A usando a sessao do usuario B.
Verificar que o acesso e bloqueado sem revelar informacao.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado, **When** ele tenta consultar o historico
   de um deal que pertence a outro usuario, **Then** o sistema nega acesso e
   nenhuma informacao e retornada.
2. **Given** um usuario autenticado, **When** ele tenta consultar o historico
   de um deal inexistente, **Then** o sistema retorna erro de not found.

## Edge Cases

- O que acontece quando o deal existe mas nao tem historico de movimentacao?
  - **Decisao**: Retorna lista vazia. Um deal recem-criado nao possui
    movimentacoes, o que e um estado valido.
- O que acontece quando o deal nao existe ou nao pertence ao usuario?
  - **Decisao**: Retorna erro de not found (404). Nao revela existencia do
    deal a usuarios sem permissao.
- O que acontece quando um deal finalizado (won/lost) tem historico?
  - **Decisao**: O historico e retornado normalmente. O status do deal nao
    afeta a consulta de historico — o historico e um registro imutavel de
    todas as transicoes passadas.
- O que acontece se o usuario tenta modificar ou deletar registros de historico?
  - **Decisao**: Nao ha endpoint de escrita para historico. Historico e
    somente leitura. Registros sao criados exclusivamente pela movimentacao
    de stage (feature 004).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuario autenticado consulte o
  historico de movimentacao de stage de um deal proprio.
- **FR-002**: O sistema MUST retornar registros de historico contendo
  identificacao do stage de origem, stage de destino e momento da transicao.
- **FR-003**: Os registros de historico MUST incluir os nomes dos stages de
  origem e destino para contexto legivel.
- **FR-004**: O sistema MUST retornar os registros ordenados cronologicamente
  da transicao mais antiga para a mais recente.
- **FR-005**: O sistema MUST negar consulta de historico de deals que nao
  pertencem ao usuario autenticado.
- **FR-006**: O sistema MUST exigir autenticacao para toda operacao de
  historico.
- **FR-007**: O sistema MUST retornar lista vazia quando o deal nao possui
  historico de movimentacao.
- **FR-008**: O historico MUST ser somente leitura — nenhum endpoint de
  criacao, edicao ou exclusao de registros de historico.

### Key Entities *(include if feature involves data)*

- **DealStageHistory** (existente): Registro de transicao de stage de um deal.
  Campos: id, deal_id (FK para Deal), from_stage_id (FK para PipelineStage),
  to_stage_id (FK para PipelineStage), changed_at (momento da transicao).
  Criado automaticamente pela feature 004 durante movimentacao de stage.
  Somente leitura nesta feature.
- **Deal** (existente): Oportunidade de venda. Campo utilizado: owner_id para
  validacao de ownership antes de retornar historico.
- **PipelineStage** (existente): Stage do pipeline. Campos utilizados: id e
  name para enriquecer os registros de historico com nomes legiveis.

## Business Rules *(mandatory)*

- **BR-001**: Historico de movimentacao e somente leitura. Nenhuma operacao de
  escrita, edicao ou exclusao e permitida nesta feature.
- **BR-002**: Historico e derivado exclusivamente da movimentacao de stage
  (feature 004). Nao existe criacao manual de registros de historico.
- **BR-003**: O usuario MUST ser o proprietario (owner_id) do deal para
  consultar o historico de movimentacao. Tentativa em deal de outro usuario
  MUST ser negada.
- **BR-004**: Cada registro de historico representa uma unica transicao de
  stage, contendo stage de origem, stage de destino e momento da transicao.
- **BR-005**: O frontend MUST NOT acessar historico diretamente. Toda consulta
  MUST fluir pela API do backend.
- **BR-006**: Historico pode ser consultado em deals de qualquer status
  (active, won, lost). O status do deal nao restringe a consulta.

## Flows *(mandatory)*

### Primary Flow — Consulta de Historico

1. Usuario autenticado solicita historico de movimentacao de um deal.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend busca o deal por id com filtro de owner_id.
4. Backend consulta registros de historico associados ao deal.
5. Backend inclui nomes dos stages de origem e destino em cada registro.
6. Backend retorna lista de movimentacoes ordenadas cronologicamente (mais
   antiga primeiro).

### Failure / Edge Flow

1. Requisicao sem sessao valida: bloqueada com erro UNAUTHORIZED (401).
2. Deal nao encontrado (id invalido ou ownership incorreto): erro
   DEAL_NOT_FOUND (404).
3. Deal sem historico: retorna lista vazia (200).

## Dependencies *(mandatory)*

- **Technical Dependencies**: Servicos existentes de autenticacao e deals.
  Tabela deal_stage_history ja populada pela feature 004.
- **Data Dependencies**: Tabela users (001-clerk-auth), tabela deals
  (003-deal-management) com campo owner_id, tabela deal_stage_history
  (004-stage-movement) com registros existentes, tabela pipeline_stages
  (002-pipeline-stages) para nomes dos stages.
- **Auth Dependencies**: Sessao autenticada para contexto de usuario, sync
  de usuario para garantir registro interno.

## Skills Used *(mandatory)*

- `next-best-practices`: Aplicar padroes de Route Handlers para o endpoint
  de consulta de historico.
- `postgresql-code-review`: Revisar query de historico com joins para nomes
  de stages, integridade referencial e indices.
- `postgresql-optimization`: Garantir que o indice existente
  (dealId, changedAt) seja utilizado eficientemente na query de listagem.
- `update-docs`: Atualizar documentacao do projeto apos implementacao.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos deals com movimentacoes retornam historico completo com
  todas as transicoes registradas, sem perda de dados.
- **SC-002**: 100% das tentativas de consultar historico de deals de outros
  usuarios sao bloqueadas sem revelar informacao.
- **SC-003**: Historico e retornado em ordem cronologica correta (mais antiga
  primeiro) em todas as consultas.
- **SC-004**: Cada registro de historico inclui nomes legiveis dos stages de
  origem e destino, alem dos identificadores.
- **SC-005**: 0% de endpoints de escrita para historico — feature e
  exclusivamente de leitura.

## Validation Criteria *(mandatory)*

- **VC-001**: Validar que a consulta de historico e executada exclusivamente no
  backend (Principio I — backend source of truth).
- **VC-002**: Validar que os registros retornados sao os mesmos criados pela
  movimentacao de stage, sem manipulacao (Principio II — auditability).
- **VC-003**: Validar que ownership e autenticacao sao enforced em toda
  consulta de historico (Principio IV — ownership security).
- **VC-004**: Validar que o historico e o log autoritativo de transicoes do
  deal (Principio III — state-oriented engine).
- **VC-005**: Validar que erros seguem formato padronizado e contrato e
  explicito (Principio V — contract discipline).

## Assumptions

- A tabela deal_stage_history ja existe e e populada pela feature 004
  (stage-movement) com registros validos.
- O indice @@index([dealId, changedAt]) ja existe na tabela e sera utilizado
  pela query de listagem.
- Os registros de historico incluem from_stage_id e to_stage_id que referenciam
  pipeline_stages existentes.
- A consulta retorna nomes dos stages via include/join — nao armazena nomes
  redundantemente nos registros de historico.
- A listagem retorna todos os registros sem paginacao. Paginacao pode ser
  adicionada em feature futura se necessario.
- A feature nao implementa UI. O endpoint sera consumido pela futura deal page.
- A ordenacao cronologica e ASC (mais antiga primeiro), diferente de activities
  que usa DESC (mais recente primeiro). Historico e uma timeline de eventos —
  leitura natural e do inicio para o fim.
