# Quickstart Validation: 003-deal-management

**Branch**: `003-deal-management` | **Date**: 2026-03-26

## Preconditions

- [ ] Dependencies installed (`pnpm install`)
- [ ] Clerk configured (`.env` with valid keys)
- [ ] Database accessible (`DATABASE_URL` valid)
- [ ] Prisma generated and migrated (`pnpm prisma generate && pnpm prisma db push`)
- [ ] Stages seed executed (`pnpm prisma db seed`)
- [ ] At least one authenticated user exists in the system

## Validation Steps

### Step 1: Create a deal with valid data

`POST /api/deals` with body: `{ "companyName": "Acme Corp", "stageId": "<valid-stage-id>", "icp": true }`

**Expected**: 201 response with deal having status=active, stageUpdatedAt set,
ownerId matching authenticated user, stage object embedded with id/name/position.

---

### Step 2: Create a deal without company_name

`POST /api/deals` with body: `{ "stageId": "<valid-stage-id>" }`

**Expected**: 400 response with INVALID_REQUEST and details array.

---

### Step 3: Create a deal with invalid stage_id

`POST /api/deals` with body: `{ "companyName": "Test", "stageId": "nonexistent" }`

**Expected**: 400 response with STAGE_NOT_FOUND.

---

### Step 4: Create a deal (unauthenticated)

`POST /api/deals` without session.

**Expected**: 401 response with UNAUTHORIZED.

---

### Step 5: List deals (authenticated)

`GET /api/deals` with valid session.

**Expected**: 200 response with deals array containing only the authenticated
user's deals, each with stage object embedded.

---

### Step 6: List deals (unauthenticated)

`GET /api/deals` without session.

**Expected**: 401 response with UNAUTHORIZED.

---

### Step 7: Get deal detail (own deal)

`GET /api/deals/<deal-id>` with valid session (owner of the deal).

**Expected**: 200 response with full deal data including stage object.

---

### Step 8: Get deal detail (another user's deal)

`GET /api/deals/<other-user-deal-id>` with valid session.

**Expected**: 404 response with DEAL_NOT_FOUND (not 403).

---

### Step 9: Get deal detail (non-existent)

`GET /api/deals/nonexistent-id` with valid session.

**Expected**: 404 response with DEAL_NOT_FOUND.

---

### Step 10: Edit deal (valid update)

`PUT /api/deals/<deal-id>` with body: `{ "companyName": "Updated Corp" }`

**Expected**: 200 response with updated companyName. Other fields unchanged.

---

### Step 11: Edit deal (attempt to change stage_id)

`PUT /api/deals/<deal-id>` with body: `{ "stageId": "<other-stage-id>" }`

**Expected**: 200 response but stageId remains unchanged (field ignored by Zod).

---

### Step 12: Edit deal (another user's deal)

`PUT /api/deals/<other-user-deal-id>` with body: `{ "companyName": "Hack" }`

**Expected**: 404 response with DEAL_NOT_FOUND.

---

### Step 13: Edit deal (non-existent)

`PUT /api/deals/nonexistent-id` with body: `{ "companyName": "Ghost" }`

**Expected**: 404 response with DEAL_NOT_FOUND.

---

### Step 14: Edit deal (unauthenticated)

`PUT /api/deals/<deal-id>` without session.

**Expected**: 401 response with UNAUTHORIZED.

---

### Step 15: Verify deal has lastTouchAt=null

Inspect any created deal.

**Expected**: lastTouchAt is null (not managed by this feature).

---

## Expected Outcomes Summary

| Scenario                           | Expected Result                       |
|------------------------------------|---------------------------------------|
| Valid create                       | 201, deal with active + stage embed   |
| Create without company_name        | 400 INVALID_REQUEST                   |
| Create with invalid stage_id       | 400 STAGE_NOT_FOUND                   |
| Create unauthenticated             | 401 UNAUTHORIZED                      |
| Authenticated list                 | 200, only user's deals                |
| Unauthenticated list               | 401 UNAUTHORIZED                      |
| Own deal detail                    | 200, full deal with stage             |
| Other user's deal detail           | 404 DEAL_NOT_FOUND                    |
| Non-existent deal detail           | 404 DEAL_NOT_FOUND                    |
| Valid edit                         | 200, updated fields                   |
| Edit stage_id (protected)          | 200, stageId unchanged (ignored)      |
| Edit other user's deal             | 404 DEAL_NOT_FOUND                    |
| Edit non-existent deal             | 404 DEAL_NOT_FOUND                    |
| Edit unauthenticated               | 401 UNAUTHORIZED                      |
| lastTouchAt on new deal            | null                                  |
