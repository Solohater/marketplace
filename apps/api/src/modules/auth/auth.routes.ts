import { Router } from "express";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
} from "@marketplace/shared";
import { requireAuth } from "../../middleware/auth.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10),
  message: "Too many requests, please try again later",
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  limit: 5,
  message: "Too many accounts created from this device, please try again later",
});

authRouter.post("/register", registerLimiter, validate(registerSchema), authController.register);
authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/verify-email", validate(verifyEmailSchema, "query"), authController.verifyEmail);
authRouter.post("/verify-phone", authLimiter, validate(verifyPhoneSchema), authController.verifyPhone);
authRouter.post("/resend-verification", authLimiter, validate(resendVerificationSchema), authController.resendVerification);
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
authRouter.post("/change-password", requireAuth, validate(changePasswordSchema), authController.changePassword);
authRouter.get("/me", requireAuth, authController.me);
authRouter.get("/sessions", requireAuth, authController.listSessions);
authRouter.delete("/sessions/:id", requireAuth, authController.revokeSession);
authRouter.delete("/sessions", requireAuth, authController.revokeOtherSessions);
