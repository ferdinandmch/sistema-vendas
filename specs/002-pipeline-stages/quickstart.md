# Quickstart Validation: 002-pipeline-stages

**Branch**: `002-pipeline-stages` | **Date**: 2026-03-25

## Preconditions

- [ ] Dependencies installed (`pnpm install`)
- [ ] Clerk configured (`.env` with valid keys)
- [ ] Database accessible (`DATABASE_URL` valid)
- [ ] Prisma generated and migrated (`pnpm prisma generate && pnpm prisma db push`)
- [ ] Seed executed (`pnpm prisma db seed`)

## Validation Steps

### Step 1: Verify seed created default stages

Execute seed and verify 8 stages exist in the database with correct names, positions, and flags.

**Expected**: 8 stages — Cold(1), Warm(2), Initial Call(3), Qualified(4), Demo(5), Negotiation(6), Won(7,final/won), Lost(8,final/lost)

---

### Step 2: Verify seed idempotency

Execute seed again.

**Expected**: Still exactly 8 stages (no duplicates).

---

### Step 3: List stages (authenticated)

`GET /api/stages` with valid session.

**Expected**: 200 response with all 8 stages ordered by position ascending.

---

### Step 4: List stages (unauthenticated)

`GET /api/stages` without session.

**Expected**: 401 response with `UNAUTHORIZED` error code.

---

### Step 5: Create a new stage

`POST /api/stages` with body: `{ "name": "Follow-up", "position": 9, "isFinal": false }`

**Expected**: 201 response with created stage. Subsequent GET returns 9 stages.

---

### Step 6: Create stage with duplicate name

`POST /api/stages` with body: `{ "name": "Cold", "position": 10, "isFinal": false }`

**Expected**: 409 response with `DUPLICATE_STAGE_NAME` error code.

---

### Step 7: Create stage with duplicate position

`POST /api/stages` with body: `{ "name": "New Stage", "position": 1, "isFinal": false }`

**Expected**: 409 response with `DUPLICATE_STAGE_POSITION` error code.

---

### Step 8: Create final stage with valid final_type

`POST /api/stages` with body: `{ "name": "Abandoned", "position": 10, "isFinal": true, "finalType": "lost" }`

**Expected**: 201 response with `isFinal=true` and `finalType="lost"`.

---

### Step 9: Create final stage without final_type

`POST /api/stages` with body: `{ "name": "Bad Stage", "position": 11, "isFinal": true }`

**Expected**: 400 response with `INVALID_FINAL_TYPE` error code.

---

### Step 10: Create non-final stage with final_type

`POST /api/stages` with body: `{ "name": "Bad Stage 2", "position": 11, "isFinal": false, "finalType": "won" }`

**Expected**: 400 response with validation error.

---

### Step 11: Update a stage

`PUT /api/stages/[id]` with body: `{ "name": "Updated Cold" }`

**Expected**: 200 response with updated name.

---

### Step 12: Update stage — clear final_type automatically

`PUT /api/stages/[won-stage-id]` with body: `{ "isFinal": false }`

**Expected**: 200 response with `isFinal=false` and `finalType=null`.

---

### Step 13: Update non-existent stage

`PUT /api/stages/nonexistent-id` with body: `{ "name": "Ghost" }`

**Expected**: 404 response with `STAGE_NOT_FOUND` error code.

---

### Step 14: Delete a stage (no deals associated)

`DELETE /api/stages/[follow-up-id]`

**Expected**: 204 response. Subsequent GET no longer includes deleted stage.

---

### Step 15: Delete non-existent stage

`DELETE /api/stages/nonexistent-id`

**Expected**: 404 response with `STAGE_NOT_FOUND` error code.

---

## Expected Outcomes Summary

| Scenario                          | Expected Result                        |
|-----------------------------------|----------------------------------------|
| Seed creates default stages       | 8 stages with correct data             |
| Seed is idempotent                | No duplicates on re-run                |
| Authenticated list                | 200, ordered by position               |
| Unauthenticated list              | 401 UNAUTHORIZED                       |
| Valid create                      | 201, stage persisted                   |
| Duplicate name create             | 409 DUPLICATE_STAGE_NAME               |
| Duplicate position create         | 409 DUPLICATE_STAGE_POSITION           |
| Final stage with valid type       | 201, isFinal + finalType correct       |
| Final stage without type          | 400 INVALID_FINAL_TYPE                 |
| Non-final with final_type         | 400 validation error                   |
| Valid update                      | 200, updated fields                    |
| Clear final on is_final=false     | 200, finalType=null automatically      |
| Update non-existent               | 404 STAGE_NOT_FOUND                    |
| Delete existing (no deals)        | 204 no content                         |
| Delete non-existent               | 404 STAGE_NOT_FOUND                    |
