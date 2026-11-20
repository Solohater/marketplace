import { sellerProfilesRepository } from "./sellers.repository.js";
import { usersRepository } from "../users/users.repository.js";
import type {
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
} from "@marketplace/shared";

export const sellerProfilesService = {
  async createProfile(userId: string, input: CreateSellerProfileInput) {
    // Check if user already has a seller profile
    const existing = await sellerProfilesRepository.findByUserId(userId);
    if (existing) {
      throw new Error("Seller profile already exists");
    }

    // Check if store name is taken
    const storeExists = await sellerProfilesRepository.findByStoreName(
      input.storeName
    );
    if (storeExists) {
      throw new Error("Store name is already taken");
    }

    // Update user role to SELLER
    await usersRepository.update(userId, { role: "SELLER" });

    return sellerProfilesRepository.create(userId, input);
  },

  async getProfile(userId: string) {
    return sellerProfilesRepository.findByUserId(userId);
  },

  async getProfileById(id: string) {
    return sellerProfilesRepository.findById(id);
  },

  async updateProfile(userId: string, input: UpdateSellerProfileInput) {
    const existing = await sellerProfilesRepository.findByUserId(userId);
    if (!existing) {
      throw new Error("Seller profile not found");
    }

    // Check if new store name is taken (if changing)
    if (input.storeName && input.storeName !== existing.storeName) {
      const storeExists = await sellerProfilesRepository.findByStoreName(
        input.storeName
      );
      if (storeExists) {
        throw new Error("Store name is already taken");
      }
    }

    return sellerProfilesRepository.update(userId, input);
  },

  async getPublicStorefront(userId: string) {
    const profile = await sellerProfilesRepository.findByUserId(userId);
    if (!profile) {
      return null;
    }

    const user = await usersRepository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      seller: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: null, // TODO: Get from media
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        storeName: profile.storeName,
        storeDescription: profile.storeDescription,
        logoUrl: profile.logoUrl,
        phone: profile.phone,
        locationId: profile.locationId,
        address: profile.address,
        isVerified: profile.isVerified === "true",
        verificationLevel: profile.verificationLevel,
        memberSince: profile.memberSince.toISOString(),
        lastActiveAt: profile.lastActiveAt?.toISOString() ?? null,
      },
      listingCount: 0, // TODO: Count from listings
      activeListingCount: 0, // TODO: Count active listings
      averageRating: null, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count reviews
    };
  },

  async listSellers(page = 1, pageSize = 20) {
    return sellerProfilesRepository.listAll(page, pageSize);
  },
};
