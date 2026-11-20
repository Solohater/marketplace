"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

type State =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "expired" }
  | { kind: "error"; message: string };

export function VerifyEmailForm({ token: initialToken }: { token?: string }) {
  const { t, tOr } = useI18n();
  const [token, setToken] = useState(initialToken ?? "");
  const [state, setState] = useState<State>(initialToken ? { kind: "verifying" } : { kind: "idle" });
  const [resending, setResending] = useState(false);

  async function verify(value: string) {
    setState({ kind: "verifying" });
    try {
      await api(`/api/auth/verify-email?token=${encodeURIComponent(value)}`, {
        skipRetry: true,
      });
      setState({ kind: "success" });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === "EXPIRED_TOKEN") {
        setState({ kind: "expired" });
      } else {
        setState({ kind: "error", message: t("errors.generic") });
      }
    }
  }

  useEffect(() => {
    if (initialToken) void verify(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  async function resend() {
    setResending(true);
    try {
      await api("/api/auth/resend-verification", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ type: "email" }),
      });
      setState({ kind: "success" });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setState({
        kind: "error",
        message: code ? tOr(`resend.error.${code}`, t("errors.generic")) : t("errors.generic"),
      });
    } finally {
      setResending(false);
    }
  }

  if (state.kind === "success") {
    return (
      <div>
        <h1>{t("verifyEmail.title")}</h1>
        <SuccessBanner message={t("verifyEmail.success")} />
        <div className="form-actions">
          <a className="btn btn-primary" href="/login">
            {t("verifyEmail.goLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(token);
      }}
    >
      <h1>{t("verifyEmail.title")}</h1>
      <p className="subtitle">{t("verifyEmail.subtitle")}</p>
      {state.kind === "expired" && <ErrorBanner message={t("verifyEmail.expired")} />}
      {state.kind === "error" && <ErrorBanner message={state.message} />}
      {state.kind === "verifying" && <p className="banner">{t("verifyEmail.verifying")}</p>}
      <Field label={t("verifyEmail.tokenLabel")}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t("verifyEmail.tokenPlaceholder")}
        />
      </Field>
      <div className="form-actions">
        <Button type="submit" className="btn-primary" disabled={state.kind === "verifying"}>
          {t("verifyEmail.submit")}
        </Button>
        <Button type="button" onClick={() => void resend()} disabled={resending}>
          {t("verifyEmail.resend")}
        </Button>
      </div>
    </form>
  );
}
