import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { SellerProfilePage } from "@/components/seller-profile-page";

export const metadata: Metadata = { title: translate("seller.title") };

export default function SellerProfileRoute() {
  return <SellerProfilePage />;
}
