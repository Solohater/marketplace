import { z } from "zod";
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { adminController } from "./admin.controller.js";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get(
  "/users",
  validate(listUsersQuerySchema, "query"),
  adminController.listUsers
);
adminRouter.get("/stats", adminController.stats);
