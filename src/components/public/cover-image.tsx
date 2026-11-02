"use client";

import { useState } from "react";

/**
 * Imagem de capa com fallback: se o arquivo não carregar (link quebrado, link de página em vez de imagem),
 * a imagem some e a capa gerada que está por baixo aparece — a página nunca mostra o ícone de imagem quebrada.
 */
export function CoverImage({ src, className = "" }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (!img.naturalWidth || !img.naturalHeight) setFailed(true);
      }}
    />
  );
}
