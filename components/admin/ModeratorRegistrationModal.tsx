"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { AdminRole } from "@/lib/adminRoles";
import { roleLabelFromKey, type OrgChartRoleKey } from "@/lib/staff/orgChartTypes";

function adminRoleLabel(role: AdminRole | null | undefined): string {
  if (!role) return "Staff TENF";
  return roleLabelFromKey(role as OrgChartRoleKey);
}

type ModeratorRegistrationModalProps = {
  integration: {
    id: string;
    title: string;
    description: string;
    image?: string;
    date: Date;
    category: string;
    location?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRegister: (formData: {
    pseudo: string;
    role: string;
    placement: "Animateur" | "Co-animateur" | "Observateur";
  }) => Promise<void>;
  isLoading?: boolean;
};

export default function ModeratorRegistrationModal({
  integration,
  isOpen,
  onClose,
  onRegister,
  isLoading = false,
}: ModeratorRegistrationModalProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [formData, setFormData] = useState({
    pseudo: "",
    role: "",
    placement: "Animateur" as "Animateur" | "Co-animateur" | "Observateur",
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const u = session?.user;
    const pseudo = (u?.username || u?.name || "").trim();
    const roleText = adminRoleLabel(u?.role ?? null);
    setFormData({
      pseudo,
      role: u?.role ? roleText : "",
      placement: "Animateur",
    });
  }, [isOpen, session?.user?.username, session?.user?.name, session?.user?.role]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pseudo || !formData.role || !formData.placement) {
      alert("Veuillez remplir tous les champs obligatoires (Pseudo, Rôle et Placement)");
      return;
    }
    onRegister(formData);
  };

  if (!isOpen) return null;

  const staffAvatar = session?.user?.avatar || session?.user?.image || null;
  const staffName = (session?.user?.username || session?.user?.name || "Membre staff").trim();
  const staffRoleLabel = adminRoleLabel(session?.user?.role ?? null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return "from-violet-500 to-fuchsia-600 shadow-[0_0_24px_rgba(139,92,246,0.35)]";
      case "Intégration rapide":
        return "from-sky-500 to-blue-600 shadow-[0_0_24px_rgba(56,189,248,0.3)]";
      case "Intégration spéciale":
        return "from-emerald-500 to-teal-600 shadow-[0_0_24px_rgba(52,211,153,0.3)]";
      default:
        return "from-zinc-500 to-zinc-700 shadow-none";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Vérifier si location est une URL
  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d12] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_80px_rgba(0,0,0,0.65),0_0_120px_rgba(99,102,241,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bannière 800×200 (ratio 4:1) — image entièrement visible */}
        <div className="relative w-full shrink-0 border-b border-white/[0.06] bg-[#070708]">
          <div className="relative mx-auto aspect-[4/1] w-full max-w-full">
            {integration.image ? (
              <img
                src={integration.image}
                alt={integration.title}
                className="h-full w-full object-contain object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(99,102,241,0.2),rgba(14,165,233,0.12),rgba(168,85,247,0.15))]">
                <span className="text-sm font-medium tracking-wide text-white/40">Visuel session</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0d12] to-transparent" />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-300 backdrop-blur-md transition hover:border-white/20 hover:bg-black/70 hover:text-white"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="max-h-[calc(92vh-11rem)] overflow-y-auto overscroll-contain px-6 pb-8 pt-2 sm:max-h-[calc(92vh-14rem)] sm:px-8">
          {/* Staff connecté */}
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[linear-gradient(145deg,rgba(99,102,241,0.08),rgba(15,16,24,0.92))] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-2 ring-indigo-500/25">
                {staffAvatar ? (
                  <img src={staffAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-indigo-200/80">
                    {staffName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/70">Vous inscrivez</p>
                {sessionStatus === "loading" ? (
                  <p className="mt-1 text-sm text-zinc-500">Chargement du profil…</p>
                ) : (
                  <>
                    <p className="mt-0.5 text-lg font-semibold tracking-tight text-white">{staffName}</p>
                    <p className="text-sm text-zinc-400">{staffRoleLabel}</p>
                  </>
                )}
              </div>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white ${getCategoryColor(integration.category)}`}
            >
              {integration.category}
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{integration.title}</h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(integration.date)}
            </span>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Description</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{integration.description}</p>
          </div>

          {integration.location && (
            <div className="mt-4 flex items-start gap-2 text-sm text-zinc-400">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isUrl(integration.location) ? (
                <a
                  href={integration.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-violet-400 underline decoration-violet-500/30 underline-offset-2 transition hover:text-violet-300"
                >
                  {integration.location}
                </a>
              ) : (
                <span>{integration.location}</span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Pseudo <span className="text-rose-400/90">*</span>
              </label>
              <input
                type="text"
                value={formData.pseudo}
                onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white shadow-inner shadow-black/20 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                required
                placeholder="Pseudo affiché pour le staffing"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Rôle <span className="text-rose-400/90">*</span>
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                required
                placeholder="Ex. Admin coordinateur, Modérateur…"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Placement <span className="text-rose-400/90">*</span>
              </label>
              <select
                value={formData.placement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    placement: e.target.value as "Animateur" | "Co-animateur" | "Observateur",
                  })
                }
                className="w-full cursor-pointer rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="Animateur">Animateur</option>
                <option value="Co-animateur">Co-animateur</option>
                <option value="Observateur">Observateur</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.pseudo || !formData.role || !formData.placement}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(99,102,241,0.35)] transition hover:shadow-[0_16px_48px_rgba(99,102,241,0.45)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              <span className="relative z-10">{isLoading ? "Inscription en cours…" : "Confirmer mon inscription staff"}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition group-hover:opacity-100" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

