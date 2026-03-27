# API Contract: Move Deal between Stages

**Branch**: `004-stage-movement` | **Date**: 2026-03-27

## POST /api/deals/[id]/move

Move a deal to a different pipeline stage. Creates a stage history record.
Updates deal status when target stage is final.

### Request

**Authentication**: Required (Clerk session)

**URL Parameters**:
- `id` (string, required) — Deal ID

**Body**:
```json
{
  "toStageId": "clxxxxxxxxxxxxxxxxx"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| toStageId | string | Yes | Non-empty, must reference existing PipelineStage |

### Response — 200 OK (Successful Move)

```json
{
  "deal": {
    "id": "clxxxxxxxxxxxxxxxxx",
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "contactDetails": "john@acme.com",
    "source": "Inbound",
    "experiment": null,
    "notes": null,
    "icp": true,
    "nextAction": "Follow up next week",
    "stageId": "clyyyyyyyyyyyyyyyyy",
    "stageUpdatedAt": "2026-03-27T15:30:00.000Z",
    "status": "active",
    "lastTouchAt": null,
    "ownerId": "clzzzzzzzzzzzzzzzzz",
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-27T15:30:00.000Z",
    "stage": {
      "id": "clyyyyyyyyyyyyyyyyy",
      "name": "Proposta Enviada",
      "position": 3
    }
  }
}
```

### Response — 200 OK (Move to Final Stage)

```json
{
  "deal": {
    "id": "clxxxxxxxxxxxxxxxxx",
    "companyName": "Acme Corp",
    "stageId": "clwwwwwwwwwwwwwwwww",
    "stageUpdatedAt": "2026-03-27T16:00:00.000Z",
    "status": "won",
    "stage": {
      "id": "clwwwwwwwwwwwwwwwww",
      "name": "Won",
      "position": 6
    }
  }
}
```

**Note**: `status` changes to `"won"` or `"lost"` based on the target stage's `finalType`.

### Error Responses

#### 401 Unauthorized — No valid session

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required for this resource."
  }
}
```

#### 400 Invalid Request — Missing or invalid toStageId

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "toStageId", "message": "Stage ID is required" }
    ]
  }
}
```

#### 400 Stage Not Found — toStageId does not exist

```json
{
  "error": {
    "code": "STAGE_NOT_FOUND",
    "message": "Stage not found"
  }
}
```

#### 400 Same Stage — toStageId equals current stageId

```json
{
  "error": {
    "code": "SAME_STAGE",
    "message": "Deal is already in this stage"
  }
}
```

#### 400 Deal Already Closed — Deal status is won or lost

```json
{
  "error": {
    "code": "DEAL_ALREADY_CLOSED",
    "message": "Cannot move a finalized deal"
  }
}
```

#### 404 Deal Not Found — Invalid ID or ownership mismatch

```json
{
  "error": {
    "code": "DEAL_NOT_FOUND",
    "message": "Deal not found"
  }
}
```

### Validation Order

1. Authentication (401 UNAUTHORIZED)
2. Body validation via Zod (400 INVALID_REQUEST)
3. Deal lookup with ownership filter (404 DEAL_NOT_FOUND)
4. Deal status check (400 DEAL_ALREADY_CLOSED)
5. Same-stage check (400 SAME_STAGE)
6. Target stage lookup (400 STAGE_NOT_FOUND)
7. Execute transactional move

### Side Effects

- `deals.stage_id` updated to `toStageId`
- `deals.stage_updated_at` updated to current timestamp
- `deals.status` updated to `won`/`lost` if target stage is final
- New `deal_stage_history` record created with `dealId`, `fromStageId`, `toStageId`, `changedAt`

### Field Naming Convention

- API: camelCase (e.g., `toStageId`, `stageUpdatedAt`)
- Database: snake_case (e.g., `to_stage_id`, `stage_updated_at`)
