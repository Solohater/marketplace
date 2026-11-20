import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { sellerProfilesService } from "./sellers.service.js";

export const sellerProfilesController = {
  createProfile: (async (req, res) => {
    const profile = await sellerProfilesService.createProfile(
      req.auth!.userId,
      req.body
    );
    sendSuccess(res, { profile }, 201);
  }) as RequestHandler,

  getMyProfile: (async (req, res) => {
    const profile = await sellerProfilesService.getProfile(req.auth!.userId);
    if (!profile) {
      sendSuccess(res, { profile: null });
      return;
    }
    sendSuccess(res, { profile });
  }) as RequestHandler,

  updateProfile: (async (req, res) => {
    const profile = await sellerProfilesService.updateProfile(
      req.auth!.userId,
      req.body
    );
    sendSuccess(res, { profile });
  }) as RequestHandler,

  getPublicStorefront: (async (req, res) => {
    const storefront = await sellerProfilesService.getPublicStorefront(
      String(req.params.userId)
    );
    if (!storefront) {
      sendSuccess(res, { error: "Seller not found" }, 404);
      return;
    }
    sendSuccess(res, { storefront });
  }) as RequestHandler,

  listSellers: (async (req, res) => {
    const { page, pageSize } = (req.validated?.query ?? {}) as {
      page?: number;
      pageSize?: number;
    };
    const result = await sellerProfilesService.listSellers(page, pageSize);
    sendSuccess(res, result);
  }) as RequestHandler,
};
