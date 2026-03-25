---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Include test tasks whenever the feature changes protected flows, state
transitions, persistence side effects, or API contracts.

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

- [ ] T001 Create or confirm project structure per implementation plan
- [ ] T002 Install or confirm required dependencies
- [ ] T003 [P] Configure linting, formatting, and test commands

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can
be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Setup database schema and migrations framework in `prisma/`
- [ ] T005 [P] Implement authentication and authorization foundation
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities shared by multiple stories
- [ ] T008 Configure standardized error handling and logging infrastructure
- [ ] T009 Setup environment configuration management
- [ ] T010 Define centralized Zod validation schemas for protected inputs
- [ ] T011 Define API response and error envelope conventions
- [ ] T012 Model ownership enforcement and `owner_id` scoping rules
- [ ] T013 Identify required transactional mutations and audit side effects

**Checkpoint**: Foundation ready; user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1

- [ ] T014 [P] [US1] Contract test for [endpoint]
- [ ] T015 [P] [US1] Integration test for [user journey]
- [ ] T016 [P] [US1] Ownership/auth test for [protected flow]
- [ ] T017 [P] [US1] Audit or persistence side-effect test for [mutation]

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create or update [Entity1] model in [exact file path]
- [ ] T019 [P] [US1] Create or update [Entity2] model in [exact file path]
- [ ] T020 [US1] Implement [Service] in [exact file path]
- [ ] T021 [US1] Implement [endpoint/feature] in [exact file path]
- [ ] T022 [US1] Add backend validation and standardized error handling
- [ ] T023 [US1] Add audit/history persistence and transactional safeguards

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T024 [P] [US2] Contract test for [endpoint]
- [ ] T025 [P] [US2] Integration test for [user journey]
- [ ] T026 [P] [US2] Ownership/auth test for [protected flow]

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create or update [Entity] model in [exact file path]
- [ ] T028 [US2] Implement [Service] in [exact file path]
- [ ] T029 [US2] Implement [endpoint/feature] in [exact file path]
- [ ] T030 [US2] Integrate with User Story 1 components if needed

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T031 [P] [US3] Contract test for [endpoint]
- [ ] T032 [P] [US3] Integration test for [user journey]
- [ ] T033 [P] [US3] Transaction or audit test for [mutation]

### Implementation for User Story 3

- [ ] T034 [P] [US3] Create or update [Entity] model in [exact file path]
- [ ] T035 [US3] Implement [Service] in [exact file path]
- [ ] T036 [US3] Implement [endpoint/feature] in [exact file path]

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates
- [ ] TXXX API contract review and error response consistency pass
- [ ] TXXX Ownership and auth regression pass
- [ ] TXXX Audit trail and persistence verification pass
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX Additional unit tests if requested
- [ ] TXXX Run quickstart validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on setup completion and blocks all stories
- **User Stories (Phase 3+)**: Depend on foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after foundational phase completion
- **User Story 2 (P2)**: Can start after foundational phase completion
- **User Story 3 (P3)**: Can start after foundational phase completion

### Within Each User Story

- Tests for protected or stateful behavior SHOULD be written before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Auth, ownership, validation, and audit side effects MUST be covered for every
  protected mutation
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel
- Once foundational work completes, different user stories can proceed in parallel
- Tests within a story marked [P] can run in parallel
- Model updates within a story marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate User Story 1 independently
5. Deploy or demo if ready

### Incremental Delivery

1. Complete setup and foundational work
2. Add User Story 1 and validate it independently
3. Add User Story 2 and validate it independently
4. Add User Story 3 and validate it independently
5. Ensure each story adds value without breaking previous ones

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Each user story should remain independently completable and testable
- Name exact files for auth, validation, history, and transactional boundaries
- Avoid vague tasks and cross-story dependencies that break independence
