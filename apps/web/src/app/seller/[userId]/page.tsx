import type { Metadata } from "next";
import { StorefrontPage } from "@/components/storefront-page";

export const metadata: Metadata = { title: "Seller Storefront" };

export default function StorefrontRoute() {
  return <StorefrontPage />;
}
