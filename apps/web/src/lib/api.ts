import type { ApiFailure } from "@marketplace/shared";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  skipRetry?: boolean;
}

let refreshing: Promise<boolean> | null = null;

/** Posts to the refresh endpoint; single-flight so concurrent 401s share one call. */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      return res.ok;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipRetry = false, headers, ...rest } = options;
  const doFetch = () =>
    fetch(path, {
      ...rest,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
    });

  let res = await doFetch();
  if (res.status === 401 && !skipRetry && !path.startsWith("/api/auth/")) {
    const ok = await refreshAccessToken();
    if (ok) res = await doFetch();
  }

  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as ApiFailure;
      code = body.error?.code;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, code);
  }

  return (await res.json()) as T;
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST", skipRetry: true });
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
