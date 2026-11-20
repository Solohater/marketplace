import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Kept in sync with packages/shared/src/roles.ts. Inlined here (not imported)
// so drizzle-kit, which runs as CJS, can load this schema without the shared
// ESM package.
export const USER_ROLES = ["USER", "SELLER", "ADMIN", "DELIVERY_AGENT"] as const;
export const USER_STATUSES = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DISABLED",
] as const;

export const userRoleEnum = pgEnum("user_role", [...USER_ROLES]);
export const userStatusEnum = pgEnum("user_status", [...USER_STATUSES]);

export const tokenPurposeEnum = pgEnum("token_purpose", [
  "EMAIL_VERIFICATION",
  "PHONE_VERIFICATION",
  "PASSWORD_RESET",
  "ACCOUNT_ACTIVATION",
]);

export type TokenPurpose = (typeof tokenPurposeEnum)["enumValues"][number];

// Kept in sync with packages/shared/src/media/schemas.ts (see comment above
// about drizzle-kit and the shared ESM package).
export const mediaPurposeEnum = pgEnum("media_purpose", [
  "listing",
  "chat",
  "avatar",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }),
    phone: varchar("phone", { length: 20 }),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("USER"),
    status: userStatusEnum("status").notNull().default("PENDING_VERIFICATION"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.email} is not null`),
    uniqueIndex("users_phone_unique")
      .on(table.phone)
      .where(sql`${table.phone} is not null`),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: tokenPurposeEnum("purpose").notNull(),
    tokenHash: text("token_hash").notNull(),
    codeHash: text("code_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("verification_tokens_user_idx").on(table.userId),
    index("verification_tokens_token_hash_idx").on(table.tokenHash),
  ]
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: mediaPurposeEnum("purpose").notNull(),
    objectKey: text("object_key").notNull(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    mimeType: varchar("mime_type", { length: 50 }).notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("media_owner_idx").on(table.ownerId),
    index("media_owner_purpose_idx").on(table.ownerId, table.purpose),
    uniqueIndex("media_object_key_unique").on(table.objectKey),
  ]
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

// Location tables
export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("countries_code_idx").on(table.code)]
);

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("regions_country_id_idx").on(table.countryId)]
);

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("cities_region_id_idx").on(table.regionId)]
);

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;

export const subCities = pgTable(
  "sub_cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sub_cities_city_id_idx").on(table.cityId)]
);

export type SubCity = typeof subCities.$inferSelect;
export type NewSubCity = typeof subCities.$inferInsert;

export const areas = pgTable(
  "areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subCityId: uuid("sub_city_id")
      .notNull()
      .references(() => subCities.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("areas_sub_city_id_idx").on(table.subCityId)]
);

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;

// Location relations
export const countriesRelations = relations(countries, ({ many }) => ({
  regions: many(regions),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
  country: one(countries, {
    fields: [regions.countryId],
    references: [countries.id],
  }),
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  region: one(regions, {
    fields: [cities.regionId],
    references: [regions.id],
  }),
  subCities: many(subCities),
}));

export const subCitiesRelations = relations(subCities, ({ one, many }) => ({
  city: one(cities, {
    fields: [subCities.cityId],
    references: [cities.id],
  }),
  areas: many(areas),
}));

export const areasRelations = relations(areas, ({ one }) => ({
  subCity: one(subCities, {
    fields: [areas.subCityId],
    references: [subCities.id],
  }),
}));

// Category tables
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    parentId: uuid("parent_id"),
    isActive: varchar("is_active", { length: 5 }).notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// Add foreign key constraint for self-referencing category
export const categoryParentFK = sql`ALTER TABLE ${categories} ADD CONSTRAINT categories_parent_id_fk FOREIGN KEY (parent_id) REFERENCES ${categories}(id) ON DELETE SET NULL`;

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    logoUrl: text("logo_url"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isActive: varchar("is_active", { length: 5 }).notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("brands_slug_idx").on(table.slug),
    index("brands_category_id_idx").on(table.categoryId),
  ]
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export const models = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    isActive: varchar("is_active", { length: 5 }).notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("models_slug_idx").on(table.slug),
    index("models_brand_id_idx").on(table.brandId),
  ]
);

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

// Category relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  brands: many(brands),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  category: one(categories, {
    fields: [brands.categoryId],
    references: [categories.id],
  }),
  models: many(models),
}));

export const modelsRelations = relations(models, ({ one }) => ({
  brand: one(brands, {
    fields: [models.brandId],
    references: [brands.id],
  }),
}));

// Audit log table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entity: varchar("entity", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entity),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Audit log relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// Seller profiles
export const sellerProfiles = pgTable(
  "seller_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    storeName: varchar("store_name", { length: 100 }).notNull(),
    storeDescription: text("store_description"),
    logoUrl: text("logo_url"),
    phone: varchar("phone", { length: 20 }),
    locationId: uuid("location_id").references(() => areas.id, {
      onDelete: "set null",
    }),
    address: text("address"),
    isVerified: varchar("is_verified", { length: 5 }).notNull().default("false"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verificationLevel: varchar("verification_level", { length: 20 })
      .notNull()
      .default("none"),
    memberSince: timestamp("member_since", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("seller_profiles_user_id_idx").on(table.userId),
    index("seller_profiles_store_name_idx").on(table.storeName),
  ]
);

export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type NewSellerProfile = typeof sellerProfiles.$inferInsert;

// User relations (add seller profile)
export const usersRelationsExtended = relations(users, ({ one }) => ({
  sellerProfile: one(sellerProfiles, {
    fields: [users.id],
    references: [sellerProfiles.userId],
  }),
}));

export const sellerProfilesRelations = relations(sellerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [sellerProfiles.userId],
    references: [users.id],
  }),
  location: one(areas, {
    fields: [sellerProfiles.locationId],
    references: [areas.id],
  }),
}));

// Listing statuses
export const listingStatusEnum = pgEnum("listing_status", [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "ACTIVE",
  "SOLD",
  "RESERVED",
  "EXPIRED",
  "SUSPENDED",
  "DELETED",
  "REJECTED",
]);

// Listings
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("ETB"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    modelId: uuid("model_id").references(() => models.id, {
      onDelete: "set null",
    }),
    condition: varchar("condition", { length: 20 }).notNull(),
    status: listingStatusEnum("status").notNull().default("DRAFT"),
    locationId: uuid("location_id").references(() => areas.id, {
      onDelete: "set null",
    }),
    address: text("address"),
    specifications: text("specifications"), // JSON string
    warranty: varchar("warranty", { length: 100 }),
    imei: varchar("imei", { length: 20 }), // Private, never exposed publicly
    viewsCount: integer("views_count").notNull().default(0),
    favoritesCount: integer("favorites_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listings_seller_id_idx").on(table.sellerId),
    index("listings_category_id_idx").on(table.categoryId),
    index("listings_brand_id_idx").on(table.brandId),
    index("listings_model_id_idx").on(table.modelId),
    index("listings_status_idx").on(table.status),
    index("listings_price_idx").on(table.price),
    index("listings_created_at_idx").on(table.createdAt),
  ]
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

// Listing relations
export const listingsRelations = relations(listings, ({ one }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [listings.brandId],
    references: [brands.id],
  }),
  model: one(models, {
    fields: [listings.modelId],
    references: [models.id],
  }),
  location: one(areas, {
    fields: [listings.locationId],
    references: [areas.id],
  }),
}));
