"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/user";
import { useI18n } from "@/lib/i18n";

interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  condition: string;
  status: string;
  specifications: Record<string, string> | null;
  warranty: string | null;
  viewsCount: number;
  favoritesCount: number;
  publishedAt: string | null;
  createdAt: string;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string } | null;
  model?: { id: string; name: string; slug: string } | null;
  seller?: {
    id: string;
    fullName: string;
    sellerProfile?: {
      storeName: string;
      isVerified: boolean;
      verificationLevel: string;
    };
  };
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    position: number;
  }>;
}

export function ListingDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const { user } = useMe();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const loadListing = useCallback(async () => {
    try {
      const data = await api<{ listing: Listing }>(`/api/listings/${listingId}`);
      setListing(data.listing);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Listing not found");
      } else {
        setError("Failed to load listing");
      }
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  if (loading) {
    return <p className="empty">{t("common.loading")}</p>;
  }

  if (error || !listing) {
    return (
      <div>
        <div className="page-head">
          <h1>Listing</h1>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="empty">{error ?? "Listing not found"}</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;

  return (
    <div>
      <div className="page-head">
        <h1>{listing.title}</h1>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Images */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 16 }}>
            {listing.images.length > 0 ? (
              <>
                <div style={{ height: 400, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <img
                    src={listing.images[selectedImageIndex].url}
                    alt={listing.title}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
                {listing.images.length > 1 && (
                  <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                    {listing.images.map((image, index) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{
                          width: 80,
                          height: 80,
                          flexShrink: 0,
                          borderRadius: 8,
                          overflow: "hidden",
                          cursor: "pointer",
                          border: index === selectedImageIndex ? "2px solid #16a34a" : "2px solid transparent",
                        }}
                      >
                        <img
                          src={image.thumbnailUrl ?? image.url}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ height: 400, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="muted">No images</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 24, fontWeight: 600, color: "#16a34a", margin: "0 0 16px" }}>
              {listing.price.toLocaleString()} {listing.currency}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {listing.category && (
                <span className="badge">{listing.category.name}</span>
              )}
              {listing.brand && (
                <span className="badge">{listing.brand.name}</span>
              )}
              {listing.model && (
                <span className="badge">{listing.model.name}</span>
              )}
              <span className="badge">{listing.condition}</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="muted">{listing.viewsCount} views</div>
              <div className="muted">{listing.favoritesCount} favorites</div>
            </div>

            {listing.warranty && (
              <div style={{ marginBottom: 16 }}>
                <strong>Warranty:</strong> {listing.warranty}
              </div>
            )}

            <div className="muted" style={{ fontSize: 12 }}>
              Posted: {new Date(listing.publishedAt ?? listing.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Seller Card */}
          {listing.seller && (
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ margin: "0 0 12px" }}>Seller</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 48, height: 48 }}>
                  {listing.seller.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{listing.seller.fullName}</div>
                  {listing.seller.sellerProfile && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {listing.seller.sellerProfile.storeName}
                      {listing.seller.sellerProfile.isVerified && " ✓"}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => router.push(`/seller/${listing.sellerId}`)}
              >
                View Store
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description & Specifications */}
      <div style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ margin: "0 0 16px" }}>Description</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {listing.description ?? "No description provided."}
          </p>
        </div>

        {listing.specifications && Object.keys(listing.specifications).length > 0 && (
          <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <h2 style={{ margin: "0 0 16px" }}>Specifications</h2>
            <table style={{ width: "100%" }}>
              <tbody>
                {Object.entries(listing.specifications).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: "8px 0", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>
                      {key}
                    </td>
                    <td style={{ padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div style={{ marginTop: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ margin: "0 0 16px" }}>Manage Listing</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {listing.status === "DRAFT" && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await api(`/api/listings/${listing.id}/submit`, { method: "POST" });
                    void loadListing();
                  }}
                >
                  Submit for Review
                </button>
              )}
              {listing.status === "ACTIVE" && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await api(`/api/listings/${listing.id}/sold`, { method: "POST" });
                      void loadListing();
                    }}
                  >
                    Mark as Sold
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      await api(`/api/listings/${listing.id}/reserve`, { method: "POST" });
                      void loadListing();
                    }}
                  >
                    Mark as Reserved
                  </button>
                </>
              )}
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this listing?")) {
                    await api(`/api/listings/${listing.id}`, { method: "DELETE" });
                    router.push("/browse");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
