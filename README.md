# Marketplace

Classified marketplace + optional e-commerce platform for buying and selling phones, tablets, and laptops in Ethiopia. See [`plan.md`](../plan.md) for the full phased plan and the [issue tracker](.scratch/marketplace/issues) for tickets.

## Stack

- **Web:** Next.js (App Router) / React / TypeScript
- **API:** Node.js (Express) — controller → service → repository
- **DB:** PostgreSQL via Drizzle ORM
- **Cache/queues:** Redis (rate limiting today; BullMQ later)
- **Testing:** Vitest + Supertest
- **CI:** GitHub Actions (lint, typecheck, test, build)

## Getting started

Prerequisites: Node 20+, Docker.

```bash
npm install                      # installs workspaces, builds @marketplace/shared
docker compose up -d             # postgres + redis
cp .env.example apps/api/.env
cp .env.example apps/web/.env
npm run db:migrate               # apply schema
npm run db:seed                  # create dev admin + demo user (optional)
npm run dev                      # web on :3000, api on :4000
```

Dev quick-start of both apps:

```bash
npm run dev:api
npm run dev:web                  # proxies /api/* to the API server
```

## Structure

```
apps/web      Next.js frontend (i18n-ready, no hard-coded user strings)
apps/api      Express API (controller -> service -> repository)
packages/shared  shared zod schemas, API response types, error codes
```

## API conventions

- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "details?" } }`
- Errors use stable codes (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, ...).
- Auth via httpOnly cookies: short-lived access token + rotating refresh token; refresh tokens stored hashed in `sessions`.

## Tests

```bash
npm test                 # all workspaces
npm run test:unit        # unit tests
npm run test:integration # API integration tests (needs postgres+redis up)
```

## Integration points

External services are kept behind provider abstractions with clearly marked
integration points — never faked:

- `apps/api/src/providers/messages` — email/SMS delivery (`console` for dev, `recording` for tests; wire Resend/SMTP + an SMS gateway here).
- `apps/api/src/providers/` — object storage lands with ticket 02.
- Payment providers land with ticket 28.
