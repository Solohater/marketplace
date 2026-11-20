import { describe, expect, it } from "vitest";
import { registerLocale, translate } from "../src/i18n/translate.js";

describe("translate", () => {
  it("returns the catalog string for a nested key", () => {
    expect(translate("login.title")).toBe("Log in");
  });

  it("interpolates parameters", () => {
    expect(translate("register.success.successEmail", { email: "a@b.c" })).toContain(
      "a@b.c"
    );
  });

  it("returns the key itself when missing", () => {
    expect(translate("missing.key.here")).toBe("missing.key.here");
  });

  it("supports registering additional locales (Amharic later)", () => {
    registerLocale("am", { login: { title: "ግባ" } });
    expect(translate("login.title", undefined, "am")).toBe("ግባ");
  });
});
