# Feature Specification: Activities de Deals

**Feature Branch**: `005-deal-activities`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "Implementar a gestao de activities dos deals, permitindo registrar interacoes do processo comercial e atualizar last_touch_at do deal sempre que uma nova activity for criada. Tipos validos: note, call, meeting, followup. Content e opcional. Criacao e listagem por deal com ownership enforcement. Atualizacao de last_touch_at atomica com criacao da activity. Sem edicao, exclusao, comentarios, anexos, automacoes ou UI."

## Objective *(mandatory)*

Permitir que usuarios registrem atividades comerciais (notas, ligacoes,
reunioes, follow-ups) vinculadas a seus deals, formando o historico operacional
de interacoes. Cada activity criada atualiza automaticamente o campo
last_touch_at do deal, garantindo que o sistema reflita com precisao quando
houve a ultima interacao real com a oportunidade. Esta feature transforma o
deal de um registro estatico em um objeto com historico de atividade rastreavel.

## Context *(mandatory)*

O Fineo ja possui autenticacao (001-clerk-auth), stages do pipeline
(002-pipeline-stages), gestao de deals (003-deal-management) e movimentacao
entre stages (004-stage-movement). Deals existem, podem ser movidos e possuem
historico de transicoes — mas nao ha registro de interacoes comerciais do dia
a dia.

O campo last_touch_at existe no modelo Deal desde a feature 003 mas permanece
null, pois nenhuma feature ate agora o alimenta. A constituicao do projeto
(Principio II) exige que "activity creation MUST update last_touch_at" — esta
feature implementa diretamente esse requisito pendente.

Sem activities, o deal nao possui historico operacional de interacoes, a deal
page futura fica incompleta e last_touch_at nao reflete atividade real. Esta
feature desbloqueia acompanhamento operacional dos deals e suporta a futura
deal page completa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar activity em um deal (Priority: P1)

Como usuario autenticado, quero registrar uma atividade (nota, ligacao, reuniao
ou follow-up) em um deal meu para documentar interacoes comerciais e manter o
historico atualizado.

**Why this priority**: Criacao de activities e a funcionalidade central desta
feature. Sem ela, nao ha historico operacional e last_touch_at permanece null.

**Independent Test**: Criar uma activity do tipo "call" com conteudo em um deal
valido e verificar que a activity foi persistida, o deal.last_touch_at foi
atualizado e a resposta contem a activity criada.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal proprio, **When** ele cria uma
   activity do tipo "call" com conteudo "Ligacao de qualificacao", **Then** o
   sistema persiste a activity vinculada ao deal, atualiza deal.last_touch_at
   para o momento atual e retorna a activity criada.
2. **Given** um usuario autenticado com um deal proprio, **When** ele cria uma
   activity do tipo "note" sem conteudo, **Then** o sistema persiste a activity
   (content null), atualiza deal.last_touch_at e retorna a activity criada.
3. **Given** um usuario autenticado, **When** ele tenta criar uma activity com
   tipo invalido (ex: "email"), **Then** o sistema rejeita com erro de
   validacao e nenhuma activity e criada.
4. **Given** um usuario autenticado, **When** ele tenta criar uma activity sem
   informar o tipo, **Then** o sistema rejeita com erro de validacao.

---

### User Story 2 - Listar activities de um deal (Priority: P1)

Como usuario autenticado, quero ver todas as activities de um deal meu para
acompanhar o historico de interacoes comerciais.

**Why this priority**: Listagem complementa a criacao — sem ela, activities
criadas sao invisiveis e o historico perde utilidade.

**Independent Test**: Criar 3 activities em um deal e verificar que a listagem
retorna as 3 activities ordenadas por data de criacao (mais recente primeiro).

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal que possui 3 activities,
   **When** ele solicita a listagem, **Then** o sistema retorna as 3
   activities ordenadas da mais recente para a mais antiga.
2. **Given** um usuario autenticado com um deal sem activities, **When** ele
   solicita a listagem, **Then** o sistema retorna uma lista vazia.

---

### User Story 3 - Ownership enforcement em activities (Priority: P1)

Como sistema, devo garantir que apenas o proprietario do deal possa criar ou
listar activities nele, protegendo a integridade dos dados de cada usuario.

**Why this priority**: Seguranca de ownership e obrigatoria por constituicao
(Principio IV) e nao pode ser tratada como secundaria.

**Independent Test**: Criar deals para dois usuarios distintos. Tentar criar
e listar activities no deal do usuario A usando a sessao do usuario B.
Verificar que ambas as operacoes sao bloqueadas sem persistir alteracoes.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado, **When** ele tenta criar uma activity em
   um deal que pertence a outro usuario, **Then** o sistema nega acesso,
   nenhuma activity e criada e last_touch_at nao e alterado.
2. **Given** um usuario autenticado, **When** ele tenta listar activities de
   um deal que pertence a outro usuario, **Then** o sistema nega acesso e
   nenhuma informacao e retornada.
3. **Given** um usuario autenticado, **When** ele tenta criar uma activity em
   um deal inexistente, **Then** o sistema retorna erro de not found.

## Edge Cases

- O que acontece quando o usuario tenta criar uma activity com tipo invalido?
  - **Decisao**: Rejeitado. Apenas os tipos note, call, meeting, followup sao
    aceitos. Erro de validacao retornado.
- O que acontece quando o deal nao existe ou nao pertence ao usuario?
  - **Decisao**: Retorna erro de not found (404). Nao revela existencia do
    deal a usuarios sem permissao.
- O que acontece se a criacao da activity falhar apos o update de last_touch_at?
  - **Decisao**: A operacao e atomica. Se qualquer parte falhar, todas as
    alteracoes sao revertidas. Nenhuma activity parcial e persistida e
    last_touch_at permanece inalterado.
- O que acontece quando content e vazio ou null?
  - **Decisao**: Aceito. Content e opcional. A activity e valida com apenas
    o tipo.
- Activities podem ser criadas em deals finalizados (won/lost)?
  - **Decisao**: Sim. Activities registram interacoes reais que podem
    acontecer mesmo apos o fechamento (ex: follow-up pos-venda, nota de
    retrospectiva). Activities nao alteram o status do deal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuario autenticado crie uma
  activity vinculada a um deal proprio.
- **FR-002**: A activity MUST ter um tipo obrigatorio dentre: note, call,
  meeting, followup.
- **FR-003**: O campo content da activity MUST ser opcional (aceitar null ou
  string nao vazia).
- **FR-004**: A criacao de uma activity MUST atualizar deal.last_touch_at para
  o momento exato da operacao.
- **FR-005**: A criacao da activity e a atualizacao de last_touch_at MUST
  ocorrer dentro de uma unica operacao atomica.
- **FR-006**: O sistema MUST permitir listar todas as activities de um deal,
  ordenadas da mais recente para a mais antiga.
- **FR-007**: O sistema MUST negar criacao de activities em deals que nao
  pertencem ao usuario autenticado.
- **FR-008**: O sistema MUST negar listagem de activities de deals que nao
  pertencem ao usuario autenticado.
- **FR-009**: O sistema MUST exigir autenticacao para toda operacao de
  activities (criacao e listagem).
- **FR-010**: O sistema MUST retornar a activity criada com seus campos
  (id, tipo, conteudo, data de criacao) apos criacao bem-sucedida.
- **FR-011**: O sistema MUST rejeitar activities com tipo fora dos valores
  permitidos.
- **FR-012**: O sistema MUST rejeitar criacao de activity sem tipo informado.

### Key Entities *(include if feature involves data)*

- **Activity** (novo): Registro de interacao comercial vinculado a um deal.
  Campos: id, deal_id (FK obrigatoria), type (enum: note, call, meeting,
  followup), content (texto opcional), created_at (momento da criacao). Um deal
  pode ter muitas activities. Cada activity pertence a exatamente um deal.
- **Deal** (existente): Oportunidade de venda. Campo afetado: last_touch_at
  (atualizado a cada nova activity). Activities herdam ownership do deal via
  deal.owner_id.

## Business Rules *(mandatory)*

- **BR-001**: Toda criacao de activity MUST atualizar deal.last_touch_at
  simultaneamente. As duas operacoes sao inseparaveis.
- **BR-002**: Toda activity MUST estar vinculada a um deal existente. Activities
  orfas nao sao permitidas.
- **BR-003**: O usuario MUST ser o proprietario (owner_id) do deal para criar
  ou listar activities nele. Tentativa em deal de outro usuario MUST ser negada.
- **BR-004**: Os tipos de activity sao fixos nesta feature: note, call, meeting,
  followup. Nenhum outro tipo e aceito.
- **BR-005**: O frontend MUST NOT criar activities diretamente ou atualizar
  last_touch_at. Toda operacao MUST fluir pela API do backend.
- **BR-006**: Activities sao append-only nesta feature. Nao ha edicao,
  exclusao ou modificacao de activities existentes.
- **BR-007**: Activities podem ser criadas em deals de qualquer status (active,
  won, lost). O status do deal nao e alterado pela criacao de activities.
- **BR-008**: Nenhuma operacao de activity pode ocorrer parcialmente. Se a
  criacao falhar, last_touch_at permanece inalterado.

## Flows *(mandatory)*

### Primary Flow — Criacao de Activity

1. Usuario autenticado solicita criacao de activity em um deal.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend valida payload (type obrigatorio, content opcional).
4. Backend busca o deal por id com filtro de owner_id.
5. Backend inicia operacao atomica:
   a. Cria a activity (deal_id, type, content, created_at).
   b. Atualiza deal.last_touch_at para o momento atual.
6. Backend retorna a activity criada.

### Primary Flow — Listagem de Activities

1. Usuario autenticado solicita activities de um deal.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend busca o deal por id com filtro de owner_id.
4. Backend retorna lista de activities ordenadas por created_at descendente.

### Failure / Edge Flow

1. Requisicao sem sessao valida: bloqueada com erro UNAUTHORIZED (401).
2. Payload invalido (sem type, tipo invalido): rejeitado com erro
   INVALID_REQUEST (400).
3. Deal nao encontrado (id invalido ou ownership incorreto): erro
   DEAL_NOT_FOUND (404).
4. Falha transacional: todas as alteracoes revertidas, erro generico.

## Dependencies *(mandatory)*

- **Technical Dependencies**: Servicos existentes de autenticacao, deals e
  stages. Mecanismo de operacoes atomicas para criacao + update.
- **Data Dependencies**: Tabela users (001-clerk-auth), tabela deals
  (003-deal-management) com campo last_touch_at existente, nova tabela de
  activities.
- **Auth Dependencies**: Sessao autenticada para contexto de usuario, sync
  de usuario para garantir registro interno.

## Skills Used *(mandatory)*

- `next-best-practices`: Aplicar padroes de Route Handlers para os endpoints
  de criacao e listagem de activities.
- `postgresql-code-review`: Revisar modelo de activities, integridade
  referencial, indices e design transacional.
- `postgresql-optimization`: Otimizar indices para queries de listagem de
  activities por deal e garantir performance em operacoes atomicas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das activities criadas atualizam deal.last_touch_at na
  mesma operacao, sem possibilidade de activity sem touch ou touch sem activity.
- **SC-002**: 100% das tentativas de criar ou listar activities em deals de
  outros usuarios sao bloqueadas sem persistir qualquer alteracao.
- **SC-003**: 100% das activities com tipos invalidos sao rejeitadas antes de
  qualquer persistencia.
- **SC-004**: Activities podem ser listadas por deal em ordem cronologica
  reversa sem erros para dados validos.
- **SC-005**: 0% de operacoes parciais — toda criacao de activity e
  completamente bem-sucedida ou completamente revertida.

## Validation Criteria *(mandatory)*

- **VC-001**: Validar que a criacao de activity e atualizacao de last_touch_at
  ocorrem exclusivamente no backend (Principio I — backend source of truth).
- **VC-002**: Validar que toda activity criada persiste corretamente e
  last_touch_at reflete a ultima interacao (Principio II — mandatory
  persistence).
- **VC-003**: Validar que ownership e autenticacao sao enforced em toda
  operacao de activities (Principio IV — ownership security).
- **VC-004**: Validar que type e validado e erros seguem formato padronizado
  (Principio V — contract discipline).
- **VC-005**: Validar que a operacao atomica reverte completamente em caso de
  falha parcial (Principio IV — transactional consistency).

## Assumptions

- O campo last_touch_at ja existe no modelo Deal desde a feature 003 e
  permanece null ate a primeira activity ser criada.
- O enum ActivityType sera criado com valores fixos: note, call, meeting,
  followup. Novos tipos podem ser adicionados em features futuras.
- A tabela de activities sera criada nesta feature com relacionamento
  obrigatorio para deals.
- Activities herdam ownership do deal — nao possuem owner_id proprio. A
  seguranca e enforced via deal.owner_id.
- A listagem retorna todas as activities do deal sem paginacao. Paginacao pode
  ser adicionada em feature futura se necessario.
- Activities sao imutaveis nesta feature (append-only). Edicao e exclusao sao
  explicitamente fora de escopo.
- Activities podem ser criadas em deals com qualquer status (active, won, lost).
  A criacao de activity nao altera o status do deal.
- A feature nao implementa UI. Os endpoints serao consumidos pela futura deal
  page.
