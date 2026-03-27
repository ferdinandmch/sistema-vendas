# Quickstart Validation: Activities de Deals

**Branch**: `005-deal-activities` | **Date**: 2026-03-27

## Prerequisites

- Servidor rodando (`pnpm dev`)
- Usuario autenticado com sessao valida
- Pelo menos 1 deal existente no primeiro stage
- Pelo menos 1 deal de outro usuario (para testes de ownership)

## Validation Steps

### 1. Criar activity com tipo valido e conteudo

```
POST /api/deals/{deal_id}/activities
Body: { "type": "call", "content": "Ligacao de qualificacao" }
```

**Esperado**: 201 com activity criada. id, dealId, type="call", content,
createdAt presentes.

### 2. Verificar last_touch_at atualizado

Consultar deal: `deals.last_touch_at` deve ser >= createdAt da activity.

### 3. Criar activity sem conteudo

```
POST /api/deals/{deal_id}/activities
Body: { "type": "note" }
```

**Esperado**: 201 com activity criada. content=null.

### 4. Verificar last_touch_at atualizado novamente

Consultar deal: `deals.last_touch_at` deve ser >= createdAt da segunda activity.

### 5. Listar activities do deal

```
GET /api/deals/{deal_id}/activities
```

**Esperado**: 200 com array de 2 activities. Ordenadas por createdAt DESC
(a mais recente primeiro).

### 6. Listar activities de deal sem activities

```
GET /api/deals/{deal_with_no_activities_id}/activities
```

**Esperado**: 200 com array vazio `{ "activities": [] }`.

### 7. Criar activity com tipo invalido

```
POST /api/deals/{deal_id}/activities
Body: { "type": "email", "content": "test" }
```

**Esperado**: 400 com error.code = INVALID_REQUEST e details array.

### 8. Criar activity sem tipo

```
POST /api/deals/{deal_id}/activities
Body: { "content": "test" }
```

**Esperado**: 400 com error.code = INVALID_REQUEST e details array.

### 9. Criar activity em deal de outro usuario

```
POST /api/deals/{other_user_deal_id}/activities
Body: { "type": "note" }
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 10. Listar activities de deal de outro usuario

```
GET /api/deals/{other_user_deal_id}/activities
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 11. Criar activity em deal inexistente

```
POST /api/deals/nonexistent-id/activities
Body: { "type": "note" }
```

**Esperado**: 404 com error.code = DEAL_NOT_FOUND.

### 12. Criar activity sem autenticacao

```
POST /api/deals/{deal_id}/activities (sem sessao)
Body: { "type": "note" }
```

**Esperado**: 401 com error.code = UNAUTHORIZED.

### 13. Listar activities sem autenticacao

```
GET /api/deals/{deal_id}/activities (sem sessao)
```

**Esperado**: 401 com error.code = UNAUTHORIZED.

### 14. Criar activity em deal finalizado (won)

```
POST /api/deals/{won_deal_id}/activities
Body: { "type": "followup", "content": "Follow-up pos-venda" }
```

**Esperado**: 201 com activity criada. Deal status permanece "won".

### 15. Verificar atomicidade

Simular falha no update de last_touch_at (ex: FK invalida). Verificar que
nenhuma activity foi criada — transacao revertida completamente.
