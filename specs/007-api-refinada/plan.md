# Implementation Plan: API Refinada

**Branch**: `007-api-refinada` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-api-refinada/spec.md`

## Summary

Padronizar todos os 14 endpoints existentes do Fineo Pipeline com contratos uniformes de sucesso, erro e validacao. A abordagem principal e criar um helper centralizado de parsing JSON + validacao Zod (`lib/validation/request-helpers.ts`) e refatorar cada route handler para usa-lo, eliminando ~60 linhas de codigo duplicado. Nenhuma regra de negocio e alterada; apenas a camada de exposicao da API.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, Prisma 6, Clerk v7, Zod
**Storage**: PostgreSQL via Prisma (somente leitura nesta feature — zero migracoes)
**Testing**: Vitest (testes de contrato e integracao)
**Target Platform**: Modern web browsers + Node.js server runtime
**Project Type**: Next.js web application (sales pipeline OS)
**Performance Goals**: Zero regressao de performance — refatoracao nao adiciona overhead mensuravel
**Constraints**: Manter todos os 111 testes existentes passando, nao alterar regras de negocio
**Scale/Scope**: 14 endpoints, 8 route handler files, 1 novo helper, ~7 handlers refatorados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Backend Source of Truth**: PASS — Feature nao altera logica de negocio. Toda logica permanece no service layer. Apenas a camada de resposta/envelope e padronizada.
- **II. Mandatory Persistence**: PASS — Feature somente leitura/refatoracao. Nenhuma mutacao de dados e alterada. Side effects (history records, last_touch_at) permanecem intactos.
- **III. State Machine**: PASS — Nenhuma transicao de estado e modificada. Feature atua exclusivamente na camada de resposta HTTP.
- **IV. Transactional + Auth + Ownership**: PASS — Auth via requireAuthenticatedUser() permanece como primeira operacao. Ownership enforcement via ownerId filter permanece identico. Transacoes no moveDeal nao sao tocadas.
- **V. Contract Discipline + Validation**: PASS — Esta e a feature que reforça este principio. Helper centralizado garante que todo payload passa por Zod antes da logica. Error payloads ja seguem formato padrao; feature elimina excecoes.
- **Skills**: PASS — next-best-practices (route handlers), postgresql-code-review (revisao queries), update-docs (CLAUDE.md).
- **Module Alignment**: PASS — Feature pertence ao Module 4 (API) conforme constituicao.

## Project Structure

### Documentation (this feature)

```text
specs/007-api-refinada/
|-- spec.md
|-- plan.md              # This file
|-- research.md          # Phase 0 output
|-- data-model.md        # Phase 1 output (minimal — no new entities)
|-- quickstart.md        # Phase 1 output
|-- contracts/           # Phase 1 output
`-- tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
|-- api/
|   |-- me/route.ts                         # Refatorar error handling inline
|   |-- stages/route.ts                     # Refatorar POST: usar helper centralizado
|   |-- stages/[id]/route.ts                # Refatorar PUT: usar helper centralizado
|   |-- deals/route.ts                      # Refatorar POST: usar helper centralizado
|   |-- deals/[id]/route.ts                 # Refatorar PUT: usar helper centralizado
|   |-- deals/[id]/move/route.ts            # Refatorar POST: usar helper centralizado
|   |-- deals/[id]/activities/route.ts      # Refatorar POST: usar helper centralizado
|   `-- deals/[id]/history/route.ts         # Sem alteracao (GET-only, sem payload)
lib/
|-- validation/
|   |-- api-error.ts                        # Sem alteracao (ja padronizado)
|   |-- request-helpers.ts                  # NOVO: helper parseAndValidate()
|   |-- stages.ts                           # Sem alteracao
|   |-- deals.ts                            # Sem alteracao
|   `-- activities.ts                       # Sem alteracao
tests/
|-- contract/
|   |-- api-refinada/                       # NOVO: testes de contrato da padronizacao
|-- integration/                            # Testes existentes — nao alterar
```

**Structure Decision**: O helper centralizado fica em `lib/validation/request-helpers.ts` junto aos schemas Zod existentes, seguindo a convencao do projeto. Nenhum middleware Next.js e criado — a padronizacao e via funcao utilitaria chamada explicitamente por cada handler.

## Domain Alignment

- **System Classification**: Auditable sales operating system / state machine. Feature nao altera classificacao.
- **Affected Modules**: Module 4 (API) — unico modulo afetado. Modulos 0-3 e 5 nao sao tocados.
- **State Transitions**: Nenhuma. Feature e puramente de refatoracao da camada HTTP.
- **Ownership Model**: Permanece identico. requireAuthenticatedUser() como primeira operacao em cada handler. ownerId filter via deal/service layer. Feature nao altera enforcement.
- **Skills Used**: `next-best-practices` (route handler patterns), `postgresql-code-review` (revisao queries durante refatoracao), `update-docs` (CLAUDE.md)

## Architecture

### Inventario de Inconsistencias Detectadas

| Endpoint | Inconsistencia | Acao |
|----------|---------------|------|
| POST /api/stages | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| PUT /api/stages/:id | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| POST /api/deals | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| PUT /api/deals/:id | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| POST /api/deals/:id/move | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| POST /api/deals/:id/activities | Parsing JSON manual + mapeamento Zod duplicado | Usar parseAndValidate() |
| GET /api/me | Error handling inline (nao usa helpers) | Migrar para syncFailedError() |
| GET /api/stages | Nenhuma | Sem alteracao |
| GET /api/deals | Nenhuma | Sem alteracao |
| GET /api/deals/:id | Nenhuma | Sem alteracao |
| GET /api/deals/:id/activities | Nenhuma | Sem alteracao |
| GET /api/deals/:id/history | Nenhuma | Sem alteracao |
| DELETE /api/stages/:id | Nenhuma (204 e correto) | Sem alteracao |

### Helper Centralizado: parseAndValidate()

**Localizacao**: `lib/validation/request-helpers.ts`

**Responsabilidade**:
1. Recebe `Request` e schema Zod
2. Tenta parsear JSON do body
3. Se JSON invalido: lanca `invalidRequestError("Invalid JSON body")`
4. Valida dados contra schema Zod
5. Se validacao falha: lanca `invalidRequestError("Validation failed", details)` com `details: [{ field, message }]`
6. Se sucesso: retorna dados tipados conforme schema

**Assinatura**:
```
parseAndValidate<T>(request: Request, schema: ZodSchema<T>): Promise<T>
```

**Impacto**: Elimina ~10 linhas duplicadas por handler (try/catch JSON + safeParse + map issues). 6 handlers afetados = ~60 linhas removidas.

### Refatoracao do GET /api/me

**Antes**: Error fallback inline `return errorResponse({ code: "SYNC_FAILED", ... })`
**Depois**: Usar `syncFailedError()` factory que ja existe em api-error.ts

### Handlers sem Alteracao

Os seguintes handlers GET-only ja estao padronizados:
- GET /api/stages, GET /api/deals, GET /api/deals/:id
- GET /api/deals/:id/activities, GET /api/deals/:id/history
- DELETE /api/stages/:id (204 sem corpo e correto)

### Fluxo Padronizado de um Handler com Payload

```
1. requireAuthenticatedUser()          → auth
2. await context.params                → route params (se aplicavel)
3. parseAndValidate(request, schema)   → parse + validate (lanca AppError se falhar)
4. serviceFunction(data, ownerId)      → logica de negocio
5. NextResponse.json({ recurso })      → resposta padronizada
```

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Refatoracao quebrar testes existentes | Baixa | Alto | Executar suite completa (111 testes) apos cada handler refatorado |
| Helper centralizado nao cobrir edge case de algum schema | Baixa | Medio | Todos os schemas Zod sao testados; helper usa safeParse generico |
| Frontend depender de formato de erro ligeiramente diferente | Nula | N/A | Nenhum frontend existe ainda; API refinada e preparacao |

## Complexity Tracking

Nenhuma violacao de constituicao. Tabela nao aplicavel.
