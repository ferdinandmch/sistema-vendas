# Research: API Refinada

**Feature**: 007-api-refinada
**Date**: 2026-03-29

## Decision 1: Helper vs Middleware para Centralizacao

**Decision**: Helper function (`parseAndValidate`) chamado explicitamente por cada handler
**Rationale**: Next.js App Router nao tem middleware de route handler nativo como Express. Um helper explicito mantem o controle no handler, e mais facil de testar, e nao introduz magic. Cada handler chama o helper quando precisa — handlers GET-only nao sao afetados.
**Alternatives considered**: Middleware wrapper (HOF que envelopa handlers) — rejeitado porque obscurece o fluxo, dificulta debugging, e handlers tem assinaturas diferentes (com/sem params).

## Decision 2: parseAndValidate Lanca vs Retorna Erro

**Decision**: parseAndValidate() LANCA AppError (throw) ao inves de retornar Result/Either
**Rationale**: O padrao existente no projeto e throw + catch no handler. Todos os services (deal-service, stage-service, activity-service, history-service) lancam AppError. Manter consistencia com o padrao estabelecido. O catch generico no handler ja trata AppError via errorResponse().
**Alternatives considered**: Retornar `{ data, error }` tuple — rejeitado porque quebraria o padrao do projeto e forcaria refatoracao desnecessaria de todos os handlers.

## Decision 3: Localizacao do Helper

**Decision**: `lib/validation/request-helpers.ts`
**Rationale**: O helper depende de Zod e AppError, ambos em `lib/validation/`. Colocar junto mantem coesao do modulo de validacao. Nome `request-helpers` e descritivo e diferencia de `api-error` (que trata erros) e dos schemas (que definem shapes).
**Alternatives considered**: `lib/api/helpers.ts` — rejeitado porque criaria novo diretorio para um unico arquivo. `lib/validation/api-error.ts` (adicionar ao existente) — rejeitado porque api-error.ts ja tem responsabilidade clara (definicao de erros).

## Decision 4: Formato de Mensagem de Erro JSON Invalido

**Decision**: Mensagem fixa "Invalid JSON body" para JSON malformed
**Rationale**: A mensagem atual nos handlers e "Request body must be valid JSON." — vou padronizar para uma unica string. "Invalid JSON body" e mais curta e direta. Como nenhum frontend consome ainda, nao ha breaking change.
**Alternatives considered**: Manter mensagem original — rejeitado porque o ponto da feature e padronizar.

## Decision 5: Refatoracao do GET /api/me

**Decision**: Substituir error response inline por `syncFailedError()` que ja existe
**Rationale**: O handler atualmente constroi `{ code: "SYNC_FAILED", message: "...", status: 500 }` inline no catch fallback. A funcao `syncFailedError()` ja existe em api-error.ts e faz exatamente isso. Basta trocar a chamada.
**Alternatives considered**: Criar novo error factory — rejeitado porque `syncFailedError()` ja existe e e suficiente.

## Decision 6: Escopo de Testes Novos

**Decision**: Testes de contrato para o helper centralizado + testes de contrato de consistencia cross-endpoint
**Rationale**: Testes de integracao existentes (111) ja cobrem o comportamento funcional. Novos testes focam em: (1) helper parseAndValidate funciona corretamente com JSON invalido e schema invalido, (2) todos os endpoints retornam formatos consistentes. Nao duplicar testes existentes.
**Alternatives considered**: Reescrever todos os testes de contrato — rejeitado porque os existentes ja validam comportamento correto.

## Decision 7: Ordem de Refatoracao

**Decision**: Helper primeiro, depois handlers um por um, testes apos cada handler
**Rationale**: O helper e dependencia de todos os handlers. Refatorar um handler por vez permite validacao incremental. Se um handler quebrar, o escopo do problema e claro. Ordem sugerida: stages (mais simples) → deals → move → activities → me.
**Alternatives considered**: Refatorar todos de uma vez — rejeitado porque aumenta risco de regressao e dificulta isolamento de bugs.

## Decision 8: Nenhuma Migracao Prisma

**Decision**: Zero alteracoes no schema Prisma ou banco de dados
**Rationale**: Feature e puramente de refatoracao da camada HTTP. Nenhuma entidade nova, nenhum campo novo, nenhuma relacao nova. Prisma schema permanece identico.
**Alternatives considered**: N/A — nao ha razao para alterar o banco.
