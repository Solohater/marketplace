import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { usersRepository } from "../users/users.repository.js";

export const adminController = {
  listUsers: (async (req, res) => {
    const { page, pageSize } = (req.validated?.query ?? {}) as {
      page: number;
      pageSize: number;
    };
    const result = await usersRepository.listAll(page, pageSize);
    sendSuccess(res, result);
  }) as RequestHandler,

  stats: (async (_req, res) => {
    const [totalUsers, activeUsers] = await Promise.all([
      usersRepository.countAll(),
      usersRepository.countActive(),
    ]);
    sendSuccess(res, { totalUsers, activeUsers });
  }) as RequestHandler,
};
