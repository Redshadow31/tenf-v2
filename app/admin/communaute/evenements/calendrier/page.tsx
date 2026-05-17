"use client";

import Link from "next/link";
import { addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Eye,
  ExternalLink,
  Film,
  Gamepad2,
  GraduationCap,
  LayoutGrid,
  List,
  ListOrdered,
  PartyPopper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Wine,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const subtleButtonClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const calendarAsideSteps = [
  {
    n: "1",
    title: "Friser, puis affiner",
    body: "Cliquez un jour dans la frise pour isoler les créneaux avant d’annoncer sur Discord ou en vocal.",
  },
  {
    n: "2",
    title: "Brouillon d’abord",
    body: "Ne publiez que lorsque le visuel et le texte reflètent exactement ce que verront les membres.",
  },
  {
    n: "3",
    title: "Responsable visible",
    body: "Spotlight affiche le streamer mis en avant ; les autres types s’appuient sur l’auteur staff — anticipez les relances.",
  },
];

const CATEGORY_CHIPS: { value: string; label: string; icon: LucideIcon; ring: string }[] = [
  { value: "Spotlight", label: "Spotlight", icon: Sparkles, ring: "ring-violet-400/50" },
  { value: "Soirée Film", label: "Soirée film", icon: Film, ring: "ring-fuchsia-400/50" },
  { value: "Formation", label: "Formation", icon: GraduationCap, ring: "ring-cyan-400/50" },
  { value: "Jeux communautaire", label: "Jeux", icon: Gamepad2, ring: "ring-emerald-400/50" },
  { value: "Apero", label: "Apéro", icon: Wine, ring: "ring-amber-400/50" },
];

function categoryMeta(category?: string): { icon: LucideIcon; gradient: string } {
  const c = category || "";
  if (c === "Spotlight") return { icon: Sparkles, gradient: "from-violet-500 to-fuchsia-600" };
  if (c === "Soirée Film") return { icon: Film, gradient: "from-fuchsia-500 to-pink-600" };
  if (c === "Formation") return { icon: GraduationCap, gradient: "from-cyan-500 to-sky-600" };
  if (c === "Jeux communautaire") return { icon: Gamepad2, gradient: "from-emerald-500 to-teal-600" };
  if (c === "Apero") return { icon: Wine, gradient: "from-amber-500 to-orange-600" };
  return { icon: PartyPopper, gradient: "from-indigo-500 to-sky-600" };
}

function normalizeResponsible(raw?: string): string {
  if (!raw || raw === "system") return "Non assigné";
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

/** Login Twitch normalisé (4–25 caractères, alphanum + underscore). */
function parseTwitchLoginInput(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase().replace(/^@+/, "");
  if (!/^[a-z0-9_]{4,25}$/.test(cleaned)) return null;
  return cleaned;
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
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [timelineDayKey, setTimelineDayKey] = useState<string | null>(null);
  const [modalEnter, setModalEnter] = useState(false);

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
          `/api/members/search?q=${encodeURIComponent(spotlightSearch.trim())}&includeInactive=true&includeCommunity=true`,
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

  const closeModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
  }, [saving]);

  const submitModal = async () => {
    if (!isFormValid(form)) {
      setError("Titre et date sont obligatoires. Pour un Spotlight, renseignez aussi le membre mis en avant.");
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
          throw new Error(uploadPayload?.error || "Impossible d’envoyer la bannière");
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
        throw new Error(result?.error || "Échec de l’enregistrement de l’événement");
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
      setError("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La bannière ne doit pas dépasser 5 Mo.");
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

  const spotlightManualLogin = useMemo(() => parseTwitchLoginInput(spotlightSearch), [spotlightSearch]);

  const spotlightExactMatch = useMemo(
    () =>
      Boolean(
        spotlightManualLogin &&
          spotlightResults.some((m) => m.twitchLogin.toLowerCase() === spotlightManualLogin)
      ),
    [spotlightManualLogin, spotlightResults]
  );

  const showSpotlightManualButton =
    form.category === "Spotlight" &&
    !form.spotlightStreamerLogin &&
    !spotlightLoading &&
    spotlightManualLogin !== null &&
    !spotlightExactMatch;

  const showSpotlightSpellHint =
    form.category === "Spotlight" &&
    !form.spotlightStreamerLogin &&
    !spotlightLoading &&
    spotlightSearch.trim().length >= 2 &&
    spotlightManualLogin === null &&
    spotlightResults.length === 0;

  const displayedEvents = useMemo(() => {
    let list = [...events];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.seriesName || "").toLowerCase().includes(q) ||
          (e.spotlightStreamerLogin || "").toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") list = list.filter((e) => (e.category || "") === filterCategory);
    if (filterStatus === "published") list = list.filter((e) => e.isPublished);
    if (filterStatus === "draft") list = list.filter((e) => !e.isPublished);
    if (timelineDayKey) {
      list = list.filter(
        (e) =>
          formatInTimeZone(new Date(e.startAtUtc || e.date), PARIS_TIMEZONE, "yyyy-MM-dd") === timelineDayKey
      );
    }
    return list;
  }, [events, searchQuery, filterCategory, filterStatus, timelineDayKey]);

  const timelineDays = useMemo(() => {
    const days: { key: string; weekday: string; dayNum: string; count: number }[] = [];
    const start = new Date();
    for (let i = 0; i < 14; i++) {
      const d = addDays(start, i);
      const key = formatInTimeZone(d, PARIS_TIMEZONE, "yyyy-MM-dd");
      const weekday = formatInTimeZone(d, PARIS_TIMEZONE, "EEE", { locale: fr });
      const dayNum = formatInTimeZone(d, PARIS_TIMEZONE, "d");
      const count = events.filter(
        (e) => formatInTimeZone(new Date(e.startAtUtc || e.date), PARIS_TIMEZONE, "yyyy-MM-dd") === key
      ).length;
      days.push({ key, weekday, dayNum, count });
    }
    return days;
  }, [events]);

  useEffect(() => {
    if (!modalOpen) {
      setModalEnter(false);
      return;
    }
    const id = requestAnimationFrame(() => setModalEnter(true));
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !saving) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, saving, closeModal]);

  const clearTimelineFilter = useCallback(() => setTimelineDayKey(null), []);

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-10 text-white selection:bg-violet-500/35 [--cal-gap:clamp(1rem,1.55vw,1.85rem)]">
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

      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-10 pt-2 sm:pb-12 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--cal-gap)]">
            <header className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${panelClass}`}>
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/communaute/evenements"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Retour pilotage événements
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                    Ce que les membres voient
                  </span>
                  <span className="rounded-full border border-emerald-400/28 bg-emerald-500/[0.08] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-emerald-100/90">
                    Staff & animation
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    Calendrier — animation & engagement
                  </p>
                  <h1 className="mt-2 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                    Vos prochains rendez-vous, en un coup d’œil
                  </h1>
                  <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                    Anticipez ce qui s’affiche sur l’agenda public et dans l’espace membre : chaque ligne rappelle le{" "}
                    <strong className="font-semibold text-zinc-100">responsable</strong>, l’état de publication et la
                    catégorie. Large écran&nbsp;: grille principale et colonne d’aide absorbent le vide latéral ; zoom navigateur&nbsp;: typo et gaps suivent avec des clamp.
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className={`${subtleButtonClass} ${focusRingClass} border-fuchsia-400/35 bg-fuchsia-950/[0.32] text-fuchsia-50 hover:border-fuchsia-300/45 hover:bg-fuchsia-900/[0.38]`}
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Nouvel événement
                  </button>
                  <button type="button" onClick={() => void loadEvents()} className={`${subtleButtonClass} ${focusRingClass}`}>
                    <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                    Actualiser
                  </button>
                  <Link
                    href="/evenements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-400/28 bg-sky-950/[0.35] text-sky-100`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Aperçu public (/evenements)
                  </Link>
                  <Link href="/admin/events/planification" className={`${subtleButtonClass} ${focusRingClass}`}>
                    Édition complète
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <Link href="/admin/communaute/evenements/spotlight/gestion" className={`${subtleButtonClass} ${focusRingClass}`}>
                    Spotlight — secours manuel
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.16),transparent_42%,transparent_58%,rgba(244,114,182,0.1))]"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]" />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse calendrier
                  </span>
                  <dl className="grid min-w-0 grid-cols-3 gap-[clamp(0.45rem,0.9vw,0.65rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-zinc-500">Créneaux</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                        {loading ? "…" : events.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-emerald-500/90">Publiés</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-emerald-200/96">
                        {loading ? "…" : stats.published}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                      <dt className="font-medium uppercase tracking-wide text-amber-500/90">Brouillons</dt>
                      <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-amber-100/94">
                        {loading ? "…" : stats.draft}
                      </dd>
                    </div>
                  </dl>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:clamp(0.65rem,0.56rem+0.26vw,0.78rem)] text-zinc-500">
                    <Compass className="h-3.5 w-3.5 shrink-0 text-violet-400/75" aria-hidden />
                    Fuseau&nbsp;: Europe/Paris · données sur la fenêtre chargée&nbsp;:{" "}
                    {loading ? "chargement…" : `${events.length} créneau${events.length !== 1 ? "x" : ""}`}.
                  </p>
                </div>
              </div>
            </header>

      {error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</section>
      ) : null}

      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Frise des 14 prochains jours</h2>
            <p className="mt-1 text-sm text-slate-400">
              Cliquez un jour pour filtrer la liste — idéal pour préparer les annonces Discord et les rappels vocaux.
            </p>
          </div>
          {timelineDayKey ? (
            <button
              type="button"
              onClick={clearTimelineFilter}
              className={`self-start rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 ${focusRingClass}`}
            >
              Réinitialiser le jour
            </button>
          ) : null}
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {timelineDays.map((day) => {
            const active = timelineDayKey === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setTimelineDayKey((k) => (k === day.key ? null : day.key))}
                className={`relative flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-2.5 py-3 text-center transition ${
                  active
                    ? "border-violet-400/58 bg-violet-500/[0.26] shadow-[0_0_24px_rgba(139,92,246,0.32)]"
                    : "border-zinc-600/85 bg-zinc-900/72 hover:border-violet-400/35 hover:bg-zinc-900/92"
                } ${focusRingClass}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{day.weekday}</span>
                <span className="mt-1 text-xl font-bold tabular-nums text-white">{day.dayNum}</span>
                <span
                  className={`mt-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-[11px] font-bold ${
                    day.count > 0 ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {day.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${panelClass} group min-w-0 p-4 transition hover:border-violet-400/30`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">À venir (fenêtre chargée)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums transition group-hover:text-violet-100">{events.length}</p>
          <p className="mt-1 text-xs text-slate-400">Créneaux triés par date</p>
        </article>
        <article className={`${panelClass} group border-emerald-500/15 p-4 transition hover:border-emerald-400/30`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Publiés</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-300 transition group-hover:text-emerald-200">{stats.published}</p>
          <p className="mt-1 text-xs text-slate-400">Visibles côté membres / public</p>
        </article>
        <article className={`${panelClass} group border-amber-500/15 p-4 transition hover:border-amber-400/30`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Brouillons</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-300 transition group-hover:text-amber-200">{stats.draft}</p>
          <p className="mt-1 text-xs text-slate-400">À finaliser avant diffusion</p>
        </article>
        <article className={`${panelClass} group border-sky-500/15 p-4 transition hover:border-sky-400/30`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Responsables</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-sky-300 transition group-hover:text-sky-200">{stats.responsibleCount}</p>
          <p className="mt-1 text-xs text-slate-400">Contacts pour relances staff</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-slate-100">Répartition par catégorie</h2>
          <p className="mt-1 text-sm text-slate-400">Proportion sur les créneaux à venir affichés ci-dessus.</p>
          <div className="mt-4 space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-300">
                Aucune catégorie pour le moment — créez un premier événement.
              </p>
            ) : (
              stats.topCategories.map(([category, count]) => {
                const { icon: CatIcon, gradient } = categoryMeta(category);
                const width = Math.max(10, Math.round((count / Math.max(1, events.length)) * 100));
                return (
                  <div
                    key={category}
                    className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 transition hover:border-indigo-400/25"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-inner`}>
                          <CatIcon className="h-4 w-4 text-white" aria-hidden />
                        </span>
                        {category}
                      </p>
                      <p className="text-xs text-slate-400">
                        {count} créneau{count > 1 ? "x" : ""}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/85">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-slate-100">Check-list rapide</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2.5 text-indigo-100">
              <span className="font-semibold text-white">1.</span> Lisez le ratio publiés / brouillons avant d’annoncer sur Discord.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2.5 text-cyan-100">
              <span className="font-semibold text-white">2.</span> Vérifiez le responsable affiché : évitez les créneaux « sans pilote ».
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2.5 text-amber-100">
              <span className="font-semibold text-white">3.</span> Bannière + texte prêts ? Passez en publié, ou ouvrez l’édition complète pour affiner.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <span className="inline-flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Règle d’équipe
            </span>
            <p className="mt-1">Chaque événement publié doit avoir un responsable clairement identifiable.</p>
          </div>
        </article>
      </section>

      <section className={`${panelClass} flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center`}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par titre, série, description…"
            className={`w-full rounded-xl border border-[#353a50] bg-[#0f1424] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 ${focusRingClass}`}
            aria-label="Rechercher un événement"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "draft"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterStatus(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
                filterStatus === key
                  ? "border-violet-400/48 bg-violet-500/[0.28] text-violet-50"
                  : "border-white/10 bg-black/30 text-slate-400 hover:border-white/20"
              }`}
            >
              {key === "all" ? "Tous statuts" : key === "published" ? "Publiés seulement" : "Brouillons seulement"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[#353a50] bg-[#0f1424] p-1">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`rounded-lg p-2 transition ${focusRingClass} ${viewMode === "cards" ? "bg-violet-500/[0.32] text-white" : "text-slate-400 hover:text-white"}`}
            aria-pressed={viewMode === "cards"}
            aria-label="Vue cartes"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition ${focusRingClass} ${viewMode === "list" ? "bg-violet-500/[0.32] text-white" : "text-slate-400 hover:text-white"}`}
            aria-pressed={viewMode === "list"}
            aria-label="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {displayedEvents.length} résultat{displayedEvents.length !== 1 ? "s" : ""}
          {timelineDayKey ? ` · jour ${timelineDayKey}` : ""}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${focusRingClass} ${
            filterCategory === "all"
              ? "border-white/30 bg-white/10 text-white"
              : "border-white/10 bg-black/25 text-slate-400 hover:border-white/20"
          }`}
        >
          Toutes catégories
        </button>
        {CATEGORY_CHIPS.map((c) => {
          const Icon = c.icon;
          const on = filterCategory === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilterCategory((prev) => (prev === c.value ? "all" : c.value))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${focusRingClass} ${
                on ? `border-indigo-400/50 bg-indigo-500/20 text-white ring-2 ${c.ring}` : "border-white/10 bg-black/25 text-slate-300 hover:border-white/20"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 border-b border-[#2f3244] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-100">Créneaux à venir</h2>
          <p className="text-xs text-slate-500">
            Liste : cliquez une ligne pour déplier · Cartes : aperçu direct · Crayon : ouvrir l’éditeur
          </p>
        </div>
        {loading ? (
          <div className="space-y-3 p-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
            <p className="text-center text-sm text-slate-500">Chargement du calendrier…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-600" aria-hidden />
            <p className="mt-3 text-sm text-slate-400">Aucun événement à venir dans cette fenêtre.</p>
            <button type="button" onClick={openCreateModal} className={`${subtleButtonClass} ${focusRingClass} mt-4`}>
              <Plus className="h-4 w-4" aria-hidden />
              Créer le premier créneau
            </button>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun résultat avec ces filtres.{" "}
            <button type="button" onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterStatus("all"); setTimelineDayKey(null); }} className="text-indigo-300 underline-offset-2 hover:underline">
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3 p-5">
            {displayedEvents.map((event) => {
              const dateLabel = formatEventDateTimeInTimezone(event.startAtUtc || event.date, PARIS_TIMEZONE).fullLabel;
              const responsible = getEventResponsible(event);
              const expanded = expandedEventId === event.id;
              const { icon: EvIcon, gradient } = categoryMeta(event.category);
              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-[#353a50] bg-[#121623]/80 transition hover:border-indigo-400/35"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedEventId((id) => (id === event.id ? null : event.id))}
                    className={`flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left ${focusRingClass}`}
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                        <EvIcon className="h-5 w-5 text-white" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-100">{event.title}</h3>
                          {event.isPublished ? (
                            <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">Publié</span>
                          ) : (
                            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">Brouillon</span>
                          )}
                          {event.category ? (
                            <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">{event.category}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden />
                          {dateLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="rounded-lg border border-indigo-300/25 bg-indigo-300/10 px-3 py-2 text-xs text-indigo-100">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-indigo-200/85">Responsable</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 font-medium">
                          <UserCircle2 className="h-3.5 w-3.5" aria-hidden />
                          {responsible}
                        </p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-slate-500 transition ${expanded ? "rotate-90" : ""}`} aria-hidden />
                    </div>
                  </button>
                  {expanded ? (
                    <div className="border-t border-[#2f3244] bg-black/20 px-4 py-3 sm:px-6">
                      {event.image ? (
                        <img src={event.image} alt="" className="mb-3 max-h-36 w-full rounded-lg object-cover object-center opacity-90" />
                      ) : null}
                      <p className="text-sm text-slate-300">{event.description || "Pas de description — pensez au texte visible par les membres."}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(event)}
                          className={`inline-flex items-center gap-1 rounded-lg border border-indigo-200/35 bg-indigo-200/10 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-200/20 ${focusRingClass}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Modifier
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {displayedEvents.map((event) => {
              const dateLabel = formatEventDateTimeInTimezone(event.startAtUtc || event.date, PARIS_TIMEZONE).fullLabel;
              const responsible = getEventResponsible(event);
              const { icon: EvIcon, gradient } = categoryMeta(event.category);
              return (
                <article
                  key={event.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#353a50] bg-[#121623]/80 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-indigo-400/40 hover:shadow-[0_16px_48px_rgba(79,70,229,0.15)]"
                >
                  <div className={`relative h-28 bg-gradient-to-br ${gradient} opacity-90`}>
                    {event.image ? (
                      <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-overlay" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1424] via-transparent to-transparent" />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-lg bg-black/40 p-1.5 backdrop-blur-sm">
                        <EvIcon className="h-4 w-4 text-white" aria-hidden />
                      </span>
                      {event.isPublished ? (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">Publié</span>
                      ) : (
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">Brouillon</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold leading-snug text-white transition group-hover:text-indigo-100">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3 shrink-0" aria-hidden />
                      {dateLabel}
                    </p>
                    {event.seriesName ? (
                      <p className="mt-2 text-xs text-violet-200/90">Série : {event.seriesName}</p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">{event.description || "Ajoutez une description pour guider les membres."}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                      <p className="inline-flex min-w-0 items-center gap-1 text-xs text-indigo-100/90">
                        <UserCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{responsible}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className={`inline-flex items-center gap-1 rounded-lg border border-indigo-300/40 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-medium text-indigo-50 opacity-90 transition hover:opacity-100 ${focusRingClass}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Éditer
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(15,23,42,0.85))] p-4 text-cyan-50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden />
          <div className="text-sm leading-relaxed">
            <p className="font-medium text-cyan-100">Besoin d’aller plus loin ?</p>
            <p className="mt-1 text-cyan-100/85">
              L’<strong className="text-white">édition complète</strong> reste l’endroit idéal pour les cas complexes (séries, visuels, publication fine). Ce calendrier sert surtout à <strong className="text-white">voir et ajuster vite</strong> ce que vivront les membres sur l’agenda.
            </p>
          </div>
        </div>
      </section>
          </main>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start" aria-label="Aide et raccourcis calendrier">
            <div className={`${panelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                Astuce équipe
              </p>
              <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                Publiez seulement quand le visuel et le texte sont prêts côté membre&nbsp;: un brouillon évite les questions «{" "}
                c’est quand&nbsp;? » sur Discord avant l’heure.
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-violet-400/22 bg-violet-500/[0.09] px-3 py-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] text-violet-100/94">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <span>
                  Fuseau <strong className="font-semibold text-white">Europe/Paris</strong> pour toutes les dates affichées ici et dans le modal.
                </span>
              </div>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                En trois gestes
              </p>
              <ol className="mt-4 space-y-[0.65rem]">
                {calendarAsideSteps.map((step) => (
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

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Modules proches
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Liens pilier événements">
                <Link
                  href="/admin/communaute/evenements/participation"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Présences
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/suivi"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Suivi par type
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/recap"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-fuchsia-400/22 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Récapitulatif
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/liste"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
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
        </div>

      {modalOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-indigo-400/25 bg-[linear-gradient(180deg,#161d32_0%,#0a0e18_55%)] shadow-[0_-20px_80px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out sm:rounded-3xl sm:shadow-[0_25px_80px_rgba(2,6,23,0.75)] ${
              modalEnter ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:translate-y-0 sm:scale-[0.97]"
            }`}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-indigo-200/85">Créneau agenda TENF</p>
                <h3 id="event-modal-title" className="mt-1 text-xl font-bold text-white">
                  {modalMode === "create" ? "Nouvel événement" : "Modifier le créneau"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">Échap pour fermer · les membres voient le résultat une fois publié</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={`rounded-xl border border-slate-600/60 bg-slate-900/80 p-2.5 text-slate-200 transition hover:bg-slate-800 disabled:opacity-50 ${focusRingClass}`}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="shrink-0 border-b border-white/10 px-5 py-3">
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-indigo-400/15 bg-black/30 p-1 sm:inline-flex sm:grid-cols-none">
                <button
                  type="button"
                  onClick={() => setModalTab("infos")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${focusRingClass} ${
                    modalTab === "infos" ? "bg-indigo-500/35 text-white shadow-inner" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span className="hidden sm:inline">Contenu</span>
                  <span className="sm:hidden">Infos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("publication")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${focusRingClass} ${
                    modalTab === "publication" ? "bg-indigo-500/35 text-white shadow-inner" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span className="hidden sm:inline">Publication</span>
                  <span className="sm:hidden">Pub.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("preview")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${focusRingClass} ${
                    modalTab === "preview" ? "bg-indigo-500/35 text-white shadow-inner" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Aperçu
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {modalTab === "infos" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 rounded-xl border border-[#353a50] bg-[#10172a]/70 p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Bannière événement</p>
                    {!imagePreview ? (
                      <div className="mt-2 rounded-xl border-2 border-dashed border-indigo-400/25 bg-indigo-500/[0.06] p-6 text-center transition hover:border-indigo-400/40">
                        <input
                          id="event-banner-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e.target.files?.[0])}
                          className="hidden"
                        />
                        <label htmlFor="event-banner-upload" className={`cursor-pointer text-sm font-medium text-indigo-100 ${focusRingClass} rounded-lg`}>
                          Glisser-déposer ou cliquer pour importer
                        </label>
                        <p className="mt-2 text-xs text-slate-400">Visuel recommandé 800×200 · PNG, JPG ou Webp · max 5 Mo</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Aperçu bannière" className="max-h-40 w-full rounded-lg border border-slate-600/70 object-cover object-center" />
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
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-200">Type de créneau *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_CHIPS.map((c) => {
                        const Icon = c.icon;
                        const sel = form.category === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                category: c.value,
                                spotlightStreamerLogin: c.value === "Spotlight" ? prev.spotlightStreamerLogin : "",
                                spotlightStreamerDisplayName: c.value === "Spotlight" ? prev.spotlightStreamerDisplayName : "",
                                seriesId:
                                  c.value === "Formation" || c.value === "Jeux communautaire" ? prev.seriesId : "",
                                seriesName:
                                  c.value === "Formation" || c.value === "Jeux communautaire" ? prev.seriesName : "",
                              }))
                            }
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${focusRingClass} ${
                              sel
                                ? `border-indigo-400/60 bg-indigo-500/25 text-white ring-2 ${c.ring}`
                                : "border-[#353a50] bg-[#0f1424] text-slate-300 hover:border-indigo-400/35"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            {c.label}
                            {sel ? <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden /> : null}
                          </button>
                        );
                      })}
                    </div>
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
                      <p className="mt-1 text-xs text-slate-400">
                        Cliquez une ligne dans les resultats pour valider le membre. La saisie seule ne suffit pas.
                      </p>
                      {spotlightLoading ? (
                        <p className="mt-2 text-xs text-slate-300">Recherche en cours…</p>
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
                      {showSpotlightManualButton ? (
                        <div className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                          <p>
                            {spotlightResults.length === 0
                              ? "Aucun membre TENF ne correspond exactement à ce login."
                              : "Ce login exact n’apparaît pas dans les résultats ci-dessus."}{" "}
                            Pour une interview sur une chaîne invitée ou partenaire, vous pouvez l’associer manuellement.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (!spotlightManualLogin) return;
                              const display = spotlightSearch.trim().replace(/^@+/, "");
                              setForm((prev) => ({
                                ...prev,
                                spotlightStreamerLogin: spotlightManualLogin,
                                spotlightStreamerDisplayName: display,
                              }));
                              setSpotlightSearch("");
                              setSpotlightResults([]);
                            }}
                            className="mt-2 rounded-md border border-amber-200/40 bg-amber-200/10 px-2 py-1 text-xs font-medium text-amber-50 hover:bg-amber-200/20"
                          >
                            Utiliser @{spotlightManualLogin} comme chaine mise en avant
                          </button>
                        </div>
                      ) : null}
                      {showSpotlightSpellHint ? (
                        <div className="mt-2 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
                          Aucun résultat. Vérifiez l’orthographe du login Twitch (4 à 25 caractères, minuscules, chiffres,
                          underscore) ou ajoutez la fiche membre dans l’admin. Le nom réel de la chaîne peut différer (ex.{" "}
                          <span className="text-slate-200">upa_events</span>).
                        </div>
                      ) : null}
                      <p className="mt-2 text-xs text-indigo-100/80">
                        Si l’événement est publié en catégorie Spotlight, la mise en avant Lives est programmée automatiquement de l’heure de début à +2 h.
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
                              ? "Nom de la formation (ex. : OBS débutant)"
                              : "Nom du jeu (ex: Mario Kart 8)"
                          }
                        />
                      </div>
                      <p className="mt-2 text-xs text-cyan-100/85">
                        Réutilisez une série existante pour suivre l’évolution des sessions dans le temps (engagement, performances, tendances).
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
                      placeholder="Points clés à communiquer avant et pendant l’événement (visible côté membres)."
                    />
                  </div>
                </div>
              ) : null}

              {modalTab === "publication" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${focusRingClass} ${
                      form.isPublished
                        ? "border-emerald-400/45 bg-emerald-500/15 shadow-[0_0_28px_rgba(16,185,129,0.12)]"
                        : "border-[#353a50] bg-[#121623]/80 hover:border-indigo-400/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                        form.isPublished ? "border-emerald-400 bg-emerald-500 text-white" : "border-slate-500 bg-slate-900"
                      }`}
                      aria-hidden
                    >
                      {form.isPublished ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span>
                      <span className="block text-base font-semibold text-white">Publier sur l’agenda public</span>
                      <span className="mt-1 block text-sm text-slate-400">
                        Les membres et visiteurs voient le créneau sur la partie événements du site (ex. /evenements) lorsque cette option est activée.
                      </span>
                    </span>
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-indigo-300/25 bg-indigo-500/10 p-4 text-xs leading-relaxed text-indigo-100">
                      <p className="font-semibold text-white">Visibilité</p>
                      <p className="mt-1">Brouillon = préparation interne uniquement. Publié = annonces et fiches membres cohérentes avec ce que vous saisissez ici.</p>
                    </div>
                    <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
                      <p className="font-semibold text-white">Responsable affiché</p>
                      <p className="mt-1">
                        Spotlight : le streamer mis en avant. Autres types : le compte staff à l’origine de la fiche. Pensez-y pour les relances Discord.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/evenements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-sm text-cyan-300 underline-offset-2 hover:underline ${focusRingClass} rounded-lg`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Ouvrir l’agenda public dans un nouvel onglet
                  </Link>
                </div>
              ) : null}

              {modalTab === "preview" ? (
                <div className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Simulation carte membre</p>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#1a2235_0%,#0d121f_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className={`relative h-36 bg-gradient-to-br ${categoryMeta(form.category).gradient}`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-[#0d121f]/40 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
                        <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {form.isPublished ? "Visible agenda" : "Brouillon staff"}
                        </span>
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-50">
                          {form.category || "Type"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 p-5">
                      <h4 className="text-lg font-bold leading-snug text-white">{form.title || "Sans titre — à compléter"}</h4>
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {form.dateParisLocal
                          ? formatEventDateTimeInTimezone(parisLocalDateTimeToUtcIso(form.dateParisLocal), PARIS_TIMEZONE).fullLabel
                          : "Date et heure non définies"}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {form.description || "Les membres verront ce paragraphe sur la fiche : ajoutez un ton clair et les infos pratiques (lien vocal, prérequis…)."}
                      </p>
                      {form.category === "Spotlight" ? (
                        <p className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                          <span className="font-semibold text-white">Mis en avant :</span>{" "}
                          {form.spotlightStreamerDisplayName || form.spotlightStreamerLogin || "— sélectionnez un membre dans l’onglet Contenu"}
                        </p>
                      ) : null}
                      {(form.category === "Formation" || form.category === "Jeux communautaire") ? (
                        <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                          <span className="font-semibold text-white">Série suivie :</span> {form.seriesName || "— à renseigner"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/20 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`inline-flex h-2 w-2 rounded-full ${isFormValid(form) ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
                {isFormValid(form) ? "Formulaire prêt à être enregistré" : "Complétez les champs obligatoires (titre, date, règles selon le type)"}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`rounded-xl border border-slate-600/70 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50 ${focusRingClass}`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void submitModal()}
                  disabled={saving || uploadingImage || !isFormValid(form)}
                  className={`rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`}
                >
                  {saving || uploadingImage ? "Enregistrement…" : modalMode === "create" ? "Créer l’événement" : "Enregistrer les changements"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

