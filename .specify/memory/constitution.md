<!--
Sync Impact Report
- Version change: template -> 5.0.0
- Modified principles:
  - Template Principle 1 -> I. Backend as Single Source of Truth
  - Template Principle 2 -> II. Mandatory Persistence and Auditability
  - Template Principle 3 -> III. State-Oriented Sales Engine
  - Template Principle 4 -> IV. Transactional Consistency and Ownership Security
  - Template Principle 5 -> V. Contract Discipline and Centralized Validation
- Added sections:
  - Official Stack and Architecture
  - Delivery Workflow and Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - updated: .specify/templates/constitution-template.md
  - updated: .specify/templates/plan-template.md
  - updated: .specify/templates/spec-template.md
  - updated: .specify/templates/tasks-template.md
  - pending: .specify/templates/agent-file-template.md
  - pending: .specify/templates/checklist-template.md
- Follow-up TODOs:
  - None
-->
# Fineo Sales Pipeline Constitution

## Core Principles

### I. Backend as Single Source of Truth
All critical business logic, state transitions, permissions, and validations MUST
execute on the backend. Frontend code MAY guide interaction and dispatch events,
but it MUST NOT apply authoritative state mutations locally or bypass API rules.
This keeps the product deterministic, reviewable, and resistant to "CRM
desorganizado" behavior.

### II. Mandatory Persistence and Auditability
Every relevant business event MUST be persisted. Stage changes MUST always create
history records, activity creation MUST update `last_touch_at`, and critical sales
data MUST remain recoverable for audit. Deals MUST NOT be physically deleted; they
MUST be controlled through lifecycle status fields instead.

### III. State-Oriented Sales Engine
The product MUST behave as an auditable state machine. A deal represents current
state, a stage represents current position, and stage history represents the
authoritative transition log. All features, specs, and implementation plans MUST
preserve this model and MUST NOT treat the system as a generic notes-first CRM.

### IV. Transactional Consistency and Ownership Security
Mutations that alter deal state MUST be atomic. Stage movement MUST update the
deal stage, refresh `stage_updated_at`, and insert the corresponding
`stage_history` record within one transaction. All protected operations MUST
require authenticated users, every relevant entity MUST have an owner, and every
query or mutation MUST enforce `owner_id` scoping without exception.

### V. Contract Discipline and Centralized Validation
Every API contract MUST be explicit, consistent, and unambiguous. All inputs MUST
be validated in the backend through centralized Zod schemas before business logic
executes. Error payloads MUST follow a standard format, and route handlers MUST
never accept unvalidated data or silently coerce invalid state.

## Official Stack and Architecture

The official product stack is mandatory unless an amendment explicitly authorizes
an exception:

- Language: TypeScript
- Framework: Next.js with App Router
- Package manager: pnpm
- Frontend: shadcn/ui, Tailwind CSS, lucide-react, `@dnd-kit`
- Backend: Next.js Route Handlers
- Database: PostgreSQL via external `DATABASE_URL`
- ORM: Prisma as the exclusive database access layer
- Authentication: Clerk
- Validation: Zod
- Data fetching: TanStack Query when feature needs caching or async client state

Architecture MUST follow this flow:

Frontend (Next.js + shadcn/ui) -> API (Next.js Route Handlers) -> Prisma ->
PostgreSQL (`DATABASE_URL` externo) -> Clerk (Auth)

Direct database access outside Prisma is prohibited. Direct provider-specific
database SDKs are prohibited. Drag and drop interactions MUST emit events only;
all authoritative movement flows through the backend API.

## Delivery Workflow and Quality Gates

Every spec MUST include objective, context, business rules, flows, dependencies,
skills used, and validation criteria. Features MUST be organized around the
system modules defined by the domain:

- Module 0: Auth
- Module 1: Core Pipeline
- Module 2: Tracking
- Module 3: Audit
- Module 4: API
- Module 5: UI

Implementation plans and tasks MUST explicitly verify:

- backend ownership of critical rules
- authenticated access and user sync requirements
- transactional integrity for stage movement
- immutable treatment of critical deal records
- stage and activity persistence side effects
- API response and error standardization
- backend validation coverage via centralized schemas
- required skills for domain-critical work, including `clerk` and
  `clerk-nextjs-patterns`

Final validation for any feature MUST confirm domain correctness, architectural
consistency, stack adherence, security ownership rules, contract consistency, and
governance compliance with this constitution.

## Governance

This constitution overrides conflicting local habits, informal workflows, and
feature-specific shortcuts. A spec, plan, task list, or implementation is not
compliant unless it passes the constitution checks defined in the active Speckit
templates.

Amendments MUST document the affected principle or section, explain the impact on
existing specs and implementation flow, and update dependent templates in the
same change set when those templates encode constitutional guidance.

Versioning policy follows semantic versioning:

- MAJOR: removal or redefinition of a governing principle or mandatory stack rule
- MINOR: addition of a new principle, required section, workflow gate, or domain
  constraint
- PATCH: wording clarification, examples, and non-semantic refinements

Compliance review is mandatory during specification, planning, task generation,
and code review. Any justified exception MUST be captured in the relevant plan
under a dedicated constitution or complexity tracking section before implementation
starts.

**Version**: 5.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
