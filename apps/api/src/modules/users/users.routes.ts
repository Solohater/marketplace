import { Router } from "express";
import { updateProfileSchema } from "@marketplace/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { usersController } from "./users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", usersController.me);
usersRouter.patch(
  "/me",
  validate(updateProfileSchema),
  usersController.updateMe
);
