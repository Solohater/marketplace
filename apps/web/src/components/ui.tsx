"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function Button({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className ? `btn ${className}` : "btn"} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-error">{t("forms.hintPrefix")} {hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="banner banner-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="banner banner-success" role="status">
      {message}
    </div>
  );
}
