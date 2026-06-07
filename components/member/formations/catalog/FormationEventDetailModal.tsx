"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import type { FormationEventItem } from "@/components/member/formations/catalog/formationsCatalogUtils";

type FormationEventDetailModalProps = {
  event: FormationEventItem | null;
  onClose: () => void;
};

export default function FormationEventDetailModal({ event, onClose }: FormationEventDetailModalProps) {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#121018] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="formation-modal-title"
      >
        {event.image ? (
          <img
            src={event.image}
            alt=""
            className="h-auto max-h-[280px] w-full object-contain bg-black/40"
          />
        ) : null}
        <div className="space-y-4 border-b border-white/10 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 id="formation-modal-title" className="text-xl font-bold leading-snug text-white md:text-2xl">
              {event.title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex shrink-0 items-center rounded-lg border border-white/10 p-2 text-white/55 transition hover:bg-white/5"
              aria-label="Fermer la fenêtre détail formation"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-white/55">
            {new Date(event.date).toLocaleString("fr-FR")} — {event.category}
          </p>
          <div className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-200 prose-a:text-[#9146ff] prose-a:hover:text-[#7c3aed] prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {event.description || "Aucune description disponible pour cette formation."}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
