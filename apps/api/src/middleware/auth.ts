import type { Request, RequestHandler } from "express";
import type { UserRoleValue } from "@marketplace/shared";
import {
  accountNotVerified,
  accountDisabled,
  accountSuspended,
  forbidden,
  unauthorized,
} from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { authRepository } from "../modules/auth/auth.repository.js";
import { usersRepository } from "../modules/users/users.repository.js";

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = (req.cookies as Record<string, unknown> | undefined)
    ?.access_token;
  return typeof cookie === "string" ? cookie : undefined;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      next(unauthorized());
      return;
    }

    const payload = await verifyAccessToken(token);
    const [user, session] = await Promise.all([
      usersRepository.findById(payload.sub),
      authRepository.findSessionById(payload.sid),
    ]);
    if (!user || !session) {
      next(unauthorized());
      return;
    }
    // A revoked or expired session invalidates the access token immediately,
    // so logout / session-revocation / password-change take effect right away.
    if (
      session.userId !== user.id ||
      session.revokedAt !== null ||
      session.expiresAt < new Date()
    ) {
      next(unauthorized());
      return;
    }

    if (user.status === "PENDING_VERIFICATION") {
      next(accountNotVerified());
      return;
    }
    if (user.status === "SUSPENDED") {
      next(accountSuspended());
      return;
    }
    if (user.status === "DISABLED") {
      next(accountDisabled());
      return;
    }

    req.auth = {
      userId: user.id,
      sessionId: payload.sid,
      role: user.role,
      user,
    };
    next();
  } catch {
    next(unauthorized());
  }
};

export function requireRole(...roles: UserRoleValue[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}
