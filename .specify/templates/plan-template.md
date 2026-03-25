# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: [e.g., TypeScript 5.x or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., Next.js, Prisma, Clerk, Zod or NEEDS CLARIFICATION]
**Storage**: [e.g., PostgreSQL via Prisma or N/A]
**Testing**: [e.g., Vitest, Playwright, integration tests or NEEDS CLARIFICATION]
**Target Platform**: [e.g., modern web browsers + server runtime]
**Project Type**: [e.g., Next.js web application]
**Performance Goals**: [domain-specific, measurable targets]
**Constraints**: [e.g., transactional integrity, ownership isolation, audit logging]
**Scale/Scope**: [domain-specific expected users, deals, stages, requests]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Backend is the single source of truth for all critical rules, state transitions,
  and permission checks.
- Every relevant mutation defines persistence side effects explicitly, including
  stage history and `last_touch_at` updates where applicable.
- Deal lifecycle design preserves immutable critical records; no hard-delete path
  exists for deals.
- All deal mutations that affect stage or status define transactional boundaries.
- Authentication, `owner_id` scoping, and Clerk-to-database user sync are covered.
- API contracts, validation schemas, and standardized error responses are defined.
- Required domain skills are listed for the feature, including `clerk` and
  `clerk-nextjs-patterns` when auth is in scope.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md              # This file (/speckit.plan command output)
|-- research.md          # Phase 0 output (/speckit.plan command)
|-- data-model.md        # Phase 1 output (/speckit.plan command)
|-- quickstart.md        # Phase 1 output (/speckit.plan command)
|-- contracts/           # Phase 1 output (/speckit.plan command)
`-- tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
|-- api/
|-- (routes as needed)
components/
|-- ui/
lib/
|-- auth/
|-- db/
|-- validation/
prisma/
tests/
|-- contract/
|-- integration/
`-- unit/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Domain Alignment

- **System Classification**: Auditable sales operating system / state machine,
  never a generic CRM.
- **Affected Modules**: [List which of Module 0 Auth, Module 1 Core Pipeline,
  Module 2 Tracking, Module 3 Audit, Module 4 API, Module 5 UI are in scope]
- **State Transitions**: [Document any deal/stage/status transitions and required
  persistence side effects]
- **Ownership Model**: [Document how authenticated user context and `owner_id`
  filtering are enforced]
- **Skills Used**: [List project skills required by this feature]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., non-standard workflow] | [current need] | [why constitution-aligned option was insufficient] |
