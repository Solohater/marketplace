import { z } from "zod";

export const MEDIA_PURPOSES = ["listing", "chat", "avatar"] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_IMAGES_PER_BATCH = 10;
export const MAX_IMAGE_FILE_MB = 10;
export const MAX_IMAGE_FILE_BYTES = MAX_IMAGE_FILE_MB * 1024 * 1024;

export const presignMediaSchema = z.object({
  purpose: z.enum(MEDIA_PURPOSES),
  files: z
    .array(
      z.object({
        mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
          message: "Only JPG, PNG and WEBP images are allowed",
        }),
        size: z
          .number()
          .int()
          .positive()
          .max(
            MAX_IMAGE_FILE_BYTES,
            `Files must be ${MAX_IMAGE_FILE_MB}MB or smaller`
          ),
      })
    )
    .min(1, "At least one file is required")
    .max(
      MAX_IMAGES_PER_BATCH,
      `At most ${MAX_IMAGES_PER_BATCH} images per upload`
    ),
});

export type PresignMediaInput = z.infer<typeof presignMediaSchema>;

export const confirmMediaSchema = z.object({
  key: z.string().min(1, "Missing object key").max(500),
  position: z.number().int().min(0).max(999).optional(),
});

export type ConfirmMediaInput = z.infer<typeof confirmMediaSchema>;

export const listMediaQuerySchema = z.object({
  purpose: z.enum(MEDIA_PURPOSES).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  position: number;
  createdAt: string;
}
