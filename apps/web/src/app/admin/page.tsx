import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { AdminPage } from "@/components/admin-page";

export const metadata: Metadata = { title: translate("admin.title") };

export default function AdminRoute() {
  return <AdminPage />;
}
