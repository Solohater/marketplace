import { Router } from "express";
import { sql } from "../../db/client.js";
import { sendSuccess } from "../../lib/http.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await sql`select 1`;
    sendSuccess(res, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Database unavailable" },
    });
  }
});
