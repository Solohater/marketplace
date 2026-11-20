"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface SellerProfile {
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

interface StorefrontData {
  seller: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  profile: SellerProfile;
  listingCount: number;
  activeListingCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export function StorefrontPage() {
  const { t } = useI18n();
  const params = useParams();
  const userId = params.userId as string;
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadStorefront = useCallback(async () => {
    try {
      const data = await api<{ storefront: StorefrontData }>(
        `/api/sellers/storefront/${userId}`
      );
      setStorefront(data.storefront);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Seller not found");
      } else {
        setError("Failed to load storefront");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadStorefront();
  }, [loadStorefront]);

  if (loading) {
    return <p className="empty">{t("common.loading")}</p>;
  }

  if (error || !storefront) {
    return (
      <div>
        <div className="page-head">
          <h1>Storefront</h1>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="empty">{error ?? "Seller not found"}</p>
        </div>
      </div>
    );
  }

  const { profile } = storefront;

  return (
    <div>
      <div className="page-head">
        <h1>{profile.storeName}</h1>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 32 }}>
            {profile.storeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{profile.storeName}</h2>
            <p className="muted">
              {profile.isVerified ? "✓ Verified Seller" : "Not Verified"}
            </p>
            <p className="muted">
              Member since {new Date(profile.memberSince).toLocaleDateString()}
            </p>
          </div>
        </div>

        {profile.storeDescription && (
          <p style={{ marginBottom: 16 }}>{profile.storeDescription}</p>
        )}

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <strong>{storefront.activeListingCount}</strong>
            <span className="muted"> Active Listings</span>
          </div>
          <div>
            <strong>{storefront.listingCount}</strong>
            <span className="muted"> Total Listings</span>
          </div>
          {storefront.averageRating !== null && (
            <div>
              <strong>{storefront.averageRating.toFixed(1)}</strong>
              <span className="muted"> Rating ({storefront.reviewCount} reviews)</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {profile.phone && (
            <div>
              <strong>Phone:</strong> {profile.phone}
            </div>
          )}
          {profile.address && (
            <div>
              <strong>Address:</strong> {profile.address}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Active Listings</h3>
        <p className="muted">
          {storefront.activeListingCount === 0
            ? "No active listings yet"
            : `Showing ${storefront.activeListingCount} active listings`}
        </p>
      </div>
    </div>
  );
}
