# 2026-08-10 — Foundations & authentication (ticket 01)

## Files created

**Monorepo / scaffold**
- `package.json` (root) — npm workspaces (`apps/*`, `packages/*`), scripts, `postinstall` builds shared.
- `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `README.md`
- `.github/workflows/ci.yml` — CI scaffold (lint, typecheck, unit+integration tests, build).
- `AGENTS.md` — workflow, verification commands, docs-update convention.
- `docker-compose.yml` — postgres:18-alpine (5435) + redis:7-alpine (6379).
- `apps/api/.env.example`, `apps/web/.env.example`, root `.env.example`

**packages/shared** (`@marketplace/shared`)
- `src/errors.ts` — `ApiErrorCode`, `ApiErrorBody`
- `src/api.ts` — `ApiSuccess<T>`, `ApiFailure`, `ApiResponse<T>`, `Paginated<T>`
- `src/roles.ts` — `USER_ROLES`, `USER_STATUSES`, role/status types
- `src/user.ts` — `PublicUser`
- `src/auth/schemas.ts` — zod schemas + shared regexes (register/login/verify/reset/change/update)
- `src/i18n/translate.ts` — `translate`, `translateOr`, `registerLocale` (Amharic-ready)
- `src/i18n/messages/en.json` — full English catalog
- `test/translate.test.ts`, `test/schemas.test.ts`

**apps/api** (`@marketplace/api`)
- `src/config/env.ts` (zod-validated env), `src/logger.ts` (pino)
- `src/db/schema.ts` (users/sessions/verification_tokens + enums), `client.ts`, `migrate.ts`, `seed.ts`
- `src/lib/errors.ts` (AppError + factories), `http.ts` (sendSuccess), `password.ts` (argon2id), `tokens.ts` (jose JWT + opaque tokens + 6-digit codes)
- `src/middleware/`: `requestLog`, `errorHandler`, `validate`, `rateLimit` (Redis, memory fallback), `auth` (requireAuth/requireRole)
- `src/providers/messages/` — types, console (dev), recording (test), index factory
- `src/modules/`: `users`, `auth` (controller→service→repository), `admin`, `health`
- `src/app.ts`, `src/index.ts`
- `test/`: global-setup (creates marketplace_test), setup-env, helpers, unit (password/tokens), integration (auth flow / rate limit)
- `drizzle/0000_condemned_morgan_stark.sql` — generated + applied migration

**apps/web** (`@marketplace/web`, Next.js 15)
- `src/middleware.ts` — route protection (jwtVerify on cookie) + admin gating
- `src/lib/api.ts` — fetch client with single-flight refresh-on-401
- `src/lib/i18n.tsx` — client i18n provider
- `src/lib/user.ts` — `useMe` hook
- Pages: `/`, `/login`, `/register`, `/verify-email`, `/verify-phone`, `/forgot-password`, `/reset-password`, `/account` (protected), `/admin` (ADMIN-only)
- `src/components/` — shared UI + all auth forms (i18n keys only, no hard-coded strings)

## Changes made during the session

- Drizzle-kit (CJS) cannot import ESM `@marketplace/shared`; user enums were inlined into `apps/api/src/db/schema.ts` (keep in sync manually).
- postgres:18 image requires the volume mount at `/var/lib/postgresql` (not `/data`); compose + existing volume recreated.
- ioredis must be imported as a named export (`import { Redis } from "ioredis"`); `rate-limit-redis` store client cast for typing.
- `LOG_LEVEL` enum includes `"silent"` for test runs; `RATE_LIMIT_ENABLED=false` in tests.
- Express 5: `req.query`/`req.params` are getter-only → `validate()` attaches parsed input to `req.validated` (`{body,query,params}`); only `req.body` is overwritten.
- `requireAuth` validates the session record (revoked/expired/ownership) in addition to the JWT, so revocations take effect immediately (fixed the two failing "sessions" integration tests).
- `optionalContact` zod schema rejects explicit `null`; extended preprocess to treat `null` as absent (found via live register smoke test through the web proxy).
- ESLint flat configs were written as `.mjs` but used TypeScript syntax (`import type { Linter }`) — Node couldn't parse them; rewrote without type annotations.
- Removed unused `// eslint-disable-next-line no-console` directives; `_`-prefixed args allowed via `no-unused-vars` options.
- Debug script `debug-verify.mjs` created then deleted.
- A stale dev server from the unrelated `e-commerce` project was holding port 4000 and answering `/health` at the wrong path; killed that one process so the marketplace API could bind :4000.

## Verification results (2026-08-10)

- `npm run lint` — clean (api, web, shared)
- `npm run typecheck` — clean (all workspaces)
- `npm test` — 43 tests passing (API 28, shared 15)
- `npm run build` — shared, API, web all build; Next compiles 12/12 pages
- `npm run db:seed` — admin@marketplace.et / admin12345, demo@marketplace.et / demo12345
- Live smoke test via web proxy (:3001 → :4000): register (email-only, null contact) → verify email → login → `/admin` redirects USER → `/account` 200 → logout → `/me` 401
