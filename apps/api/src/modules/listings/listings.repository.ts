import { eq, count, desc, and, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  listings,
  media,
  type NewListing,
  type Listing,
} from "../../db/schema.js";
import type { Paginated } from "@marketplace/shared";

export const listingsRepository = {
  async create(sellerId: string, data: Omit<NewListing, "sellerId">): Promise<Listing> {
    const [row] = await db
      .insert(listings)
      .values({ sellerId, ...data })
      .returning();
    if (!row) throw new Error("Failed to create listing");
    return row;
  },

  async findById(id: string) {
    return db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: {
        seller: {
          columns: {
            id: true,
            fullName: true,
          },
          with: {
            sellerProfile: {
              columns: {
                storeName: true,
                isVerified: true,
                verificationLevel: true,
              },
            },
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        model: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  async findByIdWithMedia(id: string) {
    const listing = await this.findById(id);
    if (!listing) return null;

    const listingMedia = await db.query.media.findMany({
      where: eq(media.ownerId, id),
      orderBy: [media.position],
    });

    return {
      ...listing,
      images: listingMedia.map((m) => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        position: m.position,
      })),
    };
  },

  async update(id: string, patch: Partial<NewListing>): Promise<Listing> {
    const [row] = await db
      .update(listings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    if (!row) throw new Error("Failed to update listing");
    return row;
  },

  async incrementViews(id: string) {
    await db
      .update(listings)
      .set({
        viewsCount: sql`${listings.viewsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));
  },

  async listBySeller(sellerId: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const items = await db.query.listings.findMany({
      where: eq(listings.sellerId, sellerId),
      orderBy: [desc(listings.createdAt)],
      limit: safePageSize,
      offset,
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const [totalRow] = await db
      .select({ value: count() })
      .from(listings)
      .where(eq(listings.sellerId, sellerId));
    const total = totalRow?.value ?? 0;

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  async listPublic(filters?: {
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    locationId?: string;
    search?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Listing>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const conditions = [eq(listings.status, "ACTIVE")];

    if (filters?.categoryId) {
      conditions.push(eq(listings.categoryId, filters.categoryId));
    }
    if (filters?.brandId) {
      conditions.push(eq(listings.brandId, filters.brandId));
    }
    if (filters?.modelId) {
      conditions.push(eq(listings.modelId, filters.modelId));
    }
    if (filters?.minPrice) {
      conditions.push(sql`${listings.price} >= ${filters.minPrice}`);
    }
    if (filters?.maxPrice) {
      conditions.push(sql`${listings.price} <= ${filters.maxPrice}`);
    }
    if (filters?.condition) {
      conditions.push(eq(listings.condition, filters.condition));
    }
    if (filters?.locationId) {
      conditions.push(eq(listings.locationId, filters.locationId));
    }
    if (filters?.search) {
      conditions.push(
        sql`${listings.title} ILIKE ${`%${filters.search}%`}`
      );
    }

    const where = and(...conditions);

    let orderBy;
    switch (filters?.sortBy) {
      case "oldest":
        orderBy = [listings.createdAt];
        break;
      case "price_asc":
        orderBy = [listings.price];
        break;
      case "price_desc":
        orderBy = [desc(listings.price)];
        break;
      case "most_viewed":
        orderBy = [desc(listings.viewsCount)];
        break;
      default:
        orderBy = [desc(listings.createdAt)];
    }

    const items = await db.query.listings.findMany({
      where,
      orderBy,
      limit: safePageSize,
      offset,
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        model: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const [totalRow] = await db
      .select({ value: count() })
      .from(listings)
      .where(where);
    const total = totalRow?.value ?? 0;

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  async delete(id: string) {
    await db.delete(listings).where(eq(listings.id, id));
  },

  async listByStatus(status: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const items = await db.query.listings.findMany({
      where: eq(listings.status, status as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "ACTIVE" | "SOLD" | "RESERVED" | "EXPIRED" | "SUSPENDED" | "DELETED" | "REJECTED"),
      orderBy: [desc(listings.createdAt)],
      limit: safePageSize,
      offset,
      with: {
        seller: {
          columns: {
            id: true,
            fullName: true,
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const [totalRow] = await db
      .select({ value: count() })
      .from(listings)
      .where(eq(listings.status, status as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "ACTIVE" | "SOLD" | "RESERVED" | "EXPIRED" | "SUSPENDED" | "DELETED" | "REJECTED"));
    const total = totalRow?.value ?? 0;

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },
};
