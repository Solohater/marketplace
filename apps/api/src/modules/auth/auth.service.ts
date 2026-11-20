import { env } from "../../config/env.js";
import {
  accountDisabled,
  accountNotVerified,
  accountSuspended,
  conflict,
  expiredToken,
  invalidCredentials,
  invalidToken,
  tooManyAttempts,
  unauthorized,
} from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  generateOpaqueToken,
  generateVerificationCode,
  hashToken,
  signAccessToken,
} from "../../lib/tokens.js";
import { createMessageProvider } from "../../providers/messages/index.js";
import type { User } from "../../db/schema.js";
import { usersRepository } from "../users/users.repository.js";
import { toPublicUser, type PublicUser } from "../users/serializer.js";
import { authRepository } from "./auth.repository.js";

const messages = createMessageProvider();

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionView {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface RegisterResult {
  user: PublicUser;
  verificationChannels: Array<"email" | "phone">;
}

const MAX_CODE_ATTEMPTS = 5;

export const authService = {
  async register(input: {
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
  }): Promise<RegisterResult> {
    const email = input.email?.toLowerCase();
    const phone = input.phone;

    const existing = await usersRepository.findByIdentifier(
      (email ?? phone) as string
    );
    if (existing) throw conflict("An account with that email or phone already exists");

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      fullName: input.fullName,
      email,
      phone,
      passwordHash,
      status: "PENDING_VERIFICATION",
    });

    const verificationChannels: Array<"email" | "phone"> = [];
    if (email) {
      await this.sendVerification(user, "EMAIL_VERIFICATION", email);
      verificationChannels.push("email");
    }
    if (phone) {
      await this.sendVerification(user, "PHONE_VERIFICATION", phone);
      verificationChannels.push("phone");
    }

    return { user: toPublicUser(user), verificationChannels };
  },

  async sendVerification(
    user: User,
    purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION",
    identifier: string
  ): Promise<void> {
    await authRepository.revokeActiveTokens(user.id, purpose);

    const expiresAt = new Date(
      Date.now() + env.VERIFICATION_CODE_TTL_MINUTES * 60_000
    );

    if (purpose === "EMAIL_VERIFICATION") {
      const token = generateOpaqueToken(32);
      await authRepository.createToken({
        userId: user.id,
        purpose,
        tokenHash: hashToken(token),
        expiresAt,
      });
      const url = `${env.WEB_APP_URL}/verify-email?token=${token}`;
      await messages.sendEmail({
        to: identifier,
        subject: "Verify your email — Marketplace",
        text: `Click this link to verify your email: ${url}`,
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      });
      return;
    }

    const code = generateVerificationCode();
    await authRepository.createToken({
      userId: user.id,
      purpose,
      tokenHash: hashToken(generateOpaqueToken()),
      codeHash: hashToken(code),
      expiresAt,
    });
    await messages.sendSms({
      to: identifier,
      message: `Your Marketplace verification code is ${code}.`,
    });
  },

  async login(
    identifier: string,
    password: string,
    meta: { ip?: string; userAgent?: string }
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await usersRepository.findByIdentifier(identifier);
    if (!user) throw invalidCredentials();

    const passwordOk = await verifyPassword(user.passwordHash, password);
    if (!passwordOk) throw invalidCredentials();

    this.assertCanLogin(user);

    const tokens = await this.createSessionForUser(user, meta);
    await usersRepository.update(user.id, { lastLoginAt: new Date() });
    return { user: toPublicUser(user), tokens };
  },

  assertCanLogin(user: User): void {
    if (user.status === "PENDING_VERIFICATION") throw accountNotVerified();
    if (user.status === "SUSPENDED") throw accountSuspended();
    if (user.status === "DISABLED") throw accountDisabled();
  },

  async createSessionForUser(
    user: User,
    meta: { ip?: string; userAgent?: string }
  ): Promise<AuthTokens> {
    const refreshToken = generateOpaqueToken(48);
    const session = await authRepository.createSession({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
      ),
    });
    const accessToken = await signAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });
    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string): Promise<{
    user: PublicUser;
    tokens: AuthTokens;
  }> {
    const session = await authRepository.findSessionByRefreshTokenHash(
      hashToken(refreshToken)
    );
    if (!session || session.revokedAt) throw unauthorized("Invalid refresh token");
    if (session.expiresAt < new Date()) {
      await authRepository.revokeSession(session.id);
      throw unauthorized("Refresh token expired");
    }

    const user = await usersRepository.findById(session.userId);
    if (!user || user.status !== "ACTIVE") {
      await authRepository.revokeSession(session.id);
      throw unauthorized("Invalid refresh token");
    }

    const newRefreshToken = generateOpaqueToken(48);
    await authRepository.rotateSession(session.id, hashToken(newRefreshToken));

    const accessToken = await signAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    return {
      user: toPublicUser(user),
      tokens: { accessToken, refreshToken: newRefreshToken },
    };
  },

  async logoutByRefreshToken(refreshToken: string): Promise<void> {
    const session = await authRepository.findSessionByRefreshTokenHash(
      hashToken(refreshToken)
    );
    if (session && !session.revokedAt) {
      await authRepository.revokeSession(session.id);
    }
  },

  async revokeSession(sessionId: string): Promise<void> {
    await authRepository.revokeSession(sessionId);
  },

  async verifyEmail(token: string): Promise<PublicUser> {
    const record = await authRepository.findActiveTokenByTokenHash(
      "EMAIL_VERIFICATION",
      hashToken(token)
    );
    if (!record) throw invalidToken();
    if (record.expiresAt < new Date()) throw expiredToken();

    const user = await usersRepository.findById(record.userId);
    if (!user) throw invalidToken();

    await authRepository.consumeToken(record.id);
    const updated = await usersRepository.update(user.id, {
      emailVerifiedAt: new Date(),
      status:
        user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
    });
    return toPublicUser(updated);
  },

  async verifyPhone(identifier: string, code: string): Promise<PublicUser> {
    const user = await usersRepository.findByIdentifier(identifier);
    if (!user) throw invalidToken();

    const record = await authRepository.findLatestActiveToken(
      user.id,
      "PHONE_VERIFICATION"
    );
    if (!record) throw invalidToken();
    if (record.expiresAt < new Date()) throw expiredToken();

    if (record.codeHash !== hashToken(code)) {
      await authRepository.incrementAttempts(record.id);
      if (record.attempts + 1 >= MAX_CODE_ATTEMPTS) {
        await authRepository.consumeToken(record.id);
        throw tooManyAttempts();
      }
      throw invalidToken();
    }

    await authRepository.consumeToken(record.id);
    const updated = await usersRepository.update(user.id, {
      phoneVerifiedAt: new Date(),
      status:
        user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
    });
    return toPublicUser(updated);
  },

  async resendVerification(identifier: string): Promise<{
    channels: Array<"email" | "phone">;
  }> {
    const user = await usersRepository.findByIdentifier(identifier);
    if (!user || user.status !== "PENDING_VERIFICATION") {
      return { channels: [] };
    }

    const channels: Array<"email" | "phone"> = [];
    if (user.email && !user.emailVerifiedAt) {
      await this.sendVerification(user, "EMAIL_VERIFICATION", user.email);
      channels.push("email");
    }
    if (user.phone && !user.phoneVerifiedAt) {
      await this.sendVerification(user, "PHONE_VERIFICATION", user.phone);
      channels.push("phone");
    }
    return { channels };
  },

  async forgotPassword(identifier: string): Promise<void> {
    const user = await usersRepository.findByIdentifier(identifier);
    if (!user) return;

    await authRepository.revokeActiveTokens(user.id, "PASSWORD_RESET");

    const expiresAt = new Date(
      Date.now() + env.VERIFICATION_CODE_TTL_MINUTES * 60_000
    );

    if (user.email) {
      const token = generateOpaqueToken(32);
      await authRepository.createToken({
        userId: user.id,
        purpose: "PASSWORD_RESET",
        tokenHash: hashToken(token),
        expiresAt,
      });
      const url = `${env.WEB_APP_URL}/reset-password?token=${token}`;
      await messages.sendEmail({
        to: user.email,
        subject: "Reset your password — Marketplace",
        text: `Click this link to reset your password: ${url}`,
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
      return;
    }

    if (user.phone) {
      const code = generateVerificationCode();
      await authRepository.createToken({
        userId: user.id,
        purpose: "PASSWORD_RESET",
        tokenHash: hashToken(generateOpaqueToken()),
        codeHash: hashToken(code),
        expiresAt,
      });
      await messages.sendSms({
        to: user.phone,
        message: `Your Marketplace password reset code is ${code}.`,
      });
    }
  },

  async resetPassword(credential: string, newPassword: string): Promise<void> {
    const byCode = /^\d{6}$/.test(credential);
    const hash = hashToken(credential);

    const record = byCode
      ? await authRepository.findActiveTokenByCodeHash("PASSWORD_RESET", hash)
      : await authRepository.findActiveTokenByTokenHash("PASSWORD_RESET", hash);

    if (!record) throw invalidToken();
    if (record.expiresAt < new Date()) throw expiredToken();

    const user = await usersRepository.findById(record.userId);
    if (!user) throw invalidToken();

    await authRepository.consumeToken(record.id);
    await usersRepository.update(user.id, {
      passwordHash: await hashPassword(newPassword),
    });
    // Reset password => all sessions die so re-login is required.
    await authRepository.revokeUserSessions(user.id);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    keepSessionId: string
  ): Promise<void> {
    const user = await usersRepository.findById(userId);
    if (!user) throw unauthorized();

    const currentOk = await verifyPassword(user.passwordHash, currentPassword);
    if (!currentOk) throw invalidCredentials();

    await usersRepository.update(user.id, {
      passwordHash: await hashPassword(newPassword),
    });
    await authRepository.revokeUserSessionsExcept(userId, keepSessionId);
  },

  async listSessions(userId: string): Promise<SessionView[]> {
    const rows = await authRepository.listSessionsForUser(userId);
    return rows
      .filter((s) => s.revokedAt === null && s.expiresAt > new Date())
      .map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      }));
  },

  async revokeSessionForUser(userId: string, sessionId: string): Promise<void> {
    const session = await authRepository.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw unauthorized("Session not found");
    }
    await authRepository.revokeSession(sessionId);
  },

  async revokeOtherSessions(
    userId: string,
    keepSessionId: string
  ): Promise<void> {
    await authRepository.revokeUserSessionsExcept(userId, keepSessionId);
  },
};
