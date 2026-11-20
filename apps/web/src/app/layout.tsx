import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { translate } from "@marketplace/shared";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marketplace",
    template: "%s · Marketplace",
  },
  description: "Ethiopia's marketplace for phones, tablets and laptops",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <header className="site-header">
            <Link href="/" className="brand">
              Marketplace
            </Link>
            <nav>
              <Link href="/browse">{translate("nav.browse")}</Link>
              <Link href="/login">{translate("nav.login")}</Link>
              <Link href="/register">{translate("nav.register")}</Link>
              <Link href="/account">{translate("nav.account")}</Link>
              <Link href="/account/seller">{translate("nav.seller")}</Link>
              <Link href="/admin">{translate("nav.admin")}</Link>
            </nav>
          </header>
          <main className="main">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
