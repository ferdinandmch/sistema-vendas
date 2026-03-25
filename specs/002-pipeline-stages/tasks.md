# Tasks: Gestao de Stages do Pipeline

**Input**: Design documents from `/specs/002-pipeline-stages/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/stages-api-contract.md, quickstart.md
**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25

**Tests**: Include test tasks for all API contracts, validation logic, persistence side effects, and auth enforcement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar dependencias e estrutura base do projeto para a feature de stages.

- [x] T001 Confirmar dependencias instaladas (`pnpm install`) e verificar que `zod`, `prisma`, `@clerk/nextjs` estao no `package.json`
- [x] T002 [P] Criar diretorio `lib/stages/` para o service layer
- [x] T003 [P] Criar diretorio `lib/validation/` (ja existe) — confirmar que `api-error.ts` e `authenticated-route.ts` estao presentes

**Checkpoint**: Estrutura de diretorios pronta para receber codigo da feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo de dados, enum, schemas de validacao e service layer que DEVEM estar completos antes de qualquer user story.

**CRITICAL**: Nenhuma user story pode comecar ate esta fase estar completa.

### Database & Model

- [x] T004 Adicionar enum `FinalType` (`won`, `lost`) e modelo `PipelineStage` em `prisma/schema.prisma` com campos: `id` (cuid), `name` (unique), `position` (Int, unique), `isFinal` (Boolean, default false), `finalType` (FinalType?, nullable), `createdAt`, `updatedAt`. Usar `@map` para snake_case no banco (`pipeline_stages`). Incluir CHECK constraint via comentario para `(is_final = true AND final_type IS NOT NULL) OR (is_final = false AND final_type IS NULL)` — postgresql-code-review
- [x] T005 Executar `pnpm prisma db push` (ou migration) para sincronizar schema com o banco

### Validation Schemas

- [x] T006 [P] Criar `lib/validation/stages.ts` com schemas Zod: `createStageSchema` (name: string non-empty, position: positive int, isFinal: boolean, finalType: enum won/lost nullable) e `updateStageSchema` (partial, mesmas regras). Incluir refinement para consistencia `isFinal`/`finalType` — next-best-practices (centralized validation)

### Error Codes

- [x] T007 [P] Estender `AppErrorCode` em `lib/validation/api-error.ts` com novos codigos: `STAGE_NOT_FOUND`, `DUPLICATE_STAGE_NAME`, `DUPLICATE_STAGE_POSITION`, `INVALID_FINAL_TYPE`, `STAGE_HAS_DEALS`. Adicionar factory functions correspondentes. Adicionar suporte opcional a campo `details` (array de field errors) no `errorResponse` para erros de validacao Zod, conforme contrato POST 400 — next-best-practices (error handling)

### Service Layer

- [x] T008 Criar `lib/stages/stage-service.ts` com funcoes: `listStages()` (ordenado por position), `createStage(data)`, `updateStage(id, data)`, `deleteStage(id)`. Toda logica de negocio (validacao de unicidade, consistencia is_final/final_type, auto-clear final_type) reside aqui. Usar Prisma client de `lib/db/prisma.ts` — next-best-practices (data patterns), postgresql-code-review (unique constraints)

**Checkpoint**: Foundation pronta — modelo, validacao, erros e service layer disponiveis para Route Handlers.

---

## Phase 3: User Story 1 — Seed Inicial de Stages (Priority: P1)

**Goal**: Sistema possui 8 stages padrao disponiveis imediatamente apos inicializacao do banco.

**Independent Test**: Executar seed e verificar que 8 stages existem com nomes, posicoes e flags corretos. Executar novamente e verificar que nao ha duplicatas.

**Refs**: FR-001, BR-005, SC-001, SC-005

### Tests for User Story 1

- [x] T009 [P] [US1] Criar teste de integracao `tests/integration/stages/seed-creates-defaults.test.ts` — verificar que seed cria exatamente 8 stages com dados corretos (nomes, posicoes, is_final, final_type)
- [x] T010 [P] [US1] Criar teste de integracao `tests/integration/stages/seed-idempotency.test.ts` — verificar que executar seed multiplas vezes resulta nos mesmos 8 stages sem duplicatas

### Implementation for User Story 1

- [x] T011 [US1] Criar `prisma/seed.ts` com seed idempotente dos 8 stages padrao usando `upsert` por nome: Cold(1), Warm(2), Initial Call(3), Qualified(4), Demo(5), Negotiation(6), Won(7, final/won), Lost(8, final/lost) — postgresql-code-review (idempotent seed)
- [x] T012 [US1] Configurar `prisma.seed` no `package.json` para apontar para `prisma/seed.ts` via `tsx` (ex: `"prisma": { "seed": "tsx prisma/seed.ts" }`)
- [x] T013 [US1] Executar `pnpm prisma db seed` e validar dados no banco

**Checkpoint**: Seed funcional e idempotente. Base de 8 stages pronta para consumo pelas proximas stories.

---

## Phase 4: User Story 2 — Listagem Ordenada de Stages (Priority: P1)

**Goal**: Usuario autenticado consulta todos os stages ordenados por posicao. Requisicoes nao autenticadas recebem 401.

**Independent Test**: GET /api/stages com sessao valida retorna 200 com stages ordenados. Sem sessao retorna 401.

**Refs**: FR-002, FR-007, SC-002, SC-004

### Tests for User Story 2

- [x] T014 [P] [US2] Criar teste de contrato `tests/contract/stages/list-stages-contract.test.ts` — verificar shape da resposta 200: `{ stages: [{ id, name, position, isFinal, finalType, createdAt, updatedAt }] }` ordenado por position
- [x] T015 [P] [US2] Criar teste de contrato `tests/contract/stages/unauthorized-stages-contract.test.ts` — verificar resposta 401 com `{ error: { code: "UNAUTHORIZED", message } }`
- [x] T016 [P] [US2] Criar teste de integracao `tests/integration/stages/list-stages-ordered.test.ts` — verificar que listagem retorna stages em ordem correta por position

### Implementation for User Story 2

- [x] T017 [US2] Criar `app/api/stages/route.ts` com handler GET que: valida autenticacao, chama `listStages()`, retorna 200 com `{ stages }`. Tratar erros via `errorResponse` — next-best-practices (route handlers)

**Checkpoint**: Listagem funcional com autenticacao. Stages disponiveis para consumo por futuras features (deals, UI).

---

## Phase 5: User Story 3 — Criacao de Stage (Priority: P2)

**Goal**: Usuario autenticado cria novos stages com validacao completa de name, position, isFinal/finalType. Duplicatas e dados invalidos sao rejeitados.

**Independent Test**: POST /api/stages com dados validos retorna 201. Duplicatas retornam 409. Dados invalidos retornam 400.

**Refs**: FR-003, FR-004, FR-008, BR-002, BR-003, BR-008, BR-009, SC-003

### Tests for User Story 3

- [x] T018 [P] [US3] Criar teste de contrato `tests/contract/stages/create-stage-contract.test.ts` — verificar shape da resposta 201: `{ stage: { id, name, position, isFinal, finalType, createdAt, updatedAt } }`
- [x] T019 [P] [US3] Criar teste de integracao `tests/integration/stages/create-stage-valid.test.ts` — criar stage com dados validos, verificar que aparece na listagem
- [x] T020 [P] [US3] Criar teste de integracao `tests/integration/stages/create-stage-duplicate-name.test.ts` — verificar 409 com `DUPLICATE_STAGE_NAME`
- [x] T021 [P] [US3] Criar teste de integracao `tests/integration/stages/create-stage-duplicate-position.test.ts` — verificar 409 com `DUPLICATE_STAGE_POSITION`
- [x] T022 [P] [US3] Criar teste de integracao `tests/integration/stages/create-stage-invalid-final.test.ts` — verificar 400 para: `isFinal=true` sem `finalType`, `isFinal=false` com `finalType`, `finalType` invalido
- [x] T022a [P] [US3] Criar teste de integracao `tests/integration/stages/create-stage-invalid-name.test.ts` — verificar 400 para: nome vazio, nome apenas espacos (FR-003, edge case spec:L119)
- [x] T022b [P] [US3] Criar teste de contrato `tests/contract/stages/unauthorized-create-contract.test.ts` — verificar 401 no POST /api/stages sem sessao autenticada (FR-007)

### Implementation for User Story 3

- [x] T023 [US3] Adicionar handler POST em `app/api/stages/route.ts` que: valida autenticacao, valida body com `createStageSchema`, chama `createStage(data)`, retorna 201 com `{ stage }`. Capturar erros Prisma de unique constraint para retornar 409 com codigo especifico — next-best-practices (route handlers), postgresql-code-review (unique constraint errors)

**Checkpoint**: Criacao funcional com todas as validacoes. Pipeline pode ser customizado alem do seed.

---

## Phase 6: User Story 4 — Edicao de Stage (Priority: P2)

**Goal**: Usuario autenticado edita stages existentes com validacao parcial. Backend auto-limpa finalType quando isFinal muda para false.

**Independent Test**: PUT /api/stages/[id] com dados validos retorna 200. Stage inexistente retorna 404. Duplicatas retornam 409.

**Refs**: FR-005, BR-010, SC-003

### Tests for User Story 4

- [x] T024 [P] [US4] Criar teste de contrato `tests/contract/stages/update-stage-contract.test.ts` — verificar shape da resposta 200: `{ stage: { ... } }` e 404 com `STAGE_NOT_FOUND`
- [x] T025 [P] [US4] Criar teste de integracao `tests/integration/stages/update-stage-valid.test.ts` — editar nome de stage existente, verificar atualizacao
- [x] T026 [P] [US4] Criar teste de integracao `tests/integration/stages/update-stage-clear-final.test.ts` — alterar `isFinal` para false em stage final, verificar que `finalType` e auto-limpo para null
- [x] T027 [P] [US4] Criar teste de integracao `tests/integration/stages/update-stage-not-found.test.ts` — editar stage inexistente, verificar 404
- [x] T027a [P] [US4] Criar teste de contrato `tests/contract/stages/unauthorized-update-contract.test.ts` — verificar 401 no PUT /api/stages/[id] sem sessao autenticada (FR-007)

### Implementation for User Story 4

- [x] T028 [US4] Criar `app/api/stages/[id]/route.ts` com handler PUT que: valida autenticacao, valida body com `updateStageSchema`, chama `updateStage(id, data)`, retorna 200 com `{ stage }`. Tratar not found (404) e unique violations (409) — next-best-practices (dynamic route handlers)

**Checkpoint**: Edicao funcional com auto-clear de finalType e validacao completa.

---

## Phase 7: User Story 5 — Exclusao de Stage (Priority: P3)

**Goal**: Usuario autenticado remove stages que nao possuem deals associados. Stages inexistentes retornam 404.

**Independent Test**: DELETE /api/stages/[id] de stage sem deals retorna 204. Stage inexistente retorna 404.

**Refs**: FR-006, BR-006

### Tests for User Story 5

- [x] T029 [P] [US5] Criar teste de contrato `tests/contract/stages/delete-stage-contract.test.ts` — verificar 204 (no content) e 404 com `STAGE_NOT_FOUND`
- [x] T030 [P] [US5] Criar teste de integracao `tests/integration/stages/delete-stage-valid.test.ts` — excluir stage sem deals, verificar que desaparece da listagem
- [x] T031 [P] [US5] Criar teste de integracao `tests/integration/stages/delete-stage-not-found.test.ts` — excluir stage inexistente, verificar 404
- [x] T031a [P] [US5] Criar teste de contrato `tests/contract/stages/unauthorized-delete-contract.test.ts` — verificar 401 no DELETE /api/stages/[id] sem sessao autenticada (FR-007)

### Implementation for User Story 5

- [x] T032 [US5] Adicionar handler DELETE em `app/api/stages/[id]/route.ts` que: valida autenticacao, chama `deleteStage(id)`, retorna 204. Tratar not found (404) e futura integridade referencial (409 STAGE_HAS_DEALS) — next-best-practices (route handlers)

**Checkpoint**: CRUD completo de stages. Todas as operacoes protegidas e validadas.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validacao cruzada, consistencia de contratos e verificacao final.

- [x] T033 [P] Revisar consistencia de error codes entre `api-error.ts`, contratos em `contracts/stages-api-contract.md` e implementacao nos route handlers
- [x] T034 [P] Revisar schema Prisma contra `data-model.md` — confirmar que campos, tipos, constraints e enum estao alinhados — postgresql-code-review
- [x] T035 Executar todos os testes (`pnpm test`) e corrigir falhas
- [x] T036 Executar validacao do quickstart (`specs/002-pipeline-stages/quickstart.md`) — 15 steps de validacao manual/automatizada
- [x] T037 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 002

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Seed)**: Depende de Phase 2 (modelo + service)
- **Phase 4 (US2 Listagem)**: Depende de Phase 2 (modelo + service + route)
- **Phase 5 (US3 Criacao)**: Depende de Phase 2 + Phase 4 (route.ts ja criado)
- **Phase 6 (US4 Edicao)**: Depende de Phase 2. Pode rodar em paralelo com Phase 5
- **Phase 7 (US5 Exclusao)**: Depende de Phase 2. Pode rodar em paralelo com Phase 6
- **Phase 8 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Seed, P1)**: Precisa de modelo Prisma (T004) e service layer (T008)
- **US2 (Listagem, P1)**: Precisa de service layer (T008) e seed para ter dados (T011)
- **US3 (Criacao, P2)**: Precisa de route.ts (T017) e validation schemas (T006)
- **US4 (Edicao, P2)**: Precisa de service layer (T008) e validation schemas (T006)
- **US5 (Exclusao, P3)**: Precisa de service layer (T008)

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Modelo antes de service
- Service antes de route handlers
- Validacao e error handling em cada mutacao

### Parallel Opportunities

- T002/T003 (setup dirs) podem rodar em paralelo
- T006/T007 (schemas + error codes) podem rodar em paralelo
- Testes dentro de cada user story marcados [P] podem rodar em paralelo
- US4 e US5 podem ser implementadas em paralelo apos Phase 2

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (modelo, schemas, service)
3. Completar Phase 3: US1 (Seed) — 8 stages no banco
4. Completar Phase 4: US2 (Listagem) — GET /api/stages funcional
5. Validar MVP: seed + listagem autenticada funcionando

### Incremental Delivery

6. Completar Phase 5: US3 (Criacao) — POST /api/stages
7. Completar Phase 6: US4 (Edicao) — PUT /api/stages/[id]
8. Completar Phase 7: US5 (Exclusao) — DELETE /api/stages/[id]
9. Completar Phase 8: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica em service layer + route handlers
- **Principio II (Persistence)**: Stages persistidos via Prisma, seed idempotente
- **Principio III (State Machine)**: Stages definem posicoes do pipeline, finais determinam desfecho
- **Principio IV (Transactional + Auth)**: Auth obrigatoria, unique constraints no banco
- **Principio V (Contracts + Validation)**: Zod centralizado, error codes padronizados, contratos documentados

## Total: 41 tasks | 5 user stories | 8 phases
