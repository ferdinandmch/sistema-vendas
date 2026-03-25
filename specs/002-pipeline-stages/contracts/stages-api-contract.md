# API Contract: Pipeline Stages

**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25

## Overview

All endpoints require authenticated session (Clerk). Unauthenticated requests
receive a 401 error with standard `AppError` envelope.

## Endpoints

### GET /api/stages

**Purpose**: List all pipeline stages ordered by position.

**Authentication**: Required

**Response 200**:
```json
{
  "stages": [
    {
      "id": "cuid_string",
      "name": "Cold",
      "position": 1,
      "isFinal": false,
      "finalType": null,
      "createdAt": "2026-03-25T00:00:00.000Z",
      "updatedAt": "2026-03-25T00:00:00.000Z"
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

**Ordering**: Always by `position` ascending.

---

### POST /api/stages

**Purpose**: Create a new pipeline stage.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Discovery",
  "position": 3,
  "isFinal": false,
  "finalType": null
}
```

**Validation Rules**:
- `name`: required, non-empty string, must be unique
- `position`: required, positive integer, must be unique
- `isFinal`: required, boolean
- `finalType`: required when `isFinal=true` (value: `"won"` or `"lost"`), must be null/absent when `isFinal=false`

**Response 201** (created):
```json
{
  "stage": {
    "id": "cuid_string",
    "name": "Discovery",
    "position": 3,
    "isFinal": false,
    "finalType": null,
    "createdAt": "2026-03-25T00:00:00.000Z",
    "updatedAt": "2026-03-25T00:00:00.000Z"
  }
}
```

**Response 400** (generic validation error — missing fields, wrong types):
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

**Response 400** (isFinal/finalType consistency — `isFinal=true` without `finalType`, or `isFinal=false` with `finalType`):
```json
{
  "error": {
    "code": "INVALID_FINAL_TYPE",
    "message": "final_type is required when is_final is true, and must be null when is_final is false"
  }
}
```

**Response 409** (duplicate name or position):
```json
{
  "error": {
    "code": "DUPLICATE_STAGE_NAME",
    "message": "A stage with this name already exists"
  }
}
```

---

### PUT /api/stages/[id]

**Purpose**: Update an existing pipeline stage.

**Authentication**: Required

**Request Body** (partial update allowed):
```json
{
  "name": "Updated Name",
  "position": 5,
  "isFinal": true,
  "finalType": "won"
}
```

**Validation Rules**: Same as POST. When `isFinal=false`, backend clears
`finalType` automatically.

**Response 200** (updated):
```json
{
  "stage": { ... }
}
```

**Response 404** (not found):
```json
{
  "error": {
    "code": "STAGE_NOT_FOUND",
    "message": "Stage not found"
  }
}
```

**Response 409** (duplicate name or position):
Same as POST.

---

### DELETE /api/stages/[id]

**Purpose**: Delete a pipeline stage.

**Authentication**: Required

**Response 204**: No content (successful deletion).

**Response 404** (not found):
```json
{
  "error": {
    "code": "STAGE_NOT_FOUND",
    "message": "Stage not found"
  }
}
```

**Response 409** (integrity violation — future, when deals exist):
```json
{
  "error": {
    "code": "STAGE_HAS_DEALS",
    "message": "Cannot delete stage with associated deals"
  }
}
```

## Error Codes Summary

| Code                     | HTTP | Description                              |
|--------------------------|------|------------------------------------------|
| `UNAUTHORIZED`           | 401  | No valid session                         |
| `INVALID_REQUEST`        | 400  | Validation failed                        |
| `STAGE_NOT_FOUND`        | 404  | Stage ID does not exist                  |
| `DUPLICATE_STAGE_NAME`   | 409  | Name already in use by another stage     |
| `DUPLICATE_STAGE_POSITION` | 409 | Position already in use by another stage |
| `INVALID_FINAL_TYPE`     | 400  | final_type invalid or missing for final stage |
| `STAGE_HAS_DEALS`        | 409  | Stage has associated deals (future)      |

## Field Naming Convention

API uses camelCase (`isFinal`, `finalType`, `createdAt`, `updatedAt`).
Database uses snake_case (`is_final`, `final_type`, `created_at`, `updated_at`).
Prisma handles the mapping via `@map`.
