import { eq, count, desc } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  sellerProfiles,
  type NewSellerProfile,
  type SellerProfile,
} from "../../db/schema.js";

export const sellerProfilesRepository = {
  async create(
    userId: string,
    data: Omit<NewSellerProfile, "userId">
  ): Promise<SellerProfile> {
    const [row] = await db
      .insert(sellerProfiles)
      .values({ userId, ...data })
      .returning();
    if (!row) throw new Error("Failed to create seller profile");
    return row;
  },

  async findByUserId(userId: string): Promise<SellerProfile | undefined> {
    return db.query.sellerProfiles.findFirst({
      where: eq(sellerProfiles.userId, userId),
    });
  },

  async findById(id: string): Promise<SellerProfile | undefined> {
    return db.query.sellerProfiles.findFirst({
      where: eq(sellerProfiles.id, id),
    });
  },

  async update(
    userId: string,
    patch: Partial<NewSellerProfile>
  ): Promise<SellerProfile> {
    const [row] = await db
      .update(sellerProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(sellerProfiles.userId, userId))
      .returning();
    if (!row) throw new Error("Failed to update seller profile");
    return row;
  },

  async listAll(page = 1, pageSize = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const items = await db.query.sellerProfiles.findMany({
      orderBy: [desc(sellerProfiles.createdAt)],
      limit: safePageSize,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const [totalRow] = await db.select({ value: count() }).from(sellerProfiles);
    const total = totalRow?.value ?? 0;

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  async findByStoreName(storeName: string) {
    return db.query.sellerProfiles.findFirst({
      where: eq(sellerProfiles.storeName, storeName),
    });
  },
};
