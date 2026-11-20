import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { auditLogs } from "../../db/schema.js";

export const auditRepository = {
  async create(data: {
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  },

  async list(filters?: {
    actorId?: string;
    action?: string;
    entity?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.entity) {
      conditions.push(eq(auditLogs.entity, filters.entity));
    }

    const where =
      conditions.length > 0
        ? conditions.reduce((acc, cond) => acc && cond)
        : undefined;

    const logs = await db.query.auditLogs.findMany({
      where,
      orderBy: [desc(auditLogs.createdAt)],
      limit: pageSize,
      offset,
      with: {
        actor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return logs;
  },

  async findById(id: string) {
    return db.query.auditLogs.findFirst({
      where: eq(auditLogs.id, id),
      with: {
        actor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },
};
