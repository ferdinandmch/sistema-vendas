# Tasks: Movimentacao de Deal entre Stages

**Input**: Design documents from `/specs/004-stage-movement/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/move-deal-api-contract.md, quickstart.md
**Branch**: `004-stage-movement` | **Date**: 2026-03-27

**Tests**: Include test tasks for all API contracts, validation logic, persistence side effects, transactional integrity, ownership enforcement and status transitions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`, `postgresql-optimization`, `update-docs`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar dependencias e estrutura base para a feature de movimentacao.

- [x] T001 Confirmar dependencias instaladas (`pnpm install`) e verificar que `zod`, `prisma`, `@clerk/nextjs` estao no `package.json`
- [x] T002 [P] Criar diretorio `app/api/deals/[id]/move/` para o endpoint de movimentacao
- [x] T003 [P] Confirmar que `lib/deals/deal-service.ts`, `lib/validation/api-error.ts`, `lib/validation/deals.ts` e `lib/auth/require-auth.ts` estao presentes

**Checkpoint**: Estrutura de diretorios pronta para receber codigo da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma migration, schemas Zod, error codes e extensao do service layer. BLOQUEIA todas as user stories.

**CRITICAL**: Nenhum trabalho de user story pode comecar ate esta fase estar completa.

- [x] T004 Estender enum `DealStatus` em `prisma/schema.prisma` adicionando valores `won` e `lost`. Adicionar modelo `DealStageHistory` com campos id, dealId (FK deals), fromStageId (FK pipeline_stages, relation "FromStage"), toStageId (FK pipeline_stages, relation "ToStage"), changedAt. Adicionar `@@index([dealId, changedAt])` e `@@map("deal_stage_history")`. Adicionar relacoes inversas em Deal (`stageHistory DealStageHistory[]`) e PipelineStage (`fromStageHistory` e `toStageHistory` com relations nomeadas). Executar `npx prisma migrate dev --name add-stage-movement` — postgresql-code-review, postgresql-optimization
- [x] T005 [P] Adicionar `moveDealSchema` em `lib/validation/deals.ts` — schema Zod com `toStageId: z.string().min(1, "Stage ID is required")`. Exportar tipo `MoveDealInput`
- [x] T006 [P] Adicionar error codes `SAME_STAGE` e `DEAL_ALREADY_CLOSED` ao tipo `AppErrorCode` em `lib/validation/api-error.ts`. Criar factory functions `sameStageError()` (400, "Deal is already in this stage"), `dealAlreadyClosedError()` (400, "Cannot move a finalized deal") e `stageNotFoundForMoveError()` (400, "Target stage not found") — factory dedicada para movimentacao, separada da existente stageNotFoundError (404) usada em GET stages
- [x] T007 Implementar funcao `moveDeal(id: string, toStageId: string, ownerId: string)` em `lib/deals/deal-service.ts` que: busca deal com filtro ownerId (throw dealNotFoundError se nao encontrado), valida deal.status != won/lost (throw dealAlreadyClosedError), valida deal.stageId != toStageId (throw sameStageError), busca stage destino (throw stageNotFoundForMoveError se nao encontrado), executa `prisma.$transaction()` interativa com: update deal (stageId, stageUpdatedAt, status derivado de is_final/finalType), create DealStageHistory (dealId, fromStageId, toStageId, changedAt). Retorna deal atualizado com stage embed (id, name, position) — next-best-practices, postgresql-code-review

**Checkpoint**: Prisma schema migrado, validation schemas prontos, error codes definidos, service layer completo. Base pronta para user stories.

---

## Phase 3: User Story 1 — Mover Deal para Outro Stage (Priority: P1)

**Goal**: Usuario autenticado move um deal ativo para outro stage nao-final. stage_id, stage_updated_at e deal_stage_history sao atualizados atomicamente.

**Independent Test**: POST /api/deals/[id]/move com deal ativo e stage valido retorna 200 com deal atualizado e cria registro de historico.

**Refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-009, FR-010, FR-011, FR-012, BR-001, BR-002, BR-003, BR-007, BR-009, SC-001, SC-005

### Tests for User Story 1

- [x] T008 [P] [US1] Criar teste de contrato `tests/contract/deals/move-deal-contract.test.ts` — verificar shape da resposta 200: `{ deal: { ... } }` com stage embed (id, name, position), stageId atualizado e stageUpdatedAt presente
- [x] T009 [P] [US1] Criar teste de contrato `tests/contract/deals/unauthorized-move-contract.test.ts` — verificar 401 no POST /api/deals/[id]/move sem sessao autenticada
- [x] T010 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-valid.test.ts` — mover deal ativo de stage A para stage B, verificar stageId atualizado, stageUpdatedAt > anterior, status permanece active, registro em deal_stage_history criado com from/to corretos
- [x] T011 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-history.test.ts` — mover deal duas vezes (A->B, B->C), verificar 2 registros em deal_stage_history com from/to corretos e changed_at crescente
- [x] T012 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-invalid-stage.test.ts` — mover deal para stage inexistente, verificar 400 STAGE_NOT_FOUND e nenhuma alteracao no deal
- [x] T013 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-same-stage.test.ts` — tentar mover deal para o stage atual, verificar 400 SAME_STAGE e nenhum registro de historico criado
- [x] T014 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-missing-payload.test.ts` — enviar body vazio ou sem toStageId, verificar 400 INVALID_REQUEST com details array
- [x] T015 [P] [US1] Criar teste de integracao `tests/integration/deals/move-deal-no-side-effects-on-error.test.ts` — apos SAME_STAGE e DEAL_ALREADY_CLOSED errors, verificar que deal.stageId permanece inalterado e nenhum registro foi criado em deal_stage_history (validacao de atomicidade)

### Implementation for User Story 1

- [x] T016 [US1] Criar `app/api/deals/[id]/move/route.ts` com handler POST que: valida autenticacao via requireAuthenticatedUser(), extrai user.id como ownerId, parse params (async, Next.js 16 pattern), parse JSON body, valida body com moveDealSchema, chama moveDeal(id, toStageId, ownerId), retorna 200 com { deal }. Zod validation errors retornam details array. Tratar erros via errorResponse — next-best-practices (dynamic route handlers)

**Checkpoint**: Movimentacao padrao funcional. Deal move entre stages com historico auditavel.

---

## Phase 4: User Story 2 — Mover Deal para Stage Final (Priority: P1)

**Goal**: Mover deal para stage final atualiza status para won/lost. Deals finalizados nao podem ser movidos novamente.

**Independent Test**: POST /api/deals/[id]/move para stage final (won) atualiza status=won. Tentar mover deal won retorna DEAL_ALREADY_CLOSED.

**Refs**: FR-006, FR-007, FR-013, BR-005, BR-006, BR-010, SC-002

### Tests for User Story 2

- [x] T017 [P] [US2] Criar teste de integracao `tests/integration/deals/move-deal-final-won.test.ts` — mover deal ativo para stage com is_final=true e final_type=won, verificar status=won, stageId atualizado, historico criado
- [x] T018 [P] [US2] Criar teste de integracao `tests/integration/deals/move-deal-final-lost.test.ts` — mover deal ativo para stage com is_final=true e final_type=lost, verificar status=lost, stageId atualizado, historico criado
- [x] T019 [P] [US2] Criar teste de integracao `tests/integration/deals/move-deal-already-closed.test.ts` — mover deal com status=won para qualquer stage, verificar 400 DEAL_ALREADY_CLOSED e nenhuma alteracao

### Implementation for User Story 2

Nenhuma implementacao adicional necessaria — logica de status final e imutabilidade ja coberta pelo `moveDeal()` em T007.

**Checkpoint**: Movimentacao para stage final funcional. Won/lost definidos. Deals finalizados imutaveis.

---

## Phase 5: User Story 3 — Ownership Enforcement na Movimentacao (Priority: P1)

**Goal**: Apenas o proprietario do deal pode move-lo. Tentativa de mover deal de outro usuario retorna 404.

**Independent Test**: Criar deals para 2 usuarios. Tentar mover deal do usuario A com sessao do usuario B retorna 404.

**Refs**: FR-008, FR-010, BR-004, SC-003

### Tests for User Story 3

- [x] T020 [P] [US3] Criar teste de integracao `tests/integration/deals/move-deal-other-owner.test.ts` — tentar mover deal de outro usuario, verificar 404 DEAL_NOT_FOUND e nenhuma alteracao
- [x] T021 [P] [US3] Criar teste de integracao `tests/integration/deals/move-deal-not-found.test.ts` — tentar mover deal inexistente, verificar 404 DEAL_NOT_FOUND

### Implementation for User Story 3

Nenhuma implementacao adicional necessaria — ownership enforcement ja coberta pelo `moveDeal()` em T007 (findFirst com filtro ownerId).

**Checkpoint**: Ownership enforcement completo. Nenhum deal de outro usuario pode ser movido.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validacao cruzada, consistencia de contratos e verificacao final.

- [x] T022 [P] Revisar consistencia de error codes entre `api-error.ts`, contratos em `contracts/move-deal-api-contract.md` e implementacao no route handler
- [x] T023 [P] Revisar schema Prisma contra `data-model.md` — confirmar campos, tipos, constraints, enum, FK, indices e relations alinhados — postgresql-code-review
- [x] T024 Executar todos os testes (`pnpm test`) e corrigir falhas
- [x] T025 Executar validacao do quickstart (`specs/004-stage-movement/quickstart.md`) — 13 steps de validacao
- [x] T026 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 004

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Move Padrao)**: Depende de Phase 2 (service + route)
- **Phase 4 (US2 Stage Final)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3 (apenas testes)
- **Phase 5 (US3 Ownership)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3 (apenas testes)
- **Phase 6 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Move Padrao, P1)**: Precisa de Prisma schema (T004), service layer (T007), validation schemas (T005), error codes (T006). Route handler em T016
- **US2 (Stage Final, P1)**: Precisa de service layer (T007). Sem implementacao adicional — logica de status final em T007
- **US3 (Ownership, P1)**: Precisa de service layer (T007). Sem implementacao adicional — ownership em T007

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Modelo antes de service
- Service antes de route handlers
- Validacao e error handling em cada mutacao

### Parallel Opportunities

- T002/T003 (setup dirs) podem rodar em paralelo
- T005/T006 (schemas + error codes) podem rodar em paralelo
- Testes dentro de cada user story marcados [P] podem rodar em paralelo
- US2 e US3 (apenas testes) podem rodar em paralelo com US1

---

## Implementation Strategy

### MVP First (US1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (Prisma migration, schemas, service)
3. Completar Phase 3: US1 (Move padrao) — deals podem ser movidos
4. Validar MVP: movimentacao com historico funcionando

### Incremental Delivery

5. Completar Phase 4: US2 (Stage Final) — testes de status won/lost
6. Completar Phase 5: US3 (Ownership) — testes de ownership enforcement
7. Completar Phase 6: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica em service layer + route handler. Status derivado no backend. Frontend nao controla movimentacao.
- **Principio II (Persistence)**: deal_stage_history criado em toda movimentacao. Append-only. Nenhuma movimentacao sem historico.
- **Principio III (State Machine)**: Deals transitam entre stages. Won/lost sao estados terminais imutaveis. Historico registra transicoes.
- **Principio IV (Transactional + Auth + Ownership)**: Prisma $transaction atomica. Auth obrigatoria. owner_id filter em toda operacao. Deals finalizados imutaveis.
- **Principio V (Contracts + Validation)**: Zod centralizado. Error codes padronizados (SAME_STAGE, DEAL_ALREADY_CLOSED). Contrato documentado.

## Clarification Alignment

- **Same-stage bloqueado**: T013 testa 400 SAME_STAGE. T006 define error code. T007 valida from != to.
- **Deal finalizado imutavel**: T018 testa 400 DEAL_ALREADY_CLOSED. T006 define error code. T007 valida status != won/lost.

## Total: 26 tasks | 3 user stories | 6 phases
