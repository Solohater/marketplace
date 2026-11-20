import pino from "pino";
import { env } from "./config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "marketplace-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "currentPassword",
      "newPassword",
      "refreshToken",
      "accessToken",
      "token",
      "code",
      "secret",
    ],
    censor: "[REDACTED]",
  },
});
