import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { categoriesController } from "./categories.controller.js";

export const categoriesRouter = Router();

// Public routes
categoriesRouter.get("/", categoriesController.getCategories);
categoriesRouter.get("/root", categoriesController.getRootCategories);
categoriesRouter.get("/:id", categoriesController.getCategoryById);
categoriesRouter.get("/slug/:slug", categoriesController.getCategoryBySlug);
categoriesRouter.get("/:parentId/subcategories", categoriesController.getSubcategories);
categoriesRouter.get("/:categoryId/brands", categoriesController.getBrandsByCategory);
categoriesRouter.get("/brands/:brandId/models", categoriesController.getModelsByBrand);

// Admin routes
categoriesRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.createCategory
);
categoriesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.updateCategory
);
categoriesRouter.post(
  "/brands",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.createBrand
);
categoriesRouter.patch(
  "/brands/:id",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.updateBrand
);
categoriesRouter.post(
  "/models",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.createModel
);
categoriesRouter.patch(
  "/models/:id",
  requireAuth,
  requireRole("ADMIN"),
  categoriesController.updateModel
);
