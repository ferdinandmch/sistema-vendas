# API Contract: Historico de Movimentacao de Deals

**Branch**: `006-stage-history` | **Date**: 2026-03-29

## GET /api/deals/[id]/history

Lista o historico completo de movimentacao de stages de um deal.

### Request

```
GET /api/deals/{deal_id}/history
Authorization: Clerk session (cookie)
```

### Responses

#### 200 OK

```json
{
  "history": [
    {
      "id": "clxyz...",
      "dealId": "clxyz...",
      "fromStageId": "clxyz...",
      "toStageId": "clxyz...",
      "changedAt": "2026-03-29T14:00:00.000Z",
      "fromStage": { "id": "clxyz...", "name": "Cold" },
      "toStage": { "id": "clxyz...", "name": "Warm" }
    },
    {
      "id": "clxyz...",
      "dealId": "clxyz...",
      "fromStageId": "clxyz...",
      "toStageId": "clxyz...",
      "changedAt": "2026-03-29T15:00:00.000Z",
      "fromStage": { "id": "clxyz...", "name": "Warm" },
      "toStage": { "id": "clxyz...", "name": "Proposal" }
    }
  ]
}
```

**Ordering**: Registros ordenados por `changedAt` ASC (mais antigo primeiro).

**Empty deal**: Retorna `{ "history": [] }` para deals sem movimentacoes.

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required for this resource."
  }
}
```

#### 404 Deal Not Found

```json
{
  "error": {
    "code": "DEAL_NOT_FOUND",
    "message": "Deal not found"
  }
}
```

### Validation Order

1. Authentication (Clerk session)
2. Deal lookup with ownership (deal_id + owner_id)
3. List history ordered by changedAt ASC with stage name includes

### Side Effects

Nenhum. Operacao de leitura.
