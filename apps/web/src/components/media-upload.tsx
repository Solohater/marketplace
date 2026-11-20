"use client";

import { useRef, useState } from "react";
import type { MediaItem, MediaPurpose } from "@marketplace/shared";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_BATCH,
  MAX_IMAGE_FILE_MB,
} from "@marketplace/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ErrorBanner, SuccessBanner } from "@/components/ui";

interface PresignItem {
  key: string;
  uploadUrl: string;
}

interface Props {
  purpose: MediaPurpose;
  onUploaded?: (items: MediaItem[]) => void;
}

export function MediaUpload({ purpose, onUploaded }: Props) {
  const { t, tOr } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const acceptedTypes = ALLOWED_IMAGE_MIME_TYPES.join(",");

  function addFiles(raw: FileList | null) {
    if (!raw) return;
    const incoming = Array.from(raw);
    const combined = [...pending, ...incoming];
    if (combined.length > MAX_IMAGES_PER_BATCH) {
      setError(
        tOr("media.tooMany", `Too many files — up to ${MAX_IMAGES_PER_BATCH} images per batch.`, { max: MAX_IMAGES_PER_BATCH })
      );
      return;
    }
    for (const f of incoming) {
      if (
        !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(f.type)
      ) {
        setError(tOr("media.invalidType", `"${f.name}" is not a supported image type.`, { name: f.name }));
        return;
      }
      if (f.size > MAX_IMAGE_FILE_MB * 1024 * 1024) {
        setError(tOr("media.fileTooLarge", `"${f.name}" is over the ${MAX_IMAGE_FILE_MB}MB limit.`, { name: f.name, mb: MAX_IMAGE_FILE_MB }));
        return;
      }
    }
    setError(undefined);
    setPending(combined);
  }

  function removePending(index: number) {
    setPending((prev) => prev.filter((_, i) => i !== index));
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  async function doUpload() {
    if (pending.length === 0) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const presign = await presignFiles(purpose, pending);
      await uploadAndConfirm(presign, pending);
      setPending([]);
      setMessage(
        tOr("media.uploaded", `Uploaded ${presign.length} image(s).`, { count: presign.length })
      );
      onUploaded?.([]);
    } catch (err) {
      const code = err instanceof Error ? err.message : undefined;
      setError(code ? tOr(`media.error.${code}`, t("errors.generic")) : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section card" style={{ padding: 16 }}>
      <h2>{t("media.uploadTitle")}</h2>
      <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
        {tOr("media.limits", `Up to ${MAX_IMAGES_PER_BATCH} images per batch, ${MAX_IMAGE_FILE_MB}MB each, JPG / PNG / WEBP.`, { max: MAX_IMAGES_PER_BATCH, mb: MAX_IMAGE_FILE_MB })}
      </p>
      <ErrorBanner message={error} />
      <SuccessBanner message={message} />

      <div
        className="media-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
      >
        {tOr("media.choose", "Choose images")}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={onPick}
        hidden
      />

      {pending.length > 0 && (
        <>
          <div className="media-preview-grid">
            {pending.map((file, i) => (
              <div className="media-preview" key={`${file.name}-${i}`}>
                <img src={URL.createObjectURL(file)} alt={file.name} />
                <button
                  type="button"
                  className="btn btn-sm media-remove-btn"
                  onClick={() => removePending(i)}
                >
                  {tOr("media.removeFile", "Remove")}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void doUpload()}
          >
            {busy
              ? tOr("media.uploading", "Uploading…")
              : tOr("media.upload", `Upload ${pending.length} image(s)`, { count: pending.length })}
          </button>
        </>
      )}
    </section>
  );
}

async function presignFiles(
  purpose: MediaPurpose,
  files: File[]
): Promise<PresignItem[]> {
  const data = await api<{ items: PresignItem[] }>("/api/media/presign", {
    method: "POST",
    skipRetry: true,
    body: JSON.stringify({
      purpose,
      files: files.map((f) => ({ mimeType: f.type, size: f.size })),
    }),
  });
  return data.items;
}

async function uploadAndConfirm(
  presigned: PresignItem[],
  files: File[]
): Promise<MediaItem[]> {
  const results: MediaItem[] = [];
  for (let i = 0; i < presigned.length; i++) {
    const { uploadUrl, key } = presigned[i]!;
    const file = files[i]!;
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!uploadRes.ok) throw new Error("UPLOAD_FAILED");
    const media = await api<{ media: MediaItem }>("/api/media/confirm", {
      method: "POST",
      skipRetry: true,
      body: JSON.stringify({ key, position: i }),
    });
    results.push(media.media);
  }
  return results;
}
