import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiErrorCode } from "@marketplace/shared";
import { AppError } from "../lib/errors.js";
import { logger } from "../logger.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      "NOT_FOUND",
      `Route ${req.method} ${req.originalUrl} not found`
    )
  );
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.errorBody });
    return;
  }

  const requestId =
    typeof (req as { id?: unknown }).id === "string"
      ? (req as { id: string }).id
      : undefined;

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Malformed JSON in request body",
      },
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
    },
  });
};
