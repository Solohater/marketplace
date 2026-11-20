import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { auditController } from "./audit.controller.js";

export const auditRouter = Router();

// Admin-only routes
auditRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  auditController.getLogs
);
auditRouter.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  auditController.getLogById
);
