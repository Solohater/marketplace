import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { MediaLibraryPage } from "@/components/media-library";

export const metadata: Metadata = { title: translate("media.title") };

export default function MediaRoute() {
  return <MediaLibraryPage />;
}
