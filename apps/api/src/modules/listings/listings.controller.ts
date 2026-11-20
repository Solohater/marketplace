import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { listingsService } from "./listings.service.js";

export const listingsController = {
  createListing: (async (req, res) => {
    const listing = await listingsService.createListing(
      req.auth!.userId,
      req.body
    );
    sendSuccess(res, { listing }, 201);
  }) as RequestHandler,

  getListing: (async (req, res) => {
    const listing = await listingsService.getListing(String(req.params.id));
    if (!listing) {
      sendSuccess(res, { error: "Listing not found" }, 404);
      return;
    }
    sendSuccess(res, { listing });
  }) as RequestHandler,

  getMyListings: (async (req, res) => {
    const { page, pageSize } = (req.validated?.query ?? {}) as {
      page?: number;
      pageSize?: number;
    };
    const result = await listingsService.getSellerListings(
      req.auth!.userId,
      page,
      pageSize
    );
    sendSuccess(res, result);
  }) as RequestHandler,

  updateListing: (async (req, res) => {
    const listing = await listingsService.updateListing(
      String(req.params.id),
      req.auth!.userId,
      req.body
    );
    sendSuccess(res, { listing });
  }) as RequestHandler,

  deleteListing: (async (req, res) => {
    await listingsService.deleteListing(
      String(req.params.id),
      req.auth!.userId
    );
    sendSuccess(res, { success: true });
  }) as RequestHandler,

  submitForReview: (async (req, res) => {
    const listing = await listingsService.submitForReview(
      String(req.params.id),
      req.auth!.userId
    );
    sendSuccess(res, { listing });
  }) as RequestHandler,

  approveListing: (async (req, res) => {
    const listing = await listingsService.approveListing(String(req.params.id));
    sendSuccess(res, { listing });
  }) as RequestHandler,

  rejectListing: (async (req, res) => {
    const { reason } = req.body as { reason?: string };
    const listing = await listingsService.rejectListing(
      String(req.params.id),
      reason ?? ""
    );
    sendSuccess(res, { listing });
  }) as RequestHandler,

  suspendListing: (async (req, res) => {
    const listing = await listingsService.suspendListing(String(req.params.id));
    sendSuccess(res, { listing });
  }) as RequestHandler,

  markAsSold: (async (req, res) => {
    const listing = await listingsService.markAsSold(
      String(req.params.id),
      req.auth!.userId
    );
    sendSuccess(res, { listing });
  }) as RequestHandler,

  markAsReserved: (async (req, res) => {
    const listing = await listingsService.markAsReserved(
      String(req.params.id),
      req.auth!.userId
    );
    sendSuccess(res, { listing });
  }) as RequestHandler,

  getModerationQueue: (async (req, res) => {
    const { page, pageSize } = (req.validated?.query ?? {}) as {
      page?: number;
      pageSize?: number;
    };
    const result = await listingsService.getModerationQueue(page, pageSize);
    sendSuccess(res, result);
  }) as RequestHandler,

  listPublic: (async (req, res) => {
    const query = (req.validated?.query ?? {}) as Record<string, unknown>;
    const result = await listingsService.listPublicListings({
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 20,
      categoryId: query.categoryId as string,
      brandId: query.brandId as string,
      modelId: query.modelId as string,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      condition: query.condition as "NEW" | "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | undefined,
      locationId: query.locationId as string,
      search: query.search as string,
      sortBy: (query.sortBy as "newest" | "oldest" | "price_asc" | "price_desc" | "most_viewed") ?? "newest",
    });
    sendSuccess(res, result);
  }) as RequestHandler,
};
