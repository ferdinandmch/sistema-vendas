# Implementation Plan: Gestao de Stages do Pipeline

**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pipeline-stages/spec.md`

## Summary

Implementar a gestao de stages do pipeline de vendas com modelo Prisma, seed
idempotente de 8 stages padrao, API REST completa (CRUD) via Next.js Route
Handlers, validacao centralizada com Zod, e protecao por sessao autenticada via
Clerk. O backend e a unica fonte de verdade para ordenacao, validacao e
persistencia dos stages.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js App Router, Clerk, Prisma, Zod
**Storage**: PostgreSQL via Prisma
**Testing**: Vitest (contract + integration tests)
**Target Platform**: Modern web browsers + Node.js server runtime
**Project Type**: Next.js web application
**Performance Goals**: CRUD de stages com resposta sub-segundo para dataset pequeno (<100 stages)
**Constraints**: Transactional integrity, backend-only validation, authenticated access, unique name and position
**Scale/Scope**: Single pipeline, ~8-50 stages, all users share the same stages

## Constitution Check

*GATE: PASS — All principles validated.*

- **Principio I (Backend Source of Truth)**: PASS — Toda logica de CRUD, validacao
  e ordenacao de stages executa exclusivamente no backend via Route Handlers.
  Frontend apenas consome.
- **Principio II (Persistence & Auditability)**: PASS — Stages sao persistidos em
  PostgreSQL. Seed e idempotente. `created_at` e `updated_at` registrados.
  Nota: stage history nao se aplica a esta feature (aplica-se a deals, feature futura).
- **Principio III (State-Oriented Sales Engine)**: PASS — Stages representam
  posicoes no pipeline, com stages finais determinando desfecho (won/lost).
  Modelo preserva semantica de maquina de estados.
- **Principio IV (Transactional Consistency)**: PASS — Operacoes de stage sao
  atomicas via Prisma. Autenticacao exigida em todas as operacoes. Nota: owner_id
  scoping nao se aplica a stages (compartilhados entre usuarios).
- **Principio V (Contract Discipline)**: PASS — Contratos de API definidos em
  `contracts/stages-api-contract.md`. Validacao via Zod centralizada. Erros
  seguem formato AppError padrao.

## Project Structure

### Documentation (this feature)

```text
specs/002-pipeline-stages/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- stages-api-contract.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
app/
|-- api/
|   `-- stages/
|       |-- route.ts          # GET (list), POST (create)
|       `-- [id]/
|           `-- route.ts      # PUT (update), DELETE (delete)
lib/
|-- auth/                     # Existing auth module
|-- db/
|   `-- prisma.ts             # Existing Prisma singleton
|-- validation/
|   |-- api-error.ts          # Existing — extend with stage error codes
|   |-- env.ts                # Existing
|   |-- authenticated-route.ts # Existing
|   `-- stages.ts             # NEW — Zod schemas for stage validation
|-- stages/
|   `-- stage-service.ts      # NEW — Stage business logic (CRUD operations)
prisma/
|-- schema.prisma             # Extend with PipelineStage model + FinalType enum
|-- seed.ts                   # NEW — Idempotent seed for 8 default stages
tests/
|-- contract/stages/          # Contract tests for API shape
`-- integration/stages/       # Integration tests for stage operations
```

**Structure Decision**: Follows existing project patterns from 001-clerk-auth.
Service layer in `lib/stages/` separates business logic from route handlers.
Validation schemas in `lib/validation/stages.ts` follow centralized pattern.

## Domain Alignment

- **System Classification**: Auditable sales operating system / state machine.
- **Affected Modules**: Module 1 — Core Pipeline
- **State Transitions**: Stages do not transition themselves; they define the
  positions through which deals transition. Final stages (won/lost) determine
  deal outcomes.
- **Ownership Model**: Stages are shared across all authenticated users (no
  owner_id scoping). Authentication is required for all operations but stages
  are not user-specific resources.
- **Skills Used**:
  - `next-best-practices`: Route Handler patterns, data patterns (reads vs mutations)
  - `postgresql-code-review`: Schema design, unique constraints, CHECK constraints, enum types

## Complexity Tracking

**Exception: Principio IV — owner_id scoping nao se aplica a stages.**

Stages sao recursos compartilhados entre todos os usuarios autenticados. Nao
pertencem a um usuario individual — definem a estrutura do pipeline usada por
todos. Portanto, `owner_id` scoping (exigido pelo Principio IV para "every
relevant entity") nao se aplica a esta entidade.

- **Justificativa**: Stages representam configuracao do sistema, nao dados de
  usuario. Todos os usuarios veem e operam sobre os mesmos stages.
- **Impacto**: Queries e mutations de stages NAO filtram por owner_id.
- **Autenticacao**: Mantida — todas as operacoes exigem sessao autenticada,
  conforme Principio IV.

> Nenhuma outra violacao encontrada. Demais principios validados sem excecoes.
