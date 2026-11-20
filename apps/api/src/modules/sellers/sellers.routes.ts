import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createSellerProfileSchema,
  updateSellerProfileSchema,
} from "@marketplace/shared";
import { sellerProfilesController } from "./sellers.controller.js";

export const sellerProfilesRouter = Router();

// Public routes
sellerProfilesRouter.get(
  "/storefront/:userId",
  sellerProfilesController.getPublicStorefront
);

// Authenticated routes
sellerProfilesRouter.use(requireAuth);

sellerProfilesRouter.post(
  "/",
  validate(createSellerProfileSchema),
  sellerProfilesController.createProfile
);
sellerProfilesRouter.get("/me", sellerProfilesController.getMyProfile);
sellerProfilesRouter.patch(
  "/me",
  validate(updateSellerProfileSchema),
  sellerProfilesController.updateProfile
);

// Admin routes
sellerProfilesRouter.get(
  "/",
  requireRole("ADMIN"),
  sellerProfilesController.listSellers
);
