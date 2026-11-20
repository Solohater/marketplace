import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import { hashPassword } from "../../src/lib/password.js";
import { usersRepository } from "../../src/modules/users/users.repository.js";
import { sql } from "../../src/db/client.js";
import {
  cookieValue,
  extractCodeFromSms,
  extractTokenFromEmailText,
  lastEmail,
  lastSms,
  resetMessages,
  truncateAll,
} from "../helpers.js";

let app: Express;

beforeAll(async () => {
  app = await createApp();
});

beforeEach(async () => {
  await truncateAll();
  resetMessages();
});

afterAll(async () => {
  await sql.end();
});

describe("register", () => {
  it("registers a user as PENDING_VERIFICATION and sends a verification email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Abebe Kebede",
      email: "abebe@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.status).toBe("PENDING_VERIFICATION");
    expect(res.body.data.verificationChannels).toEqual(["email"]);
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const email = lastEmail();
    expect(email?.to).toBe("abebe@example.com");
    expect(email?.subject).toContain("Verify your email");
    expect(email?.text).toContain("token=");
  });

  it("rejects an invalid payload with a consistent VALIDATION_ERROR", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "A",
      password: "short",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it("rejects a duplicate email with CONFLICT", async () => {
    const payload = {
      fullName: "Abebe Kebede",
      email: "abebe@example.com",
      password: "secret123",
    };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });
});

describe("email verification", () => {
  it("activates the account after email verification", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Abebe Kebede",
        email: "abebe@example.com",
        password: "secret123",
      });

    const token = extractTokenFromEmailText(lastEmail()!.text);
    const res = await request(app).get(`/api/auth/verify-email?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe("ACTIVE");
    expect(res.body.data.user.emailVerified).toBe(true);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get(
      "/api/auth/verify-email?token=not-a-real-token"
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });
});

describe("phone verification", () => {
  it("verifies a phone number with the SMS code", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Kebede Chala",
        phone: "0911223344",
        password: "secret123",
      });

    const code = extractCodeFromSms(lastSms()!.message);
    const res = await request(app)
      .post("/api/auth/verify-phone")
      .send({ identifier: "0911223344", code });
    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe("ACTIVE");
    expect(res.body.data.user.phoneVerified).toBe(true);
  });

  it("rejects a wrong code", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Kebede Chala",
        phone: "0911223344",
        password: "secret123",
      });

    const res = await request(app)
      .post("/api/auth/verify-phone")
      .send({ identifier: "0911223344", code: "000000" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });
});

describe("login & logout", () => {
  async function registerVerifiedUser(
    email = "abebe@example.com",
    password = "secret123"
  ) {
    await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Abebe Kebede", email, password });
    const token = extractTokenFromEmailText(lastEmail()!.text);
    await request(app).get(`/api/auth/verify-email?token=${token}`);
  }

  it("blocks login until the account is verified", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Sara Tadesse",
        email: "sara@example.com",
        password: "secret123",
      });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "sara@example.com", password: "secret123" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("ACCOUNT_NOT_VERIFIED");
  });

  it("rejects wrong credentials with INVALID_CREDENTIALS", async () => {
    await registerVerifiedUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("logs in, sets httpOnly cookies, reads /me, refreshes, and logs out", async () => {
    await registerVerifiedUser();
    const agent = request.agent(app);

    const login = await agent
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });
    expect(login.status).toBe(200);
    const setCookies = (login.headers["set-cookie"] ?? []) as string[];
    expect(cookieValue(setCookies, "access_token")).toBeTruthy();
    expect(cookieValue(setCookies, "refresh_token")).toBeTruthy();

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("abebe@example.com");
    expect(me.body.data.user.passwordHash).toBeUndefined();

    // sessions persist across refresh
    const refresh = await agent.post("/api/auth/refresh");
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.user.email).toBe("abebe@example.com");
    const refreshCookies = (refresh.headers["set-cookie"] ?? []) as string[];
    expect(cookieValue(refreshCookies, "refresh_token")).toBeTruthy();

    const meAfterRefresh = await agent.get("/api/auth/me");
    expect(meAfterRefresh.status).toBe(200);

    // logout kills the session
    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);

    const meAfterLogout = await agent.get("/api/auth/me");
    expect(meAfterLogout.status).toBe(401);
  });

  it("dies on logout: the refresh token is revoked", async () => {
    await registerVerifiedUser();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });
    const refreshToken = cookieValue(
      (login.headers["set-cookie"] ?? []) as string[],
      "refresh_token"
    );

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refresh_token=${refreshToken}`]);
    expect(logout.status).toBe(200);

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refresh_token=${refreshToken}`]);
    expect(refresh.status).toBe(401);
  });
});

describe("password reset", () => {
  it("resets the password via the emailed token and revokes old credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Abebe Kebede",
        email: "abebe@example.com",
        password: "secret123",
      });
    const verifyToken = extractTokenFromEmailText(lastEmail()!.text);
    await request(app).get(`/api/auth/verify-email?token=${verifyToken}`);

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ identifier: "abebe@example.com" });
    expect(forgot.status).toBe(200);

    const resetToken = extractTokenFromEmailText(lastEmail()!.text);
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, newPassword: "newpassword456" });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "newpassword456" });
    expect(newLogin.status).toBe(200);
  });
});

describe("sessions", () => {
  async function registerVerifiedUser(
    email = "abebe@example.com",
    password = "secret123"
  ) {
    await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Abebe Kebede", email, password });
    const token = extractTokenFromEmailText(lastEmail()!.text);
    await request(app).get(`/api/auth/verify-email?token=${token}`);
  }

  it("lists sessions and revokes all others", async () => {
    await registerVerifiedUser();

    const a1 = request.agent(app);
    const a2 = request.agent(app);
    await a1
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });
    await a2
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });

    const list = await a1.get("/api/auth/sessions");
    expect(list.status).toBe(200);
    expect(list.body.data.sessions.length).toBe(2);

    const revokeOthers = await a1.delete("/api/auth/sessions");
    expect(revokeOthers.status).toBe(200);

    const listAfter = await a1.get("/api/auth/sessions");
    expect(listAfter.body.data.sessions.length).toBe(1);

    const otherAgentMe = await a2.get("/api/auth/me");
    expect(otherAgentMe.status).toBe(401);
  });

  it("keeps the current session and revokes others on password change", async () => {
    await registerVerifiedUser();

    const a1 = request.agent(app);
    const a2 = request.agent(app);
    await a1
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });
    await a2
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });

    const change = await a1.post("/api/auth/change-password").send({
      currentPassword: "secret123",
      newPassword: "newpassword456",
    });
    expect(change.status).toBe(200);

    const currentStillValid = await a1.get("/api/auth/me");
    expect(currentStillValid.status).toBe(200);

    const otherRevoked = await a2.get("/api/auth/me");
    expect(otherRevoked.status).toBe(401);
  });
});

describe("role-based access control", () => {
  it("denies non-admin users from admin endpoints", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Abebe Kebede",
        email: "abebe@example.com",
        password: "secret123",
      });
    const token = extractTokenFromEmailText(lastEmail()!.text);
    await request(app).get(`/api/auth/verify-email?token=${token}`);

    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ identifier: "abebe@example.com", password: "secret123" });

    const denied = await agent.get("/api/admin/users");
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("FORBIDDEN");
  });

  it("allows admins into admin endpoints", async () => {
    await usersRepository.create({
      fullName: "Marketplace Admin",
      email: "admin@example.com",
      passwordHash: await hashPassword("admin12345"),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    });

    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ identifier: "admin@example.com", password: "admin12345" });
    expect(login.status).toBe(200);

    const users = await agent.get("/api/admin/users");
    expect(users.status).toBe(200);
    expect(users.body.data.items.length).toBeGreaterThan(0);
    expect(users.body.data.total).toBeGreaterThan(0);

    const stats = await agent.get("/api/admin/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.data.activeUsers).toBeGreaterThanOrEqual(1);
  });
});

describe("shared response shape", () => {
  it("returns a consistent success shape", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        status: "ok",
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns a consistent error shape for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("denies unauthenticated access to protected routes", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
