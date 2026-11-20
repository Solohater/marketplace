"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  status: string;
  viewsCount: number;
  favoritesCount: number;
  createdAt: string;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string } | null;
  model?: { id: string; name: string; slug: string } | null;
  seller?: { id: string; fullName: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function BrowsePage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const brandId = searchParams.get("brandId") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "newest";

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      if (brandId) params.set("brandId", brandId);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (condition) params.set("condition", condition);
      params.set("sortBy", sortBy);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const data = await api<PaginatedResult<Listing>>(
        `/api/listings?${params.toString()}`
      );
      setListings(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, brandId, minPrice, maxPrice, condition, sortBy, page]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api<{ categories: Category[] }>("/api/categories");
      setCategories(data.categories);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Browse Listings</h1>
        <p className="muted">{total} listings found</p>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Filters Sidebar */}
        <aside style={{ width: 240, flexShrink: 0 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3>Filters</h3>

            <div style={{ marginBottom: 16 }}>
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => updateFilter("categoryId", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Price Range (ETB)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  style={{ width: "50%" }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Condition</label>
              <select
                value={condition}
                onChange={(e) => updateFilter("condition", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Any Condition</option>
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="most_viewed">Most Viewed</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <main style={{ flex: 1 }}>
          {loading ? (
            <p className="empty">{t("common.loading")}</p>
          ) : listings.length === 0 ? (
            <p className="empty">No listings found</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="card"
                    style={{ padding: 16, cursor: "pointer" }}
                    onClick={() => router.push(`/listing/${listing.id}`)}
                  >
                    <div style={{ height: 160, background: "#f0f0f0", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="muted">No image</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{listing.title}</h3>
                    <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#16a34a" }}>
                      {listing.price.toLocaleString()} {listing.currency}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      {listing.category && (
                        <span className="badge">{listing.category.name}</span>
                      )}
                      {listing.brand && (
                        <span className="badge">{listing.brand.name}</span>
                      )}
                      <span className="badge">{listing.condition}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {listing.seller?.fullName} · {listing.viewsCount} views
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="btn"
                  >
                    Previous
                  </button>
                  <span className="muted" style={{ alignSelf: "center" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
