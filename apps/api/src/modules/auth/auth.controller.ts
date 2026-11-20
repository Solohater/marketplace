import type { Request, RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../lib/http.js";
import { toPublicUser } from "../users/serializer.js";
import { authService } from "./auth.service.js";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  const secure = env.NODE_ENV === "production";
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

function readCookie(req: Request, name: string): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[name];
  return typeof value === "string" ? value : undefined;
}

export const authController = {
  register: (async (req, res) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  }) as RequestHandler,

  login: (async (req, res) => {
    const { user, tokens } = await authService.login(
      req.body.identifier,
      req.body.password,
      {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      }
    );
    setAuthCookies(res, tokens);
    sendSuccess(res, { user });
  }) as RequestHandler,

  logout: (async (req, res) => {
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (refreshToken) {
      await authService.logoutByRefreshToken(refreshToken);
    } else if (req.auth) {
      await authService.revokeSession(req.auth.sessionId);
    }
    clearAuthCookies(res);
    sendSuccess(res, { loggedOut: true });
  }) as RequestHandler,

  refresh: (async (req, res) => {
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (!refreshToken) {
      sendSuccess(res, { authenticated: false });
      return;
    }
    const { user, tokens } = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    sendSuccess(res, { user });
  }) as RequestHandler,

  verifyEmail: (async (req, res) => {
    const { token } = (req.validated?.query ?? {}) as { token: string };
    const user = await authService.verifyEmail(token);
    sendSuccess(res, { user });
  }) as RequestHandler,

  verifyPhone: (async (req, res) => {
    const user = await authService.verifyPhone(
      req.body.identifier,
      req.body.code
    );
    sendSuccess(res, { user });
  }) as RequestHandler,

  resendVerification: (async (req, res) => {
    const result = await authService.resendVerification(req.body.identifier);
    sendSuccess(res, result);
  }) as RequestHandler,

  forgotPassword: (async (req, res) => {
    await authService.forgotPassword(req.body.identifier);
    sendSuccess(res, { ok: true });
  }) as RequestHandler,

  resetPassword: (async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, { ok: true });
  }) as RequestHandler,

  changePassword: (async (req, res) => {
    await authService.changePassword(
      req.auth!.userId,
      req.body.currentPassword,
      req.body.newPassword,
      req.auth!.sessionId
    );
    sendSuccess(res, { ok: true });
  }) as RequestHandler,

  me: ((req, res) => {
    sendSuccess(res, { user: toPublicUser(req.auth!.user) });
  }) as RequestHandler,

  listSessions: (async (req, res) => {
    const sessions = await authService.listSessions(req.auth!.userId);
    sendSuccess(res, { sessions });
  }) as RequestHandler,

  revokeSession: (async (req, res) => {
    await authService.revokeSessionForUser(
      req.auth!.userId,
      String(req.params.id)
    );
    sendSuccess(res, { ok: true });
  }) as RequestHandler,

  revokeOtherSessions: (async (req, res) => {
    await authService.revokeOtherSessions(
      req.auth!.userId,
      req.auth!.sessionId
    );
    sendSuccess(res, { ok: true });
  }) as RequestHandler,
};
