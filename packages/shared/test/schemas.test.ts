import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  verifyPhoneSchema,
} from "../src/auth/schemas.js";

describe("registerSchema", () => {
  it("accepts email-only registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      email: "abebe@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone-only registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      phone: "0912345678",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neither email nor phone is present", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      phone: "12345",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weak password", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      email: "abebe@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("treats empty string contacts as absent", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      email: "",
      phone: "0912345678",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("treats a null contact as absent while keeping the other", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      email: "abebe@example.com",
      phone: null,
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when all contacts are null", () => {
    const result = registerSchema.safeParse({
      fullName: "Abebe Kebede",
      email: null,
      phone: null,
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email or phone identifier", () => {
    expect(
      loginSchema.safeParse({ identifier: "0912345678", password: "x" }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ identifier: "a@b.c", password: "x" }).success
    ).toBe(true);
  });

  it("rejects an empty identifier", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(
      false
    );
  });
});

describe("verifyPhoneSchema", () => {
  it("requires a 6-digit code", () => {
    expect(
      verifyPhoneSchema.safeParse({ identifier: "0912345678", code: "123456" })
        .success
    ).toBe(true);
    expect(
      verifyPhoneSchema.safeParse({ identifier: "0912345678", code: "12" })
        .success
    ).toBe(false);
  });
});
