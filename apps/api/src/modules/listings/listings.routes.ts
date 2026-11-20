import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createListingSchema,
  updateListingSchema,
} from "@marketplace/shared";
import { listingsController } from "./listings.controller.js";

export const listingsRouter = Router();

// Public routes
listingsRouter.get("/", listingsController.listPublic);
listingsRouter.get("/:id", listingsController.getListing);

// Authenticated routes
listingsRouter.use(requireAuth);

listingsRouter.post(
  "/",
  validate(createListingSchema),
  listingsController.createListing
);
listingsRouter.get("/me/listings", listingsController.getMyListings);
listingsRouter.patch(
  "/:id",
  validate(updateListingSchema),
  listingsController.updateListing
);
listingsRouter.delete("/:id", listingsController.deleteListing);
listingsRouter.post("/:id/submit", listingsController.submitForReview);
listingsRouter.post("/:id/sold", listingsController.markAsSold);
listingsRouter.post("/:id/reserve", listingsController.markAsReserved);

// Admin routes
listingsRouter.get(
  "/admin/moderation",
  requireRole("ADMIN"),
  listingsController.getModerationQueue
);
listingsRouter.post(
  "/:id/approve",
  requireRole("ADMIN"),
  listingsController.approveListing
);
listingsRouter.post(
  "/:id/reject",
  requireRole("ADMIN"),
  listingsController.rejectListing
);
listingsRouter.post(
  "/:id/suspend",
  requireRole("ADMIN"),
  listingsController.suspendListing
);
