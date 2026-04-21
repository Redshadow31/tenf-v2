"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Pencil, Plus, RefreshCw, ShieldCheck, UserCircle2, X } from "lucide-react";
import {
  PARIS_TIMEZONE,
  formatEventDateTimeInTimezone,
  parisLocalDateTimeToUtcIso,
  utcIsoToParisDateTimeLocalInput,
} from "@/lib/timezone";

type CommunityEvent = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  startAtUtc?: string;
  date: string;
  location?: string;
  image?: string;
  isPublished?: boolean;
  createdBy?: string;
  spotlightStreamerLogin?: string;
  spotlightStreamerDisplayName?: string;
  seriesId?: string;
  seriesName?: string;
};

type EventForm = {
  title: string;
  description: string;
  category: string;
  dateParisLocal: string;
  isPublished: boolean;
  imageUrl: string;
  spotlightStreamerLogin: string;
  spotlightStreamerDisplayName: string;
  seriesId: string;
  seriesName: string;
};

type MemberSearchResult = {
  twitchLogin: string;
  displayName: string;
  isActive?: boolean;
};

type CategorySeriesOption = {
  seriesId: string;
  seriesName: string;
};

const DEFAULT_FORM: EventForm = {
  title: "",
  description: "",
  category: "Spotlight",
  dateParisLocal: "",
  isPublished: false,
  imageUrl: "",
  spotlightStreamerLogin: "",
  spotlightStreamerDisplayName: "",
  seriesId: "",
  seriesName: "",
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function normalizeResponsible(raw?: string): string {
  if (!raw || raw === "system") return "Non assigne";
  return raw;
}

function getEventResponsible(event: CommunityEvent): string {
  if (event.category === "Spotlight") {
    const spotlightResponsible = String(event.spotlightStreamerDisplayName || event.spotlightStreamerLogin || "").trim();
    if (spotlightResponsible) return spotlightResponsible;
  }
  return normalizeResponsible(event.createdBy);
}

function isFormValid(form: EventForm): boolean {
  if (!form.title.trim() || !form.dateParisLocal) return false;
  if (form.category === "Spotlight") {
    return Boolean(form.spotlightStreamerLogin.trim());
  }
  if (form.category === "Formation" || form.category === "Jeux communautaire") {
    return Boolean(form.seriesName.trim());
  }
  return true;
}

function normalizeSeriesSeed(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSeriesId(category: string, seriesName: string): string {
  const categorySeed = normalizeSeriesSeed(category) || "event";
  const nameSeed = normalizeSeriesSeed(seriesName) || "serie";
  return `series-${categorySeed}-${nameSeed}`;
}

export default function CommunauteEvenementsCalendrierPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [allEventsCatalog, setAllEventsCatalog] = useState<CommunityEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"infos" | "publication" | "preview">("infos");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [spotlightSearch, setSpotlightSearch] = useState("");
  const [spotlightResults, setSpotlightResults] = useState<MemberSearchResult[]>([]);
  const [spotlightLoading, setSpotlightLoading] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/events?admin=true", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const now = new Date();
      const incoming = Array.isArray(payload?.events) ? (payload.events as CommunityEvent[]) : [];
      setAllEventsCatalog(incoming);
      const upcoming = incoming
        .filter((event) => new Date(event.startAtUtc || event.date).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.startAtUtc || a.date).getTime() - new Date(b.startAtUtc || b.date).getTime());
      setEvents(upcoming.slice(0, 50));
    } catch (loadErr) {
      setError(loadErr instanceof Error ? loadErr.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    const shouldSearch = modalOpen && form.category === "Spotlight" && spotlightSearch.trim().length >= 2;
    if (!shouldSearch) {
      setSpotlightResults([]);
      setSpotlightLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setSpotlightLoading(true);
        const response = await fetch(
          `/api/members/search?q=${encodeURIComponent(spotlightSearch.trim())}&includeInactive=false&includeCommunity=true`,
          { cache: "no-store", signal: controller.signal }
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
        const members = Array.isArray(payload?.members) ? payload.members : [];
        setSpotlightResults(
          members.map((member: any) => ({
            twitchLogin: String(member.twitchLogin || "").toLowerCase(),
            displayName: String(member.displayName || member.twitchLogin || ""),
            isActive: member.isActive !== false,
          }))
        );
      } catch {
        setSpotlightResults([]);
      } finally {
        setSpotlightLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [modalOpen, form.category, spotlightSearch]);

  const categorySeriesOptions = useMemo(() => {
    if (form.category !== "Formation" && form.category !== "Jeux communautaire") return [];

    const map = new Map<string, CategorySeriesOption>();
    allEventsCatalog.forEach((event) => {
      if (event.category !== form.category) return;
      const seriesName = String(event.seriesName || event.title || "").trim();
      if (!seriesName) return;
      const seriesId = String(event.seriesId || buildSeriesId(form.category, seriesName)).trim();
      if (!seriesId) return;
      if (!map.has(seriesId)) {
        map.set(seriesId, { seriesId, seriesName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.seriesName.localeCompare(b.seriesName, "fr"));
  }, [allEventsCatalog, form.category]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingEventId(null);
    setForm(DEFAULT_FORM);
    setImageFile(null);
    setImagePreview(null);
    setSpotlightSearch("");
    setSpotlightResults([]);
    setModalTab("infos");
    setModalOpen(true);
  };

  const openEditModal = (event: CommunityEvent) => {
    setModalMode("edit");
    setEditingEventId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "Spotlight",
      dateParisLocal: utcIsoToParisDateTimeLocalInput(event.startAtUtc || event.date),
      isPublished: Boolean(event.isPublished),
      imageUrl: event.image || "",
      spotlightStreamerLogin: event.spotlightStreamerLogin || "",
      spotlightStreamerDisplayName: event.spotlightStreamerDisplayName || "",
      seriesId: event.seriesId || "",
      seriesName: event.seriesName || "",
    });
    setImageFile(null);
    setImagePreview(event.image || null);
    setSpotlightSearch(event.spotlightStreamerLogin || "");
    setSpotlightResults([]);
    setModalTab("infos");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const submitModal = async () => {
    if (!isFormValid(form)) {
      setError("Titre et date sont obligatoires.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      let finalImageUrl = form.imageUrl.trim() || "";
      if (imageFile) {
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadResponse = await fetch("/api/admin/events/upload-image", {
          method: "POST",
          body: uploadData,
        });
        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload?.error || "Upload banniere impossible");
        }
        finalImageUrl = String(uploadPayload?.imageUrl || "");
      }
      const startAtUtc = parisLocalDateTimeToUtcIso(form.dateParisLocal);
      const isTrackedCategory = form.category === "Formation" || form.category === "Jeux communautaire";
      const normalizedSeriesName = isTrackedCategory ? form.seriesName.trim() : "";
      const normalizedSeriesId = isTrackedCategory
        ? (form.seriesId.trim() || buildSeriesId(form.category, normalizedSeriesName))
        : "";
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        startAtParisLocal: form.dateParisLocal,
        startAtUtc,
        date: startAtUtc,
        isPublished: form.isPublished,
        image: finalImageUrl || undefined,
        spotlightStreamerLogin:
          form.category === "Spotlight"
            ? form.spotlightStreamerLogin.trim().replace(/^@/, "").toLowerCase()
            : undefined,
        spotlightStreamerDisplayName:
          form.category === "Spotlight" ? form.spotlightStreamerDisplayName.trim() || undefined : undefined,
        seriesId: isTrackedCategory ? normalizedSeriesId : undefined,
        seriesName: isTrackedCategory ? normalizedSeriesName : undefined,
        sourceEventId: isTrackedCategory && normalizedSeriesId ? editingEventId || undefined : undefined,
      };
      const response =
        modalMode === "create"
          ? await fetch("/api/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/events/${editingEventId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Echec enregistrement evenement");
      }
      setModalOpen(false);
      await loadEvents();
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : "Erreur enregistrement");
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  const handleImageChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit etre une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La banniere ne doit pas depasser 5MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => {
    const published = events.filter((event) => event.isPublished).length;
    const draft = events.length - published;
    const byCategory = events.reduce<Record<string, number>>((acc, event) => {
      const key = event.category || "Non classe";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const responsibleCount = new Set(events.map((event) => getEventResponsible(event))).size;
    return { published, draft, topCategories, responsibleCount };
  }, [events]);

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Communaute - Calendrier</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Calendrier evenementiel pilote
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page centralise la lecture operationnelle des prochains evenements. Chaque fiche affiche un responsable
              pour clarifier qui porte la coordination et simplifier les relances.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openCreateModal} className={subtleButtonClass}>
              <Plus className="h-4 w-4" />
              Ajouter un evenement
            </button>
            <button type="button" onClick={() => void loadEvents()} className={subtleButtonClass}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <Link href="/admin/events/planification" className={subtleButtonClass}>
              Ouvrir edition complete
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/communaute/evenements/spotlight/gestion" className={subtleButtonClass}>
              Secours Spotlight manuel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Evenements a venir</p>
          <p className="mt-2 text-3xl font-semibold">{events.length}</p>
          <p className="mt-1 text-xs text-slate-400">Prochaines occurrences calendrier</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Publies</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.published}</p>
          <p className="mt-1 text-xs text-slate-400">Deja visibles pour la communaute</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Brouillons</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{stats.draft}</p>
          <p className="mt-1 text-xs text-slate-400">A finaliser avant diffusion</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Responsables identifies</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.responsibleCount}</p>
          <p className="mt-1 text-xs text-slate-400">Personnes en charge des evenements</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Lecture rapide du calendrier</h2>
          <p className="mt-1 text-sm text-slate-400">Vue priorisee des categories les plus presentes.</p>
          <div className="mt-4 space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-300">
                Aucune categorie disponible pour le moment.
              </p>
            ) : (
              stats.topCategories.map(([category, count]) => {
                const width = Math.max(10, Math.round((count / Math.max(1, events.length)) * 100));
                return (
                  <div key={category} className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-100">{category}</p>
                      <p className="text-xs text-slate-400">{count} event(s)</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800/85">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Explication de la page</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              1. Lire les volumes publies/brouillons pour prioriser les publications.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              2. Verifier le responsable de chaque evenement pour eviter les zones sans owner.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              3. Ouvrir l'edition complete pour modifier date, contenu, publication et visuels.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <span className="inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Regle operationnelle
            </span>
            <p className="mt-1">Chaque evenement doit avoir un responsable identifiable avant publication.</p>
          </div>
        </article>
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Prochains evenements (avec responsable)</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-400">Chargement du calendrier...</div>
        ) : events.length === 0 ? (
          <div className="p-5 text-sm text-slate-400">Aucun evenement a venir.</div>
        ) : (
          <div className="space-y-3 p-5">
            {events.map((event) => {
              const dateLabel = formatEventDateTimeInTimezone(event.startAtUtc || event.date, PARIS_TIMEZONE).fullLabel;
              const responsible = getEventResponsible(event);
              return (
                <article key={event.id} className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-100">{event.title}</h3>
                        {event.isPublished ? (
                          <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">
                            Publie
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">
                            Brouillon
                          </span>
                        )}
                        {event.category ? (
                          <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">
                            {event.category}
                          </span>
                        ) : null}
                        {event.seriesName ? (
                          <span className="rounded-full border border-violet-300/35 bg-violet-300/10 px-2 py-0.5 text-xs text-violet-100">
                            Serie: {event.seriesName}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{dateLabel}</p>
                      {event.description ? <p className="mt-2 text-sm text-slate-300 line-clamp-2">{event.description}</p> : null}
                    </div>
                    <div className="min-w-[170px] rounded-lg border border-indigo-300/25 bg-indigo-300/10 px-3 py-2 text-xs text-indigo-100">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-indigo-200/85">Responsable</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-medium">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        {responsible}
                      </p>
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-indigo-200/35 bg-indigo-200/10 px-2 py-1 text-[11px] text-indigo-100 transition hover:bg-indigo-200/20"
                      >
                        <Pencil className="h-3 w-3" />
                        Editer
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-cyan-100">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Besoin de modifier un evenement ? Utiliser le bouton <strong>Ouvrir edition complete</strong> pour gerer creation,
            publication, visuels et parametrage avance.
          </p>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-indigo-300/25 bg-[#0f1527] shadow-[0_25px_70px_rgba(2,6,23,0.7)]">
            <div className="flex items-start justify-between gap-3 border-b border-[#2f3244] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Calendrier communaute</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                  {modalMode === "create" ? "Ajouter un evenement" : "Editer un evenement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-600/60 bg-slate-800/70 p-2 text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[#2f3244] px-5 py-3">
              <div className="inline-flex rounded-xl border border-indigo-300/20 bg-[#11192d] p-1">
                <button
                  type="button"
                  onClick={() => setModalTab("infos")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    modalTab === "infos" ? "bg-indigo-500/30 text-indigo-100" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Informations
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("publication")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    modalTab === "publication" ? "bg-indigo-500/30 text-indigo-100" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Publication
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("preview")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    modalTab === "preview" ? "bg-indigo-500/30 text-indigo-100" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Apercu
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              {modalTab === "infos" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 rounded-xl border border-[#353a50] bg-[#10172a]/70 p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Banniere evenement</p>
                    {!imagePreview ? (
                      <div className="mt-2 rounded-xl border-2 border-dashed border-slate-600/70 p-4 text-center">
                        <input
                          id="event-banner-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e.target.files?.[0])}
                          className="hidden"
                        />
                        <label htmlFor="event-banner-upload" className="cursor-pointer text-sm text-slate-200">
                          Importer une banniere (recommande: 800x200)
                        </label>
                        <p className="mt-1 text-xs text-slate-400">png, jpg, webp - max 5MB</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Apercu banniere" className="w-full rounded-lg border border-slate-600/70 object-cover" />
                        <div className="mt-2 flex gap-2">
                          <input
                            id="event-banner-replace"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e.target.files?.[0])}
                            className="hidden"
                          />
                          <label
                            htmlFor="event-banner-replace"
                            className="cursor-pointer rounded-md border border-cyan-300/35 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
                          >
                            Remplacer
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                              setForm((prev) => ({ ...prev, imageUrl: "" }));
                            }}
                            className="rounded-md border border-rose-300/35 bg-rose-300/10 px-2 py-1 text-xs text-rose-100"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm text-slate-300">Titre *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/45"
                      placeholder="Ex: Spotlight de printemps"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Categorie *</label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                          spotlightStreamerLogin: e.target.value === "Spotlight" ? prev.spotlightStreamerLogin : "",
                          spotlightStreamerDisplayName: e.target.value === "Spotlight" ? prev.spotlightStreamerDisplayName : "",
                          seriesId:
                            e.target.value === "Formation" || e.target.value === "Jeux communautaire"
                              ? prev.seriesId
                              : "",
                          seriesName:
                            e.target.value === "Formation" || e.target.value === "Jeux communautaire"
                              ? prev.seriesName
                              : "",
                        }))
                      }
                      className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/45"
                    >
                      <option value="Spotlight">Spotlight</option>
                      <option value="Soirée Film">Soirée Film</option>
                      <option value="Formation">Formation</option>
                      <option value="Jeux communautaire">Jeux communautaire</option>
                      <option value="Apero">Apero</option>
                    </select>
                  </div>
                  {form.category === "Spotlight" ? (
                    <div className="md:col-span-2 rounded-xl border border-indigo-300/30 bg-indigo-300/10 p-3">
                      <label className="mb-2 block text-sm text-indigo-100">Membre mis en avant (Spotlight) *</label>
                      {form.spotlightStreamerLogin ? (
                        <div className="mb-2 flex items-center justify-between rounded-lg border border-indigo-200/35 bg-[#0f1424] px-3 py-2">
                          <div>
                            <p className="text-sm text-white">{form.spotlightStreamerDisplayName || form.spotlightStreamerLogin}</p>
                            <p className="text-xs text-slate-400">@{form.spotlightStreamerLogin}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                spotlightStreamerLogin: "",
                                spotlightStreamerDisplayName: "",
                              }))
                            }
                            className="rounded-md border border-slate-500/40 px-2 py-1 text-xs text-slate-300 hover:text-white"
                          >
                            Changer
                          </button>
                        </div>
                      ) : null}
                      <input
                        type="text"
                        value={spotlightSearch}
                        onChange={(e) => setSpotlightSearch(e.target.value)}
                        className="w-full rounded-lg border border-[#353a50] bg-[#0f1424] px-3 py-2 text-sm text-white outline-none focus:border-indigo-300/45"
                        placeholder="Rechercher un membre (pseudo Twitch)"
                      />
                      {spotlightLoading ? (
                        <p className="mt-2 text-xs text-slate-300">Recherche en cours...</p>
                      ) : null}
                      {spotlightResults.length > 0 ? (
                        <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
                          {spotlightResults.map((member) => (
                            <button
                              key={member.twitchLogin}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  spotlightStreamerLogin: member.twitchLogin,
                                  spotlightStreamerDisplayName: member.displayName,
                                }))
                              }
                              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-left hover:border-indigo-300/45"
                            >
                              <p className="text-sm text-white">{member.displayName}</p>
                              <p className="text-xs text-slate-400">@{member.twitchLogin}</p>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-2 text-xs text-indigo-100/80">
                        Si l'evenement est publie en categorie Spotlight, la mise en avant Lives est programmee automatiquement de l'heure de debut a +2h.
                      </p>
                    </div>
                  ) : null}
                  {form.category === "Formation" || form.category === "Jeux communautaire" ? (
                    <div className="md:col-span-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3">
                      <label className="mb-2 block text-sm text-cyan-100">
                        {form.category === "Formation" ? "Parcours de formation" : "Jeu suivi"} *
                      </label>
                      <select
                        value={form.seriesId}
                        onChange={(e) => {
                          const selected = categorySeriesOptions.find((item) => item.seriesId === e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            seriesId: e.target.value,
                            seriesName: selected?.seriesName || prev.seriesName,
                          }));
                        }}
                        className="w-full rounded-lg border border-[#353a50] bg-[#0f1424] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45"
                      >
                        <option value="">Nouvelle serie</option>
                        {categorySeriesOptions.map((option) => (
                          <option key={option.seriesId} value={option.seriesId}>
                            {option.seriesName}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={form.seriesName}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              seriesName: e.target.value,
                              seriesId:
                                prev.seriesId ||
                                buildSeriesId(
                                  form.category,
                                  e.target.value
                                ),
                            }))
                          }
                          className="w-full rounded-lg border border-[#353a50] bg-[#0f1424] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45"
                          placeholder={
                            form.category === "Formation"
                              ? "Nom de la formation (ex: OBS debutant)"
                              : "Nom du jeu (ex: Mario Kart 8)"
                          }
                        />
                      </div>
                      <p className="mt-2 text-xs text-cyan-100/85">
                        Utilise une serie existante pour suivre l'evolution des sessions dans le temps (engagement, performances, tendances).
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Date & heure (Paris) *</label>
                    <input
                      type="datetime-local"
                      value={form.dateParisLocal}
                      onChange={(e) => setForm((prev) => ({ ...prev, dateParisLocal: e.target.value }))}
                      className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/45"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm text-slate-300">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/45"
                      placeholder="Points cles a communiquer avant et pendant l'evenement."
                    />
                  </div>
                </div>
              ) : null}

              {modalTab === "publication" ? (
                <div className="space-y-4">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                    />
                    Publier sur la vue publique /events
                  </label>
                  <div className="rounded-xl border border-indigo-300/25 bg-indigo-300/10 p-3 text-xs text-indigo-100">
                    <p className="font-medium">Explication</p>
                    <p className="mt-1">
                      Quand ce statut est actif, l'evenement devient visible pour les membres sur la partie publique.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">
                    <p className="font-medium">Responsable</p>
                    <p className="mt-1">
                      Spotlight: responsable = membre selectionne. Sinon: responsable = compte admin createur.
                    </p>
                  </div>
                </div>
              ) : null}

              {modalTab === "preview" ? (
                <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-100">{form.title || "Titre evenement"}</p>
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">
                      {form.category || "Non classe"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        form.isPublished
                          ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                          : "border-amber-300/35 bg-amber-300/10 text-amber-100"
                      }`}
                    >
                      {form.isPublished ? "Publie" : "Brouillon"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {form.dateParisLocal
                      ? formatEventDateTimeInTimezone(parisLocalDateTimeToUtcIso(form.dateParisLocal), PARIS_TIMEZONE).fullLabel
                      : "Date non definie"}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">{form.description || "Aucune description fournie."}</p>
                  {form.category === "Spotlight" ? (
                    <p className="mt-2 text-xs text-indigo-200">
                      Membre Spotlight: {form.spotlightStreamerDisplayName || form.spotlightStreamerLogin || "Non selectionne"}
                    </p>
                  ) : null}
                  {(form.category === "Formation" || form.category === "Jeux communautaire") ? (
                    <p className="mt-2 text-xs text-cyan-200">
                      Serie suivie: {form.seriesName || "Non renseignee"}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2f3244] px-5 py-4">
              <p className="text-xs text-slate-400">Modal multi-onglets pour creation et edition rapide.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-600/70 bg-slate-800/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void submitModal()}
                  disabled={saving || uploadingImage || !isFormValid(form)}
                  className="rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving || uploadingImage ? "Enregistrement..." : modalMode === "create" ? "Creer l'evenement" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

