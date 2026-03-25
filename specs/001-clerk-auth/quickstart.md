# Quickstart: Autenticacao com Clerk

## Goal

Validate the planned authentication architecture end to end without moving into
task decomposition.

## Preconditions

- Install dependencies from `package.json`
- Clerk application keys are configured for the project environment
- Database connectivity is available through `DATABASE_URL`
- The `users` table includes the fields required by this feature
- Prisma client and database schema are generated and applied

## Validation Flow

1. Install dependencies and generate Prisma client.
2. Start the application with Clerk configured.
3. Access `/pipeline` while signed out.
4. Confirm the request is redirected to the sign-in flow before private content is
   shown.
5. Complete sign-in with a user that does not yet exist in the internal `users`
   table.
6. Confirm the application creates the internal user record and allows access to
   the private area.
7. Call `GET /api/me` with the authenticated session and confirm the response
   includes both Clerk identity and the internal user.
8. Sign out and sign in again with the same account.
9. Confirm the application reuses the same internal user record rather than
   creating a duplicate.
10. Call `GET /api/me` without a valid session.
11. Confirm the endpoint returns a standardized `401` response.

## Expected Outcomes

- Anonymous access does not reach private application content
- Authenticated access resolves a stable internal user
- First login creates the internal user when necessary
- Repeated login does not duplicate users
- Protected APIs deny unauthenticated requests consistently
- `/api/me` returns backend-resolved authenticated context for valid sessions
