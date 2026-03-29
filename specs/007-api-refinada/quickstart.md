# Quickstart Validation: API Refinada

**Feature**: 007-api-refinada
**Date**: 2026-03-29

## Pre-requisitos

- Servidor Next.js rodando (`pnpm dev`)
- Usuario autenticado via Clerk
- Dados de teste existentes (stages, deals, activities)

## Validation Steps

### Step 1: Helper parseAndValidate existe e exporta corretamente

Verificar que `lib/validation/request-helpers.ts` existe e exporta a funcao `parseAndValidate`.

### Step 2: POST /api/stages com JSON malformed

```
POST /api/stages
Content-Type: application/json
Body: "invalid json{{"

Expected: 400 { error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } }
```

### Step 3: POST /api/stages com validacao Zod falha

```
POST /api/stages
Content-Type: application/json
Body: { "name": "", "position": -1 }

Expected: 400 { error: { code: "INVALID_REQUEST", message: "Validation failed", details: [...] } }
```

### Step 4: POST /api/deals com JSON malformed

```
POST /api/deals
Content-Type: application/json
Body: "not json"

Expected: 400 { error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } }
Verify: Mesma mensagem que Step 2 (consistencia cross-endpoint)
```

### Step 5: GET /api/me sem sessao

```
GET /api/me (sem auth header)

Expected: 401 { error: { code: "UNAUTHORIZED", message: "..." } }
```

### Step 6: GET /api/me com erro de sync

Verificar que o fallback error usa `syncFailedError()` ao inves de objeto inline.

### Step 7: Todos os endpoints de listagem retornam envelope correto

```
GET /api/stages    → { stages: [...] }
GET /api/deals     → { deals: [...] }
GET /api/deals/:id/activities → { activities: [...] }
GET /api/deals/:id/history   → { history: [...] }
```

### Step 8: Endpoints de criacao retornam 201

```
POST /api/stages     → 201 { stage: {...} }
POST /api/deals      → 201 { deal: {...} }
POST /api/deals/:id/activities → 201 { activity: {...} }
```

### Step 9: DELETE retorna 204 sem corpo

```
DELETE /api/stages/:id → 204 (corpo vazio)
```

### Step 10: Suite completa de testes passa

```
pnpm test
Expected: 111+ testes passando (existentes + novos), 0 falhas
```

## Criterio de Sucesso

Todos os 10 steps passam. Nenhum teste existente quebrado. Formato de resposta uniforme em todos os endpoints.
