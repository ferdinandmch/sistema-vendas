# API Contract: Deals

**Branch**: `003-deal-management` | **Date**: 2026-03-26

## Overview

All endpoints require authenticated session (Clerk). Unauthenticated requests
receive a 401 error with standard `AppError` envelope. All deal operations are
scoped to the authenticated user's `owner_id`.

## Endpoints

### GET /api/deals

**Purpose**: List all deals belonging to the authenticated user.

**Authentication**: Required

**Response 200**:
```json
{
  "deals": [
    {
      "id": "cuid_string",
      "companyName": "Acme Corp",
      "contactName": "John Doe",
      "contactDetails": "+55 11 99999-0000",
      "source": "Referral",
      "experiment": null,
      "notes": "Interested in premium plan",
      "icp": true,
      "nextAction": "Schedule demo",
      "stageId": "cuid_stage",
      "stageUpdatedAt": "2026-03-26T00:00:00.000Z",
      "status": "active",
      "lastTouchAt": null,
      "ownerId": "cuid_user",
      "createdAt": "2026-03-26T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z",
      "stage": {
        "id": "cuid_stage",
        "name": "Cold",
        "position": 1
      }
    }
  ]
}
```

**Response 401** (unauthenticated):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required for this resource."
  }
}
```

**Scoping**: Always filtered by authenticated user's `owner_id`.

---

### POST /api/deals

**Purpose**: Create a new deal.

**Authentication**: Required

**Request Body**:
```json
{
  "companyName": "Acme Corp",
  "contactName": "John Doe",
  "contactDetails": "+55 11 99999-0000",
  "source": "Referral",
  "experiment": null,
  "notes": "Interested in premium plan",
  "icp": true,
  "nextAction": "Schedule demo",
  "stageId": "cuid_stage"
}
```

**Validation Rules**:
- `companyName`: required, non-empty string
- `stageId`: required, must reference existing PipelineStage
- `contactName`: optional, string
- `contactDetails`: optional, string
- `source`: optional, string
- `experiment`: optional, string
- `notes`: optional, string
- `icp`: optional, boolean (default: false)
- `nextAction`: optional, string

**Auto-set by backend** (not accepted in payload):
- `ownerId`: from authenticated user context
- `status`: `active`
- `stageUpdatedAt`: current timestamp
- `lastTouchAt`: `null`

**Response 201** (created):
```json
{
  "deal": {
    "id": "cuid_string",
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "contactDetails": "+55 11 99999-0000",
    "source": "Referral",
    "experiment": null,
    "notes": "Interested in premium plan",
    "icp": true,
    "nextAction": "Schedule demo",
    "stageId": "cuid_stage",
    "stageUpdatedAt": "2026-03-26T00:00:00.000Z",
    "status": "active",
    "lastTouchAt": null,
    "ownerId": "cuid_user",
    "createdAt": "2026-03-26T00:00:00.000Z",
    "updatedAt": "2026-03-26T00:00:00.000Z",
    "stage": {
      "id": "cuid_stage",
      "name": "Cold",
      "position": 1
    }
  }
}
```

**Response 400** (validation error):
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "companyName", "message": "Company name is required" }
    ]
  }
}
```

**Response 400** (invalid stage):
```json
{
  "error": {
    "code": "STAGE_NOT_FOUND",
    "message": "Stage not found"
  }
}
```

---

### GET /api/deals/[id]

**Purpose**: Get full details of a deal belonging to the authenticated user.

**Authentication**: Required

**Response 200**:
```json
{
  "deal": {
    "id": "cuid_string",
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "contactDetails": "+55 11 99999-0000",
    "source": "Referral",
    "experiment": null,
    "notes": "Interested in premium plan",
    "icp": true,
    "nextAction": "Schedule demo",
    "stageId": "cuid_stage",
    "stageUpdatedAt": "2026-03-26T00:00:00.000Z",
    "status": "active",
    "lastTouchAt": null,
    "ownerId": "cuid_user",
    "createdAt": "2026-03-26T00:00:00.000Z",
    "updatedAt": "2026-03-26T00:00:00.000Z",
    "stage": {
      "id": "cuid_stage",
      "name": "Cold",
      "position": 1
    }
  }
}
```

**Response 404** (not found or not owned):
```json
{
  "error": {
    "code": "DEAL_NOT_FOUND",
    "message": "Deal not found"
  }
}
```

**Security**: Returns 404 (not 403) for deals that exist but belong to another
user, to avoid revealing existence.

---

### PUT /api/deals/[id]

**Purpose**: Update an existing deal belonging to the authenticated user.

**Authentication**: Required

**Request Body** (partial update, editable fields only):
```json
{
  "companyName": "Updated Corp",
  "contactName": "Jane Doe",
  "icp": false,
  "notes": "Updated notes"
}
```

**Editable Fields**:
- companyName, contactName, contactDetails, source, experiment, notes, icp,
  nextAction

**Protected Fields** (ignored if sent):
- stageId, ownerId, status, stageUpdatedAt, lastTouchAt

**Response 200** (updated):
```json
{
  "deal": { ... }
}
```

**Response 400** (validation error):
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "companyName", "message": "Company name must not be empty" }
    ]
  }
}
```

**Response 404** (not found or not owned):
```json
{
  "error": {
    "code": "DEAL_NOT_FOUND",
    "message": "Deal not found"
  }
}
```

## Error Codes Summary

| Code              | HTTP | Description                                     |
|-------------------|------|-------------------------------------------------|
| `UNAUTHORIZED`    | 401  | No valid session                                |
| `INVALID_REQUEST` | 400  | Validation failed                               |
| `STAGE_NOT_FOUND` | 400  | stage_id does not reference existing stage       |
| `DEAL_NOT_FOUND`  | 404  | Deal ID does not exist or belongs to other user  |

## Field Naming Convention

API uses camelCase (`companyName`, `stageId`, `stageUpdatedAt`, `ownerId`).
Database uses snake_case (`company_name`, `stage_id`, `stage_updated_at`, `owner_id`).
Prisma handles the mapping via `@map`.
