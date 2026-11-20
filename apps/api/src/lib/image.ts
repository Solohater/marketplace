import sharp from "sharp";

const FORMAT_TO_MIME = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type SupportedFormat = keyof typeof FORMAT_TO_MIME;

export interface ImageInfo {
  format: SupportedFormat;
  width: number;
  height: number;
  size: number;
}

/** Reads the actual format + dimensions of a buffer. Returns null if not an image. */
export async function inspectImage(buffer: Buffer): Promise<ImageInfo | null> {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.format || !meta.width || !meta.height) return null;
    if (!(meta.format in FORMAT_TO_MIME)) return null;
    return {
      format: meta.format as SupportedFormat,
      width: meta.width,
      height: meta.height,
      size: buffer.length,
    };
  } catch {
    return null;
  }
}

export function mimeToFormat(mime: string): SupportedFormat | undefined {
  const entry = Object.entries(FORMAT_TO_MIME).find(
    ([, value]) => value === mime
  );
  return entry?.[0] as SupportedFormat | undefined;
}

export function extensionForFormat(format: SupportedFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

/**
 * Re-encodes an image as WEBP (lossy compression) and constrains it to
 * `maxDimension`, preserving EXIF orientation. Never upscales.
 */
export async function compressToWebp(
  buffer: Buffer,
  maxDimension: number
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Creates a square WEBP thumbnail of the given size (crop to fill). */
export async function makeThumbnail(
  buffer: Buffer,
  size: number
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();
}
