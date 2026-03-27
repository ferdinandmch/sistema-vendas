# Tasks: Gestao de Deals

**Input**: Design documents from `/specs/003-deal-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/deals-api-contract.md, quickstart.md
**Branch**: `003-deal-management` | **Date**: 2026-03-26

**Tests**: Include test tasks for all API contracts, validation logic, persistence side effects, and auth enforcement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`, `postgresql-optimization`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar dependencias e estrutura base para a feature de deals.

- [x] T001 Confirmar dependencias instaladas (`pnpm install`) e verificar que `zod`, `prisma`, `@clerk/nextjs` estao no `package.json`
- [x] T002 [P] Criar diretorio `lib/deals/` para o service layer
- [x] T003 [P] Confirmar que `lib/validation/api-error.ts`, `lib/auth/require-auth.ts` e `lib/db/prisma.ts` estao presentes

**Checkpoint**: Estrutura de diretorios pronta para receber codigo da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo de dados, enum, schemas de validacao, error codes e service layer que DEVEM estar completos antes de qualquer user story.

**CRITICAL**: Nenhuma user story pode comecar ate esta fase estar completa.

### Database & Model

- [x] T004 Adicionar enum `DealStatus` (`active`) e modelo `Deal` em `prisma/schema.prisma` com campos: `id` (cuid), `companyName` (String, required), `contactName` (String?), `contactDetails` (String?), `source` (String?), `experiment` (String?), `notes` (String?), `icp` (Boolean, default false), `nextAction` (String?), `stageId` (String, FK -> pipeline_stages), `stageUpdatedAt` (DateTime, default now), `status` (DealStatus, default active), `lastTouchAt` (DateTime?), `ownerId` (String, FK -> users), `createdAt`, `updatedAt`. Usar `@map` para snake_case no banco (`deals`). Adicionar `@@index([ownerId])`. Adicionar relacoes reversas em PipelineStage e User (`deals Deal[]`) — postgresql-code-review, postgresql-optimization
- [x] T005 Executar `pnpm prisma db push` para sincronizar schema com o banco

### Validation Schemas

- [x] T006 [P] Criar `lib/validation/deals.ts` com schemas Zod: `createDealSchema` (companyName: string non-empty required, stageId: string required, contactName: string optional, contactDetails: string optional, source: string optional, experiment: string optional, notes: string optional, icp: boolean optional default false, nextAction: string optional) e `updateDealSchema` (companyName: string non-empty optional, contactName: string nullable optional, contactDetails: string nullable optional, source: string nullable optional, experiment: string nullable optional, notes: string nullable optional, icp: boolean optional, nextAction: string nullable optional). Nenhum campo protegido (stageId, ownerId, status, stageUpdatedAt) no update schema — next-best-practices (centralized validation)

### Error Codes

- [x] T007 [P] Estender `AppErrorCode` em `lib/validation/api-error.ts` com novo codigo: `DEAL_NOT_FOUND`. Adicionar factory function `dealNotFoundError()` retornando AppError com code DEAL_NOT_FOUND, message "Deal not found", status 404 — next-best-practices (error handling)

### Service Layer

- [x] T008 Criar `lib/deals/deal-service.ts` com funcoes: `listDeals(ownerId)` (filtrado por ownerId, include stage {id, name, position}), `getDeal(id, ownerId)` (filtrado por id + ownerId, include stage), `createDeal(data, ownerId)` (valida stage_id existe, cria com status=active, stageUpdatedAt=now, lastTouchAt=null, include stage na resposta), `updateDeal(id, data, ownerId)` (find por id+ownerId, update campos editaveis, include stage na resposta). Usar Prisma client de `lib/db/prisma.ts`. Lancar stageNotFoundError() se stage_id inexistente na criacao. Lancar dealNotFoundError() se deal nao encontrado — next-best-practices (data patterns), postgresql-code-review (FK validation), postgresql-optimization (include strategy)

**Checkpoint**: Foundation pronta — modelo, validacao, erros e service layer disponiveis para Route Handlers.

---

## Phase 3: User Story 1 — Criar um Deal no Pipeline (Priority: P1)

**Goal**: Usuario autenticado cria deals com stage valido, status active, stage_updated_at definido e owner_id do contexto.

**Independent Test**: POST /api/deals com dados validos retorna 201 com deal completo incluindo stage embed. Dados invalidos retornam 400. Stage inexistente retorna 400. Sem sessao retorna 401.

**Refs**: FR-001, FR-002, FR-003, FR-009, FR-010, FR-011, BR-001, BR-002, BR-003, BR-004, BR-009, BR-010, SC-001

### Tests for User Story 1

- [x] T009 [P] [US1] Criar teste de contrato `tests/contract/deals/create-deal-contract.test.ts` — verificar shape da resposta 201: `{ deal: { id, companyName, stageId, status, stageUpdatedAt, ownerId, stage: { id, name, position }, ... } }`
- [x] T010 [P] [US1] Criar teste de contrato `tests/contract/deals/unauthorized-create-contract.test.ts` — verificar 401 no POST /api/deals sem sessao autenticada
- [x] T011 [P] [US1] Criar teste de integracao `tests/integration/deals/create-deal-valid.test.ts` — criar deal com dados validos, verificar status=active, stageUpdatedAt definido, ownerId correto, lastTouchAt=null, stage embed presente
- [x] T012 [P] [US1] Criar teste de integracao `tests/integration/deals/create-deal-invalid-stage.test.ts` — criar deal com stageId inexistente, verificar 400 STAGE_NOT_FOUND
- [x] T013 [P] [US1] Criar teste de integracao `tests/integration/deals/create-deal-missing-company.test.ts` — criar deal sem companyName, verificar 400 INVALID_REQUEST com details
- [x] T014 [P] [US1] Criar teste de integracao `tests/integration/deals/create-deal-defaults.test.ts` — criar deal com campos opcionais omitidos, verificar que icp=false, contactName=null, etc.

### Implementation for User Story 1

- [x] T015 [US1] Criar `app/api/deals/route.ts` com handler POST que: valida autenticacao via requireAuthenticatedUser(), extrai user.id como ownerId, parse JSON, valida body com createDealSchema, chama createDeal(data, ownerId), retorna 201 com { deal }. Zod validation errors retornam details array — next-best-practices (route handlers)

**Checkpoint**: Criacao funcional com todas as validacoes. Deals podem ser criados no sistema.

---

## Phase 4: User Story 2 — Listar Meus Deals (Priority: P1)

**Goal**: Usuario autenticado consulta seus deals filtrados por ownership. Retorna apenas deals proprios com stage embed.

**Independent Test**: GET /api/deals com sessao valida retorna 200 com apenas deals do usuario. Lista vazia se nao tem deals. Sem sessao retorna 401.

**Refs**: FR-004, FR-011, FR-013, BR-005, SC-002, SC-005

### Tests for User Story 2

- [x] T016 [P] [US2] Criar teste de contrato `tests/contract/deals/list-deals-contract.test.ts` — verificar shape da resposta 200: `{ deals: [{ id, companyName, stage: { id, name, position }, ... }] }` filtrado por owner
- [x] T017 [P] [US2] Criar teste de contrato `tests/contract/deals/unauthorized-list-contract.test.ts` — verificar 401 no GET /api/deals sem sessao autenticada
- [x] T018 [P] [US2] Criar teste de integracao `tests/integration/deals/list-deals-owner-filter.test.ts` — criar deals para dois owners distintos, verificar que cada owner ve apenas seus deals
- [x] T019 [P] [US2] Criar teste de integracao `tests/integration/deals/list-deals-empty.test.ts` — listar deals para owner sem deals, verificar lista vazia

### Implementation for User Story 2

- [x] T020 [US2] Adicionar handler GET em `app/api/deals/route.ts` que: valida autenticacao, extrai user.id como ownerId, chama listDeals(ownerId), retorna 200 com { deals } — next-best-practices (route handlers)

**Checkpoint**: Listagem funcional com ownership isolation. Deals do usuario visiveis para consumo futuro da UI.

---

## Phase 5: User Story 3 — Consultar Detalhe de um Deal (Priority: P2)

**Goal**: Usuario autenticado acessa detalhes completos de um deal proprio. Deals de outros usuarios ou inexistentes retornam 404.

**Independent Test**: GET /api/deals/[id] com deal proprio retorna 200. Deal de outro usuario retorna 404. Deal inexistente retorna 404. Sem sessao retorna 401.

**Refs**: FR-005, FR-006, FR-011, FR-013, BR-005, SC-003

### Tests for User Story 3

- [x] T021 [P] [US3] Criar teste de contrato `tests/contract/deals/get-deal-contract.test.ts` — verificar shape da resposta 200: `{ deal: { ... } }` com stage embed, e 404 com DEAL_NOT_FOUND
- [x] T022 [P] [US3] Criar teste de contrato `tests/contract/deals/unauthorized-get-contract.test.ts` — verificar 401 no GET /api/deals/[id] sem sessao autenticada
- [x] T023 [P] [US3] Criar teste de integracao `tests/integration/deals/get-deal-valid.test.ts` — buscar deal proprio, verificar todos os campos retornados incluindo stage embed
- [x] T024 [P] [US3] Criar teste de integracao `tests/integration/deals/get-deal-other-owner.test.ts` — tentar buscar deal de outro usuario, verificar 404 DEAL_NOT_FOUND
- [x] T025 [P] [US3] Criar teste de integracao `tests/integration/deals/get-deal-not-found.test.ts` — buscar deal inexistente, verificar 404 DEAL_NOT_FOUND

### Implementation for User Story 3

- [x] T026 [US3] Criar `app/api/deals/[id]/route.ts` com handler GET que: valida autenticacao, extrai user.id como ownerId, parse params (async, Next.js 16 pattern), chama getDeal(id, ownerId), retorna 200 com { deal }. Tratar not found via errorResponse — next-best-practices (dynamic route handlers)

**Checkpoint**: Detalhe funcional com ownership enforcement. Base pronta para edicao.

---

## Phase 6: User Story 4 — Editar um Deal (Priority: P2)

**Goal**: Usuario autenticado edita campos permitidos de um deal proprio. Campos protegidos sao ignorados. Deals de outros usuarios ou inexistentes retornam 404.

**Independent Test**: PUT /api/deals/[id] com dados validos atualiza deal. Campos protegidos (stageId) sao ignorados. Deal de outro usuario retorna 404. Sem sessao retorna 401.

**Refs**: FR-006, FR-007, FR-008, FR-011, BR-005, BR-007, BR-008, SC-006

### Tests for User Story 4

- [x] T027 [P] [US4] Criar teste de contrato `tests/contract/deals/update-deal-contract.test.ts` — verificar shape da resposta 200: `{ deal: { ... } }` com campos atualizados, e 404 com DEAL_NOT_FOUND
- [x] T028 [P] [US4] Criar teste de contrato `tests/contract/deals/unauthorized-update-contract.test.ts` — verificar 401 no PUT /api/deals/[id] sem sessao autenticada
- [x] T029 [P] [US4] Criar teste de integracao `tests/integration/deals/update-deal-valid.test.ts` — editar companyName de deal proprio, verificar atualizacao persistida
- [x] T030 [P] [US4] Criar teste de integracao `tests/integration/deals/update-deal-invalid-data.test.ts` — enviar companyName vazio no payload de edicao, verificar 400 INVALID_REQUEST com details array
- [x] T031 [P] [US4] Criar teste de integracao `tests/integration/deals/update-deal-protected-fields.test.ts` — enviar stageId no payload de edicao, verificar que stageId permanece inalterado
- [x] T032 [P] [US4] Criar teste de integracao `tests/integration/deals/update-deal-other-owner.test.ts` — tentar editar deal de outro usuario, verificar 404 DEAL_NOT_FOUND
- [x] T033 [P] [US4] Criar teste de integracao `tests/integration/deals/update-deal-not-found.test.ts` — editar deal inexistente, verificar 404 DEAL_NOT_FOUND

### Implementation for User Story 4

- [x] T034 [US4] Adicionar handler PUT em `app/api/deals/[id]/route.ts` que: valida autenticacao, extrai user.id como ownerId, parse params (async), parse JSON, valida body com updateDealSchema, chama updateDeal(id, data, ownerId), retorna 200 com { deal }. Zod validation errors retornam details array. Tratar not found via errorResponse — next-best-practices (dynamic route handlers)

**Checkpoint**: CRUD completo de deals. Todas as operacoes protegidas e validadas.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validacao cruzada, consistencia de contratos e verificacao final.

- [x] T035 [P] Revisar consistencia de error codes entre `api-error.ts`, contratos em `contracts/deals-api-contract.md` e implementacao nos route handlers
- [x] T036 [P] Revisar schema Prisma contra `data-model.md` — confirmar campos, tipos, constraints, enum, FK e indices alinhados — postgresql-code-review
- [x] T037 Executar todos os testes (`pnpm test`) e corrigir falhas
- [x] T038 Executar validacao do quickstart (`specs/003-deal-management/quickstart.md`) — 15 steps de validacao
- [x] T039 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Criacao)**: Depende de Phase 2 (modelo + service + route)
- **Phase 4 (US2 Listagem)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3
- **Phase 5 (US3 Detalhe)**: Depende de Phase 2. Requer route.ts de Phase 3 (compartilha arquivo)
- **Phase 6 (US4 Edicao)**: Depende de Phase 2 + Phase 5 (compartilha [id]/route.ts)
- **Phase 7 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Criacao, P1)**: Precisa de modelo Prisma (T004), service layer (T008), validation schemas (T006)
- **US2 (Listagem, P1)**: Precisa de service layer (T008) e route.ts (T015 cria o arquivo, T020 adiciona GET)
- **US3 (Detalhe, P2)**: Precisa de service layer (T008). Cria [id]/route.ts (T026)
- **US4 (Edicao, P2)**: Precisa de service layer (T008) e [id]/route.ts (T026)

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Modelo antes de service
- Service antes de route handlers
- Validacao e error handling em cada mutacao

### Parallel Opportunities

- T002/T003 (setup dirs) podem rodar em paralelo
- T006/T007 (schemas + error codes) podem rodar em paralelo
- Testes dentro de cada user story marcados [P] podem rodar em paralelo
- US1 e US2 podem ser implementadas em sequencia rapida (compartilham route.ts)

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (modelo, schemas, service)
3. Completar Phase 3: US1 (Criacao) — deals podem ser criados
4. Completar Phase 4: US2 (Listagem) — deals podem ser visualizados
5. Validar MVP: criacao + listagem com ownership funcionando

### Incremental Delivery

6. Completar Phase 5: US3 (Detalhe) — GET /api/deals/[id]
7. Completar Phase 6: US4 (Edicao) — PUT /api/deals/[id]
8. Completar Phase 7: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica em service layer + route handlers. owner_id, status, stageUpdatedAt definidos no backend.
- **Principio II (Persistence)**: Deals persistidos via Prisma, sem delete. lastTouchAt reservado para activities futuras.
- **Principio III (State Machine)**: Deals nascem com status=active. Stage movement e feature futura.
- **Principio IV (Transactional + Auth + Ownership)**: Auth obrigatoria, owner_id em todas as queries, FK stage_id valida.
- **Principio V (Contracts + Validation)**: Zod centralizado, error codes padronizados, contratos documentados.

## Total: 39 tasks | 4 user stories | 7 phases
