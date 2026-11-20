"use client";

import { useEffect, useState } from "react";
import type { PublicUser } from "@marketplace/shared";
import { api } from "@/lib/api";

export function useMe() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<{ user: PublicUser }>("/api/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        // route protection is handled by the middleware
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
