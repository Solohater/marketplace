import en from "./messages/en.json" with { type: "json" };

export const DEFAULT_LOCALE = "en" as const;

export type Locale = "en" | "am";

type Catalog = Record<string, unknown>;

const catalogs: Record<string, Catalog> = {
  en: en as Catalog,
};

/**
 * Registers a message catalog for a locale. Amharic (am) lands with ticket 42 —
 * adding it here means zero changes to components.
 */
export function registerLocale(locale: string, messages: unknown): void {
  catalogs[locale] = messages as Catalog;
}

function lookup(catalog: Catalog, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc === undefined || acc === null) return undefined;
    if (typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, catalog);
}

/**
 * i18n-ready translation helper. All user-facing strings must go through this
 * so Amharic can be added later without touching components.
 */
export function translate(
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const catalog = catalogs[locale] ?? en;
  const value = lookup(catalog, key);
  if (typeof value !== "string") return key;
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * Like `translate`, but returns `fallback` when the key has no message, so call
 * sites can fail gracefully instead of rendering the raw key.
 */
export function translateOr(
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const value = translate(key, params, locale);
  return value === key ? fallback : value;
}

export { en as enMessages };
