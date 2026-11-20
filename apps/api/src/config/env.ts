import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      "postgres://marketplace:marketplace@localhost:5435/marketplace"
    ),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  // Development-only defaults. Production MUST provide strong secrets.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default("dev-only-access-secret-change-me-00000000000000"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-refresh-secret-change-me-000000000000"),
  ACCESS_TOKEN_TTL: z.string().min(1).default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  WEB_APP_URL: z.string().url().default("http://localhost:3000"),
  MESSAGE_PROVIDER: z.enum(["console", "recording"]).default("console"),
  VERIFICATION_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_ENABLED: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
  RATE_LIMIT_STORE: z.enum(["auto", "memory"]).default("auto"),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_SIGNING_SECRET: z
    .string()
    .min(16)
    .default("dev-only-storage-signing-secret-0000"),
  PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  LOCAL_STORAGE_BASE_DIR: z.string().min(1).default("./storage"),
  LOCAL_STORAGE_PUBLIC_BASE_URL: z.string().default(""),
  MAX_IMAGE_FILE_MB: z.coerce.number().int().positive().default(10),
  IMAGE_MAX_DIMENSION: z.coerce.number().int().positive().default(1600),
  THUMBNAIL_SIZE: z.coerce.number().int().positive().default(300),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("marketplace"),
  S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
  S3_PUBLIC_BASE_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
