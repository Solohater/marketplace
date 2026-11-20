import type { Metadata } from "next";
import { ListingDetailPage } from "@/components/listing-detail-page";

export const metadata: Metadata = { title: "Listing Details" };

export default function ListingDetailRoute() {
  return <ListingDetailPage />;
}
