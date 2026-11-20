import express from "express";
import cookieParser from "cookie-parser";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { listingsRouter } from "./modules/listings/listings.routes.js";
import { locationRouter } from "./modules/locations/location.routes.js";
import { localMediaRouter } from "./modules/media/local-media.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { sellerProfilesRouter } from "./modules/sellers/sellers.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initRateLimiter } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestLog.js";

export async function createApp() {
  await initRateLimiter();

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestLogger);
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/sellers", sellerProfilesRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/locations", locationRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/audit", auditRouter);
  // Local-provider upload/raw routes must come before the auth'd media router,
  // because mediaRouter applies requireAuth to every request entering it.
  app.use("/api/media", localMediaRouter);
  app.use("/api/media", mediaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
