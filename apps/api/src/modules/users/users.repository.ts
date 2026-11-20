import { count, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users, type NewUser, type User } from "../../db/schema.js";
import type { Paginated } from "@marketplace/shared";

export const usersRepository = {
  async create(input: NewUser): Promise<User> {
    const [row] = await db.insert(users).values(input).returning();
    if (!row) throw new Error("Failed to create user");
    return row;
  },

  async findById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  },

  async findByPhone(phone: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.phone, phone) });
  },

  async findByIdentifier(identifier: string): Promise<User | undefined> {
    if (identifier.includes("@")) return this.findByEmail(identifier);
    return this.findByPhone(identifier);
  },

  async update(id: string, patch: Partial<NewUser>): Promise<User> {
    const [row] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new Error("Failed to update user");
    return row;
  },

  async listAll(page = 1, pageSize = 20): Promise<Paginated<User>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const items = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(safePageSize)
      .offset(offset);

    const [totalRow] = await db.select({ value: count() }).from(users);
    const total = totalRow?.value ?? 0;

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  },

  async countAll(): Promise<number> {
    const [row] = await db.select({ value: count() }).from(users);
    return row?.value ?? 0;
  },

  async countActive(): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.status, "ACTIVE"));
    return row?.value ?? 0;
  },
};
