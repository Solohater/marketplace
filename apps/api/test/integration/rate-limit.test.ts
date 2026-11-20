import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";

let app: Express;
let truncateAll: () => Promise<void>;

beforeAll(async () => {
  process.env.RATE_LIMIT_ENABLED = "true";
  process.env.RATE_LIMIT_STORE = "memory";
  process.env.AUTH_RATE_LIMIT_MAX = "3";

  const [{ createApp }, helpers] = await Promise.all([
    import("../../src/app.js"),
    import("../helpers.js"),
  ]);
  truncateAll = helpers.truncateAll;
  app = await createApp();
});

beforeEach(async () => {
  await truncateAll();
});

describe("rate limiting", () => {
  it("returns 429 RATE_LIMITED after the login limit is exceeded", async () => {
    const attempt = () =>
      request(app)
        .post("/api/auth/login")
        .send({ identifier: "x@example.com", password: "wrong" });

    for (let i = 0; i < 3; i++) {
      const res = await attempt();
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
