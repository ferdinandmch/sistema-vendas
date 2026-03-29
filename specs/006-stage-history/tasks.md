# Tasks: Historico de Movimentacao de Deals

**Input**: Design documents from `/specs/006-stage-history/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/stage-history-api-contract.md, quickstart.md
**Branch**: `006-stage-history` | **Date**: 2026-03-29

**Tests**: Include test tasks for API contracts, ownership enforcement, ordering, empty history, and stage name enrichment.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`, `postgresql-optimization`, `update-docs`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar dependencias e estrutura base para a feature de stage history.

- [x] T001 Confirmar dependencias instaladas (`pnpm install`) e verificar que `prisma`, `@clerk/nextjs` estao no `package.json`
- [x] T002 [P] Criar diretorios `app/api/deals/[id]/history/`, `lib/history/`, `tests/contract/history/`, `tests/integration/history/`
- [x] T003 [P] Confirmar que `lib/deals/deal-service.ts`, `lib/validation/api-error.ts`, `lib/auth/require-auth.ts` e `prisma/schema.prisma` (DealStageHistory model) estao presentes

**Checkpoint**: Estrutura de diretorios pronta para receber codigo da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Service layer e route handler. BLOQUEIA todas as user stories.

**CRITICAL**: Nenhum trabalho de user story pode comecar ate esta fase estar completa.

- [x] T004 Implementar `lib/history/history-service.ts` com funcao `listStageHistory(dealId: string, ownerId: string)` — busca deal com filtro ownerId (throw dealNotFoundError se nao encontrado), retorna `prisma.dealStageHistory.findMany({ where: { dealId }, orderBy: { changedAt: "asc" }, include: { fromStage: { select: { id: true, name: true } }, toStage: { select: { id: true, name: true } } } })` — postgresql-code-review, postgresql-optimization
- [x] T005 Criar `app/api/deals/[id]/history/route.ts` com handler GET only: valida autenticacao via requireAuthenticatedUser(), extrai user.id como ownerId, parse params (async, Next.js 16 pattern). GET: chama listStageHistory(id, ownerId), retorna 200 com { history }. Tratar erros via errorResponse. Nenhum POST/PUT/DELETE definido — next-best-practices (dynamic route handlers)

**Checkpoint**: Service layer completo, route handler funcional. Base pronta para user stories (testes).

---

## Phase 3: User Story 1 — Consultar Historico de Movimentacao de um Deal (Priority: P1)

**Goal**: Usuario autenticado consulta historico completo de movimentacoes de stage de um deal proprio. Registros ordenados cronologicamente (ASC) com nomes dos stages.

**Independent Test**: Mover deal por 3 stages, consultar historico, verificar 3 registros com from/to stage names e timestamps em ordem ASC.

**Refs**: FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, BR-004, BR-005, BR-006, SC-001, SC-003, SC-004

### Tests for User Story 1

- [x] T006 [P] [US1] Criar teste de contrato `tests/contract/history/list-history-contract.test.ts` — verificar shape da resposta 200: `{ history: [{ id, dealId, fromStageId, toStageId, changedAt, fromStage: { id, name }, toStage: { id, name } }] }` com todos os campos presentes
- [x] T007 [P] [US1] Criar teste de contrato `tests/contract/history/unauthorized-list-contract.test.ts` — verificar que GET /api/deals/[id]/history sem sessao autenticada retorna 401 UNAUTHORIZED
- [x] T008 [P] [US1] Criar teste de integracao `tests/integration/history/list-history-ordered.test.ts` — mover deal por 3 stages (A→B→C), consultar historico, verificar 3 registros ordenados por changedAt ASC, fromStage/toStage names corretos
- [x] T009 [P] [US1] Criar teste de integracao `tests/integration/history/list-history-empty.test.ts` — consultar historico de deal sem movimentacoes, verificar 200 com array vazio `{ "history": [] }`
- [x] T010 [P] [US1] Criar teste de integracao `tests/integration/history/list-history-stage-names.test.ts` — verificar que cada registro contem fromStage.name e toStage.name como strings nao vazias
- [x] T011 [P] [US1] Criar teste de integracao `tests/integration/history/list-history-finalized-deal.test.ts` — consultar historico de deal com status=won, verificar que historico e retornado normalmente

### Implementation for User Story 1

Nenhuma implementacao adicional necessaria — service layer (T004) e route handler (T005) cobrem toda a logica de consulta.

**Checkpoint**: Consulta de historico funcional. Registros retornados com stage names em ordem cronologica.

---

## Phase 4: User Story 2 — Ownership Enforcement no Historico (Priority: P1)

**Goal**: Apenas o proprietario do deal pode consultar o historico de movimentacao. Tentativa em deal de outro usuario retorna 404.

**Independent Test**: Criar deals para 2 usuarios. Tentar consultar historico do deal do usuario A usando sessao do usuario B. Verificar que o acesso e bloqueado.

**Refs**: FR-005, FR-006, BR-003, SC-002

### Tests for User Story 2

- [x] T012 [P] [US2] Criar teste de integracao `tests/integration/history/list-history-other-owner.test.ts` — tentar consultar historico de deal de outro usuario, verificar 404 DEAL_NOT_FOUND
- [x] T013 [P] [US2] Criar teste de integracao `tests/integration/history/list-history-deal-not-found.test.ts` — tentar consultar historico de deal inexistente, verificar 404 DEAL_NOT_FOUND

### Implementation for User Story 2

Nenhuma implementacao adicional necessaria — ownership enforcement ja coberta pelo history-service em T004 (findFirst com filtro ownerId).

**Checkpoint**: Ownership enforcement completo. Nenhum historico de outro usuario pode ser consultado.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validacao cruzada, consistencia de contratos e verificacao final.

- [x] T014 [P] Revisar consistencia de error codes entre `api-error.ts`, contrato em `contracts/stage-history-api-contract.md` e implementacao no route handler
- [x] T015 [P] Revisar query Prisma contra `data-model.md` — confirmar include de fromStage/toStage, orderBy changedAt ASC, indice utilizado — postgresql-code-review
- [x] T016 Executar todos os testes (`pnpm test`) e corrigir falhas
- [x] T017 Executar validacao do quickstart (`specs/006-stage-history/quickstart.md`) — 10 steps de validacao
- [x] T018 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 006 — update-docs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Consultar Historico)**: Depende de Phase 2 (service + route)
- **Phase 4 (US2 Ownership)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3 (apenas testes)
- **Phase 5 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Consultar Historico, P1)**: Precisa de service layer (T004) e route handler (T005)
- **US2 (Ownership, P1)**: Precisa de service layer (T004). Sem implementacao adicional — ownership em T004

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Service antes de route handlers
- Validacao e error handling em cada operacao

### Parallel Opportunities

- T002/T003 (setup dirs) podem rodar em paralelo
- Testes dentro de cada user story marcados [P] podem rodar em paralelo
- US2 (apenas testes) pode rodar em paralelo com US1

---

## Implementation Strategy

### MVP First (US1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (service + route)
3. Completar Phase 3: US1 (Consultar Historico) — historico consultavel com stage names
4. Validar MVP: consulta funcional com ordenacao e enriquecimento

### Incremental Delivery

5. Completar Phase 4: US2 (Ownership) — testes de ownership enforcement
6. Completar Phase 5: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica em service layer + route handler. Frontend nao acessa historico diretamente.
- **Principio II (Persistence)**: Historico lido diretamente de deal_stage_history — registros criados pela feature 004. Nenhuma manipulacao.
- **Principio III (State Machine)**: Historico e o log autoritativo de transicoes. Feature apenas expoe dados existentes.
- **Principio IV (Transactional + Auth + Ownership)**: Auth obrigatoria. owner_id filter via deal em toda operacao. Feature somente leitura — sem transacoes necessarias.
- **Principio V (Contracts + Validation)**: Error codes padronizados. Contrato documentado. Nenhum schema de body necessario (GET-only).

## Total: 18 tasks | 2 user stories | 5 phases
