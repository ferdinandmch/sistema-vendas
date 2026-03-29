# Quickstart Validation: Historico de Movimentacao de Deals

**Branch**: `006-stage-history` | **Date**: 2026-03-29

## Prerequisites

- Servidor rodando (`pnpm dev`)
- Usuario autenticado com sessao valida
- Pelo menos 1 deal com movimentacoes de stage (mover entre 2-3 stages)
- Pelo menos 1 deal recem-criado sem movimentacoes
- Pelo menos 1 deal de outro usuario (para testes de ownership)

## Validation Steps

### 1. Consultar historico de deal com movimentacoes

```
GET /api/deals/{deal_id}/history
```

**Esperado**: 200 com array de historico. Cada item contem id, dealId,
fromStageId, toStageId, changedAt, fromStage.name, toStage.name.

### 2. Verificar ordenacao cronologica

Conferir que os registros estao ordenados por changedAt ASC (mais antigo
primeiro). O primeiro item deve ser a primeira movimentacao do deal.

### 3. Verificar nomes dos stages

Cada registro deve conter `fromStage: { id, name }` e
`toStage: { id, name }` com nomes legiveis dos stages.

### 4. Consultar historico de deal sem movimentacoes

```
GET /api/deals/{deal_new_id}/history
```

**Esperado**: 200 com array vazio `{ "history": [] }`.

### 5. Consultar historico de deal de outro usuario

```
GET /api/deals/{other_user_deal_id}/history
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 6. Consultar historico de deal inexistente

```
GET /api/deals/nonexistent-id/history
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 7. Consultar historico sem autenticacao

```
GET /api/deals/{deal_id}/history (sem sessao)
```

**Esperado**: 401 com error.code = UNAUTHORIZED.

### 8. Consultar historico de deal finalizado (won/lost)

```
GET /api/deals/{won_deal_id}/history
```

**Esperado**: 200 com historico completo. Status do deal nao afeta a consulta.

### 9. Verificar consistencia com movimentacao

Mover um deal de stage A para stage B. Consultar historico. Verificar que o
ultimo registro contem fromStage=A e toStage=B com changedAt recente.

### 10. Verificar que nao existe endpoint de escrita

```
POST /api/deals/{deal_id}/history
Body: { "fromStageId": "x", "toStageId": "y" }
```

**Esperado**: 405 Method Not Allowed ou ausencia de handler (nenhum POST
definido no route handler).
