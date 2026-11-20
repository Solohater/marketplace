import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  sessions,
  verificationTokens,
  type NewSession,
  type NewVerificationToken,
  type Session,
  type TokenPurpose,
  type VerificationToken,
} from "../../db/schema.js";

export const authRepository = {
  // --- sessions ---
  async createSession(input: NewSession): Promise<Session> {
    const [row] = await db.insert(sessions).values(input).returning();
    if (!row) throw new Error("Failed to create session");
    return row;
  },

  async findSessionById(id: string): Promise<Session | undefined> {
    return db.query.sessions.findFirst({ where: eq(sessions.id, id) });
  },

  async findSessionByRefreshTokenHash(
    hash: string
  ): Promise<Session | undefined> {
    return db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, hash),
    });
  },

  async rotateSession(
    id: string,
    newRefreshTokenHash: string
  ): Promise<void> {
    await db
      .update(sessions)
      .set({ refreshTokenHash: newRefreshTokenHash, lastActiveAt: new Date() })
      .where(eq(sessions.id, id));
  },

  async revokeSession(id: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  },

  async revokeUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  },

  async revokeUserSessionsExcept(
    userId: string,
    keepSessionId: string
  ): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          sql`${sessions.id} != ${keepSessionId}`
        )
      );
  },

  async listSessionsForUser(userId: string): Promise<Session[]> {
    return db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: desc(sessions.createdAt),
    });
  },

  // --- verification tokens ---
  async createToken(input: NewVerificationToken): Promise<VerificationToken> {
    const [row] = await db.insert(verificationTokens).values(input).returning();
    if (!row) throw new Error("Failed to create verification token");
    return row;
  },

  async findActiveTokenByTokenHash(
    purpose: TokenPurpose,
    hash: string
  ): Promise<VerificationToken | undefined> {
    return db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.purpose, purpose),
        eq(verificationTokens.tokenHash, hash),
        isNull(verificationTokens.consumedAt)
      ),
    });
  },

  async findActiveTokenByCodeHash(
    purpose: TokenPurpose,
    hash: string
  ): Promise<VerificationToken | undefined> {
    return db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.purpose, purpose),
        eq(verificationTokens.codeHash, hash),
        isNull(verificationTokens.consumedAt)
      ),
      orderBy: desc(verificationTokens.createdAt),
    });
  },

  async findLatestActiveToken(
    userId: string,
    purpose: TokenPurpose
  ): Promise<VerificationToken | undefined> {
    return db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.purpose, purpose),
        isNull(verificationTokens.consumedAt)
      ),
      orderBy: desc(verificationTokens.createdAt),
    });
  },

  async consumeToken(id: string): Promise<void> {
    await db
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, id));
  },

  async incrementAttempts(id: string): Promise<void> {
    await db
      .update(verificationTokens)
      .set({ attempts: sql`${verificationTokens.attempts} + 1` })
      .where(eq(verificationTokens.id, id));
  },

  async revokeActiveTokens(
    userId: string,
    purpose: TokenPurpose
  ): Promise<void> {
    await db
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.purpose, purpose),
          isNull(verificationTokens.consumedAt)
        )
      );
  },
};
