# Foundations & authentication — reference

Reusable patterns and gotchas worth remembering across tickets.

## API response shape

All API responses use the shared shape from `@marketplace/shared`:

```ts
// success
{ "success": true, "data": { ... } }
// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

- Controllers call `sendSuccess(res, payload)` from `src/lib/http.ts`.
- Errors are raised via `AppError` factories in `src/lib/errors.ts` (e.g. `invalidCredentials()`, `validationError(details)`).
- `errorHandler` (Express error middleware, 4 args) maps `AppError` → JSON; unknown errors log and return `INTERNAL_ERROR`. Must keep all 4 parameters so Express recognizes it.

## Validation middleware (Express 5 quirk)

`req.query` and `req.params` are getter-only in Express 5 — you cannot write back onto them.

```ts
req.validated = { ...req.validated, [source]: result.data };
if (source === "body") req.body = result.data; // body still safe to replace
```

Handlers read `req.validated.query` / `req.validated.params`; `req.body` stays the idiomatic accessor. Declare `validated` on `types/express.d.ts`.

## Auth token model

- **access_token** cookie: JWT (jose), 15 min, `path=/`, signed with `JWT_ACCESS_SECRET`. Carries `sid`, `sub`, `role`, `type:"access"`.
- **refresh_token** cookie: 30 days, `path=/api/auth` (only sent to auth endpoints). Stores an opaque hash; server keeps a `sessions` row.
- Refresh rotates the refresh token (old one deleted, new one issued), so stolen tokens die on next use.
- `requireAuth` verifies the JWT AND checks the session row (revoked? expired? belongs to this user?). This makes revoke/logout take effect immediately.
- Logout deletes the session row and clears both cookies → `/me` returns 401 right away.

## Rate limiting

- `rate-limit-redis` store with in-memory fallback when Redis is down.
- `import { Redis } from "ioredis"` (named import required).
- The shared limit key is per-IP + per-route-prefix (auth/verify/otp). Tightest limits on verify/resend OTP endpoints.

## Password hashing

- argon2id via `@node-rs/argon2` (`lib/password.ts`), salt auto-generated.
- Password policy lives in shared `schemas.ts`: min 8 / max 72 chars, at least one letter and one digit (enforced by zod on the API side).

## Drizzle + monorepo gotcha

Drizzle-kit is CJS and cannot load the ESM `@marketplace/shared` package. User-role/status enums are therefore **inlined** in `apps/api/src/db/schema.ts` with a comment to keep them in sync with `packages/shared/src/roles.ts`. Remember to update both when roles/statuses change.

## Console message provider (dev)

`MESSAGE_PROVIDER=console` logs "emails" and "SMS" to the API log. During manual testing, extract verification tokens/links from `/tmp/api-dev.log`. Tests use `MESSAGE_PROVIDER=recording` (`providers/messages/recording.ts`) and read from the exported `recordingStore`.

## Web app patterns

- Next.js `rewrites` proxy `/api/:path*` → `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) — same-origin cookies, no CORS in dev.
- `src/lib/api.ts` does single-flight refresh: any 401 (outside `/api/auth/*`) triggers one POST `/api/auth/refresh`, then retries once. Refresh calls must pass `skipRetry: true`.
- Route protection is in `src/middleware.ts` (edge) — verifies the access JWT cookie, redirects unauthenticated → `/login?next=<path>`, non-admin → `/account`.
- **i18n discipline:** no hard-coded user-facing strings in components. Server components call `translate(...)` from shared; client components use the `useI18n()` provider's `t()`/`tOr()`. Error codes map to keys like `login.error.INVALID_CREDENTIALS`; `translateOr(key, fallback)` avoids rendering raw keys.
- Server pages read `searchParams` as a `Promise` (Next 15) and pass values down as props — avoids `useSearchParams` Suspense boilerplate in client forms.

## ESLint flat config in this repo

Config files are `.mjs` — **no TypeScript syntax allowed** (`import type` crashes Node's ESM loader). Use plain JS. `no-unused-vars` configured with `argsIgnorePattern: "^_"` to allow Express-style `_next` params.

## Useful commands

```
npm run db:generate | db:migrate | db:seed | db:studio   # api workspace
npm run dev:api                                          # :4000
npm run dev:web                                          # :3000
npm run lint | typecheck | test | build                  # across workspaces
```
