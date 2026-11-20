# Media & image storage — reference

## Storage provider abstraction

The `StorageProvider` interface (`src/providers/storage/types.ts`) defines:
- `putObject({ key, body, contentType })` — write an object
- `presignUpload({ key, contentType, expiresInSeconds })` → signed upload URL
- `getObject(key)` → Buffer
- `getPublicUrl(key)` → public URL for reading
- `deleteObject(key)` — remove an object

**Implementations:**
- `LocalStorageProvider` — fs-backed; presigned URLs point at `/api/media/upload` (HMAC-signed); public URLs at `/api/media/raw`; safeJoin prevents path traversal.
- `S3StorageProvider` — AWS S3 / Cloudflare R2 / MinIO; lazy bucket creation; `getPublicUrl` uses path-style for MinIO (`endpoint/bucket/key`), virtual-hosted for AWS.

Factory: `createStorageProvider()` reads `STORAGE_PROVIDER` env; singleton exported as `storage`.

## Media upload flow

1. Client calls `POST /api/media/presign` with `{ purpose, files: [{mimeType, size}] }`.
2. Server returns `items[]` with `{ key, uploadUrl, expiresAt }`.
3. Client PUTs the raw file to `uploadUrl` (with `Content-Type` header).
4. Client calls `POST /api/media/confirm` with `{ key, position? }`.
5. Server: validates key format + ownership → reads object → checks MIME type (sharp metadata) → checks size → compresses to WEBP (maxDimension) → creates thumbnail (300×300 WEBP) → overwrites original key with compressed WEBP → stores thumbnail → inserts DB row → returns `MediaItem`.

## Image processing

- `inspectImage(buffer)` — sharp metadata → `{ format, width, height, size }` or null
- `compressToWebp(buffer, maxDimension)` — rotate (EXIF), resize inside `maxDimension`, webp q80
- `makeThumbnail(buffer, size)` — square cover crop, webp q75
- Raw route sniffs magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP `RIFF....WEBP`) for content-type, not file extension

## Rate limiting

- `/presign`: 30 requests/minute per user (createRateLimiter)
- Auth routes: 5 register/hour, 10 login/15min (existing)
- All media routes require authentication (requireAuth)

## i18n keys

Catalog section: `media.*` — upload, limits, library, delete, errors. Nav: `nav.media`. Error code mapping via `tOr("media.error.{CODE}", t("errors.generic"))`.

## Env vars

| Key | Default | Notes |
|---|---|---|
| `STORAGE_PROVIDER` | `local` | `local` or `s3` |
| `STORAGE_SIGNING_SECRET` | dev secret | HMAC signing for local presigned URLs (min 16 chars) |
| `PRESIGN_TTL_SECONDS` | 120 | How long presigned URLs are valid |
| `LOCAL_STORAGE_BASE_DIR` | `./storage` | Filesystem path for local storage |
| `MAX_IMAGE_FILE_MB` | 10 | Max upload size in MB |
| `IMAGE_MAX_DIMENSION` | 1600 | Longest side after compression |
| `THUMBNAIL_SIZE` | 300 | Square thumbnail px |
| `S3_ENDPOINT` | — | MinIO/R2 endpoint URL |
| `S3_BUCKET` | `marketplace` | Bucket name |
