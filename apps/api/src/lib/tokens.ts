import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: string;
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ sid: payload.sid, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("marketplace-api")
    .setAudience("marketplace-web")
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: "marketplace-api",
    audience: "marketplace-web",
  });
  const { sub, sid, role } = payload;
  if (
    typeof sub !== "string" ||
    typeof sid !== "string" ||
    typeof role !== "string"
  ) {
    throw new Error("Malformed access token payload");
  }
  return { sub, sid, role };
}

/** One-way hash for secrets we only ever compare (refresh tokens, codes). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

export function generateVerificationCode(length = 6): string {
  const digits = "0123456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte === undefined) break;
    code += digits[byte % 10];
  }
  return code;
}
