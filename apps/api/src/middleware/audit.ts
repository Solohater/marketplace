import type { Request, Response, NextFunction } from "express";
import { auditService } from "../modules/audit/audit.service.js";

interface AuditContext {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

export function auditLog(context: AuditContext) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Store audit context for later use
    req.auditContext = context;
    next();
  };
}

export function captureAuditLog(req: Request, _res: Response, next: NextFunction) {
  // Capture the original json method to intercept responses
  const originalJson = req.res?.json.bind(req.res);

  if (req.res?.json && originalJson) {
    req.res.json = function (body: unknown) {
      // Log the audit entry after the response is sent
      const auditContext = req.auditContext;
      if (auditContext && req.auth) {
        auditService.log({
          actorId: req.auth.userId,
          action: auditContext.action,
          entity: auditContext.entity,
          entityId: auditContext.entityId ?? extractEntityId(req),
          details: auditContext.details ?? JSON.stringify({
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body),
          }),
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }).catch(console.error);
      }

      return originalJson(body);
    };
  }

  next();
}

function extractEntityId(req: Request): string | undefined {
  return String(req.params.id ?? req.body?.id ?? undefined);
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;

  const sanitized = { ...body } as Record<string, unknown>;
  const sensitiveFields = ["password", "passwordHash", "token", "secret", "authorization"];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
