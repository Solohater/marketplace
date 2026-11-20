import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger } from "../logger.js";

export const requestLogger = pinoHttp({
  logger,
  genReqId: () => randomUUID(),
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} failed -> ${res.statusCode}: ${err.message}`,
});
