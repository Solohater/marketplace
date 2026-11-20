"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

export function ResetPasswordForm({ token }: { token?: string }) {
  const { t, tOr } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError(t("reset.missingToken"));
      return;
    }
    if (password.length < 8) {
      setError(t("reset.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.passwordMismatch"));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`reset.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1>{t("reset.successTitle")}</h1>
        <SuccessBanner message={t("reset.success")} />
        <div className="form-actions">
          <Link className="btn btn-primary" href="/login">
            {t("reset.goLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1>{t("reset.title")}</h1>
      <p className="subtitle">{t("reset.subtitle")}</p>
      <ErrorBanner message={error} />
      <Field label={t("reset.passwordLabel")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </Field>
      <Field label={t("reset.confirmLabel")}>
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
          {t("reset.submit")}
        </Button>
      </div>
    </form>
  );
}
