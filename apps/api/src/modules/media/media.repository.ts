import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { media, type Media, type NewMedia } from "../../db/schema.js";
import type { MediaPurpose } from "@marketplace/shared";

export const mediaRepository = {
  async insert(input: NewMedia): Promise<Media> {
    const [row] = await db.insert(media).values(input).returning();
    if (!row) throw new Error("Insert returned no row");
    return row;
  },

  async findById(id: string): Promise<Media | undefined> {
    return db.query.media.findFirst({ where: eq(media.id, id) });
  },

  async listByOwner(
    ownerId: string,
    purpose: MediaPurpose | undefined,
    page: number,
    pageSize: number
  ): Promise<{ items: Media[]; total: number }> {
    const where = and(
      eq(media.ownerId, ownerId),
      purpose ? eq(media.purpose, purpose) : undefined
    );
    const [items, totalRows] = await Promise.all([
      db.query.media.findMany({
        where,
        orderBy: [asc(media.position), desc(media.createdAt)],
        offset: (page - 1) * pageSize,
        limit: pageSize,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(media)
        .where(where),
    ]);
    return { items, total: totalRows[0]?.count ?? 0 };
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  },
};
