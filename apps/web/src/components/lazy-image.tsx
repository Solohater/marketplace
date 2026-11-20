"use client";

import { useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LazyImage({ src, alt, className }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`lazy-image ${className ?? ""}`}>
      {!loaded && <div className="lazy-image-placeholder" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={loaded ? "" : "lazy-image-hidden"}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
