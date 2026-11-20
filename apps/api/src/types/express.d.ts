import type { User } from "../db/schema.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        role: User["role"];
        user: User;
      };
      /** Zod-validated input, keyed by source. */
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
      /** Audit log context for capturing actions. */
      auditContext?: {
        action: string;
        entity: string;
        entityId?: string;
        details?: string;
      };
    }
  }
}

export {};
