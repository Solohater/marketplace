export interface PublicSellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  phone: string | null;
  locationId: string | null;
  address: string | null;
  isVerified: boolean;
  verificationLevel: string;
  memberSince: string;
  lastActiveAt: string | null;
}

export interface SellerStorefront {
  seller: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  profile: PublicSellerProfile;
  listingCount: number;
  activeListingCount: number;
  averageRating: number | null;
  reviewCount: number;
}
