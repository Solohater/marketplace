import { Router } from "express";
import {
  confirmMediaSchema,
  listMediaQuerySchema,
  presignMediaSchema,
} from "@marketplace/shared";
import { requireAuth } from "../../middleware/auth.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { mediaController } from "./media.controller.js";

export const mediaRouter = Router();

mediaRouter.use(requireAuth);

mediaRouter.post(
  "/presign",
  createRateLimiter({ windowMs: 60_000, limit: 30 }),
  validate(presignMediaSchema),
  mediaController.presign
);
mediaRouter.post("/confirm", validate(confirmMediaSchema), mediaController.confirm);
mediaRouter.get("/", validate(listMediaQuerySchema, "query"), mediaController.list);
mediaRouter.delete("/:id", mediaController.remove);
