import type { RequestHandler } from "express";
import type {
  ConfirmMediaInput,
  ListMediaQuery,
  PresignMediaInput,
} from "@marketplace/shared";
import type { MediaPurpose } from "@marketplace/shared";
import { env } from "../../config/env.js";
import { mediaNotFound } from "../../lib/errors.js";
import { sendSuccess } from "../../lib/http.js";
import { mediaRepository } from "./media.repository.js";
import { toMediaItem } from "./media.serializer.js";
import { mediaService } from "./media.service.js";

export const mediaController = {
  presign: (async (req, res) => {
    const { purpose, files } = req.validated?.body as PresignMediaInput;
    const userId = req.auth!.userId;
    const items = await mediaService.presign(purpose, files, userId);
    sendSuccess(res, { purpose, items, expiresInSeconds: env.PRESIGN_TTL_SECONDS });
  }) as RequestHandler,

  confirm: (async (req, res) => {
    const { key, position } = req.validated?.body as ConfirmMediaInput;
    const row = await mediaService.confirm(key, position, req.auth!.userId);
    sendSuccess(res, { media: toMediaItem(row) }, 201);
  }) as RequestHandler,

  list: (async (req, res) => {
    const { purpose, page, pageSize } = req.validated?.query as ListMediaQuery;
    const { items, total } = await mediaRepository.listByOwner(
      req.auth!.userId,
      purpose,
      page,
      pageSize
    );
    sendSuccess(res, {
      items: items.map(toMediaItem),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }) as RequestHandler,

  remove: (async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) throw mediaNotFound();
    await mediaService.remove(id, req.auth!.userId);
    sendSuccess(res, { deleted: true });
  }) as RequestHandler,
};

export type { MediaPurpose };
