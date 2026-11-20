# Foundations & authentication — how it works

A walkthrough of the auth loop, file by file, matching the current implementation.

## 1. Request enters the API

`apps/api/src/index.ts` boots `createApp()` from `src/app.ts`. Middleware order matters:

```
requestLogger → express.json → cookieParser → routes → notFoundHandler → errorHandler
```

- `requestLogger` assigns a request id, logs method/url/status/duration.
- `express.json({ limit: "100kb" })` parses bodies.
- `cookieParser` exposes `req.cookies` (needed for access/refresh tokens).
- Rate limiter is initialised before the app (`initRateLimiter`) so a Redis outage falls back to memory instead of crashing boot.

## 2. Route registration

`app.ts` mounts routers under `/api/*`:

- `/api/health` — DB `select 1` health check.
- `/api/auth` — all authentication routes.
- `/api/users` — `/me` (get + update).
- `/api/admin` — ADMIN-only user list + stats.

Any unmatched route hits `notFoundHandler` → `404 NOT_FOUND` in the shared error shape.

## 3. A login request, step by step

**Route** (`modules/auth/auth.routes.ts`): `POST /api/auth/login` → `validate(loginSchema)` → `loginController`.

**Validation** (`middleware/validate.ts`): `loginSchema` (in `packages/shared/src/auth/schemas.ts`) parses `req.body`. On failure it builds a `details` array (`[{field, code, message}]`) and calls `validationError(details)` → 400 `VALIDATION_ERROR`. On success `req.body` is the parsed, trimmed payload.

**Controller** (`modules/auth/auth.controller.ts`): reads `req.body`, calls `authService.login(identifier, password)`. Success → sets two cookies via `res.cookie`:
- `access_token` — `path=/`, httpOnly, sameSite `lax`, 15 min.
- `refresh_token` — `path=/api/auth`, httpOnly, sameSite `lax`, 30 days.

Then `sendSuccess(res, { user, tokens })` (tokens returned so the web client *could* store them; the browser cookie is the primary mechanism).

**Service** (`modules/auth/auth.service.ts`): finds the user by email OR phone; `verifyPassword` (argon2id); checks status (not-verified/suspended/disabled each throw their own error code). Creates a session row + refresh token via `authRepository`, signs the access JWT. Emits nothing here — login is silent.

**Repository** (`modules/auth/auth.repository.ts`): raw Drizzle queries for users, sessions, and verification tokens.

## 4. Register + verify

`POST /api/auth/register` → `registerSchema` (at-least-one-contact refine) → `authService.register`:
1. Creates the user with `status: PENDING_VERIFICATION` (DB-level flow for email, phone, or both).
2. Generates an **email token** (opaque hash) and/or a **6-digit phone code**.
3. Sends via `createMessageProvider()` — console in dev, recording in tests, real email/SMS providers later.
4. Responds `{ user, verificationChannels: ["email"] | ["phone"] | [...] }` (or `CONFLICT` if the email/phone exists).

`GET /api/auth/verify-email?token=…` → `verifyEmail`: hashes the token, looks up `verification_tokens`, checks expiry + purpose + single-use. On success: `emailVerifiedAt = now`, `status = ACTIVE`, token consumed. Same flow for phone with a 6-digit code via `POST /api/auth/verify-phone`.

The web `/verify-email` page auto-submits the `?token=` from the link; `/verify-phone` is a small code form. Both render server messages via `translate`.

## 5. Refresh + logout

- `POST /api/auth/refresh` → `refresh` reads the refresh cookie, validates the session row, **rotates**: deletes the old refresh token, issues a new session + token, re-signs the access JWT. Old stolen tokens fail on next use because their session row is gone.
- `POST /api/auth/logout` → `logout` deletes the session row and clears both cookies. The next request finds no session → 401.

## 6. Protected routes + RBAC

- `middleware/auth.ts` exports `requireAuth` and `requireRole(...roles)`.
- `requireAuth`: verifies the access JWT (jose, `JWT_ACCESS_SECRET`), then loads the session row and rejects if revoked/expired/wrong user. Sets `req.auth = { user, session }`.
- `requireRole("ADMIN")` short-circuits unless `user.role` matches. The `/admin` router applies it to every route.
- On the web side, `src/middleware.ts` (Next edge middleware) mirrors this: verifies the access cookie, redirects logged-out users to `/login?next=…`, and non-admins away from `/admin`. Client API calls add a second line of defence: `401 → refresh → retry → redirect`.

## 7. Admin

`modules/admin/admin.routes.ts` → `adminController` (`GET /api/admin/stats`, `GET /api/admin/users`), guarded by `requireRole("ADMIN")`. Seeded admin: `admin@marketplace.et` / `admin12345`. The web `/admin` page renders stats cards + a users table.

## 8. Web app

`apps/web` is Next.js 15 with `rewrites` proxying `/api/*` to the API (same-origin cookies, no CORS). All auth forms are client components under `src/components/`, using `useI18n().t()`/`tOr()` for every string and mapping API error codes to catalog keys. Server pages (`src/app/*/page.tsx`) pull `searchParams` (Promise in Next 15) and hand values to the client forms as props.

## 9. Tests

- `test/integration/auth.test.ts` — supertest against the Express app with `MESSAGE_PROVIDER=recording`; covers register, email+phone verification, login, refresh rotation, logout, sessions (list/revoke-all/keep-current), password reset, change password, RBAC denials, and the response shape.
- `test/unit/*` — password hashing + token generation.
- `packages/shared/test/*` — translation (incl. `registerLocale`) and zod schemas (contacts, password policy, null handling).

The 43 tests all pass, lint/typecheck/build are clean, and the live register→verify→login→RBAC→logout loop was verified end-to-end against the running stack.
