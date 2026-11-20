process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  "postgres://marketplace:marketplace@localhost:5435/marketplace_test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET ??=
  "test-access-secret-0123456789abcdef0123456789abcdef";
process.env.JWT_REFRESH_SECRET ??=
  "test-refresh-secret-0123456789abcdef0123456789abcd";
process.env.MESSAGE_PROVIDER ??= "recording";
process.env.RATE_LIMIT_ENABLED ??= "false";
process.env.WEB_APP_URL ??= "http://localhost:3000";
process.env.LOG_LEVEL ??= "silent";
process.env.STORAGE_PROVIDER ??= "local";
process.env.LOCAL_STORAGE_BASE_DIR ??= "/tmp/marketplace-media-test";
process.env.LOCAL_STORAGE_PUBLIC_BASE_URL ??= "";
process.env.STORAGE_SIGNING_SECRET ??= "test-storage-signing-secret-0123456789";
