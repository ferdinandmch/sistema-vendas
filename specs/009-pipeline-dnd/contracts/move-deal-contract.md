# API Contract: Move Deal (consumed by DnD)

**Feature**: 009-pipeline-dnd
**Date**: 2026-03-30
**Contract type**: Consumed (existing endpoint from feature 004)

---

## Endpoint consumed

```
POST /api/deals/:id/move
```

This endpoint was implemented in feature 004. This feature only consumes it — no changes to the contract.

---

## Request

**Headers**:
- `Content-Type: application/json`
- Clerk session cookie (automatic, set by browser)

**Path params**:
- `id` — UUID of the deal to move

**Body**:
```json
{
  "toStageId": "uuid-of-target-stage"
}
```

---

## Response — Success (200)

```json
{
  "deal": {
    "id": "uuid",
    "companyName": "Empresa X",
    "contactName": "João Silva",
    "stageId": "uuid-of-new-stage",
    "status": "active",
    "nextAction": null,
    "ownerId": "user_clerk_id",
    "createdAt": "2026-03-30T00:00:00.000Z",
    "stageUpdatedAt": "2026-03-30T00:00:00.000Z",
    "stage": {
      "id": "uuid-of-new-stage",
      "name": "Qualificação",
      "position": 2
    }
  }
}
```

---

## Response — Errors

| Status | Code | Scenario |
|--------|------|----------|
| 401 | `UNAUTHORIZED` | No valid Clerk session |
| 403 | `FORBIDDEN` | Deal belongs to another user |
| 404 | `NOT_FOUND` | Deal or stage not found |
| 409 | `DEAL_ALREADY_CLOSED` | Deal status is won or lost |
| 422 | `VALIDATION_ERROR` | `toStageId` missing or invalid |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

All errors follow the standardized envelope from feature 007:
```json
{
  "error": {
    "code": "DEAL_ALREADY_CLOSED",
    "message": "Deal already closed and cannot be moved."
  }
}
```

---

## Frontend contract (moveDeal function)

```ts
// lib/pipeline/api.ts
async function moveDeal(dealId: string, toStageId: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${dealId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toStageId }),
  });
  if (!res.ok) throw new Error("Failed to move deal");
  const data = await res.json() as { deal: Deal };
  return data.deal;
}
```

Errors are caught by TanStack Query `useMutation` `onError` handler — no inline try/catch needed.

---

## No new endpoints

This feature creates no new API routes. All backend logic for deal movement is already implemented (feature 004) and standardized (feature 007).
