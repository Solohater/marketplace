"use client";

import { useEffect, useState } from "react";
import type { PublicUser } from "@marketplace/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface AdminStats {
  users: number;
  verifiedUsers: number;
  admins: number;
  sellers: number;
  pendingVerification: number;
}

export function AdminPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    void api<{ stats: AdminStats }>("/api/admin/stats")
      .then((d) => setStats(d.stats))
      .catch(() => {});
    void api<{ users: PublicUser[] }>("/api/admin/users")
      .then((d) => setUsers(d.users))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>{t("admin.title")}</h1>
      </div>

      <div className="grid" style={{ marginBottom: 28 }}>
        {[
          { label: t("admin.statUsers"), value: stats?.users ?? 0 },
          { label: t("admin.statVerified"), value: stats?.verifiedUsers ?? 0 },
          { label: t("admin.statSellers"), value: stats?.sellers ?? 0 },
          { label: t("admin.statPending"), value: stats?.pendingVerification ?? 0 },
        ].map((stat) => (
          <div className="card" key={stat.label} style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
            <div className="muted" style={{ color: "var(--muted)", fontSize: 14 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <section className="section card">
        <div style={{ padding: "16px 16px 0" }}>
          <h2>{t("admin.usersTitle")}</h2>
        </div>
        {users.length === 0 ? (
          <p className="empty">{t("admin.noUsers")}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("admin.colName")}</th>
                <th>{t("admin.colContact")}</th>
                <th>{t("admin.colRole")}</th>
                <th>{t("admin.colStatus")}</th>
                <th>{t("admin.colJoined")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{[user.email, user.phone].filter(Boolean).join(" · ")}</td>
                  <td>
                    <span className={`badge badge-${user.role.toLowerCase()}`}>
                      {t(`roles.${user.role}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${user.status.toLowerCase()}`}>
                      {t(`statuses.${user.status}`)}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
