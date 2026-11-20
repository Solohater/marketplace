"use client";

import { useCallback, useEffect, useState } from "react";
import type { MediaItem } from "@marketplace/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LazyImage } from "@/components/lazy-image";
import { MediaUpload } from "@/components/media-upload";
import { Button, ErrorBanner, SuccessBanner } from "@/components/ui";

export function MediaLibraryPage() {
  const { t, tOr } = useI18n();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();

  const load = useCallback(async () => {
    try {
      const data = await api<{
        items: MediaItem[];
        total: number;
        totalPages: number;
      }>("/api/media?purpose=listing");
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteItem(id: string) {
    setDeletingId(id);
    setError(undefined);
    setMessage(undefined);
    try {
      await api(`/api/media/${id}`, { method: "DELETE", skipRetry: true });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => prev - 1);
      setMessage(tOr("media.deleted", "Image deleted."));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setDeletingId(undefined);
    }
  }

  if (loading) {
    return <p className="empty">{tOr("media.loading", "Loading your images…")}</p>;
  }

  return (
    <div>
      <div className="page-head">
        <h1>{tOr("media.title", "Media library")}</h1>
      </div>
      <p className="muted" style={{ marginTop: -12 }}>
        {tOr("media.subtitle", "Upload and manage your images.")}
      </p>

      <MediaUpload purpose="listing" onUploaded={() => void load()} />

      <section className="section card" style={{ padding: 16 }}>
        <h2>{tOr("media.libraryTitle", "Your images")}</h2>
        <ErrorBanner message={error} />
        <SuccessBanner message={message} />
        {items.length === 0 ? (
          <p className="empty">{tOr("media.noImages", "No images yet. Upload your first image above.")}</p>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              {total} image{total !== 1 ? "s" : ""}
            </p>
            <div className="media-grid">
              {items.map((item) => (
                <div className="media-card" key={item.id}>
                  <LazyImage src={item.thumbnailUrl ?? item.url} alt={`Image ${item.position}`} className="media-card-img" />
                  <div className="media-card-footer">
                    <span className="media-card-meta">
                      {item.width}×{item.height} · {(item.size / 1024).toFixed(0)}KB
                    </span>
                    <Button
                      className="btn-sm btn-danger"
                      disabled={deletingId === item.id}
                      onClick={() => void deleteItem(item.id)}
                    >
                      {deletingId === item.id
                        ? tOr("media.deleting", "Deleting…")
                        : tOr("media.delete", "Delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="media-pagination" style={{ marginTop: 12, textAlign: "center" }}>
                <Button
                  className="btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </Button>
                <span style={{ margin: "0 12px", fontSize: 14 }}>
                  {page} / {totalPages}
                </span>
                <Button
                  className="btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  →
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
