# Research: Movimentacao de Deal entre Stages

**Branch**: `004-stage-movement` | **Date**: 2026-03-27

## Decisions

### R1: Endpoint como sub-route POST /api/deals/[id]/move

- **Decision**: Usar `POST /api/deals/[id]/move/route.ts` como endpoint dedicado
- **Rationale**: Movimentacao e uma acao/comando, nao um update generico.
  POST e apropriado para operacoes com side effects (historico). Separar
  de PUT /api/deals/[id] evita confusao com edicao de campos.
- **Alternatives**: PATCH /api/deals/[id] com campo stageId — rejeitado
  porque mistura edicao de dados com acao de dominio; PUT /api/deals/[id]/stage
  — rejeitado porque PUT implica idempotencia, e movimentacao cria historico
  a cada chamada.

### R2: Prisma interactive transaction para atomicidade

- **Decision**: Usar `prisma.$transaction(async (tx) => { ... })` para
  agrupar update de deal + insert de historico
- **Rationale**: Interactive transactions garantem rollback automatico se
  qualquer operacao falhar. Prisma suporta isso nativamente. Alinhado com
  Principio IV (transactional consistency).
- **Alternatives**: Sequential writes sem transacao — rejeitado por violar
  Principio IV; raw SQL transaction — rejeitado por violar stack (Prisma
  como unico acesso a DB).

### R3: DealStatus enum estendido no Prisma

- **Decision**: Adicionar `won` e `lost` ao enum DealStatus existente.
  Requer migration.
- **Rationale**: Status finais sao necessarios para refletir resultado de
  deals movidos para stages finais. Enum garante type-safety e validacao
  no nivel do banco.
- **Alternatives**: String field com validacao Zod — rejeitado por perder
  constraint de banco; boolean fields (isWon, isLost) — rejeitado por nao
  escalar para futuros status.

### R4: DealStageHistory como modelo independente

- **Decision**: Criar modelo DealStageHistory com FKs para Deal, from_stage
  (PipelineStage) e to_stage (PipelineStage).
- **Rationale**: Historico e entidade auditavel independente. Relacionamento
  com PipelineStage via FK garante integridade referencial. Modelo segue
  Principio II (mandatory persistence).
- **Alternatives**: JSON array no Deal — rejeitado por violar auditabilidade
  e dificultar queries; event sourcing — rejeitado por overengineering para
  o escopo atual.

### R5: Ownership retorna 404 (nao 403)

- **Decision**: Consistente com 003-deal-management — deal nao encontrado ou
  ownership incorreto retorna 404 DEAL_NOT_FOUND.
- **Rationale**: Nao revelar existencia de deals de outros usuarios. Padrao
  ja estabelecido no getDeal/updateDeal existentes.
- **Alternatives**: 403 Forbidden — rejeitado por vazar informacao de
  existencia do deal.

### R6: Validacoes pre-transacao

- **Decision**: Validar same-stage e deal-already-closed ANTES de iniciar
  a transacao. Validar stage existencia dentro da transacao (para evitar
  race condition).
- **Rationale**: Same-stage e closed-deal sao validacoes rapidas que nao
  precisam de transacao. Stage existencia e validada dentro da transacao
  para garantir consistencia.
- **Alternatives**: Tudo dentro da transacao — aceitavel mas desnecessario
  para checks simples que nao mudam estado.

### R7: Indices para DealStageHistory

- **Decision**: Indice em `deal_id` para queries de historico por deal.
  Indice composto `[deal_id, changed_at]` para ordenacao temporal.
- **Rationale**: Queries futuras de historico de um deal precisarao filtrar
  por deal_id e ordenar por changed_at. Indice composto otimiza ambas
  operacoes.
- **Alternatives**: Apenas indice simples em deal_id — suficiente para
  agora, mas indice composto prepara para feature de listagem de historico.
