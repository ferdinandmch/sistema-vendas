# Research: 002-pipeline-stages

**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25

## Decision 1: Route Handlers para CRUD de stages

**Decision**: Usar Next.js Route Handlers (`app/api/stages/route.ts`) para todas as operacoes de stages (GET, POST). Usar dynamic route handler (`app/api/stages/[id]/route.ts`) para PUT e DELETE por ID.

**Rationale**: Conforme next-best-practices, Route Handlers sao a abordagem correta para APIs que precisam ser consumidas tanto internamente (Server Components para reads) quanto externamente no futuro. GET handlers suportam caching HTTP. A constituicao exige que toda logica critica passe pelo backend via API.

**Alternatives considered**:
- Server Actions: Adequados para mutations de UI, mas a constituicao exige APIs explicitas com contratos definidos. Server Actions nao geram endpoints REST documentaveis.
- Direct Prisma em Server Components: Adequado para reads simples, mas nao fornece contrato de API explicito conforme Principio V.

## Decision 2: Validacao centralizada com Zod

**Decision**: Criar schemas Zod centralizados para validacao de input de stages (`createStageSchema`, `updateStageSchema`) em `lib/validation/`.

**Rationale**: Principio V da constituicao exige validacao centralizada no backend com Zod. Os schemas validam `name` (string nao-vazia), `position` (inteiro positivo), consistencia `is_final`/`final_type`, e unicidade (verificada no banco).

**Alternatives considered**:
- Validacao inline nos Route Handlers: Viola Principio V (centralizacao).
- Prisma-only validation: Insuficiente para regras de negocio compostas (is_final + final_type).

## Decision 3: Seed idempotente via Prisma seed script

**Decision**: Implementar seed como `prisma/seed.ts` executado via `pnpm prisma db seed`. Usar `upsert` por nome para garantir idempotencia.

**Rationale**: Prisma suporta seed nativo via configuracao no `package.json`. Upsert por nome garante que multiplas execucoes nao criam duplicatas (BR-005). Os 8 stages padrao sao inseridos com posicoes e flags corretos.

**Alternatives considered**:
- Script SQL manual: Funciona mas nao integra com o tooling Prisma.
- Migration com INSERT: Nao e idempotente sem logica condicional.

## Decision 4: Modelo Prisma com constraints de unicidade

**Decision**: Modelo `PipelineStage` com `@unique` em `name` e `position` separadamente. Tipo `FinalType` como enum Prisma (`won`, `lost`).

**Rationale**: Clarificacoes da spec definem que tanto `name` quanto `position` devem ser unicos (BR-008, BR-009). Enum Prisma para `final_type` garante type-safety e restricao no banco (FR-008). Conforme postgresql-code-review, constraints de unicidade no banco garantem integridade mesmo em cenarios de concorrencia.

**Alternatives considered**:
- Validacao de unicidade apenas no codigo: Vulneravel a race conditions.
- Compound unique (name+position): Nao faz sentido semanticamente — cada um e unico independentemente.

## Decision 5: Erro padronizado reutilizando AppError existente

**Decision**: Reutilizar o sistema de erros existente (`lib/validation/api-error.ts`) adicionando codigos de erro para stages: `STAGE_NOT_FOUND`, `DUPLICATE_STAGE_NAME`, `DUPLICATE_STAGE_POSITION`, `INVALID_FINAL_TYPE`.

**Rationale**: Principio V exige formato padrao de erros. O sistema AppError ja existe da feature 001 e deve ser estendido, nao duplicado.

**Alternatives considered**:
- Novo sistema de erros: Desnecessario e violaria consistencia.
- Erros genericos HTTP sem codigo: Viola Principio V (contratos explicitos).
