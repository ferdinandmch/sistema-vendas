# Tasks: Activities de Deals

**Input**: Design documents from `/specs/005-deal-activities/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/activities-api-contract.md, quickstart.md
**Branch**: `005-deal-activities` | **Date**: 2026-03-27

**Tests**: Include test tasks for API contracts, validation logic, persistence side effects, transactional integrity (activity + last_touch_at), ownership enforcement and activity type validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`, `postgresql-optimization`, `update-docs`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar dependencias e estrutura base para a feature de activities.

- [x] T001 Confirmar dependencias instaladas (`pnpm install`) e verificar que `zod`, `prisma`, `@clerk/nextjs` estao no `package.json`
- [x] T002 [P] Criar diretorios `app/api/deals/[id]/activities/`, `lib/activities/`, `tests/contract/activities/`, `tests/integration/activities/`
- [x] T003 [P] Confirmar que `lib/deals/deal-service.ts`, `lib/validation/api-error.ts`, `lib/auth/require-auth.ts` estao presentes

**Checkpoint**: Estrutura de diretorios pronta para receber codigo da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma migration, schema Zod, service layer e route handler. BLOQUEIA todas as user stories.

**CRITICAL**: Nenhum trabalho de user story pode comecar ate esta fase estar completa.

- [x] T004 Adicionar enum `ActivityType` em `prisma/schema.prisma` com valores `note`, `call`, `meeting`, `followup`. Adicionar modelo `Activity` com campos id (cuid), dealId (FK deals), type (ActivityType), content (String?), createdAt (DateTime default now). Adicionar `@@index([dealId, createdAt])` e `@@map("activities")`. Adicionar relacao inversa em Deal (`activities Activity[]`). Executar `npx prisma db push` — postgresql-code-review, postgresql-optimization
- [x] T005 [P] Criar `lib/validation/activities.ts` com `createActivitySchema` — schema Zod com `type: z.enum(["note", "call", "meeting", "followup"])` obrigatorio e `content: z.string().min(1).nullable().optional()`. Exportar tipo `CreateActivityInput`
- [x] T006 Implementar `lib/activities/activity-service.ts` com duas funcoes: `createActivity(dealId: string, data: CreateActivityInput, ownerId: string)` — busca deal com filtro ownerId (throw dealNotFoundError se nao encontrado), executa `prisma.$transaction()` interativa com: create Activity (dealId, type, content, createdAt=now), update deal (lastTouchAt=now), retorna activity criada. `listActivities(dealId: string, ownerId: string)` — busca deal com filtro ownerId (throw dealNotFoundError), retorna activities ordenadas por createdAt desc — next-best-practices, postgresql-code-review
- [x] T007 Criar `app/api/deals/[id]/activities/route.ts` com handlers GET (list) e POST (create): valida autenticacao via requireAuthenticatedUser(), extrai user.id como ownerId, parse params (async, Next.js 16 pattern). POST: parse JSON body, valida body com createActivitySchema, chama createActivity(id, data, ownerId), retorna 201 com { activity }. GET: chama listActivities(id, ownerId), retorna 200 com { activities }. Zod validation errors retornam details array. Tratar erros via errorResponse — next-best-practices (dynamic route handlers)

**Checkpoint**: Prisma schema migrado, validation schema pronto, service layer completo, route handler funcional. Base pronta para user stories (testes).

---

## Phase 3: User Story 1 — Criar Activity em um Deal (Priority: P1)

**Goal**: Usuario autenticado cria activity (note, call, meeting, followup) vinculada ao deal. Activity persistida e deal.last_touch_at atualizado atomicamente.

**Independent Test**: POST /api/deals/[id]/activities com type valido retorna 201 com activity criada e deal.last_touch_at atualizado.

**Refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-009, FR-010, FR-011, FR-012, BR-001, BR-002, BR-004, BR-005, BR-007, BR-008, SC-001, SC-003, SC-005

### Tests for User Story 1

- [x] T008 [P] [US1] Criar teste de contrato `tests/contract/activities/create-activity-contract.test.ts` — verificar shape da resposta 201: `{ activity: { id, dealId, type, content, createdAt } }` com todos os campos presentes
- [x] T009 [P] [US1] Criar teste de contrato `tests/contract/activities/unauthorized-create-contract.test.ts` — verificar que POST /api/deals/[id]/activities sem sessao autenticada e bloqueado
- [x] T010 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-valid.test.ts` — criar activity tipo "call" com content em deal valido, verificar activity persistida, deal.lastTouchAt atualizado (>= createdAt), type e content corretos
- [x] T011 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-no-content.test.ts` — criar activity tipo "note" sem content, verificar activity persistida com content=null, lastTouchAt atualizado
- [x] T012 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-invalid-type.test.ts` — enviar type="email", verificar 400 INVALID_REQUEST com details array
- [x] T013 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-missing-type.test.ts` — enviar body sem type, verificar 400 INVALID_REQUEST com details array
- [x] T014 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-touch-atomicity.test.ts` — criar activity com sucesso e verificar que deal.lastTouchAt foi atualizado na mesma operacao. Apos erro de deal inexistente, verificar que nenhuma activity foi criada (validacao de atomicidade)
- [x] T015 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-all-types.test.ts` — criar uma activity de cada tipo (note, call, meeting, followup) no mesmo deal, verificar que todas sao persistidas e lastTouchAt reflete a mais recente
- [x] T016 [P] [US1] Criar teste de integracao `tests/integration/activities/create-activity-finalized-deal.test.ts` — criar activity em deal com status=won, verificar 201 sucesso, deal.status permanece won

### Implementation for User Story 1

Nenhuma implementacao adicional necessaria — service layer (T006) e route handler (T007) cobrem toda a logica de criacao.

**Checkpoint**: Criacao de activities funcional. Activity persistida com tipo e conteudo, last_touch_at atualizado atomicamente.

---

## Phase 4: User Story 2 — Listar Activities de um Deal (Priority: P1)

**Goal**: Usuario autenticado lista activities de um deal proprio, ordenadas da mais recente para a mais antiga.

**Independent Test**: GET /api/deals/[id]/activities retorna array de activities ordenadas por createdAt desc.

**Refs**: FR-006, FR-009, SC-004

### Tests for User Story 2

- [x] T017 [P] [US2] Criar teste de contrato `tests/contract/activities/list-activities-contract.test.ts` — verificar shape da resposta 200: `{ activities: [{ id, dealId, type, content, createdAt }] }` com array de activities
- [x] T018 [P] [US2] Criar teste de contrato `tests/contract/activities/unauthorized-list-contract.test.ts` — verificar que GET /api/deals/[id]/activities sem sessao autenticada e bloqueado
- [x] T019 [P] [US2] Criar teste de integracao `tests/integration/activities/list-activities-ordered.test.ts` — criar 3 activities em um deal, verificar que listagem retorna 3 activities ordenadas por createdAt desc (mais recente primeiro)
- [x] T020 [P] [US2] Criar teste de integracao `tests/integration/activities/list-activities-empty.test.ts` — listar activities de deal sem activities, verificar 200 com array vazio

### Implementation for User Story 2

Nenhuma implementacao adicional necessaria — listActivities (T006) e GET handler (T007) cobrem toda a logica de listagem.

**Checkpoint**: Listagem de activities funcional. Activities retornadas em ordem cronologica reversa.

---

## Phase 5: User Story 3 — Ownership Enforcement em Activities (Priority: P1)

**Goal**: Apenas o proprietario do deal pode criar ou listar activities nele. Tentativa em deal de outro usuario retorna 404.

**Independent Test**: Criar deals para 2 usuarios. Tentar criar e listar activities no deal do usuario A usando sessao do usuario B. Verificar que ambas as operacoes sao bloqueadas.

**Refs**: FR-007, FR-008, FR-009, BR-003, SC-002

### Tests for User Story 3

- [x] T021 [P] [US3] Criar teste de integracao `tests/integration/activities/create-activity-other-owner.test.ts` — tentar criar activity em deal de outro usuario, verificar 404 DEAL_NOT_FOUND, nenhuma activity criada, lastTouchAt inalterado
- [x] T022 [P] [US3] Criar teste de integracao `tests/integration/activities/list-activities-other-owner.test.ts` — tentar listar activities de deal de outro usuario, verificar 404 DEAL_NOT_FOUND
- [x] T023 [P] [US3] Criar teste de integracao `tests/integration/activities/create-activity-deal-not-found.test.ts` — tentar criar activity em deal inexistente, verificar 404 DEAL_NOT_FOUND

### Implementation for User Story 3

Nenhuma implementacao adicional necessaria — ownership enforcement ja coberta pelo activity-service em T006 (findFirst com filtro ownerId).

**Checkpoint**: Ownership enforcement completo. Nenhuma activity de outro usuario pode ser criada ou listada.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validacao cruzada, consistencia de contratos e verificacao final.

- [x] T024 [P] Revisar consistencia de error codes entre `api-error.ts`, contratos em `contracts/activities-api-contract.md` e implementacao no route handler
- [x] T025 [P] Revisar schema Prisma contra `data-model.md` — confirmar campos, tipos, constraints, enum, FK, indices e relations alinhados — postgresql-code-review
- [x] T026 Executar todos os testes (`pnpm test`) e corrigir falhas
- [x] T027 Executar validacao do quickstart (`specs/005-deal-activities/quickstart.md`) — 15 steps de validacao
- [x] T028 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 005

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Criar Activity)**: Depende de Phase 2 (service + route)
- **Phase 4 (US2 Listar Activities)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3 (apenas testes)
- **Phase 5 (US3 Ownership)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3 (apenas testes)
- **Phase 6 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Criar Activity, P1)**: Precisa de Prisma schema (T004), service layer (T006), validation schema (T005), route handler (T007)
- **US2 (Listar Activities, P1)**: Precisa de service layer (T006) e route handler (T007). Sem implementacao adicional
- **US3 (Ownership, P1)**: Precisa de service layer (T006). Sem implementacao adicional — ownership em T006

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Modelo antes de service
- Service antes de route handlers
- Validacao e error handling em cada mutacao

### Parallel Opportunities

- T002/T003 (setup dirs) podem rodar em paralelo
- T005 (schema Zod) pode rodar em paralelo com T004 (Prisma)
- Testes dentro de cada user story marcados [P] podem rodar em paralelo
- US2 e US3 (apenas testes) podem rodar em paralelo com US1

---

## Implementation Strategy

### MVP First (US1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (Prisma migration, schema, service, route)
3. Completar Phase 3: US1 (Criar Activity) — activities criadas com touch atomico
4. Validar MVP: criacao funcional com last_touch_at

### Incremental Delivery

5. Completar Phase 4: US2 (Listar Activities) — testes de listagem
6. Completar Phase 5: US3 (Ownership) — testes de ownership enforcement
7. Completar Phase 6: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica em service layer + route handler. Tipos validados no backend. last_touch_at atualizado no backend. Frontend nao controla activities.
- **Principio II (Persistence)**: Activity criada e last_touch_at atualizado em toda operacao. Append-only. Constituicao exige: "activity creation MUST update last_touch_at".
- **Principio III (State Machine)**: Activities nao alteram estado do deal (stage/status). Sao registro operacional, nao transicao de estado.
- **Principio IV (Transactional + Auth + Ownership)**: Prisma $transaction atomica (activity + last_touch_at). Auth obrigatoria. owner_id filter via deal em toda operacao.
- **Principio V (Contracts + Validation)**: Zod centralizado para type enum e content. Error codes padronizados. Contrato documentado.

## Total: 28 tasks | 3 user stories | 6 phases
