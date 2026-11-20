"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

export function VerifyPhoneForm({ phone: initialPhone }: { phone?: string }) {
  const { t, tOr } = useI18n();
  const [identifier, setIdentifier] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api("/api/auth/verify-phone", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ identifier, code }),
      });
      setSuccess(t("verifyPhone.success"));
    } catch (err) {
      const code2 = err instanceof ApiError ? err.code : undefined;
      setError(code2 ? tOr(`verifyPhone.error.${code2}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api("/api/auth/resend-verification", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ type: "phone", identifier }),
      });
      setSuccess(t("verifyPhone.resent"));
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`verifyPhone.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitCode} noValidate>
      <h1>{t("verifyPhone.title")}</h1>
      <p className="subtitle">{t("verifyPhone.subtitle")}</p>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <Field label={t("verifyPhone.phoneLabel")}>
        <input
          type="tel"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
      </Field>
      <Field label={t("verifyPhone.codeLabel")}>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
        />
      </Field>
      <div className="form-actions">
        <Button type="submit" className="btn-primary" disabled={busy}>
          {t("verifyPhone.submit")}
        </Button>
        <Button type="button" onClick={() => void resend()} disabled={busy}>
          {t("verifyPhone.resend")}
        </Button>
      </div>
    </form>
  );
}
