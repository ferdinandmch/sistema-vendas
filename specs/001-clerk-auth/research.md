# Research: Autenticacao com Clerk

## Decision 1: Use protected-first route enforcement

- **Decision**: Protect the application by default and allowlist only explicit
  public routes.
- **Rationale**: The Fineo product is an authenticated internal workspace, so the
  safest default is to deny anonymous access everywhere except known public entry
  points such as sign-in and sign-up.
- **Alternatives considered**:
  - Public-first middleware with explicit private route matching: rejected because
    it is easier to miss a protected surface as the application grows.

## Decision 2: Resolve auth only in server-side boundaries

- **Decision**: Use Clerk auth resolution only in server-side entrypoints, with
  `await auth()` in Server Components, Route Handlers, and other backend gates.
- **Rationale**: Clerk's Next.js guidance distinguishes server auth from client
  hooks, and the project constitution forbids frontend authority over protected
  access.
- **Alternatives considered**:
  - Client-side auth gating with hooks: rejected because it exposes private UI
    decisions to the client and does not protect backend operations.

## Decision 3: Synchronize the internal user before domain access

- **Decision**: Every authenticated request that reaches protected domain logic
  must first resolve or create the corresponding internal `users` record.
- **Rationale**: Future ownership and audit rules depend on a stable internal user
  identifier, not only the external identity provider session.
- **Alternatives considered**:
  - Lazy sync only on specific pages or mutations: rejected because it creates
    inconsistent behavior across protected surfaces.
  - Manual admin-created users: rejected because it adds friction and breaks the
    first-login flow defined in the spec.

## Decision 4: Standardize denial semantics for protected APIs

- **Decision**: Return `401` when no valid session exists and reserve `403` for
  future authenticated permission failures.
- **Rationale**: This follows the Clerk guidance for API routes and gives future
  ownership or role checks a clear semantic space.
- **Alternatives considered**:
  - Return `403` for all denied requests: rejected because it blurs the difference
    between unauthenticated access and authorized-but-forbidden access.

## Decision 5: Prefer server-resolved data patterns for protected reads

- **Decision**: Read protected data in server boundaries and use Route Handlers
  only where an HTTP interface is actually needed.
- **Rationale**: Next.js App Router best practices favor direct server reads for
  internal pages and reserve HTTP APIs for explicit interface needs.
- **Alternatives considered**:
  - Always fetch protected data through client-side API calls: rejected because it
    adds unnecessary round trips and shifts auth-sensitive behavior toward the UI.
