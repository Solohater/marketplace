import type {
  ApiErrorBody,
  ApiErrorCodeValue,
  ApiErrorDetail,
} from "@marketplace/shared";

export class AppError extends Error {
  readonly statusCode: number;
  readonly errorBody: ApiErrorBody;

  constructor(
    statusCode: number,
    code: ApiErrorCodeValue,
    message: string,
    details?: ApiErrorDetail[],
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorBody = { code, message, ...(details ? { details } : {}) };
  }
}

export const validationError = (
  details: ApiErrorDetail[],
  message = "Invalid request payload"
): AppError => new AppError(400, "VALIDATION_ERROR", message, details);

export const unauthorized = (message = "Authentication required"): AppError =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (
  message = "You do not have permission to perform this action"
): AppError => new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Resource not found"): AppError =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (message = "Resource already exists"): AppError =>
  new AppError(409, "CONFLICT", message);

export const invalidCredentials = (): AppError =>
  new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email/phone or password"
  );

export const rateLimited = (
  message = "Too many requests, please try again later"
): AppError => new AppError(429, "RATE_LIMITED", message);

export const tooManyAttempts = (): AppError =>
  new AppError(
    429,
    "TOO_MANY_ATTEMPTS",
    "Too many attempts, please try again later"
  );

export const invalidToken = (): AppError =>
  new AppError(400, "INVALID_TOKEN", "Invalid or already used token");

export const expiredToken = (): AppError =>
  new AppError(400, "EXPIRED_TOKEN", "This token has expired");

export const accountNotVerified = (): AppError =>
  new AppError(
    401,
    "ACCOUNT_NOT_VERIFIED",
    "Please verify your email or phone before logging in"
  );

export const accountSuspended = (): AppError =>
  new AppError(403, "ACCOUNT_SUSPENDED", "This account has been suspended");

export const accountDisabled = (): AppError =>
  new AppError(403, "ACCOUNT_DISABLED", "This account has been disabled");

export const invalidMediaType = (): AppError =>
  new AppError(
    415,
    "MEDIA_INVALID_TYPE",
    "Only JPG, PNG and WEBP images are allowed"
  );

export const mediaFileTooLarge = (maxMb: number): AppError =>
  new AppError(413, "MEDIA_FILE_TOO_LARGE", `File exceeds the ${maxMb}MB limit`);

export const mediaInvalidDimensions = (): AppError =>
  new AppError(422, "MEDIA_INVALID_DIMENSIONS", "Image dimensions are invalid");

export const mediaProcessingFailed = (): AppError =>
  new AppError(422, "MEDIA_PROCESSING_FAILED", "Image could not be processed");

export const mediaNotFound = (): AppError =>
  new AppError(404, "MEDIA_NOT_FOUND", "Media not found");

export const mediaUploadExpired = (): AppError =>
  new AppError(410, "MEDIA_UPLOAD_EXPIRED", "Upload link has expired");
