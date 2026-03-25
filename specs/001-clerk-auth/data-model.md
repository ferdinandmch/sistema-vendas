# Data Model: Autenticacao com Clerk

## Entity: User

**Purpose**: Represents the internal domain user that anchors ownership,
traceability, and future business relationships.

### Fields

- `id`: Internal primary key used by the product domain
- `clerk_user_id`: Canonical external identity reference; unique and required
- `email`: Primary email used for recognition and contact
- `name`: Display name stored for operator visibility
- `created_at`: Creation timestamp for auditability

### Constraints

- `clerk_user_id` must be unique
- `clerk_user_id` must be present for every internal user created from an
  authenticated session
- The user record must exist before any protected domain operation proceeds

### Relationships

- Future domain entities such as deals and activities will reference `users.id`
  for ownership rather than `clerk_user_id`

## Non-Persisted Model: Authenticated Session Context

**Purpose**: Represents the backend-resolved auth state used during a protected
request.

### Fields

- `clerkUserId`: External identity resolved from Clerk
- `isAuthenticated`: Boolean flag indicating whether the session is valid
- `sessionStatus`: Session lifecycle state when available from Clerk
- `user`: The resolved internal `User` record once synchronization completes

### Rules

- This context is resolved on the backend only
- It must not be accepted from frontend input
- It is incomplete until the internal `User` record is found or created

## Lifecycle Notes

- First authenticated access creates the internal `User` record if none exists
- Subsequent authenticated access reuses the existing `User`
- Missing or invalid authenticated context prevents protected domain logic from
  executing
