import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/password.js";

describe("password hashing (argon2id)", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    await expect(verifyPassword(hash, "secret123")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("secret123");
    await expect(verifyPassword(hash, "not-the-password")).resolves.toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    const a = await hashPassword("secret123");
    const b = await hashPassword("secret123");
    expect(a).not.toBe(b);
  });
});
