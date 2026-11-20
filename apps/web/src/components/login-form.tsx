"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const { t, tOr } = useI18n();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const data = await api<{ user: { role: string } }>("/api/auth/login", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ identifier, password }),
      });
      const target = next || (data.user.role === "ADMIN" ? "/admin" : "/account");
      router.replace(target);
      router.refresh();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`login.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1>{t("login.title")}</h1>
      <p className="subtitle">{t("login.subtitle")}</p>
      <ErrorBanner message={error} />
      <Field label={t("login.identifierLabel")}>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t("login.identifierPlaceholder")}
          required
          autoComplete="username"
        />
      </Field>
      <Field label={t("login.passwordLabel")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("login.passwordPlaceholder")}
          required
          autoComplete="current-password"
        />
      </Field>
      <div className="form-actions">
        <Button type="submit" className="btn-primary" disabled={busy}>
          {t("login.submit")}
        </Button>
      </div>
      <p className="form-foot">
        {t("login.noAccount")}{" "}
        <Link href="/register">{t("login.registerLink")}</Link>
        {" · "}
        <Link href="/forgot-password">{t("login.forgotLink")}</Link>
      </p>
    </form>
  );
}
