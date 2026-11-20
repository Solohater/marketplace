import { z } from "zod";

export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const emailString = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(EMAIL_MAX);

const phoneString = z
  .string()
  .trim()
  .regex(/^(\+?251|0)?9\d{8}$/, "Enter a valid Ethiopian phone number (e.g. 0912345678)");

const optionalContact = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value === null ? undefined : value,
  z.union([emailString, phoneString]).optional()
);

const password = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX)
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

const identifier = z.string().trim().min(1).max(254);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(120),
    email: optionalContact,
    phone: optionalContact,
    password,
  })
  .refine((value) => value.email !== undefined || value.phone !== undefined, {
    message: "Provide at least an email or a phone number",
    path: ["email"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: identifier,
  password: z.string().min(1, "Enter your password").max(PASSWORD_MAX),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Missing verification token").max(500),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const verifyPhoneSchema = z.object({
  identifier,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;

export const resendVerificationSchema = z.object({
  identifier,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({
  identifier,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token").max(500),
  newPassword: password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(PASSWORD_MAX),
  newPassword: password,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
