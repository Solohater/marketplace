import type { MediaItem } from "@marketplace/shared";
import type { Media } from "../../db/schema.js";

export function toMediaItem(row: Media): MediaItem {
  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnailUrl,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}
