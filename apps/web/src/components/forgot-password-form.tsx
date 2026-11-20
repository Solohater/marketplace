"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

export function ForgotPasswordForm() {
  const { t, tOr } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ identifier }),
      });
      setSent(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`forgot.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h1>{t("forgot.successTitle")}</h1>
        <SuccessBanner message={t("forgot.success")} />
        <div className="form-actions">
          <Link className="btn btn-primary" href="/login">
            {t("forgot.goLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1>{t("forgot.title")}</h1>
      <p className="subtitle">{t("forgot.subtitle")}</p>
      <ErrorBanner message={error} />
      <Field label={t("forgot.identifierLabel")}>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t("forgot.identifierPlaceholder")}
          required
        />
      </Field>
      <div className="form-actions">
        <Button type="submit" className="btn-primary" disabled={busy}>
          {t("forgot.submit")}
        </Button>
      </div>
      <p className="form-foot">
        {t("forgot.remembered")}{" "}
        <Link href="/login">{t("forgot.loginLink")}</Link>
      </p>
    </form>
  );
}
