import { z } from "zod";

const listingConditionEnum = z.enum([
  "NEW",
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
]);

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().max(5000).optional(),
  price: z.number().int().positive("Price must be positive"),
  currency: z.string().length(3).default("ETB"),
  categoryId: z.string().uuid("Invalid category"),
  brandId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  condition: listingConditionEnum,
  locationId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  warranty: z.string().max(100).optional(),
  imei: z.string().max(20).optional(),
});

export const updateListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z.string().max(5000).optional(),
  price: z.number().int().positive("Price must be positive").optional(),
  categoryId: z.string().uuid("Invalid category").optional(),
  brandId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  condition: listingConditionEnum.optional(),
  locationId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  warranty: z.string().max(100).optional(),
});

export const listingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  condition: listingConditionEnum.optional(),
  locationId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "most_viewed"])
    .default("newest"),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;
