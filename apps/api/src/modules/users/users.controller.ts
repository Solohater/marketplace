import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { usersRepository } from "./users.repository.js";
import { toPublicUser } from "./serializer.js";

export const usersController = {
  me: ((req, res) => {
    if (!req.auth) return;
    sendSuccess(res, { user: toPublicUser(req.auth.user) });
  }) as RequestHandler,

  updateMe: (async (req, res) => {
    const user = await usersRepository.update(req.auth!.userId, {
      fullName: req.body.fullName,
    });
    sendSuccess(res, { user: toPublicUser(user) });
  }) as RequestHandler,
};
