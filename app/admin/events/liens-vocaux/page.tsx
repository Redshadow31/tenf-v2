"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Copy,
  ExternalLink,
  Headphones,
  Link2,
  ListOrdered,
  Mic2,
  PartyPopper,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCommunauteEventsHub } from "@/lib/admin/CommunauteEventsHubContext";

type LocationLink = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const layoutPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubSubtleBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const liensVocauxAsideSteps = [
  {
    n: "1",
    title: "Nom explicite",
    body: "L’étiquette du lien doit suffire au staff pour choisir le bon salon sans ouvrir Discord.",
  },
  {
    n: "2",
    title: "Désactiver plutôt que supprimer",
    body: "Un vocal récurrent peut revenir : l’inactivation retire le lien des choix actifs sans casser l’historique.",
  },
  {
    n: "3",
    title: "Tester avant publication",
    body: "Ouvrez l’URL depuis la carte ; un lien mort bloque la planification au pire moment.",
  },
];
const modalBackdropClass =
  "fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-black/65 p-4 backdrop-blur-md";
const modalShellClass =
  "relative w-full max-w-lg animate-fadeIn overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(165deg,rgba(99,102,241,0.16),rgba(14,15,23,0.96)_40%,rgba(11,13,20,0.99))] shadow-[0_28px_80px_rgba(2,6,23,0.75)]";
const inputClass =
  "w-full rounded-xl border border-white/12 bg-[#0c0e14]/90 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-400/55 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]";

type ToastState = { variant: "success" | "error"; message: string };

export default function EventLocationLinksPage() {
  const hubLayout = useCommunauteEventsHub();
  const formTitleId = useId();
  const deleteTitleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [links, setLinks] = useState<LocationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "" });
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocationLink | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [copyFlashId, setCopyFlashId] = useState<string | null>(null);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

  const pushToast = useCallback((variant: ToastState["variant"], message: string) => {
    setToast({ variant, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!formModalOpen) return;
    const t = requestAnimationFrame(() => firstFieldRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [formModalOpen]);

  useEffect(() => {
    if (!formModalOpen && !deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteTarget) setDeleteTarget(null);
        else closeFormModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formModalOpen, deleteTarget]);

  async function loadLinks() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events/location-links", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les liens");
      }
      setLinks((data.links || []) as LocationLink[]);
    } catch (error) {
      console.error("[liens-vocaux] Erreur chargement:", error);
      pushToast("error", error instanceof Error ? error.message : "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  function resetForm() {
    setForm({ name: "", url: "" });
    setEditingId(null);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    resetForm();
  }

  function openAddModal() {
    resetForm();
    setFormModalOpen(true);
  }

  function openEditModal(link: LocationLink) {
    setEditingId(link.id);
    setForm({ name: link.name, url: link.url });
    setFormModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      pushToast("error", "Nom et URL requis.");
      return;
    }

    try {
      setSaving(true);
      const isEdit = !!editingId;
      const response = await fetch(
        isEdit ? `/api/admin/events/location-links/${editingId}` : "/api/admin/events/location-links",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            url: form.url.trim(),
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'enregistrer");
      }

      closeFormModal();
      await loadLinks();
      pushToast("success", isEdit ? "Lien mis à jour." : "Lien ajouté.");
    } catch (error) {
      console.error("[liens-vocaux] Erreur sauvegarde:", error);
      pushToast("error", error instanceof Error ? error.message : "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: LocationLink) {
    try {
      setToggleBusyId(link.id);
      const response = await fetch(`/api/admin/events/location-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Impossible de modifier l'état");
      await loadLinks();
      pushToast("success", link.isActive ? "Lien désactivé." : "Lien activé.");
    } catch (error) {
      console.error("[liens-vocaux] Erreur activation:", error);
      pushToast("error", "Erreur lors de la mise à jour.");
    } finally {
      setToggleBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/events/location-links/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Impossible de supprimer");
      setDeleteTarget(null);
      await loadLinks();
      pushToast("success", "Lien supprimé.");
    } catch (error) {
      console.error("[liens-vocaux] Erreur suppression:", error);
      pushToast("error", "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  async function copyUrl(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFlashId(id);
      window.setTimeout(() => setCopyFlashId((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      pushToast("error", "Copie impossible (permissions navigateur).");
    }
  }

  const activeCount = links.filter((link) => link.isActive).length;
  const inactiveCount = links.length - activeCount;

  const filteredLinks =
    filter === "all" ? links : filter === "active" ? links.filter((l) => l.isActive) : links.filter((l) => !l.isActive);

  const hubBackHref = "/admin/communaute/evenements";
  const classicBackHref = "/admin/events";

  const hubPanel = hubLayout ? layoutPanelClass : sectionCardClass;
  const pillActive = hubLayout
    ? "border-violet-400/50 bg-violet-500/20 text-violet-50"
    : "border-indigo-400/50 bg-indigo-500/20 text-indigo-50";
  const pillInactive = hubLayout
    ? "border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-violet-400/25 hover:text-slate-200"
    : "border-[#3b4157] bg-[#13192b] text-slate-400 hover:border-indigo-300/30 hover:text-slate-200";

  return (
    <div
      className={
        hubLayout
          ? "relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--lv-gap:clamp(1rem,1.55vw,1.85rem)]"
          : "min-h-screen space-y-6 bg-[#0e0e10] p-8 text-white"
      }
    >
      {hubLayout ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(244,114,182,0.12),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(56,189,248,0.1),transparent_52%)]" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[min(820px,100vh)]"
            style={{
              backgroundImage:
                "linear-gradient(104deg,rgba(255,255,255,0.032) 0px,rgba(255,255,255,0.032) 1px,transparent 1px,transparent 74px)",
              backgroundSize: "clamp(54px,4.2vw,72px) 100%",
              opacity: 0.21,
              maskImage: "linear-gradient(180deg,black 0%,transparent 78%)",
            }}
          />
        </>
      ) : null}
      <div
        className={
          hubLayout
            ? "mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3"
            : ""
        }
      >
        <div
          className={
            hubLayout
              ? "grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]"
              : "contents"
          }
        >
          <div className={hubLayout ? "min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--lv-gap)]" : "space-y-6"}>
            {hubLayout ? (
              <header
                className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${layoutPanelClass}`}
              >
                <div className="min-w-0 space-y-4">
                  <Link
                    href={hubBackHref}
                    className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                    Retour pilotage événements
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/26 bg-cyan-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-cyan-100/90">
                      <Headphones className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Accès membres (planifs)
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Staff — salons Discord
                    </span>
                  </div>
                  <div>
                    <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                      Bibliothèque vocale
                    </p>
                    <h1 className="mt-2 flex flex-wrap items-center gap-3 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                      <Mic2 className="h-8 w-8 shrink-0 text-cyan-300/90 md:h-9 md:w-9" aria-hidden />
                      Liens vocaux
                    </h1>
                    <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                      Invitations Discord vocales : activez, copiez et réutilisez les salons dans la planification sans
                      lien mort.
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                    <button
                      type="button"
                      onClick={openAddModal}
                      className={`inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-950/[0.32] px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:border-emerald-300/45 hover:bg-emerald-900/[0.38] ${focusRingClass}`}
                    >
                      <Plus className="h-4 w-4 shrink-0" aria-hidden />
                      Nouveau salon vocal
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadLinks()}
                      className={`${hubSubtleBtnClass} ${focusRingClass}`}
                    >
                      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                      Actualiser
                    </button>
                    <Link href="/admin/communaute/evenements/calendrier" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                      Calendrier
                    </Link>
                  </div>
                </div>
                <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.16),transparent_42%,transparent_58%,rgba(244,114,182,0.1))]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]"
                  />
                  <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                      Synthèse
                    </span>
                    <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Total</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                          {links.length}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Actifs</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-emerald-200/95">
                          {activeCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Inactifs</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-amber-200/95">
                          {inactiveCount}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                      Utilisez la copie rapide sur chaque carte avant de coller dans un créneau calendrier.
                    </p>
                  </div>
                </div>
              </header>
            ) : (
              <section className={`${glassCardClass} p-5 md:p-6`}>
                <Link href={classicBackHref} className="mb-3 inline-block text-gray-300 transition-colors hover:text-white">
                  ← Retour aux evenements
                </Link>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Evenements communautaires</p>
                    <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                      Liens des salons vocaux
                    </h1>
                    <p className="mt-3 text-sm text-slate-300">
                      Cette page centralise les liens Discord vocaux utilises dans la planification. Elle permet de garantir que chaque
                      evenement pointe vers un salon valide, actif et simple a reutiliser.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </button>
                    <Link href="/admin/communaute/evenements/calendrier" className={subtleButtonClass}>
                      Ouvrir calendrier
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

      {toast ? (
        <div
          role="status"
          className={`animate-fadeIn rounded-2xl border px-4 py-3 text-sm ${
            toast.variant === "success"
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100"
              : "border-rose-500/40 bg-rose-950/35 text-rose-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-violet-400/30" : "hover:border-indigo-400/35"
          } ${
            filter === "all"
              ? hubLayout
                ? "ring-2 ring-violet-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-indigo-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total liens</p>
          <p className="mt-2 text-3xl font-semibold">{links.length}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Afficher tout</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-emerald-400/30" : "hover:border-emerald-400/35"
          } ${
            filter === "active"
              ? hubLayout
                ? "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{activeCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Filtrer les utilisables</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setFilter("inactive")}
          className={`${hubPanel} p-4 text-left transition hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
            hubLayout ? "hover:border-amber-400/30" : "hover:border-amber-400/35"
          } ${
            filter === "inactive"
              ? hubLayout
                ? "ring-2 ring-amber-400/45 ring-offset-2 ring-offset-zinc-950"
                : "ring-2 ring-amber-400/45 ring-offset-2 ring-offset-[#0a0b10]"
              : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Inactifs</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{inactiveCount}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Masqués en planif</p> : null}
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Vue liste</span>
        {(["all", "active", "inactive"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              hubLayout ? focusRingClass : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            } ${filter === key ? pillActive : pillInactive}`}
          >
            {key === "all" ? "Tous" : key === "active" ? "Actifs seulement" : "Inactifs seulement"}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.1fr]">
        <article className={`${hubPanel} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Rappels rapides</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              Créer un lien vocal clair et nominatif pour les équipes événement.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              Garder uniquement les liens actifs pour éviter les erreurs en planification.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              Désactiver au lieu de supprimer quand un salon peut revenir plus tard.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <span className="inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Règle opérationnelle
            </span>
            <p className="mt-1">Chaque lien vocal doit être testé et actif avant publication d&apos;un événement.</p>
          </div>
          {!hubLayout ? (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Ouvrir le formulaire (modal)
            </button>
          ) : (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
              <PartyPopper className="h-4 w-4 shrink-0 text-amber-300/90" />
              Astuce : copiez le lien depuis la carte avant de coller dans un formulaire d&apos;événement.
            </div>
          )}
        </article>

        <article className={`${hubPanel} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2f3244] px-5 py-3">
            <h2 className="text-base font-semibold text-slate-100">Liens enregistrés</h2>
            <span className="text-xs text-slate-500">
              {filteredLinks.length} affiché{filteredLinks.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="p-5">
            {loading ? (
              hubLayout ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-[#353a50] bg-[#121623]/60 p-4"
                    >
                      <div className="h-4 w-1/3 rounded bg-slate-700/50" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-800/40" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-slate-800/40" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Chargement...</p>
              )
            ) : filteredLinks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600/50 bg-[#0f1424]/60 p-8 text-center">
                <Link2 className="mx-auto h-10 w-10 text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">
                  {links.length === 0 ? "Aucun lien configuré. Ajoutez un salon vocal." : "Aucun lien pour ce filtre."}
                </p>
                {links.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                    Créer le premier lien
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => {
                  const busy = toggleBusyId === link.id;
                  return (
                    <div
                      key={link.id}
                      className={`group rounded-2xl border bg-[#121623]/90 p-4 shadow-[0_8px_28px_rgba(2,6,23,0.35)] transition hover:border-indigo-400/35 hover:shadow-[0_12px_36px_rgba(2,6,23,0.45)] ${
                        link.isActive ? "border-emerald-500/20" : "border-[#353a50]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="inline-flex items-center gap-2 font-semibold text-slate-100">
                              <Link2 className="h-4 w-4 shrink-0 text-cyan-300" />
                              {link.name}
                            </p>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                link.isActive
                                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                  : "border-slate-500/40 bg-slate-800/80 text-slate-400"
                              }`}
                            >
                              {link.isActive ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-sm text-indigo-200 hover:text-indigo-100"
                          >
                            {link.url}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          </a>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copyUrl(link.url, link.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                copyFlashId === link.id
                                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                                  : "border-slate-600/50 bg-slate-800/60 text-slate-200 hover:border-indigo-400/40"
                              }`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copyFlashId === link.id ? "Copié !" : "Copier"}
                            </button>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                          <div
                            className="flex rounded-xl border border-slate-600/50 bg-[#0c0e14]/80 p-1"
                            role="group"
                            aria-label="État du lien"
                          >
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => !link.isActive && toggleActive(link)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                link.isActive ? "bg-emerald-600/90 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              On
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => link.isActive && toggleActive(link)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                !link.isActive ? "bg-slate-600/90 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              Off
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(link)}
                              className="rounded-xl border border-cyan-300/35 bg-cyan-300/10 p-2.5 text-cyan-100 transition hover:brightness-110"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(link)}
                              disabled={busy}
                              className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-2.5 text-amber-100 transition hover:brightness-110 disabled:opacity-50"
                              title="Basculer actif / inactif"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(link)}
                              className="rounded-xl border border-rose-300/35 bg-rose-300/10 p-2.5 text-rose-100 transition hover:brightness-110"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </section>
          </div>
          {hubLayout ? (
            <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide et raccourcis liens vocaux">
              <div className={`${layoutPanelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Compass className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  Astuce équipe
                </p>
                <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                  Les planifications existantes ne sont pas mises à jour automatiquement quand vous supprimez un lien :
                  vérifiez les créneaux déjà publiés.
                </p>
              </div>

              <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                  En trois gestes
                </p>
                <ol className="mt-4 space-y-[0.65rem]">
                  {liensVocauxAsideSteps.map((step) => (
                    <li key={step.n} className="flex min-w-0 gap-3">
                      <span
                        aria-hidden
                        className="flex h-[2.125em] min-w-[2.125em] items-center justify-center rounded-lg border border-violet-500/28 bg-violet-500/[0.09] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] font-bold tabular-nums text-violet-50"
                      >
                        {step.n}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-semibold text-zinc-100">{step.title}</p>
                        <p className="mt-1 text-[length:clamp(0.6875rem,0.62rem+0.2vw,0.8rem)] leading-[1.55] text-zinc-500">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className={`${layoutPanelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
                <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Modules proches
                </p>
                <nav className="mt-3 flex flex-col gap-2" aria-label="Liens pilier événements">
                  <Link
                    href="/admin/communaute/evenements/calendrier"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Calendrier
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/events/planification"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-cyan-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Planification
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/participation"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Présences
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/propositions"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-amber-400/24 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Propositions
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/liste"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-fuchsia-400/22 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    Liste des événements
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements"
                    className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/14 hover:bg-zinc-900/72 ${focusRingClass}`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <CalendarCheck2 className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                      Hub événements
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  </Link>
                </nav>
              </div>
            </aside>
          ) : null}
        </div>

      {formModalOpen ? (
        <div
          className={modalBackdropClass}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeFormModal();
          }}
        >
          <div
            className={modalShellClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby={formTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-xl border border-white/10 bg-black/30 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 px-6 pb-4 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200/90">Salon Discord</p>
              <h2 id={formTitleId} className="mt-1 text-xl font-semibold text-white">
                {editingId ? "Modifier le lien vocal" : "Ajouter un lien vocal"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Collez l&apos;URL complète du salon (invite ou lien de salon). Le nom sert d&apos;étiquette dans les listes.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="lv-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-indigo-100/85">
                  Nom du vocal
                </label>
                <input
                  ref={firstFieldRef}
                  id="lv-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Ex : Vocal Communauté"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="lv-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-indigo-100/85">
                  Lien
                </label>
                <input
                  id="lv-url"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  className={inputClass}
                  placeholder="https://discord.com/channels/..."
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-600/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.2)] transition hover:bg-emerald-500 disabled:opacity-50 min-w-[140px]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-xl border border-slate-500/50 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className={modalBackdropClass}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            className={`${modalShellClass} max-w-md`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-6 pb-2 pt-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/35 bg-rose-500/15">
                <Trash2 className="h-7 w-7 text-rose-200" />
              </div>
              <h2 id={deleteTitleId} className="mt-4 text-center text-lg font-semibold text-white">
                Supprimer ce lien ?
              </h2>
              <p className="mt-2 text-center text-sm text-slate-400">
                <span className="font-medium text-slate-200">{deleteTarget.name}</span>
                <br />
                Cette action est définitive. Les planifications existantes ne sont pas modifiées automatiquement.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-500/50 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl border border-rose-500/40 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
