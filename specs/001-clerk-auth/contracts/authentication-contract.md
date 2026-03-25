# Authentication Contract

## Purpose

Define the technical contract for protected access and user synchronization in the
authentication foundation feature.

## Contract 1: Protected page access

### Input

- Request to a private application route

### Preconditions

- The route is not part of the public allowlist
- Public allowlist for this feature:
  - `/`
  - `/sign-in`
  - `/sign-up`

### Expected behavior

- If no valid session exists, the request is redirected to the sign-in flow before
  private content is rendered
- If a valid session exists, the backend resolves the authenticated identity and
  continues toward user synchronization

### Implemented boundary

- Framework boundary: `proxy.ts`
- Private layout gate: `app/(private)/layout.tsx`
- Example protected page: `app/(private)/pipeline/page.tsx`

## Contract 2: Protected API access

### Input

- Request to a protected Route Handler
- Current protected example endpoint: `GET /api/me`

### Expected behavior

- If no valid session exists, the handler returns a standardized unauthorized
  response with HTTP `401`
- If a valid session exists, the handler resolves the internal user context before
  continuing with domain logic
- If the authenticated identity cannot be synchronized to an internal user, the
  handler fails explicitly and does not execute domain behavior

### Response envelope

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required for this resource."
  }
}
```

## Contract 3: User synchronization service

### Input

- Backend-authenticated identity containing at least:
  - `clerk_user_id`
  - email
  - name

### Expected behavior

- Find an existing internal user by `clerk_user_id`
- Create the minimum required internal user record if none exists
- Return the internal user record for downstream protected operations
- Never create duplicate users for the same `clerk_user_id`

### Failure behavior

- If identity data is missing or invalid, synchronization fails explicitly
- If persistence fails, the protected request fails and no domain logic continues

## Contract 4: Backend authenticated context

### Output shape

- `clerkUserId`: canonical external identifier from Clerk
- `isAuthenticated`: backend confirmation that the session is valid
- `sessionStatus`: session lifecycle state when available
- `user`: internal `users` record resolved or created before domain logic

### Rules

- This context is resolved only in server-side code
- Frontend-provided identity values are never accepted as authoritative input
- Protected routes and handlers depend on this context before touching domain data
