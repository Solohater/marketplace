"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

interface SessionInfo {
  id: string;
  current: boolean;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

export function AccountPage() {
  const { t, tOr } = useI18n();
  const router = useRouter();
  const { user, loading } = useMe();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api<{ sessions: SessionInfo[] }>("/api/auth/sessions");
      setSessions(data.sessions);
    } catch {
      // ignore; the page still renders the profile
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeOthers() {
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await api("/api/auth/sessions", { method: "DELETE" });
      setMessage(t("account.sessionsRevoked"));
      await loadSessions();
    } catch (err) {
      setError(err instanceof ApiError ? t("errors.generic") : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        skipRetry: true,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("account.passwordChanged"));
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? tOr(`changePassword.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function doLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  if (loading || !user) {
    return <p className="empty">{t("account.loading")}</p>;
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t("account.title")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn" href="/account/media">
            {t("nav.media")}
          </a>
          <Button className="btn-danger" onClick={() => void doLogout()}>
            {t("account.logout")}
          </Button>
        </div>
      </div>

      <div className="profile card" style={{ padding: 16 }}>
        <div className="avatar">{user.fullName.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user.fullName}</h2>
          <p className="muted">
            {[user.email, user.phone].filter(Boolean).join(" · ")}
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <span className={`badge badge-${user.role.toLowerCase()}`}>{t(`roles.${user.role}`)}</span>
            <span className={`badge badge-${user.status.toLowerCase()}`}>{t(`statuses.${user.status}`)}</span>
          </div>
        </div>
      </div>

      <div className="grid">
        <section className="section card">
          <div style={{ padding: "16px 16px 0" }}>
            <h2>{t("account.sessionsTitle")}</h2>
          </div>
          {sessions.length === 0 ? (
            <p className="empty">{t("account.noSessions")}</p>
          ) : (
            sessions.map((session) => (
              <div className="session-row" key={session.id}>
                <div>
                  <div>
                    {session.userAgent || t("account.unknownDevice")}
                    {session.current && (
                      <span className="session-current"> · {t("account.currentDevice")}</span>
                    )}
                  </div>
                  <div className="session-meta">
                    {t("account.lastActive")}:{" "}
                    {session.lastActiveAt
                      ? new Date(session.lastActiveAt).toLocaleString()
                      : new Date(session.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div style={{ padding: 16 }}>
            <Button type="button" className="btn-block" onClick={() => void revokeOthers()} disabled={busy}>
              {t("account.revokeOthers")}
            </Button>
          </div>
        </section>

        <section className="section card">
          <form onSubmit={changePassword} noValidate style={{ padding: 16 }}>
            <h2>{t("account.changePasswordTitle")}</h2>
            <ErrorBanner message={error} />
            <SuccessBanner message={message} />
            <Field label={t("account.currentPasswordLabel")}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Field label={t("account.newPasswordLabel")}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="btn-primary btn-block" disabled={busy}>
              {t("account.changePassword")}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
