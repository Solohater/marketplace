import { z } from "zod";

export const createSellerProfileSchema = z.object({
  storeName: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be at most 100 characters"),
  storeDescription: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
  phone: z.string().min(10).max(20).optional(),
  locationId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
});

export const updateSellerProfileSchema = z.object({
  storeName: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be at most 100 characters")
    .optional(),
  storeDescription: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
  phone: z.string().min(10).max(20).optional(),
  locationId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
});

export const updateUserProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters")
    .optional(),
  locationId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
});

export type CreateSellerProfileInput = z.infer<typeof createSellerProfileSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
