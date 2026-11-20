# Media & image storage — explanation

## What this feature does

Users can upload images (JPG, PNG, WEBP) for listings, chat, or avatars. The system:
1. Validates file type, size (≤10MB), and count (≤10 per batch) client-side and server-side.
2. Generates presigned upload URLs (HMAC-signed for local, real S3 presigned for R2/MinIO).
3. Compresses uploaded images to WEBP (lossy, q80) constrained to 1600px longest side.
4. Creates a 300×300 square WEBP thumbnail for each image.
5. Stores the compressed original + thumbnail, serves them via raw URLs.
6. Tracks metadata (owner, purpose, dimensions, size, position) in a Postgres `media` table.

## Architecture

```
Browser → POST /api/media/presign → Server returns signed URL
Browser → PUT  /upload/:key        → LocalStorageProvider.putObject()
Browser → POST /api/media/confirm  → compress → thumbnail → DB insert
Browser → GET  /api/media/raw/:key → sniff bytes → serve with correct content-type
```

For S3/R2/MinIO: the upload goes directly to the object store (real presigned PUT). For local: the upload goes through the API's `/api/media/upload` endpoint.

## Key design decisions

- **WEBP everywhere**: All stored images are WEBP (compressed + thumbnail). The original extension is kept in the key for URL compatibility, but content is always WEBP. The raw route sniffs magic bytes for correct content-type.
- **Local provider mimics presigned URLs**: Uses HMAC-signed query params (`?expires=...&token=...`) to make local dev behave like S3 without requiring MinIO. The token is verified with `timingSafeEqual` to prevent timing attacks.
- **S3 path-style for MinIO**: When `S3_FORCE_PATH_STYLE=true`, `getPublicUrl` returns `endpoint/bucket/key` (not `bucket.endpoint/key`), which is required for MinIO and compatible with R2.
- **Batch presign + serial confirm**: Presigning all files at once (one HTTP round-trip). Confirming one at a time (each triggers compression + thumbnail + DB insert) — keeps memory usage bounded.

## DB schema (media table)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `owner_id` | uuid FK → users | CASCADE on delete |
| `purpose` | enum (listing/chat/avatar) | Indexed |
| `object_key` | text UNIQUE | `purpose/ownerId/uuid.ext` |
| `url` | text | Public URL |
| `thumbnail_url` | text | Thumbnail public URL |
| `mime_type` | text | Always `image/webp` after confirm |
| `size` | integer | Compressed size in bytes |
| `width` / `height` | integer? | Original dimensions |
| `position` | integer | Sort order (default 0) |
| `created_at` | timestamptz | Auto-generated |

Indexes: `media_owner_idx`, `media_owner_purpose_idx`, `media_object_key_unique`.
