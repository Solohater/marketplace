# 2026-08-11 — Media & image storage (ticket 02)

## Files created

**packages/shared** (`@marketplace/shared`)
- `src/media/schemas.ts` — `MEDIA_PURPOSES`, `ALLOWED_IMAGE_MIME_TYPES`, `MAX_IMAGES_PER_BATCH`, `MAX_IMAGE_FILE_MB`, `MAX_IMAGE_FILE_BYTES`, `presignMediaSchema`, `confirmMediaSchema`, `listMediaQuerySchema`, `MediaItem` interface, error codes (`MEDIA_INVALID_TYPE`, `MEDIA_FILE_TOO_LARGE`, `MEDIA_INVALID_DIMENSIONS`, `MEDIA_PROCESSING_FAILED`, `MEDIA_BATCH_LIMIT`, `MEDIA_NOT_FOUND`, `MEDIA_UPLOAD_EXPIRED`)

**apps/api** (`@marketplace/api`)
- `src/providers/storage/types.ts` — `StorageProvider` interface, `PutObjectInput`, `PresignUploadInput`
- `src/providers/storage/local.ts` — `LocalStorageProvider` (fs-backed, HMAC-signed presigned upload URLs, public raw URLs, safeJoin, timingSafeEqual verify)
- `src/providers/storage/s3.ts` — `S3StorageProvider` (S3/R2/MinIO, lazy CreateBucket, getSignedUrl, forcePathStyle, path-style public URLs for MinIO)
- `src/providers/storage/index.ts` — factory by `STORAGE_PROVIDER` env, singleton
- `src/lib/image.ts` — `inspectImage`, `mimeToFormat`, `extensionForFormat`, `compressToWebp`, `makeThumbnail` (sharp-based)
- `src/modules/media/media.repository.ts` — insert, findById, listByOwner (paginated + count), deleteById
- `src/modules/media/media.serializer.ts` — `toMediaItem` (Media → shared MediaItem)
- `src/modules/media/media.service.ts` — `parseMediaKey`, `thumbnailKeyFor`, `buildKey`, `presign`, `confirm`, `remove`, `MediaService` class, `mediaService` singleton
- `src/modules/media/media.controller.ts` — presign, confirm, list, remove
- `src/modules/media/media.routes.ts` — all requireAuth; POST `/presign` (rate-limited 30/min), POST `/confirm`, GET `/`, DELETE `/:id`
- `src/modules/media/local-media.routes.ts` — PUT `/upload/:key` (HMAC+expiry+size enforcement+streaming), GET `/raw/:key` (sniff magic bytes for content-type, immutable cache)
- `drizzle/0001_brave_power_pack.sql` — media table + mediaPurposeEnum migration (generated + applied)

**apps/web** (`@marketplace/web`)
- `src/components/lazy-image.tsx` — `LazyImage` (lazy decode, blur placeholder, crossfade on load)
- `src/components/media-upload.tsx` — `MediaUpload` (drag-and-drop, file validation, presign→PUT→confirm flow, preview grid)
- `src/components/media-library.tsx` — `MediaLibraryPage` (list existing media, delete, pagination)
- `src/app/account/media/page.tsx` — `/account/media` route

## Changes made during the session

- Added `mediaPurposeEnum` and `media` pgTable to `apps/api/src/db/schema.ts` (enums inlined per Drizzle CJS constraint).
- Added `MEDIA_*` error codes to `packages/shared/src/errors.ts` and API error factories to `apps/api/src/lib/errors.ts`.
- Exported `src/media/schemas` from `packages/shared/src/index.ts`.
- Added media-related env vars to `apps/api/src/config/env.ts`: `STORAGE_PROVIDER`, `STORAGE_SIGNING_SECRET`, `PRESIGN_TTL_SECONDS`, `LOCAL_STORAGE_BASE_DIR`, `LOCAL_STORAGE_PUBLIC_BASE_URL`, `MAX_IMAGE_FILE_MB`, `IMAGE_MAX_DIMENSION`, `THUMBNAIL_SIZE`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_BASE_URL`.
- `app.ts`: mounted `localMediaRouter` then `mediaRouter` at `/api/media` (local first — before auth'd router so upload/raw stay public).
- `local-media.routes.ts`: Express 5 param typing — extracted `param()` helper for safe `req.params[name]` access; sniff magic bytes (JPEG/PNG/WEBP) instead of extension for content-type (fixes confirm-overwriting-PNG-with-webp bug).
- `media.service.ts`: `parseMediaKey` guards `ownerId` and `file` for `noUncheckedIndexedAccess`; `createStorageProvider` imported for singleton.
- `media.repository.ts`: guard `insert().returning()` array element for `noUncheckedIndexedAccess`.
- `media.controller.ts`: safe param extraction for `remove`, guard against empty id.
- `s3.ts`: `getPublicUrl` uses endpoint+path-style for MinIO (not AWS-style URL).
- `docker-compose.yml`: added MinIO service (minio/minio, port 9000/9001, healthcheck).
- `apps/api/.env.example`: added storage + image processing env vars.
- `.gitignore`: added `storage/`.
- `packages/shared/src/i18n/messages/en.json`: added `media.*` keys (upload, limits, library, delete, errors) and `nav.media`.
- Account page: added "Media" link in page-head actions group.
- Tests: `test/setup-env.ts` (storage env), `test/helpers.ts` (truncateAll includes media), `test/unit/image.test.ts` (inspect/compress/thumbnail), `test/integration/media.test.ts` (full presign→upload→confirm→list→delete flow, validation, auth, pagination, error cases).

## Verification results (2026-08-11)

- `npm run lint` — clean (api, web, shared; 2 Next.js img warnings only)
- `npm run typecheck` — clean (all workspaces)
- `npm test` — 61 tests passing (API 46, shared 15)
- `npm run build` — shared, API, web all build; Next compiles 13/13 pages
- Live smoke test: skipped (DB port 5435 not available outside test harness); integration tests cover the full media API flow end-to-end
