# Tasks: API Refinada

**Input**: Design documents from `/specs/007-api-refinada/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-response-contract.md, quickstart.md
**Branch**: `007-api-refinada` | **Date**: 2026-03-29

**Tests**: Include test tasks for helper centralizado, consistencia cross-endpoint, e padrao de erro uniforme.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Skills Used**: `next-best-practices`, `postgresql-code-review`, `update-docs`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar estrutura e dependencias existentes para a refatoracao.

- [x] T001 Confirmar que `lib/validation/api-error.ts`, `lib/auth/require-auth.ts` e todos os schemas Zod (`lib/validation/stages.ts`, `lib/validation/deals.ts`, `lib/validation/activities.ts`) estao presentes e intactos
- [x] T002 [P] Criar diretorio `tests/contract/api-refinada/` para testes de contrato da padronizacao

**Checkpoint**: Estrutura confirmada, pronta para criacao do helper centralizado.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar helper centralizado de parsing + validacao. BLOQUEIA todas as user stories.

**CRITICAL**: Nenhum trabalho de user story pode comecar ate esta fase estar completa.

- [x] T003 Implementar `lib/validation/request-helpers.ts` com funcao `parseAndValidate<T>(request: Request, schema: ZodSchema<T>): Promise<T>` — tenta `request.json()`, se falha lanca `invalidRequestError("Invalid JSON body")`; valida com `schema.safeParse()`, se falha lanca `invalidRequestError("Validation failed", details)` com `details: [{ field: issue.path.join("."), message: issue.message }]`; se sucesso retorna dados tipados — next-best-practices

**Checkpoint**: Helper centralizado pronto. Base para refatoracao dos handlers.

---

## Phase 3: User Story 1 — Respostas de Sucesso Padronizadas (Priority: P1)

**Goal**: Todos os endpoints retornam sucesso no formato envelope padronizado. Handlers com payload usam parseAndValidate().

**Independent Test**: Chamar cada endpoint com dados validos e verificar formato de resposta consistente.

**Refs**: FR-001, FR-002, FR-003, FR-006, FR-007, FR-008, BR-001, BR-005, BR-006, SC-001, SC-003

### Tests for User Story 1

- [x] T004 [P] [US1] Criar teste de contrato `tests/contract/api-refinada/parse-and-validate.test.ts` — testar helper com: JSON valido + schema valido (retorna dados), JSON malformed (lanca INVALID_REQUEST "Invalid JSON body"), JSON valido + schema invalido (lanca INVALID_REQUEST "Validation failed" com details)
- [x] T005 [P] [US1] Criar teste de contrato `tests/contract/api-refinada/success-envelope.test.ts` — verificar que POST /api/stages retorna 201 `{ stage }`, POST /api/deals retorna 201 `{ deal }`, PUT /api/stages/:id retorna 200 `{ stage }`, DELETE /api/stages/:id retorna 204 sem corpo

### Implementation for User Story 1

- [x] T006 [US1] Refatorar `app/api/stages/route.ts` POST — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, createStageSchema)` — next-best-practices
- [x] T007 [P] [US1] Refatorar `app/api/stages/[id]/route.ts` PUT — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, updateStageSchema)` — next-best-practices
- [x] T008 [P] [US1] Refatorar `app/api/deals/route.ts` POST — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, createDealSchema)` — next-best-practices
- [x] T009 [P] [US1] Refatorar `app/api/deals/[id]/route.ts` PUT — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, updateDealSchema)` — next-best-practices
- [x] T010 [P] [US1] Refatorar `app/api/deals/[id]/move/route.ts` POST — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, moveDealSchema)` — next-best-practices
- [x] T011 [P] [US1] Refatorar `app/api/deals/[id]/activities/route.ts` POST — substituir bloco try/catch JSON + safeParse + map issues por `parseAndValidate(request, createActivitySchema)` — next-best-practices

**Checkpoint**: Todos os 6 handlers com payload usam helper centralizado. Zero parsing manual restante.

---

## Phase 4: User Story 2 — Respostas de Erro Padronizadas (Priority: P1)

**Goal**: Todos os endpoints retornam erros no formato uniforme `{ error: { code, message, details? } }`. GET /api/me usa helpers padronizados.

**Independent Test**: Provocar cada tipo de erro em diferentes endpoints e verificar formato uniforme.

**Refs**: FR-004, FR-005, FR-008, BR-002, SC-002

### Tests for User Story 2

- [x] T012 [P] [US2] Criar teste de contrato `tests/contract/api-refinada/error-format-consistency.test.ts` — verificar que JSON malformed em POST /api/stages retorna `{ error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } }` com status 400; mesma shape em POST /api/deals (consistencia cross-endpoint)
- [x] T013 [P] [US2] Criar teste de contrato `tests/contract/api-refinada/validation-error-details.test.ts` — verificar que payload invalido em POST /api/stages retorna `{ error: { code: "INVALID_REQUEST", message: "Validation failed", details: [{ field, message }] } }` com status 400

### Implementation for User Story 2

- [x] T014 [US2] Refatorar `app/api/me/route.ts` GET — substituir error response inline `return errorResponse({ code: "SYNC_FAILED", ... })` por `throw syncFailedError()` no catch fallback, mantendo o padrao throw + catch do projeto — next-best-practices

**Checkpoint**: Todos os endpoints retornam erros via helpers padronizados. Zero error handling inline.

---

## Phase 5: User Story 3 — Validacao Centralizada de Payloads (Priority: P1)

**Goal**: Confirmar que o helper centralizado e usado em todos os handlers e que o formato de erro Zod e uniforme.

**Independent Test**: Enviar payloads invalidos para cada endpoint com validacao e verificar formato identico.

**Refs**: FR-001, FR-002, FR-008, SC-003

### Tests for User Story 3

- [x] T015 [P] [US3] Criar teste de contrato `tests/contract/api-refinada/zod-error-cross-endpoint.test.ts` — enviar payload invalido para POST /api/deals, POST /api/deals/:id/move e POST /api/deals/:id/activities, verificar que todos retornam `details` array com `{ field, message }` no mesmo formato

### Implementation for User Story 3

Nenhuma implementacao adicional necessaria — helper (T003) e refatoracao dos handlers (T006-T011) ja cobrem esta user story.

**Checkpoint**: Validacao centralizada confirmada por testes cross-endpoint.

---

## Phase 6: User Story 4 — Consistencia entre Todos os Endpoints (Priority: P2)

**Goal**: Verificar que todos os 14 endpoints seguem os mesmos padroes sem excecao.

**Independent Test**: Suite completa de testes de contrato verifica zero inconsistencias.

**Refs**: FR-003, FR-004, FR-006, FR-007, SC-001, SC-002, SC-004, SC-005

### Tests for User Story 4

- [x] T016 [P] [US4] Criar teste de integracao `tests/contract/api-refinada/full-consistency-check.test.ts` — verificar que GET /api/me retorna `{ user }` com 200, GET /api/stages retorna `{ stages }` com 200, GET /api/deals retorna `{ deals: [] }` com 200 quando usuario sem deals (lista vazia como sucesso, BR-004), DELETE /api/stages/:id retorna 204 sem corpo — cobertura total do endpoint matrix

### Implementation for User Story 4

Nenhuma implementacao adicional necessaria — refatoracoes das fases anteriores ja garantem consistencia.

**Checkpoint**: Todos os 14 endpoints validados contra contrato padrao.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validacao final, testes de regressao e atualizacao de documentacao.

- [x] T017 Executar todos os testes (`pnpm test`) e corrigir falhas — confirmar 111 testes existentes + novos testes passando
- [x] T018 [P] Revisar que nenhum route handler faz parsing JSON manual — grep por `request.json()` nos handlers e confirmar que so existe dentro de `request-helpers.ts` — postgresql-code-review
- [x] T019 [P] Executar validacao do quickstart (`specs/007-api-refinada/quickstart.md`) — 10 steps de validacao
- [x] T020 [P] Atualizar `CLAUDE.md` via `update-agent-context.ps1 -AgentType claude` com tecnologias da feature 007 — update-docs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1. BLOQUEIA todas as user stories
- **Phase 3 (US1 Sucesso Padronizado)**: Depende de Phase 2 (helper)
- **Phase 4 (US2 Erro Padronizado)**: Depende de Phase 2. Pode rodar em paralelo com Phase 3
- **Phase 5 (US3 Validacao Centralizada)**: Depende de Phase 3 (handlers refatorados)
- **Phase 6 (US4 Consistencia Total)**: Depende de Phases 3 e 4
- **Phase 7 (Polish)**: Depende de todas as phases anteriores

### User Story Dependencies

- **US1 (Sucesso Padronizado, P1)**: Precisa de helper (T003)
- **US2 (Erro Padronizado, P1)**: Precisa de helper (T003). Independente de US1
- **US3 (Validacao Centralizada, P1)**: Precisa de handlers refatorados (T006-T011)
- **US4 (Consistencia Total, P2)**: Precisa de US1 + US2 completos

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementacao
- Helper antes de handlers
- Refatoracao incremental: um handler por vez

### Parallel Opportunities

- T001/T002 (setup) podem rodar em paralelo
- T004/T005 (testes US1) podem rodar em paralelo
- T007/T008/T009/T010/T011 (refatoracao handlers) podem rodar em paralelo (arquivos diferentes)
- T012/T013 (testes US2) podem rodar em paralelo
- US1 e US2 podem rodar em paralelo apos Phase 2

---

## Implementation Strategy

### MVP First (US1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Helper centralizado
3. Completar Phase 3: US1 (Sucesso Padronizado) — handlers refatorados
4. Validar MVP: zero parsing manual, testes passando

### Incremental Delivery

5. Completar Phase 4: US2 (Erro Padronizado) — GET /api/me corrigido
6. Completar Phase 5: US3 (Validacao Centralizada) — testes cross-endpoint
7. Completar Phase 6: US4 (Consistencia Total) — full consistency check
8. Completar Phase 7: Polish, testes finais e quickstart validation

---

## Constitution Compliance

- **Principio I (Backend Source of Truth)**: Toda logica permanece no service layer. Feature refatora apenas camada HTTP.
- **Principio II (Persistence)**: Nenhuma mutacao alterada. Side effects (history, last_touch_at) intactos.
- **Principio III (State Machine)**: Nenhuma transicao de estado modificada. Feature e puramente de camada de resposta.
- **Principio IV (Transactional + Auth + Ownership)**: Auth como primeira operacao em cada handler. Ownership enforcement inalterado. Transacoes em moveDeal nao tocadas.
- **Principio V (Contracts + Validation)**: Esta feature REFORÇA este principio. Helper centralizado garante validacao Zod antes da logica. Error payloads uniformizados.

## Total: 20 tasks | 4 user stories | 7 phases
