"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, translate, translateOr, type Locale } from "@marketplace/shared";

interface I18nValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  tOr: (key: string, fallback: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: (key, params) => translate(key, params, DEFAULT_LOCALE),
  tOr: (key, fallback, params) => translateOr(key, fallback, params, DEFAULT_LOCALE),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      locale: DEFAULT_LOCALE,
      t: (key, params) => translate(key, params, DEFAULT_LOCALE),
      tOr: (key, fallback, params) => translateOr(key, fallback, params, DEFAULT_LOCALE),
    }),
    []
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
