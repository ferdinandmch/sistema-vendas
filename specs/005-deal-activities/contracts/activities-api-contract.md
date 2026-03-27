# API Contract: Activities de Deals

**Branch**: `005-deal-activities` | **Date**: 2026-03-27

## POST /api/deals/[id]/activities

Cria uma nova activity vinculada ao deal.

### Request

```
POST /api/deals/{deal_id}/activities
Content-Type: application/json
Authorization: Clerk session (cookie)

{
  "type": "call",
  "content": "Ligacao de qualificacao com o prospect"
}
```

### Request Body

| Field   | Type   | Required | Validation                            |
|---------|--------|----------|---------------------------------------|
| type    | string | Yes      | Enum: note, call, meeting, followup   |
| content | string | No       | Nullable. Se presente, min 1 char     |

### Responses

#### 201 Created

```json
{
  "activity": {
    "id": "clxyz...",
    "dealId": "clxyz...",
    "type": "call",
    "content": "Ligacao de qualificacao com o prospect",
    "createdAt": "2026-03-27T15:00:00.000Z"
  }
}
```

#### 400 Invalid Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "type", "message": "Invalid enum value..." }
    ]
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
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
2. Body validation (Zod — type required, content optional)
3. Deal lookup with ownership (deal_id + owner_id)
4. Atomic creation (activity + last_touch_at update)

### Side Effects

- Activity criada em `activities` table
- `deals.last_touch_at` atualizado para `now()`
- Ambos dentro de uma unica transacao

---

## GET /api/deals/[id]/activities

Lista todas as activities de um deal.

### Request

```
GET /api/deals/{deal_id}/activities
Authorization: Clerk session (cookie)
```

### Responses

#### 200 OK

```json
{
  "activities": [
    {
      "id": "clxyz...",
      "dealId": "clxyz...",
      "type": "call",
      "content": "Ligacao de qualificacao",
      "createdAt": "2026-03-27T15:00:00.000Z"
    },
    {
      "id": "clxyz...",
      "dealId": "clxyz...",
      "type": "note",
      "content": null,
      "createdAt": "2026-03-27T14:30:00.000Z"
    }
  ]
}
```

**Ordering**: Activities ordenadas por `createdAt` DESC (mais recente primeiro).

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
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
3. List activities ordered by createdAt DESC

### Side Effects

Nenhum. Operacao de leitura.
