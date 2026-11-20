import { randomUUID } from "node:crypto";
import type {
  AllowedImageMimeType,
  MediaPurpose,
  PresignMediaInput,
} from "@marketplace/shared";
import { MAX_IMAGE_FILE_BYTES, MAX_IMAGE_FILE_MB, MEDIA_PURPOSES } from "@marketplace/shared";
import { env } from "../../config/env.js";
import type { Media } from "../../db/schema.js";
import {
  compressToWebp,
  extensionForFormat,
  inspectImage,
  makeThumbnail,
  mimeToFormat,
} from "../../lib/image.js";
import {
  forbidden,
  invalidMediaType,
  mediaFileTooLarge,
  mediaNotFound,
  mediaProcessingFailed,
} from "../../lib/errors.js";
import { createStorageProvider, type StorageProvider } from "../../providers/storage/index.js";
import { mediaRepository } from "./media.repository.js";

export interface PresignResultItem {
  key: string;
  uploadUrl: string;
  expiresAt: string;
}

interface ParsedKey {
  purpose: MediaPurpose;
  ownerId: string;
  extension: string;
}

function isValidPurpose(value: string | undefined): value is MediaPurpose {
  return (
    typeof value === "string" &&
    (MEDIA_PURPOSES as readonly string[]).includes(value)
  );
}

export function parseMediaKey(key: string): ParsedKey | null {
  const parts = key.split("/");
  if (parts.length !== 3) return null;
  const [purpose, ownerId, file] = parts;
  if (!isValidPurpose(purpose)) return null;
  if (!ownerId) return null;
  if (!file) return null;
  const dot = file.lastIndexOf(".");
  if (dot < 1) return null;
  return { purpose, ownerId, extension: file.slice(dot + 1) };
}

export function thumbnailKeyFor(objectKey: string): string {
  return `${objectKey.replace(/\.[^.]+$/, "")}.thumb.webp`;
}

function buildKey(
  purpose: MediaPurpose,
  ownerId: string,
  mimeType: AllowedImageMimeType
): string {
  const format = mimeToFormat(mimeType);
  const extension = format ? extensionForFormat(format) : "jpg";
  return `${purpose}/${ownerId}/${randomUUID()}.${extension}`;
}

export class MediaService {
  constructor(private readonly storage: StorageProvider) {}

  async presign(
    purpose: MediaPurpose,
    files: PresignMediaInput["files"],
    ownerId: string
  ): Promise<PresignResultItem[]> {
    const expiresAt = new Date(Date.now() + env.PRESIGN_TTL_SECONDS * 1000);
    return Promise.all(
      files.map(async (file) => {
        const key = buildKey(purpose, ownerId, file.mimeType);
        const uploadUrl = await this.storage.presignUpload({
          key,
          contentType: file.mimeType,
          expiresInSeconds: env.PRESIGN_TTL_SECONDS,
        });
        return { key, uploadUrl, expiresAt: expiresAt.toISOString() };
      })
    );
  }

  async confirm(
    key: string,
    position: number | undefined,
    ownerId: string
  ): Promise<Media> {
    const parsed = parseMediaKey(key);
    if (!parsed) throw mediaNotFound();
    if (parsed.ownerId !== ownerId) throw forbidden();

    let buffer: Buffer;
    try {
      buffer = await this.storage.getObject(key);
    } catch {
      throw mediaNotFound();
    }

    const info = await inspectImage(buffer);
    if (!info) {
      await this.storage.deleteObject(key).catch(() => undefined);
      throw invalidMediaType();
    }
    if (info.size > MAX_IMAGE_FILE_BYTES) {
      await this.storage.deleteObject(key).catch(() => undefined);
      throw mediaFileTooLarge(MAX_IMAGE_FILE_MB);
    }

    let compressed: Buffer;
    let thumbnail: Buffer;
    try {
      compressed = await compressToWebp(buffer, env.IMAGE_MAX_DIMENSION);
      thumbnail = await makeThumbnail(buffer, env.THUMBNAIL_SIZE);
    } catch {
      await this.storage.deleteObject(key).catch(() => undefined);
      throw mediaProcessingFailed();
    }

    const thumbKey = thumbnailKeyFor(key);
    try {
      await Promise.all([
        this.storage.putObject({ key, body: compressed, contentType: "image/webp" }),
        this.storage.putObject({ key: thumbKey, body: thumbnail, contentType: "image/webp" }),
      ]);
    } catch {
      throw mediaProcessingFailed();
    }

    const [url, thumbnailUrl] = await Promise.all([
      this.storage.getPublicUrl(key),
      this.storage.getPublicUrl(thumbKey),
    ]);

    return mediaRepository.insert({
      ownerId,
      purpose: parsed.purpose,
      objectKey: key,
      url,
      thumbnailUrl,
      mimeType: "image/webp",
      size: compressed.length,
      width: info.width,
      height: info.height,
      position: position ?? 0,
    });
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const row = await mediaRepository.findById(id);
    if (!row) throw mediaNotFound();
    if (row.ownerId !== ownerId) throw forbidden();

    await this.storage.deleteObject(row.objectKey).catch(() => undefined);
    await this.storage.deleteObject(thumbnailKeyFor(row.objectKey)).catch(() => undefined);
    await mediaRepository.deleteById(id);
  }
}

export const mediaService = new MediaService(createStorageProvider());
