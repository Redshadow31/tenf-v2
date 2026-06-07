"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

type RaidDeclareSuccessModalProps = {
  open: boolean;
  firstName: string;
  onClose: () => void;
};

export default function RaidDeclareSuccessModal({ open, firstName, onClose }: RaidDeclareSuccessModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-success-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[1.35rem] border border-emerald-500/30 bg-gradient-to-b from-[#0f1a16] to-[#080c10] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-white/45 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex rounded-2xl border border-emerald-500/25 bg-emerald-500/15 p-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
        </div>

        <h2 id="raid-success-title" className="text-xl font-black text-white">
          Merci {firstName}, c&apos;est enregistré
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/62">
          Ta déclaration rejoint la file modération. Pas besoin de renvoyer la même chose — la modération croise avec les
          données TENF et te répond via le statut du dossier.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          Dès validation, le raid pourra apparaître dans ton historique membre.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/member/raids/historique"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-zinc-100 sm:flex-none"
          >
            Voir Mes raids <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/5"
          >
            Continuer ici
          </button>
        </div>
      </div>
    </div>
  );
}
