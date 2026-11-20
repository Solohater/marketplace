export interface PublicListing {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  categoryId: string;
  brandId: string | null;
  modelId: string | null;
  condition: string;
  status: string;
  locationId: string | null;
  address: string | null;
  specifications: Record<string, string> | null;
  warranty: string | null;
  viewsCount: number;
  favoritesCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string } | null;
  model?: { id: string; name: string; slug: string } | null;
  seller?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    sellerProfile?: {
      storeName: string;
      isVerified: boolean;
      verificationLevel: string;
    };
  };
}

export interface ListingWithDetails extends PublicListing {
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    position: number;
  }>;
  isFavorited?: boolean;
}
