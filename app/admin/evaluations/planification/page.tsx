"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  X,
  Image as ImageIcon,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Archive,
  Info,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Users,
  MapPin,
  HeartHandshake,
  Gauge,
  Eye,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { LOCATION_OPTIONS } from "@/lib/locationOptions";
import {
  ONBOARDING_ACCUEIL_LOCATION_NAME,
  ONBOARDING_ACCUEIL_VOCAL_URL,
  ONBOARDING_SESSION_IMAGE_HEIGHT,
  ONBOARDING_SESSION_IMAGE_WIDTH,
} from "@/lib/onboardingSessionDefaults";

interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryConfig[] = [
  {
    value: "Intégration standard",
    label: "Intégration standard",
    color: "text-[#9146ff]",
    bgColor: "bg-[#9146ff]/20",
    borderColor: "border-[#9146ff]/30",
  },
  {
    value: "Intégration rapide",
    label: "Intégration rapide",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Intégration spéciale",
    label: "Intégration spéciale",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
];

// Fonction utilitaire pour obtenir la config d'une catégorie
const getCategoryConfig = (categoryValue: string): CategoryConfig => {
  return categories.find(cat => cat.value === categoryValue) || categories[0];
};

const BANNER_W = ONBOARDING_SESSION_IMAGE_WIDTH;
const BANNER_H = ONBOARDING_SESSION_IMAGE_HEIGHT;

/** Recadre l’image au centre (mode « cover », comme object-cover) puis exporte en {BANNER_W}×{BANNER_H} — sans étirement. */
async function resizeToSessionBanner(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = BANNER_W;
  canvas.height = BANNER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  const sw = bitmap.width;
  const sh = bitmap.height;
  const scale = Math.max(BANNER_W / sw, BANNER_H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (BANNER_W - dw) / 2;
  const dy = (BANNER_H - dh) / 2;
  ctx.drawImage(bitmap, 0, 0, sw, sh, dx, dy, dw, dh);
  bitmap.close();
  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = mime === "image/jpeg" ? 0.9 : undefined;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export image impossible"))), mime, quality);
  });
  const base = file.name.replace(/\.[^.]+$/, "") || "banniere";
  const ext = mime === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}-${BANNER_W}x${BANNER_H}.${ext}`, { type: mime });
}

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

const emptyForm = () => ({
  title: "",
  description: "",
  category: "Intégration standard",
  date: "",
  location: "" as string,
  locationName: ONBOARDING_ACCUEIL_LOCATION_NAME,
  locationUrl: ONBOARDING_ACCUEIL_VOCAL_URL,
  isPublished: false,
  image: null as File | null,
  imageUrl: null as string | null,
});

export default function PlanificationPage() {
  const [formData, setFormData] = useState(emptyForm);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [multiDayMode, setMultiDayMode] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDateKeys, setSelectedDateKeys] = useState<Set<string>>(() => new Set());
  const [sessionTime, setSessionTime] = useState("20:00");
  const [bulkImageApplying, setBulkImageApplying] = useState(false);
  const [listTab, setListTab] = useState<"upcoming" | "archive">("upcoming");
  const [kpiPulse, setKpiPulse] = useState(false);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const listSectionRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const total = integrations.length;
    const published = integrations.filter((item) => item.isPublished).length;
    const upcoming = integrations.filter((item) => new Date(item.date).getTime() >= Date.now()).length;
    const withImage = integrations.filter((item) => Boolean(item.image)).length;
    const drafts = Math.max(0, total - published);
    const publicationRate = total > 0 ? Math.round((published / total) * 100) : 0;
    return { total, published, upcoming, withImage, drafts, publicationRate };
  }, [integrations]);

  useEffect(() => {
    if (!loading) {
      setKpiPulse(true);
      const t = window.setTimeout(() => setKpiPulse(false), 700);
      return () => window.clearTimeout(t);
    }
  }, [loading, integrations.length]);

  const { upcomingIntegrations, archiveIntegrations } = useMemo(() => {
    const now = Date.now();
    const upcoming: any[] = [];
    const archive: any[] = [];
    for (const item of integrations) {
      const t = new Date(item.date).getTime();
      if (Number.isNaN(t)) {
        upcoming.push(item);
        continue;
      }
      if (t >= now) upcoming.push(item);
      else archive.push(item);
    }
    const byDateAsc = (a: any, b: any) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      const na = Number.isNaN(ta);
      const nb = Number.isNaN(tb);
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return ta - tb;
    };
    upcoming.sort(byDateAsc);
    archive.sort((a, b) => byDateAsc(b, a));
    return { upcomingIntegrations: upcoming, archiveIntegrations: archive };
  }, [integrations]);

  const displayedIntegrations =
    listTab === "upcoming" ? upcomingIntegrations : archiveIntegrations;

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations?admin=true", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Erreur chargement intégrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) return;

    if (!raw.type.startsWith("image/")) {
      alert("❌ Le fichier doit être une image");
      return;
    }

    if (raw.size > 5 * 1024 * 1024) {
      alert("❌ L'image ne doit pas dépasser 5MB");
      return;
    }

    let file: File;
    try {
      file = await resizeToSessionBanner(raw);
    } catch (err) {
      console.error(err);
      alert("❌ Impossible de traiter l'image. Essayez JPG ou PNG.");
      return;
    }

    setFormData((prev) => ({ ...prev, image: file, imageUrl: null }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, imageUrl: null });
    setImagePreview(null);
  };

  // Fonction pour vérifier si une chaîne est une URL
  const isUrl = (str: string): boolean => {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleStartEdit = (integration: any) => {
    // Convertir la date ISO en format datetime-local
    const dateObj = new Date(integration.date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    setEditingIntegration(integration);
    setFormData({
      title: integration.title || "",
      description: integration.description || "",
      category: integration.category || "Intégration standard",
      date: dateTimeLocal,
      location: integration.location || "", // Pour compatibilité
      locationName: integration.locationName || integration.location || "",
      locationUrl: integration.locationUrl || (integration.location && isUrl(integration.location) ? integration.location : ""),
      isPublished: integration.isPublished || false,
      image: null,
      imageUrl: integration.image || null,
    });
    setImagePreview(integration.image || null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditingIntegration(null);
    setIsEditMode(false);
    setFormData(emptyForm());
    setImagePreview(null);
    setMultiDayMode(false);
    setSelectedDateKeys(new Set());
    setCalendarMonth(startOfMonth(new Date()));
  };

  const handleDuplicate = (integration: any) => {
    // Convertir la date ISO et ajouter 7 jours pour suggérer une nouvelle date
    const dateObj = new Date(integration.date);
    dateObj.setDate(dateObj.getDate() + 7);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Préremplir le formulaire avec les données de l'intégration
    setEditingIntegration(null); // Pas en mode édition
    setIsEditMode(false); // Mode création
    setFormData({
      title: integration.title || "",
      description: integration.description || "",
      category: integration.category || "Intégration standard",
      date: dateTimeLocal, // Nouvelle date (+7 jours par défaut)
      location: integration.location || "", // Pour compatibilité
      locationName: integration.locationName || integration.location || "",
      locationUrl: integration.locationUrl || (integration.location && isUrl(integration.location) ? integration.location : ""),
      isPublished: false, // Par défaut non publiée pour laisser le choix
      image: null,
      imageUrl: integration.image || null, // Conserver l'image
    });
    setImagePreview(integration.image || null);
    
    // Faire défiler vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette intégration ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Intégration supprimée avec succès !");
        await loadIntegrations();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || "Impossible de supprimer l'intégration"}`);
      }
    } catch (error) {
      console.error("Erreur suppression intégration:", error);
      alert("❌ Erreur lors de la suppression");
    }
  };

  const uploadSessionImage = async (file: File): Promise<string | null> => {
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);
    const uploadResponse = await fetch("/api/admin/events/upload-image", {
      method: "POST",
      body: uploadFormData,
    });
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || "Impossible d'uploader l'image");
    }
    const uploadData = await uploadResponse.json();
    return uploadData.imageUrl as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Veuillez remplir le titre");
      return;
    }

    if (!isEditMode && multiDayMode) {
      if (selectedDateKeys.size === 0) {
        alert("Sélectionnez au moins un jour dans le calendrier");
        return;
      }
    } else if (!isEditMode && !formData.date) {
      alert("Veuillez choisir une date et une heure");
      return;
    }

    const useMulti = !isEditMode && multiDayMode;

    let finalImageUrl = formData.imageUrl;
    if (formData.image && !formData.imageUrl) {
      try {
        setUploadingImage(true);
        finalImageUrl = await uploadSessionImage(formData.image);
      } catch (error) {
        console.error("Erreur upload image:", error);
        alert(
          `❌ Erreur upload image: ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const datesToSubmit: string[] = useMulti
      ? Array.from(selectedDateKeys)
          .sort()
          .map((d) => `${d}T${sessionTime}:00`)
      : [formData.date];

    const basePayload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location:
        formData.locationName && formData.locationUrl
          ? undefined
          : formData.location || undefined,
      locationName: formData.locationName || undefined,
      locationUrl: formData.locationUrl || undefined,
      isPublished: formData.isPublished,
      image: finalImageUrl || undefined,
    };

    try {
      setSaving(true);

      if (isEditMode && editingIntegration) {
        const integrationData = { ...basePayload, date: formData.date };
        const response = await fetch(`/api/integrations/${editingIntegration.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(integrationData),
        });
        if (response.ok) {
          alert("✅ Intégration modifiée avec succès !");
          handleCancelEdit();
          await loadIntegrations();
        } else {
          const error = await response.json();
          alert(`❌ Erreur: ${error.error || "Impossible de modifier l'intégration"}`);
        }
        return;
      }

      let created = 0;
      for (const date of datesToSubmit) {
        const response = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, date }),
        });
        if (response.ok) {
          created += 1;
        } else {
          const error = await response.json();
          alert(
            `❌ Erreur à la création (${date}): ${error.error || "Échec"} — ${created} session(s) déjà créée(s).`
          );
          await loadIntegrations();
          return;
        }
      }

      alert(
        created > 1
          ? `✅ ${created} sessions créées avec les mêmes paramètres.`
          : "✅ Intégration créée avec succès !"
      );
      handleCancelEdit();
      await loadIntegrations();
    } catch (error) {
      console.error(`Erreur ${isEditMode ? "modification" : "création"} intégration:`, error);
      alert(`❌ Erreur lors de la ${isEditMode ? "modification" : "création"}`);
    } finally {
      setSaving(false);
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const toggleCalendarDay = useCallback((key: string) => {
    setSelectedDateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const applyAccueilVocalDefaults = () => {
    setFormData((prev) => ({
      ...prev,
      locationName: ONBOARDING_ACCUEIL_LOCATION_NAME,
      locationUrl: ONBOARDING_ACCUEIL_VOCAL_URL,
    }));
  };

  const handleBulkImageToAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) return;
    if (integrations.length === 0) {
      alert("Aucune session à mettre à jour.");
      return;
    }
    if (!raw.type.startsWith("image/")) {
      alert("❌ Le fichier doit être une image");
      return;
    }
    if (
      !confirm(
        `Remplacer l'image de ${integrations.length} session(s) par cette bannière ${BANNER_W}×${BANNER_H} px ?`
      )
    ) {
      return;
    }
    let file: File;
    try {
      file = await resizeToSessionBanner(raw);
    } catch (err) {
      console.error(err);
      alert("❌ Impossible de traiter l'image.");
      return;
    }
    try {
      setBulkImageApplying(true);
      const imageUrl = await uploadSessionImage(file);
      if (!imageUrl) throw new Error("URL manquante");
      let ok = 0;
      for (const integration of integrations) {
        const res = await fetch(`/api/integrations/${integration.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });
        if (res.ok) ok += 1;
      }
      alert(`✅ Image appliquée à ${ok} / ${integrations.length} session(s).`);
      await loadIntegrations();
    } catch (error) {
      console.error(error);
      alert("❌ Erreur lors de l'application globale de l'image");
    } finally {
      setBulkImageApplying(false);
    }
  };

  const scrollToForm = () =>
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToList = () =>
    listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-8 text-white">
      <section className={`${heroShellClass} p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/12 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Link
              href="/admin/onboarding"
              className={`inline-flex items-center gap-1 text-sm text-indigo-200/90 transition hover:text-white ${focusRingClass} rounded-lg`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Retour au hub onboarding
            </Link>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                Sessions d&apos;accueil
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                Vue membres &amp; public
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Planification</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                Les créneaux que voient les nouveaux membres
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Chaque session publiée apparaît sur le parcours{" "}
                <strong className="font-semibold text-slate-100">intégration</strong> : titre, visuel 4∶1, date et lien
                vocal. Les brouillons restent internes au staff — publie quand le staffing et le message sont prêts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadIntegrations()}
                className={`${subtleButtonClass} ${focusRingClass}`}
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Rafraîchir les sessions
              </button>
              <button
                type="button"
                onClick={scrollToForm}
                className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                Créer / éditer
              </button>
              <Link
                href="/integration"
                target="_blank"
                rel="noopener noreferrer"
                className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                Page publique intégration
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm shrink-0 space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
              Publication
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Publiées / total</span>
                <span className="font-semibold text-white">{stats.publicationRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-[width] duration-700 ease-out ${kpiPulse ? "animate-pulse" : ""}`}
                  style={{ width: `${stats.publicationRate}%` }}
                  role="progressbar"
                  aria-valuenow={stats.publicationRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                {stats.published} en ligne · {stats.drafts} brouillon(s) · {stats.total} session(s)
              </p>
            </div>
            <p className="flex items-start gap-2 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
              Pense au ressenti : une bannière lisible et une date claire rassurent avant le vocal.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={scrollToList}
          className={`${sectionCardClass} w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/35 hover:shadow-[0_12px_36px_rgba(79,70,229,0.18)] ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-white transition ${kpiPulse ? "scale-[1.02]" : ""}`}>
            {stats.total}
          </p>
          <p className="mt-2 text-xs text-slate-500">Voir la liste complète</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden /> Défiler vers les sessions
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            scrollToForm();
          }}
          className={`${sectionCardClass} w-full border-emerald-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Publiées</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-emerald-300 ${kpiPulse ? "scale-[1.02]" : ""}`}>
            {stats.published}
          </p>
          <p className="mt-2 text-xs text-slate-500">Visibles côté membre / public</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300/90">
            <Eye className="h-3.5 w-3.5" aria-hidden /> Cocher « Publier » dans le formulaire
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setListTab("upcoming");
            scrollToList();
          }}
          className={`${sectionCardClass} w-full border-sky-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">À venir</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-sky-300 ${kpiPulse ? "scale-[1.02]" : ""}`}>
            {stats.upcoming}
          </p>
          <p className="mt-2 text-xs text-slate-500">Onglet « À venir »</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-sky-300/90">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Filtrer la liste
          </span>
        </button>
        <button
          type="button"
          onClick={scrollToForm}
          className={`${sectionCardClass} w-full border-amber-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-amber-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/70">Avec visuel</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-amber-300 ${kpiPulse ? "scale-[1.02]" : ""}`}>
            {stats.withImage}
          </p>
          <p className="mt-2 text-xs text-slate-500">Bannières {BANNER_W}×{BANNER_H}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-amber-200/90">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden /> Ajouter une image
          </span>
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Formulaire */}
        <div ref={formSectionRef} className={`${sectionCardClass} scroll-mt-24 p-6 md:p-7`}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/75">Éditeur</p>
              <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
                {isEditMode ? "Modifier la session" : "Nouvelle session"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Le bloc de gauche prépare ce que les membres verront ; la liste à droite permet de dupliquer ou corriger
                vite.
              </p>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-100 ${focusRingClass}`}
                aria-label="Annuler l’édition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Upload d'image */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Image de l'intégration ({BANNER_W}×{BANNER_H} px)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Recadrage centré au ratio 4∶1 ({BANNER_W}×{BANNER_H} px), sans étirement — le cadre ci‑dessous correspond au rendu sur le site.
              </p>
              <div className="mb-3 flex gap-3 rounded-xl border border-indigo-400/25 bg-[linear-gradient(90deg,rgba(99,102,241,0.14),rgba(6,182,212,0.08))] px-3 py-3 sm:px-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/25 text-indigo-200"
                  aria-hidden
                >
                  <Info className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  <span className="font-semibold text-slate-100">
                    Consigne importante — rendu côté membres
                  </span>
                  <br />
                  Le visuel est exporté en{" "}
                  <strong className="text-white">
                    {BANNER_W}×{BANNER_H} px
                  </strong>{" "}
                  (ratio 4∶1). L’import remplit ce cadre par zoom centré (pas de déformation). Sur le site public la bannière est affichée en entier ; garde le texte et les sujets importants plutôt au centre.
                </p>
              </div>
              {!imagePreview && !formData.imageUrl ? (
                <div
                  className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-[#353a50] bg-[#0a0d14] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)] transition-colors hover:border-indigo-300/55"
                  style={{ aspectRatio: `${BANNER_W} / ${BANNER_H}` }}
                >
                  {/* Repères discrets du cadre final (ratio site) */}
                  <div
                    className="pointer-events-none absolute inset-3 rounded-md border border-white/10 sm:inset-4"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-y-3 left-1/4 right-1/4 border-x border-dashed border-white/10 sm:inset-y-4"
                    aria-hidden
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center"
                  >
                    <ImageIcon className="h-10 w-10 text-indigo-300/70 sm:h-12 sm:w-12" />
                    <p className="text-sm text-gray-300">
                      Importer une image — cadre {BANNER_W}×{BANNER_H} (4∶1)
                    </p>
                    <p className="text-xs text-gray-500">
                      webp, jpg, png — max 5 Mo — recadrage centré, sans déformation
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-indigo-200/90">
                    Aperçu du cadre site ({BANNER_W}×{BANNER_H} px, ratio 4∶1)
                  </p>
                  <div
                    className="relative w-full overflow-hidden rounded-xl border-2 border-indigo-400/45 bg-black/40 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.06)] ring-1 ring-white/10"
                    style={{ aspectRatio: `${BANNER_W} / ${BANNER_H}` }}
                  >
                    <img
                      src={imagePreview || formData.imageUrl || ""}
                      alt="Aperçu bannière session"
                      className="h-full w-full object-cover"
                      width={BANNER_W}
                      height={BANNER_H}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2 top-2 rounded-full border border-rose-300/45 bg-rose-500/25 p-2 text-rose-100 shadow-lg backdrop-blur-sm transition hover:bg-rose-500/35"
                      aria-label="Retirer l’image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {formData.image && !formData.imageUrl && (
                    <p className="text-xs text-gray-400">
                      L&apos;image sera uploadée automatiquement lors de la création de l&apos;intégration.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55 resize-none"
                placeholder="Vous pouvez utiliser du Markdown : **gras**, *italique*, listes - ..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Formatage Markdown disponible : <strong>**gras**</strong>, <em>*italique*</em>, listes <code>- item</code>, retours à la ligne
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {/* Aperçu de la couleur de la catégorie */}
              <div className="mt-2">
                {(() => {
                  const catConfig = getCategoryConfig(formData.category);
                  return (
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}>
                      {catConfig.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={multiDayMode}
                  disabled={isEditMode}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setMultiDayMode(on);
                    if (on && formData.date.includes("T")) {
                      const t = formData.date.split("T")[1];
                      if (t) setSessionTime(t.slice(0, 5));
                    }
                  }}
                  className="w-4 h-4 rounded border-[#353a50] bg-[#0f1321] text-indigo-500 focus:ring-indigo-300/50 disabled:opacity-40"
                />
                <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                  <CalendarDays className="h-4 w-4 text-sky-300" />
                  Programmer plusieurs jours (calendrier)
                </span>
              </label>

              {!multiDayMode || isEditMode ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Date et heure *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                    required={!isEditMode && !multiDayMode}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-[#353a50] bg-[#0a0d18] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {format(calendarMonth, "MMMM yyyy", { locale: fr })}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                        className="rounded-lg border border-[#353a50] p-2 text-gray-300 hover:bg-[#151a2e]"
                        aria-label="Mois précédent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                        className="rounded-lg border border-[#353a50] p-2 text-gray-300 hover:bg-[#151a2e]"
                        aria-label="Mois suivant"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-gray-500">
                    {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const inMonth = isSameMonth(day, calendarMonth);
                      const selected = selectedDateKeys.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleCalendarDay(key)}
                          className={[
                            "aspect-square rounded-lg text-sm transition",
                            inMonth ? "text-white" : "text-gray-600",
                            selected
                              ? "bg-indigo-500/90 font-semibold text-white ring-1 ring-indigo-300"
                              : "bg-[#151a2e] hover:bg-[#1f2540]",
                          ].join(" ")}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400">
                    {selectedDateKeys.size} jour(s) sélectionné(s) — même horaire pour toutes les sessions créées.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Heure commune (tous les jours)
                    </label>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Localisation
                </label>
                <div className="space-y-3">
                  {/* Sélecteur de nom de localisation */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Nom d'affichage
                    </label>
                    <select
                      value={formData.locationName}
                      onChange={(e) => {
                        setFormData({ ...formData, locationName: e.target.value });
                      }}
                      className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                    >
                      <option value="">Aucun</option>
                      {LOCATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez un nom prédéfini ou laissez vide
                    </p>
                  </div>

                  {/* Champ URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      URL de la localisation (salon vocal / texte)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        onClick={applyAccueilVocalDefaults}
                        className="rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25"
                      >
                        Salon accueil + vocal (prérempli)
                      </button>
                      <a
                        href={ONBOARDING_ACCUEIL_VOCAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-indigo-300/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/25"
                      >
                        Ouvrir le vocal Discord
                      </a>
                    </div>
                    <input
                      type="url"
                      value={formData.locationUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, locationUrl: e.target.value })
                      }
                      placeholder={ONBOARDING_ACCUEIL_VOCAL_URL}
                      className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Par défaut : lien du salon vocal accueil / intégration. Le nom affiché pointe vers cette URL côté public.
                    </p>
                  </div>

                  {/* Champ legacy pour compatibilité */}
                  {(!formData.locationName && !formData.locationUrl) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Localisation (texte simple - ancien format)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Ex: Discord TENF (ancien format)"
                        className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <label
              htmlFor="isPublished"
              className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                formData.isPublished
                  ? "border-emerald-400/40 bg-emerald-500/[0.08] ring-1 ring-emerald-400/20"
                  : "border-[#353a50] bg-[#0a0d14] hover:border-white/15"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className={`mt-1 h-4 w-4 shrink-0 rounded border-[#353a50] bg-[#0f1321] ${focusRingClass}`}
                />
                <div>
                  <span className="text-sm font-semibold text-white">Publication sur le parcours intégration</span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Activé : la session est visible sur{" "}
                    <Link href="/integration" className="text-indigo-300 underline-offset-2 hover:underline" target="_blank">
                      /integration
                    </Link>{" "}
                    pour les membres et le public (selon les règles du site).
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  formData.isPublished
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                    : "border-amber-400/35 bg-amber-500/15 text-amber-100"
                }`}
              >
                {formData.isPublished ? "Visible" : "Interne staff"}
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/35 bg-gradient-to-r from-indigo-500/25 to-violet-500/20 py-3.5 px-6 text-base font-semibold text-white shadow-[0_12px_36px_rgba(79,70,229,0.2)] transition hover:from-indigo-500/35 hover:to-violet-500/30 disabled:opacity-50 ${focusRingClass}`}
            >
              {saving || uploadingImage ? (
                <RefreshCw className="h-5 w-5 shrink-0 animate-spin text-indigo-100" aria-hidden />
              ) : (
                <Sparkles className="h-5 w-5 shrink-0 text-indigo-100" aria-hidden />
              )}
              {saving || uploadingImage
                ? uploadingImage
                  ? "Upload image…"
                  : isEditMode
                    ? "Modification..."
                    : "Création..."
                : isEditMode
                  ? "Enregistrer les modifications"
                  : multiDayMode
                    ? selectedDateKeys.size > 0
                      ? `Créer ${selectedDateKeys.size} session(s)`
                      : "Sélectionnez des jours dans le calendrier"
                    : "Créer la session"}
            </button>
          </form>
        </div>

        {/* Liste des intégrations */}
        <div ref={listSectionRef} className={`${sectionCardClass} scroll-mt-24 p-6 md:p-7`}>
          <div
            className="mb-4 flex gap-1 rounded-xl border border-[#353a50] bg-[#0a0d18] p-1"
            role="tablist"
            aria-label="Filtrer les sessions"
          >
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "upcoming"}
              onClick={() => setListTab("upcoming")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                listTab === "upcoming"
                  ? "bg-indigo-500/35 text-white shadow-sm ring-1 ring-indigo-300/40"
                  : "text-slate-400 hover:bg-[#151a2e] hover:text-slate-200",
              ].join(" ")}
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              À venir
              {upcomingIntegrations.length > 0 && (
                <span className="rounded-md bg-[#0f1321] px-1.5 py-0.5 text-xs font-medium text-slate-300">
                  {upcomingIntegrations.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listTab === "archive"}
              onClick={() => setListTab("archive")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                listTab === "archive"
                  ? "bg-indigo-500/35 text-white shadow-sm ring-1 ring-indigo-300/40"
                  : "text-slate-400 hover:bg-[#151a2e] hover:text-slate-200",
              ].join(" ")}
            >
              <Archive className="h-4 w-4 shrink-0" />
              Archive
              {archiveIntegrations.length > 0 && (
                <span className="rounded-md bg-[#0f1321] px-1.5 py-0.5 text-xs font-medium text-slate-300">
                  {archiveIntegrations.length}
                </span>
              )}
            </button>
          </div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/75">Bibliothèque</p>
              <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
                {listTab === "upcoming" ? "Prochains créneaux" : "Historique"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Clique une carte pour modifier, dupliquer pour pré-remplir une nouvelle date, ou applique une bannière à
                toutes les sessions.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <label className="text-xs text-gray-400">
                Même image sur toutes les sessions ({BANNER_W}×{BANNER_H} px, recadrage centré)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBulkImageToAll}
                  className="hidden"
                  id="bulk-image-all"
                  disabled={bulkImageApplying || loading}
                />
                <label
                  htmlFor="bulk-image-all"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25 ${bulkImageApplying || loading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {bulkImageApplying ? "Application…" : "Choisir une bannière"}
                </label>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-white/[0.06] bg-[#0f1321]/80 p-4"
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-28 shrink-0 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/5" />
                      <div className="h-3 w-1/2 rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : integrations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-indigo-400/25 bg-indigo-500/[0.04] py-14 text-center">
              <Users className="h-10 w-10 text-indigo-300/50" aria-hidden />
              <p className="text-slate-300">Aucune session pour l&apos;instant</p>
              <p className="max-w-sm text-sm text-slate-500">
                Utilise le formulaire à gauche pour créer le premier créneau — tu pourras le dupliquer ensuite.
              </p>
              <button
                type="button"
                onClick={scrollToForm}
                className={`mt-2 ${subtleButtonClass} ${focusRingClass}`}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Créer une session
              </button>
            </div>
          ) : displayedIntegrations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/20 py-12 text-center">
              <CalendarDays className="h-9 w-9 text-slate-600" aria-hidden />
              <p className="text-slate-400">
                {listTab === "upcoming"
                  ? "Aucune session à venir dans cette liste."
                  : "Rien dans l’archive pour le moment."}
              </p>
            </div>
          ) : (
            <div className="max-h-[min(640px,70vh)] space-y-3 overflow-y-auto pr-1 [scrollbar-color:rgba(99,102,241,0.35)_transparent] [scrollbar-width:thin]">
              {displayedIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className={`group rounded-2xl border bg-[#0f1321]/90 p-4 transition hover:border-indigo-400/35 hover:shadow-[0_12px_40px_rgba(67,56,202,0.12)] ${
                    integration.isPublished
                      ? "border-emerald-500/25 ring-1 ring-emerald-500/10"
                      : "border-[#353a50]"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {integration.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={integration.image}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                          <ImageIcon className="h-6 w-6 text-slate-600" aria-hidden />
                          <span className="text-[10px] text-slate-600">Sans visuel</span>
                        </div>
                      )}
                      {integration.isPublished ? (
                        <span className="absolute left-1 top-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                          Live
                        </span>
                      ) : (
                        <span className="absolute left-1 top-1 rounded-md bg-amber-500/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0a0d14] shadow">
                          Brouillon
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-snug text-white">{integration.title}</h3>
                      {integration.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{integration.description}</p>
                      ) : null}
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-400/80" aria-hidden />
                        {new Date(integration.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {integration.locationName && integration.locationUrl ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-400/90" aria-hidden />
                          <a
                            href={integration.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
                          >
                            {integration.locationName}
                          </a>
                        </p>
                      ) : integration.location ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                          {integration.location}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {(() => {
                          const catConfig = getCategoryConfig(integration.category);
                          return (
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}
                            >
                              {integration.category}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(integration)}
                        className={`rounded-xl border border-sky-300/35 bg-sky-500/20 p-2.5 text-sky-100 transition hover:bg-sky-500/35 ${focusRingClass}`}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(integration)}
                        className={`rounded-xl border border-emerald-300/35 bg-emerald-500/20 p-2.5 text-emerald-100 transition hover:bg-emerald-500/35 ${focusRingClass}`}
                        title="Dupliquer (nouvelle date)"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(integration.id)}
                        className={`rounded-xl border border-rose-300/35 bg-rose-500/20 p-2.5 text-rose-100 transition hover:bg-rose-500/35 ${focusRingClass}`}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
