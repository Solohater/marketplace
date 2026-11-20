import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { AccountPage } from "@/components/account-page";

export const metadata: Metadata = { title: translate("account.title") };

export default function AccountRoute() {
  return <AccountPage />;
}
