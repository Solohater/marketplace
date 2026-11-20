import type { Metadata } from "next";
import { BrowsePage } from "@/components/browse-page";

export const metadata: Metadata = { title: "Browse Listings" };

export default function BrowseRoute() {
  return <BrowsePage />;
}
