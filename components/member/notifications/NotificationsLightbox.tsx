"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type NotificationsLightboxProps = {
  open: boolean;
  src: string | null;
  title: string;
  onClose: () => void;
};

export default function NotificationsLightbox({ open, src, title, onClose }: NotificationsLightboxProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Image : ${title}` : "Image en grand"}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-4 top-4 z-[101] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
        aria-label="Fermer"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={22} aria-hidden />
      </button>
      <div
        className="max-h-[min(92vh,920px)] max-w-[min(96vw,1200px)] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title || ""}
          className="mx-auto max-h-[min(92vh,920px)] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
        />
      </div>
    </div>
  );
}
