import { Router, type Request, type RequestHandler } from "express";
import {
  MAX_IMAGE_FILE_BYTES,
  MAX_IMAGE_FILE_MB,
} from "@marketplace/shared";
import {
  forbidden,
  mediaFileTooLarge,
  mediaUploadExpired,
  notFound,
  validationError,
} from "../../lib/errors.js";
import { sendSuccess } from "../../lib/http.js";
import { LocalStorageProvider } from "../../providers/storage/local.js";
import { createStorageProvider } from "../../providers/storage/index.js";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Sniffs magic bytes; extension only as a fallback (keys keep the original extension). */
function sniffContentType(buffer: Buffer, ext: string): string {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Express 5 params can be `string | string[] | undefined`; extract a string. */
function param(req: Request, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

/**
 * Routes that make the local filesystem provider behave like presigned object
 * storage: PUT /upload/:key (HMAC-signed, short-lived) and GET /raw/:key.
 * Only active when STORAGE_PROVIDER=local; otherwise they 404.
 */
export const localMediaRouter = Router();

const provider = createStorageProvider();

localMediaRouter.put("/upload/:key", (async (req, res, next) => {
  try {
    if (!(provider instanceof LocalStorageProvider)) throw notFound();

    const key = param(req, "key");
    const expires = Number(req.query.expires);
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!expires || expires < Math.floor(Date.now() / 1000)) {
      throw mediaUploadExpired();
    }
    if (!token || !key || !provider.verify(key, expires, token)) {
      throw forbidden("Invalid or expired upload link");
    }

    const declaredLength = Number(req.headers["content-length"] ?? 0);
    if (declaredLength > MAX_IMAGE_FILE_BYTES) {
      throw mediaFileTooLarge(MAX_IMAGE_FILE_MB);
    }

    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of req) {
      const buf = chunk as Buffer;
      total += buf.length;
      if (total > MAX_IMAGE_FILE_BYTES) {
        throw mediaFileTooLarge(MAX_IMAGE_FILE_MB);
      }
      chunks.push(buf);
    }
    if (total === 0) {
      throw validationError([{ code: "empty_body", message: "Upload body is empty" }]);
    }

    const declaredType = req.headers["content-type"];
    const contentType =
      typeof declaredType === "string" && declaredType
        ? declaredType
        : (MIME_BY_EXT[key.split(".").pop() ?? ""] ?? "application/octet-stream");

    await provider.putObject({ key, body: Buffer.concat(chunks), contentType });
    sendSuccess(res, { uploaded: true });
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

localMediaRouter.get("/raw/:key", (async (req, res, next) => {
  try {
    if (!(provider instanceof LocalStorageProvider)) throw notFound();
    const key = param(req, "key");
    const buffer = await provider.getObject(key);
    const ext = key.split(".").pop() ?? "";
    res.setHeader("Content-Type", sniffContentType(buffer, ext));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch {
    next(notFound());
  }
}) as RequestHandler);
