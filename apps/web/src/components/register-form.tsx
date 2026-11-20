"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

type VerificationChannels = Array<"email" | "phone">;

export function RegisterForm() {
  const { t, tOr } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [channels, setChannels] = useState<VerificationChannels>([]);
  const [busy, setBusy] = useState(false);

  function validate(): string | undefined {
    if (fullName.trim().length < 2) return t("register.error.invalidName");
    if (!email && !phone) return t("register.error.noContact");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t("register.error.invalidEmail");
    if (phone && !/^(\+?251|0)?9\d{8}$/.test(phone)) return t("register.error.invalidPhone");
    if (password.length < 8) return t("register.error.passwordTooShort");
    if (password !== confirm) return t("register.error.passwordMismatch");
    return undefined;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const data = await api<{ verificationChannels: VerificationChannels }>("/api/auth/register", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ fullName, email: email || null, phone: phone || null, password }),
      });
      setChannels(data.verificationChannels);
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`register.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const wantsEmail = channels.includes("email");
    const wantsPhone = channels.includes("phone");
    return (
      <div>
        <h1>{t("register.success.title")}</h1>
        <p className="subtitle">{t("register.success.subtitle")}</p>
        <SuccessBanner message={t("register.success.banner")} />
        <div className="form-actions">
          {wantsEmail && (
            <Link className="btn btn-primary" href="/verify-email">
              {t("register.success.verifyEmail")}
            </Link>
          )}
          {wantsPhone && (
            <Link className="btn btn-primary" href="/verify-phone">
              {t("register.success.verifyPhone")}
            </Link>
          )}
          <Link className="btn" href="/login">
            {t("register.success.goLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1>{t("register.title")}</h1>
      <p className="subtitle">{t("register.subtitle")}</p>
      <ErrorBanner message={error} />
      <Field label={t("register.fullNameLabel")}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </Field>
      <Field label={t("register.emailLabel")} hint={t("register.emailHint")}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </Field>
      <Field label={t("register.phoneLabel")} hint={t("register.phoneHint")}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </Field>
      <Field label={t("register.passwordLabel")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </Field>
      <Field label={t("register.confirmLabel")}>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
      </Field>
      <div className="form-actions">
        <Button type="submit" className="btn-primary" disabled={busy}>
          {t("register.submit")}
        </Button>
      </div>
      <p className="form-foot">
        {t("register.haveAccount")}{" "}
        <Link href="/login">{t("register.loginLink")}</Link>
      </p>
    </form>
  );
}
