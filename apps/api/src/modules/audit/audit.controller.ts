import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { auditService } from "./audit.service.js";

export const auditController = {
  getLogs: (async (req, res) => {
    const { page, pageSize, actorId, action, entity } = (req.validated?.query ?? {}) as {
      page?: number;
      pageSize?: number;
      actorId?: string;
      action?: string;
      entity?: string;
    };
    const logs = await auditService.getLogs({
      page,
      pageSize,
      actorId,
      action,
      entity,
    });
    sendSuccess(res, { logs });
  }) as RequestHandler,

  getLogById: (async (req, res) => {
    const log = await auditService.getLogById(String(req.params.id));
    if (!log) {
      sendSuccess(res, { error: "Log not found" }, 404);
      return;
    }
    sendSuccess(res, { log });
  }) as RequestHandler,
};
