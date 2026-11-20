import { describe, expect, it } from "vitest";
import {
  generateOpaqueToken,
  generateVerificationCode,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} from "../../src/lib/tokens.js";

describe("tokens & codes", () => {
  it("signs and verifies an access token", async () => {
    const token = await signAccessToken({ sub: "u1", sid: "s1", role: "USER" });
    const payload = await verifyAccessToken(token);
    expect(payload).toEqual({ sub: "u1", sid: "s1", role: "USER" });
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken({ sub: "u1", sid: "s1", role: "USER" });
    await expect(
      verifyAccessToken(`${token}x`)
    ).rejects.toThrow();
  });

  it("hashes tokens deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("generates opaque tokens", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it("generates 6-digit verification codes", () => {
    expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    expect(generateVerificationCode(8)).toMatch(/^\d{8}$/);
  });
});
