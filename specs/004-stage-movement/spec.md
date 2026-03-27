# Feature Specification: Movimentacao de Deal entre Stages

**Feature Branch**: `004-stage-movement`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "Implementar a movimentacao de deals entre stages do pipeline, garantindo atualizacao consistente do stage_id, atualizacao de stage_updated_at, registro obrigatorio em deal_stage_history e atualizacao de status quando o stage de destino for final."

## Objective *(mandatory)*

Permitir que deals sejam movidos entre stages do pipeline de forma atomica e
auditavel, criando o mecanismo central de progressao de oportunidades. Cada
movimentacao atualiza o stage atual do deal, registra o momento da transicao e
insere um registro historico obrigatorio, formando a base para rastreabilidade
completa e reconhecimento operacional de deals ganhos e perdidos.

## Context *(mandatory)*

O Fineo ja possui autenticacao (001-clerk-auth), stages do pipeline
(002-pipeline-stages) e gestao de deals (003-deal-management). Deals existem e
ocupam stages, mas nao podem transitar entre eles — o pipeline e estatico. Sem
movimentacao, o sistema nao funciona como maquina de estados e perde sua razao
de existir como ferramenta de vendas.

Esta feature e o ponto de virada: transforma o pipeline de uma lista de deals
em um motor operacional de vendas. A constituicao do projeto (Principio III)
exige que o sistema se comporte como "auditable state machine" e (Principio IV)
que stage movement seja transacional. Esta feature implementa diretamente esses
dois principios.

Todas as features subsequentes (historico visual, board com drag & drop,
metricas de conversao) dependem de movimentacao correta e auditavel.

## Clarifications

### Session 2026-03-27

- Q: Mover deal para o mesmo stage — permitir ou bloquear? → A: Bloquear com erro SAME_STAGE. Evita historico desnecessario.
- Q: Deal finalizado (won/lost) pode ser movido novamente? → A: Nao. Deal finalizado e imutavel. Reativacao sera feature futura propria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mover deal para outro stage (Priority: P1)

Como usuario autenticado, quero mover um deal meu para outro stage do pipeline
para refletir o progresso real da oportunidade de venda.

**Why this priority**: Movimentacao e a funcionalidade central desta feature.
Sem ela, nenhum outro cenario faz sentido.

**Independent Test**: Mover um deal de um stage intermediario para outro stage
intermediario e verificar que stage_id, stage_updated_at e deal_stage_history
sao atualizados corretamente numa unica operacao.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal no stage "Contato Inicial",
   **When** ele solicita mover o deal para "Proposta Enviada", **Then** o
   sistema atualiza stage_id, define stage_updated_at como o momento atual e
   cria um registro em deal_stage_history com from_stage_id, to_stage_id e
   changed_at.
2. **Given** um usuario autenticado, **When** ele solicita mover um deal para
   um stage_id inexistente, **Then** o sistema rejeita a operacao com erro
   especifico e nenhuma alteracao e persistida.
3. **Given** um visitante sem sessao, **When** ele tenta mover um deal,
   **Then** o sistema bloqueia a operacao com erro de autenticacao.

---

### User Story 2 - Mover deal para stage final (Priority: P1)

Como usuario autenticado, quero mover um deal para um stage final (Won ou Lost)
para registrar o resultado definitivo da oportunidade.

**Why this priority**: O reconhecimento de ganho/perda e inseparavel da
movimentacao — e o que da significado operacional ao pipeline.

**Independent Test**: Mover um deal para um stage com is_final=true e
final_type=won. Verificar que status muda para won, stage_updated_at e
atualizado e deal_stage_history e criado.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado com um deal ativo, **When** ele move o deal
   para um stage com is_final=true e final_type=won, **Then** o sistema define
   status=won, atualiza stage_id e stage_updated_at, e cria registro em
   deal_stage_history.
2. **Given** um usuario autenticado com um deal ativo, **When** ele move o deal
   para um stage com is_final=true e final_type=lost, **Then** o sistema define
   status=lost, atualiza stage_id e stage_updated_at, e cria registro em
   deal_stage_history.
3. **Given** um usuario autenticado com um deal em status won ou lost, **When**
   ele tenta mover o deal para qualquer stage, **Then** o sistema bloqueia a
   operacao com erro especifico.

---

### User Story 3 - Ownership enforcement na movimentacao (Priority: P1)

Como sistema, devo garantir que apenas o proprietario de um deal consiga
move-lo, protegendo a integridade dos dados de cada usuario.

**Why this priority**: Seguranca de ownership e obrigatoria por constituicao
(Principio IV) e nao pode ser tratada como secundaria.

**Independent Test**: Criar deals para dois usuarios distintos. Tentar mover
o deal do usuario A usando a sessao do usuario B. Verificar que a operacao e
bloqueada e nenhuma alteracao e persistida.

**Acceptance Scenarios**:

1. **Given** um usuario autenticado, **When** ele tenta mover um deal que
   pertence a outro usuario, **Then** o sistema nega acesso e nenhuma alteracao
   e persistida.
2. **Given** um usuario autenticado, **When** ele tenta mover um deal
   inexistente, **Then** o sistema retorna erro de not found.

## Edge Cases

- O que acontece quando o usuario tenta mover um deal para o stage em que ele
  ja esta?
  - **Decisao**: Bloqueado. Movimentacao para o mesmo stage e rejeitada com
    erro especifico. Evita historico desnecessario.
- O que acontece quando o deal ja esta em status won ou lost e o usuario tenta
  move-lo?
  - **Decisao**: Bloqueado. Deal finalizado e imutavel. Won/lost e definitivo.
    Se necessario reabrir no futuro, sera feature propria com regras e
    auditoria adequadas.
- O que acontece se o stage de destino for deletado entre a validacao e a
  persistencia?
  - **Decisao**: A integridade referencial do banco (FK) impede a insercao.
    A transacao falha e nenhuma alteracao parcial e persistida.
- O que acontece se a transacao falhar no meio (ex: insert de historico falha)?
  - **Decisao**: A transacao e atomica. Se qualquer parte falhar, todas as
    alteracoes sao revertidas. Nenhuma movimentacao parcial e possivel.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuario autenticado mova um deal
  proprio para um stage valido diferente.
- **FR-002**: A movimentacao MUST atualizar deal.stage_id para o novo stage.
- **FR-003**: A movimentacao MUST definir deal.stage_updated_at como o momento
  exato da operacao.
- **FR-004**: A movimentacao MUST criar um registro em deal_stage_history com
  deal_id, from_stage_id, to_stage_id e changed_at.
- **FR-005**: As operacoes FR-002, FR-003 e FR-004 MUST ocorrer dentro de uma
  unica transacao atomica.
- **FR-006**: Quando o stage de destino tiver is_final=true e final_type=won,
  o sistema MUST definir deal.status como won.
- **FR-007**: Quando o stage de destino tiver is_final=true e final_type=lost,
  o sistema MUST definir deal.status como lost.
- **FR-008**: O sistema MUST negar movimentacao de deals que nao pertencem ao
  usuario autenticado.
- **FR-009**: O sistema MUST validar que to_stage_id referencia um stage
  existente antes de executar a movimentacao.
- **FR-010**: O sistema MUST exigir autenticacao para toda operacao de
  movimentacao.
- **FR-011**: O sistema MUST retornar o deal atualizado com stage embed (id,
  name, position) apos movimentacao bem-sucedida.
- **FR-012**: O sistema MUST rejeitar movimentacao quando o stage de destino
  for igual ao stage atual do deal.
- **FR-013**: O sistema MUST rejeitar movimentacao de deals com status won ou
  lost. Deals finalizados sao imutaveis.

### Key Entities *(include if feature involves data)*

- **Deal** (existente): Oportunidade de venda. Campos afetados pela
  movimentacao: stage_id, stage_updated_at, status. O enum DealStatus sera
  estendido com valores won e lost.
- **PipelineStage** (existente): Stage do pipeline. Campos consultados na
  movimentacao: id, is_final, final_type, name, position.
- **DealStageHistory** (novo): Registro auditavel de cada movimentacao de
  stage. Campos: id, deal_id (FK), from_stage_id (FK), to_stage_id (FK),
  changed_at. Um deal pode ter muitos registros de historico. Cada registro
  referencia o deal e os dois stages envolvidos.

## Business Rules *(mandatory)*

- **BR-001**: Toda movimentacao de stage MUST ser executada em uma unica
  transacao que inclui: update de stage_id, update de stage_updated_at,
  insert em deal_stage_history e, se aplicavel, update de status.
- **BR-002**: Toda movimentacao MUST criar um registro em deal_stage_history.
  Nenhuma movimentacao pode existir sem historico correspondente.
- **BR-003**: O campo to_stage_id MUST referenciar um PipelineStage existente.
  Movimentacao para stage inexistente MUST ser rejeitada.
- **BR-004**: O usuario MUST ser o proprietario (owner_id) do deal para
  move-lo. Tentativa de mover deal de outro usuario MUST ser negada.
- **BR-005**: Quando o stage de destino for final (is_final=true), o status
  do deal MUST ser atualizado para corresponder ao final_type do stage
  (won ou lost).
- **BR-006**: Quando o stage de destino NAO for final, o deal MUST permanecer
  com status=active.
- **BR-007**: Nenhuma movimentacao pode ocorrer parcialmente. Se qualquer
  parte da transacao falhar, todas as alteracoes MUST ser revertidas.
- **BR-008**: O frontend MUST NOT executar movimentacao diretamente. Toda
  movimentacao MUST fluir pela API do backend.
- **BR-009**: Movimentacao para o mesmo stage (from == to) MUST ser rejeitada.
  Nao e permitido criar historico de movimentacao sem mudanca real.
- **BR-010**: Deals com status won ou lost MUST NOT ser movidos. O estado
  final e definitivo e imutavel nesta feature.

## Flows *(mandatory)*

### Primary Flow — Movimentacao Padrao

1. Usuario autenticado solicita mover um deal para outro stage.
2. Backend valida autenticacao e extrai owner_id do contexto.
3. Backend valida payload (to_stage_id obrigatorio).
4. Backend busca o deal por id com filtro de owner_id.
5. Backend busca o stage de destino e valida existencia.
6. Backend inicia transacao:
   a. Registra from_stage_id (stage atual do deal).
   b. Atualiza deal.stage_id para o novo stage.
   c. Atualiza deal.stage_updated_at para o momento atual.
   d. Se stage de destino for final: atualiza deal.status (won ou lost).
   e. Insere registro em deal_stage_history (deal_id, from_stage_id,
      to_stage_id, changed_at).
7. Backend retorna o deal atualizado com stage embed.

### Primary Flow — Movimentacao para Stage Final

1. Fluxo identico ao padrao ate o passo 5.
2. Backend identifica is_final=true no stage de destino.
3. Dentro da transacao, alem de stage_id e stage_updated_at, atualiza
   deal.status para o valor correspondente ao final_type (won ou lost).
4. Registra historico e retorna deal atualizado.

### Failure / Edge Flow

1. Requisicao sem sessao valida: bloqueada com erro UNAUTHORIZED (401).
2. Payload invalido (sem to_stage_id): rejeitado com erro INVALID_REQUEST (400).
3. Deal nao encontrado (id invalido ou ownership incorreto): erro
   DEAL_NOT_FOUND (404).
4. Stage de destino inexistente: erro STAGE_NOT_FOUND (400).
5. Movimentacao para o mesmo stage: erro SAME_STAGE (400).
6. Deal ja finalizado (won/lost): erro DEAL_ALREADY_CLOSED (400).
7. Falha transacional: todas as alteracoes revertidas, erro generico.

## Dependencies *(mandatory)*

- **Technical Dependencies**: Next.js App Router, Prisma (transacoes),
  servicos existentes de autenticacao, stages e deals.
- **Data Dependencies**: Tabela users (001-clerk-auth), tabela
  pipeline_stages (002-pipeline-stages), tabela deals (003-deal-management),
  nova tabela deal_stage_history.
- **Auth Dependencies**: Clerk para sessao, require-auth para contexto
  autenticado, sync-user para garantir registro interno do usuario.

## Skills Used *(mandatory)*

- `next-best-practices`: Aplicar padroes de Route Handlers e data patterns
  para a API de movimentacao.
- `postgresql-code-review`: Revisar modelo de historico, integridade
  referencial, indices e design transacional.
- `postgresql-optimization`: Otimizar indices para queries de historico e
  garantir performance em transacoes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das movimentacoes bem-sucedidas atualizam stage_id,
  stage_updated_at e criam registro em deal_stage_history numa unica operacao.
- **SC-002**: 100% das movimentacoes para stages finais atualizam o status do
  deal corretamente (won ou lost conforme final_type).
- **SC-003**: 100% das tentativas de mover deals de outros usuarios sao
  bloqueadas sem persistir qualquer alteracao.
- **SC-004**: 100% das tentativas com stage de destino invalido sao rejeitadas
  sem persistir qualquer alteracao.
- **SC-005**: 0% de movimentacoes parciais — toda operacao e completamente
  bem-sucedida ou completamente revertida.
- **SC-006**: Usuarios autenticados conseguem mover deals entre stages em
  fluxo completo sem erros para dados validos.

## Validation Criteria *(mandatory)*

- **VC-001**: Validar que toda movimentacao atualiza stage_id, stage_updated_at
  e status (quando aplicavel) exclusivamente no backend (Principio I — backend
  source of truth).
- **VC-002**: Validar que toda movimentacao cria registro em
  deal_stage_history sem excecao (Principio II — mandatory persistence).
- **VC-003**: Validar que a movimentacao respeita o modelo de maquina de
  estados: deal tem stage atual, historico registra transicoes (Principio III
  — state-oriented engine).
- **VC-004**: Validar que update de stage_id, stage_updated_at, status e
  insert de historico ocorrem numa unica transacao atomica (Principio IV —
  transactional consistency).
- **VC-005**: Validar que ownership e autenticacao sao enforced em toda
  operacao de movimentacao (Principio IV — ownership security).
- **VC-006**: Validar que to_stage_id e validado e erros seguem formato
  padronizado (Principio V — contract discipline).

## Assumptions

- O enum DealStatus sera estendido com valores won e lost nesta feature. O
  valor active permanece como default na criacao.
- A tabela deal_stage_history sera criada nesta feature com relacionamentos
  para deals e pipeline_stages.
- Nao ha limite de movimentacoes por deal — um deal pode ser movido quantas
  vezes forem necessarias entre stages nao-finais.
- A listagem e visualizacao do historico de movimentacoes NAO faz parte desta
  feature — sera tratada em feature futura.
- A movimentacao via drag & drop (UI) NAO faz parte desta feature — a API sera
  consumida por futuro board visual.
- A feature nao altera o campo last_touch_at — este sera gerenciado pela
  feature de activities.
- O relacionamento DealStageHistory -> Deal e obrigatorio (deal_id nao
  nullable).
- Os relacionamentos DealStageHistory -> PipelineStage (from e to) sao
  obrigatorios.
