---

description: "Task list template for feature implementation"
---

# Tasks: Autenticacao com Clerk

**Input**: Design documents from `/specs/001-clerk-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Include test tasks because this feature changes protected flows, user
synchronization side effects, and API auth contracts.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js app**: `app/`, `components/`, `lib/`, `prisma/`, `tests/`
- Adjust paths to the structure defined in `plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline structure

- [X] T001 Confirm Clerk, Prisma, and auth-related package entries in `package.json`
- [X] T002 Define required Clerk and database environment variables in `.env.example`
- [X] T003 [P] Create auth feature folders in `app/(public)/`, `app/(private)/`, `lib/auth/`, and `tests/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can
be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Update the user schema and uniqueness rule for `clerk_user_id` in `prisma/schema.prisma`
- [X] T005 [P] Create the auth environment loader and validation contract in `lib/validation/env.ts`
- [X] T006 [P] Define the protected/public route matcher strategy in `proxy.ts`
- [X] T007 Create the internal authenticated context types in `lib/auth/session-context.ts`
- [X] T008 Create the user synchronization service contract in `lib/auth/sync-user.ts`
- [X] T009 Create the server-side auth guard entrypoint in `lib/auth/require-auth.ts`
- [X] T010 Define the standardized unauthorized error envelope in `lib/validation/api-error.ts`
- [X] T011 Define protected route input validation helpers in `lib/validation/authenticated-route.ts`
- [X] T012 Document the public/private route boundary and protected API scope in `specs/001-clerk-auth/contracts/authentication-contract.md`

**Checkpoint**: Foundation ready; user story implementation can now begin

---

## Phase 3: User Story 1 - Entrar no sistema com seguranca (Priority: P1)

**Goal**: Prevent anonymous access to private application areas and force valid
authentication before protected content is rendered

**Independent Test**: Access a private page while signed out and confirm the
request is redirected to sign-in before private UI or data is exposed

### Tests for User Story 1

- [X] T013 [P] [US1] Add a contract test for unauthorized private API access in `tests/contract/auth/unauthorized-route-contract.test.ts`
- [X] T014 [P] [US1] Add an integration test for private page redirect behavior in `tests/integration/auth/private-route-redirect.test.ts`
- [X] T015 [P] [US1] Add an integration test for authenticated return to a private route in `tests/integration/auth/private-route-return.test.ts`

### Implementation for User Story 1

- [X] T016 [US1] Implement the Clerk route protection boundary in `proxy.ts`
- [X] T017 [US1] Create the private route layout auth gate in `app/(private)/layout.tsx`
- [X] T018 [US1] Create the public auth entry surface in `app/(public)/sign-in/[[...sign-in]]/page.tsx`
- [X] T019 [US1] Add protected route unauthorized handling for Route Handlers in `lib/auth/require-auth.ts`
- [X] T020 [US1] Wire the unauthorized API response envelope into `lib/validation/api-error.ts`

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - Ter identidade persistida no sistema (Priority: P1)

**Goal**: Ensure every authenticated user has a stable internal `users` record
before domain operations proceed

**Independent Test**: Sign in with a new account and verify that the internal
user record is created once, then reused on later access

### Tests for User Story 2

- [X] T021 [P] [US2] Add a contract test for the user sync service expectations in `tests/contract/auth/user-sync-contract.test.ts`
- [X] T022 [P] [US2] Add an integration test for first-login user creation in `tests/integration/auth/first-login-sync.test.ts`
- [X] T023 [P] [US2] Add an integration test for existing-user reuse in `tests/integration/auth/existing-user-reuse.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Implement the `users` persistence mapping for auth fields in `prisma/schema.prisma`
- [X] T025 [US2] Implement the idempotent user synchronization service in `lib/auth/sync-user.ts`
- [X] T026 [US2] Implement the server-side authenticated context resolver in `lib/auth/session-context.ts`
- [X] T027 [US2] Integrate first-access synchronization into the private app entry boundary in `app/(private)/layout.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Executar operacoes protegidas com contexto valido (Priority: P2)

**Goal**: Allow protected backend operations to proceed only with a valid Clerk
session and resolved internal domain user

**Independent Test**: Call a protected backend operation with and without a valid
session and confirm only the authenticated request continues with domain context

### Tests for User Story 3

- [X] T028 [P] [US3] Add a contract test for the authenticated context shape in `tests/contract/auth/authenticated-context-contract.test.ts`
- [X] T029 [P] [US3] Add an integration test for protected Route Handler access in `tests/integration/auth/protected-api-access.test.ts`
- [X] T030 [P] [US3] Add an integration test for explicit sync failure handling in `tests/integration/auth/sync-failure-blocks-domain.test.ts`

### Implementation for User Story 3

- [X] T031 [US3] Implement backend-only session resolution with Clerk in `lib/auth/require-auth.ts`
- [X] T032 [US3] Create a protected Route Handler example that uses resolved auth context in `app/api/me/route.ts`
- [X] T033 [US3] Enforce authenticated context plus validated input on protected handlers in `lib/validation/authenticated-route.ts`
- [X] T034 [US3] Add explicit sync-failure and unauthorized response handling in `lib/auth/session-context.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T035 [P] Refresh the auth validation walkthrough in `specs/001-clerk-auth/quickstart.md`
- [X] T036 Review auth decision consistency across `specs/001-clerk-auth/plan.md`, `specs/001-clerk-auth/research.md`, and `specs/001-clerk-auth/contracts/authentication-contract.md`
- [ ] T037 Run the end-to-end auth validation checklist against `specs/001-clerk-auth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on setup completion and blocks all stories
- **User Stories (Phase 3+)**: Depend on foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after foundational work and establishes protected
  route enforcement for the application
- **User Story 2 (P1)**: Depends on foundational auth contracts and builds the
  internal user sync path used by later protected operations
- **User Story 3 (P2)**: Depends on User Story 2 because protected backend
  operations require a resolved internal user context

### Within Each User Story

- Tests for protected or stateful behavior SHOULD be written before implementation
- Schema and types before services
- Services before route and layout integration
- Route and handler enforcement before validation pass
- Auth, sync, and unauthorized behavior MUST be covered before the story is complete

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005-T006 can run in parallel once setup is done
- T013-T015 can run in parallel within User Story 1
- T021-T023 can run in parallel within User Story 2
- T028-T030 can run in parallel within User Story 3

---

## Parallel Example: User Story 1

```text
Task: "T013 [US1] Add a contract test for unauthorized private API access in tests/contract/auth/unauthorized-route-contract.test.ts"
Task: "T014 [US1] Add an integration test for private page redirect behavior in tests/integration/auth/private-route-redirect.test.ts"
Task: "T015 [US1] Add an integration test for authenticated return to a private route in tests/integration/auth/private-route-return.test.ts"
```

## Parallel Example: User Story 2

```text
Task: "T021 [US2] Add a contract test for the user sync service expectations in tests/contract/auth/user-sync-contract.test.ts"
Task: "T022 [US2] Add an integration test for first-login user creation in tests/integration/auth/first-login-sync.test.ts"
Task: "T023 [US2] Add an integration test for existing-user reuse in tests/integration/auth/existing-user-reuse.test.ts"
```

## Parallel Example: User Story 3

```text
Task: "T028 [US3] Add a contract test for the authenticated context shape in tests/contract/auth/authenticated-context-contract.test.ts"
Task: "T029 [US3] Add an integration test for protected Route Handler access in tests/integration/auth/protected-api-access.test.ts"
Task: "T030 [US3] Add an integration test for explicit sync failure handling in tests/integration/auth/sync-failure-blocks-domain.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate redirect plus unauthorized behavior independently
5. Demo protected access before expanding into persistence

### Incremental Delivery

1. Complete setup and foundational work
2. Add User Story 1 and validate anonymous access blocking
3. Add User Story 2 and validate first-login sync plus duplicate prevention
4. Add User Story 3 and validate backend authenticated context handling
5. Run final quickstart validation across all protected flows

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Each user story remains independently completable and testable
- File paths follow the App Router and backend auth boundaries defined in `plan.md`
- No task depends on requirements outside the approved spec and plan
