# Implementation Plan: Autenticacao com Clerk

**Branch**: `001-clerk-auth` | **Date**: 2026-03-24 | **Spec**: [spec.md](c:/Users/Ferdinand/Desktop/Projetos/pipeline-vendas/specs/001-clerk-auth/spec.md)
**Input**: Feature specification from `/specs/001-clerk-auth/spec.md`

**Note**: This plan defines the technical shape of the authentication layer only.
It does not expand scope beyond the approved specification.

## Summary

This feature establishes the product authentication foundation using Clerk as the
only identity provider and an internal `users` record as the domain anchor for
future ownership. The technical approach centers on protected-first route
enforcement, backend-only identity resolution, mandatory user synchronization
before domain operations, and standardized unauthorized responses for protected
web and API access.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js App Router, Clerk, Prisma, Zod
**Storage**: PostgreSQL via Prisma
**Testing**: Integration tests for protected navigation and user sync, contract
tests for protected route behavior
**Target Platform**: Modern web browsers with server-rendered Next.js routes
**Project Type**: Next.js web application
**Performance Goals**: Protected pages should resolve access state in a single
request flow without extra client-side auth bootstrap
**Constraints**: Backend-only auth decisions, mandatory user sync before domain
operations, canonical external identity via `clerk_user_id`, standardized 401
handling for unauthenticated requests
**Scale/Scope**: Single-product authenticated workspace for internal sales
operations, starting with foundational user access and identity persistence

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

**Gate Result (pre-design)**: PASS

The plan keeps all critical auth decisions on the backend, defines mandatory user
sync before domain access, and formalizes protected route and API behavior without
delegating authority to the frontend.

## Project Structure

### Documentation (this feature)

```text
specs/001-clerk-auth/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- authentication-contract.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- (public)/
|-- (private)/
|-- api/
|   `-- [protected handlers]
components/
|-- auth/
|-- ui/
lib/
|-- auth/
|   |-- session-context.ts
|   |-- sync-user.ts
|   `-- require-auth.ts
|-- db/
|-- validation/
prisma/
tests/
|-- contract/
|-- integration/
`-- unit/
```

**Structure Decision**: Use route groups to define public versus private surfaces,
central auth utilities in `lib/auth/` for backend-only identity resolution, and
protected route handlers under `app/api/` for server-enforced access. This keeps
Clerk session access, user synchronization, and domain user lookup isolated from
UI concerns while matching the App Router architecture required by the project.

## Domain Alignment

- **System Classification**: Auditable sales operating system / state machine,
  never a generic CRM.
- **Affected Modules**: Module 0 Auth, Module 4 API, Module 5 UI.
- **State Transitions**: This feature does not introduce deal or stage state
  transitions. Its only write-side effect is ensuring that the authenticated user
  has a corresponding internal `users` record before domain operations proceed.
- **Ownership Model**: Clerk supplies the external identity, `clerk_user_id`
  maps to a single internal `users.id`, and future ownership checks will use that
  domain user identifier rather than frontend-provided identity data.
- **Skills Used**: `speckit-plan`, `clerk-nextjs-patterns`,
  `next-best-practices`.

## Architecture Decisions

### Identity Source

Clerk is the sole identity authority. The backend resolves the authenticated
session and treats `clerk_user_id` as the canonical external reference. No route,
server action, or protected read path may trust identity values supplied by the
client.

### Internal User Boundary

The domain model uses `users.id` as the stable internal key for relations and
future ownership. `clerk_user_id` exists only as the bridge between auth context
and the domain record. This prevents Clerk-specific identifiers from leaking into
future business relationships.

### Route Protection Strategy

The product behaves like a protected-first internal tool. Public routes are
explicitly allowlisted and all other application surfaces require a valid session.
Route protection is centralized at the framework boundary and complemented by
server-side checks inside protected handlers.

### Backend Auth Resolution Pattern

Authoritative auth checks happen in server boundaries only. Server Components,
Route Handlers, and any server-side mutation entrypoint use `await auth()` to
resolve session state. Client hooks may render UI state, but they do not decide
authorization or domain access.

### Mandatory User Synchronization

After successful authentication, the application resolves the internal user by
`clerk_user_id`. If the internal user does not exist, the backend creates the
minimum valid record. If synchronization fails, the protected request fails
explicitly and domain logic does not continue.

### Error Contract

Protected API requests return `401 Unauthorized` when no valid session exists.
`403 Forbidden` is reserved for future authenticated permission denials, such as
ownership or role checks, and is not used for anonymous access failures.

## Research Summary

- Use a protected-first middleware strategy because the product is an internal,
  authenticated workspace rather than a public marketing surface.
- Use `await auth()` in all server-side auth boundaries; never rely on client
  hooks for authoritative auth checks.
- Prefer server-resolved data access for protected reads and keep auth-sensitive
  mutations in server-side entrypoints, aligning with App Router data patterns.
- Standardize unauthenticated API failures as `401` and keep `403` available for
  later authorization rules.

## Design Outputs

### Internal Flows

1. Private page request enters the route protection boundary.
2. If no valid session exists, the request is redirected to sign-in before any
   private content or domain query is resolved.
3. If a valid session exists, the backend resolves `clerk_user_id` and ensures the
   internal user exists.
4. Protected page or API logic receives the resolved domain user context and
   proceeds safely.

### Required Components

- **Auth edge boundary**: framework-level protection for public/private route
  separation.
- **Session resolution utility**: central backend helper that reads Clerk session
  state and returns authenticated identity details.
- **User sync service**: idempotent backend service that finds or creates the
  internal user by `clerk_user_id`.
- **Authenticated domain context**: backend abstraction that packages Clerk
  identity plus the internal user record for downstream domain operations.
- **Protected API response contract**: consistent unauthorized response shape for
  server endpoints that require authentication.

### Validation and Data Boundaries

Zod validation remains required for route inputs, even on protected endpoints.
Authentication proves identity, but payload validation remains a separate backend
responsibility. Auth context and domain input validation therefore stay distinct.

## Post-Design Constitution Check

**Gate Result (post-design)**: PASS

- Backend remains the single source of truth for route access and identity.
- User synchronization is mandatory and explicit before protected domain work.
- API behavior distinguishes unauthenticated access from future authorization
  failures.
- The design prepares `owner_id`-based domain ownership without leaking frontend
  identity into protected operations.

## Risks and Mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Duplicate internal users | Breaks future ownership and audit consistency | Enforce unique lookup and creation by `clerk_user_id` |
| Frontend-led auth decisions | Would violate constitution and allow inconsistent access | Keep all auth enforcement in middleware/proxy and backend utilities |
| Silent sync failures | Creates authenticated sessions without a usable domain user | Fail protected access explicitly if sync cannot establish the internal user |
| Mixed auth and domain identifiers | Makes future ownership rules brittle | Use Clerk only for external identity and `users.id` for domain relationships |
| Inconsistent API denial semantics | Makes clients and future modules harder to reason about | Reserve `401` for unauthenticated requests and `403` for future permission denials |

## Complexity Tracking

No constitutional violations or exceptional complexity justifications were
identified for this feature.
