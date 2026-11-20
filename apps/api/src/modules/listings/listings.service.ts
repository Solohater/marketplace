import { listingsRepository } from "./listings.repository.js";
import type {
  CreateListingInput,
  UpdateListingInput,
  ListingQueryInput,
} from "@marketplace/shared";

export const listingsService = {
  async createListing(sellerId: string, input: CreateListingInput) {
    const specifications = input.specifications
      ? JSON.stringify(input.specifications)
      : undefined;

    return listingsRepository.create(sellerId, {
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency ?? "ETB",
      categoryId: input.categoryId,
      brandId: input.brandId,
      modelId: input.modelId,
      condition: input.condition,
      locationId: input.locationId,
      address: input.address,
      specifications,
      warranty: input.warranty,
      imei: input.imei,
    });
  },

  async getListing(id: string) {
    const listing = await listingsRepository.findByIdWithMedia(id);
    if (!listing) return null;

    // Increment view count
    await listingsRepository.incrementViews(id);

    return {
      ...listing,
      viewsCount: listing.viewsCount + 1,
      specifications: listing.specifications
        ? JSON.parse(listing.specifications)
        : null,
    };
  },

  async getSellerListings(sellerId: string, page = 1, pageSize = 20) {
    return listingsRepository.listBySeller(sellerId, page, pageSize);
  },

  async updateListing(id: string, sellerId: string, input: UpdateListingInput) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.sellerId !== sellerId) {
      throw new Error("Not authorized to update this listing");
    }

    const patch: Record<string, unknown> = { ...input };
    if (input.specifications) {
      patch.specifications = JSON.stringify(input.specifications);
    }

    return listingsRepository.update(id, patch);
  },

  async deleteListing(id: string, sellerId: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.sellerId !== sellerId) {
      throw new Error("Not authorized to delete this listing");
    }

    return listingsRepository.delete(id);
  },

  async submitForReview(id: string, sellerId: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.sellerId !== sellerId) {
      throw new Error("Not authorized to submit this listing");
    }
    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new Error("Listing cannot be submitted for review");
    }

    return listingsRepository.update(id, { status: "PENDING_REVIEW" });
  },

  async approveListing(id: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.status !== "PENDING_REVIEW") {
      throw new Error("Listing is not pending review");
    }

    return listingsRepository.update(id, {
      status: "ACTIVE",
      publishedAt: new Date(),
    });
  },

  async rejectListing(id: string, _reason: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.status !== "PENDING_REVIEW") {
      throw new Error("Listing is not pending review");
    }

    return listingsRepository.update(id, { status: "REJECTED" });
  },

  async suspendListing(id: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }

    return listingsRepository.update(id, { status: "SUSPENDED" });
  },

  async markAsSold(id: string, sellerId: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.sellerId !== sellerId) {
      throw new Error("Not authorized to update this listing");
    }
    if (existing.status !== "ACTIVE") {
      throw new Error("Only active listings can be marked as sold");
    }

    return listingsRepository.update(id, { status: "SOLD" });
  },

  async markAsReserved(id: string, sellerId: string) {
    const existing = await listingsRepository.findById(id);
    if (!existing) {
      throw new Error("Listing not found");
    }
    if (existing.sellerId !== sellerId) {
      throw new Error("Not authorized to update this listing");
    }
    if (existing.status !== "ACTIVE") {
      throw new Error("Only active listings can be reserved");
    }

    return listingsRepository.update(id, { status: "RESERVED" });
  },

  async getModerationQueue(page = 1, pageSize = 20) {
    return listingsRepository.listByStatus("PENDING_REVIEW", page, pageSize);
  },

  async listPublicListings(query: ListingQueryInput) {
    const result = await listingsRepository.listPublic(query);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        specifications: item.specifications
          ? JSON.parse(item.specifications)
          : null,
      })),
    };
  },
};
