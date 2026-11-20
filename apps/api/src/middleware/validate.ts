import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { validationError } from "../lib/errors.js";

export function validate<T>(
  schema: ZodType<T>,
  source: "body" | "query" | "params" = "body"
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || undefined,
        code: issue.code,
        message: issue.message,
      }));
      next(validationError(details));
      return;
    }
    // req.query/req.params are getter-only in Express 5, so parsed input is
    // attached to req.validated instead of being written back onto the request.
    req.validated = { ...req.validated, [source]: result.data };
    if (source === "body") {
      req.body = result.data as never;
    }
    next();
  };
}
