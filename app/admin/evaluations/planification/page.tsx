"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

/** Redimensionne l’image en bannière 800×200 px avant envoi. */
async function resizeToSessionBanner(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = BANNER_W;
  canvas.height = BANNER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  ctx.drawImage(bitmap, 0, 0, BANNER_W, BANNER_H);
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

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

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

  const stats = useMemo(() => {
    const total = integrations.length;
    const published = integrations.filter((item) => item.isPublished).length;
    const upcoming = integrations.filter((item) => new Date(item.date).getTime() >= Date.now()).length;
    const withImage = integrations.filter((item) => Boolean(item.image)).length;
    return { total, published, upcoming, withImage };
  }, [integrations]);

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

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link
              href="/admin/onboarding"
              className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              ← Retour à l'onboarding
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding · Sessions</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Planification des sessions d'intégration
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Centralise la création, l'édition et la publication des sessions pour piloter l'onboarding sans friction.
            </p>
          </div>
          <button type="button" onClick={() => void loadIntegrations()} className={subtleButtonClass}>
            <Copy className="h-4 w-4" />
            Rafraîchir la liste
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total sessions</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{stats.total}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions publiées</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.published}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">À venir</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.upcoming}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avec visuel</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{stats.withImage}</p>
        </article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className={`${sectionCardClass} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isEditMode ? "Modifier l'intégration" : "Créer une intégration"}
            </h2>
            {isEditMode && (
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
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
                Import redimensionné automatiquement en bannière {BANNER_W}×{BANNER_H} px (ratio 4∶1).
              </p>
              {!imagePreview && !formData.imageUrl ? (
                <div className="border-2 border-dashed border-[#353a50] rounded-lg p-6 text-center hover:border-indigo-300/55 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400 mb-2">
                      Cliquez pour importer une image (webp, jpg, png)
                    </p>
                    <span className="text-xs text-gray-500">
                      Taille max: 5MB — export {BANNER_W}×{BANNER_H}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || formData.imageUrl || ''}
                    alt="Aperçu"
                    className="w-full max-h-48 aspect-[4/1] object-cover rounded-lg border border-[#353a50]"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 rounded-full border border-rose-300/45 bg-rose-500/25 p-2 text-rose-100 transition hover:bg-rose-500/35"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {formData.image && !formData.imageUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-2">
                        L'image sera uploadée automatiquement lors de la création de l'intégration
                      </p>
                    </div>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="w-4 h-4 text-indigo-300 bg-[#0f1321] border-[#353a50] rounded focus:ring-indigo-300/50"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-300">
                Publier sur /integration (visible publiquement)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full rounded-xl border border-indigo-300/35 bg-indigo-500/20 py-3 px-6 font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50"
            >
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
                    : "Créer l'intégration"}
            </button>
          </form>
        </div>

        {/* Liste des intégrations */}
        <div className={`${sectionCardClass} p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Intégrations créées
            </h2>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <label className="text-xs text-gray-400">
                Même image sur toutes les sessions ({BANNER_W}×{BANNER_H} px)
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
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
            </div>
          ) : integrations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucune intégration créée
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {integrations.map((integration) => (
                <div key={integration.id} className="rounded-lg border border-[#353a50] bg-[#0f1321] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {integration.title}
                      </h3>
                      {integration.description && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {integration.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mb-2">
                        {new Date(integration.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {integration.locationName && integration.locationUrl ? (
                        <p className="text-sm text-gray-400 mb-2">
                          📍{" "}
                          <a
                            href={integration.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-300 hover:text-indigo-200 underline"
                          >
                            {integration.locationName}
                          </a>
                        </p>
                      ) : integration.location ? (
                        <p className="text-sm text-gray-400 mb-2">
                          📍 {integration.location}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const catConfig = getCategoryConfig(integration.category);
                          return (
                            <span className={`text-xs px-2 py-1 rounded border ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}>
                              {integration.category}
                            </span>
                          );
                        })()}
                        {integration.isPublished && (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            Publié
                          </span>
                        )}
                      </div>
                      {integration.image && (
                        <div className="mt-2">
                          <img
                            src={integration.image}
                            alt={integration.title}
                            className="w-full aspect-[4/1] max-h-40 object-cover rounded-lg border border-[#353a50]"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(integration)}
                        className="rounded-lg border border-sky-300/35 bg-sky-500/20 p-2 text-sky-100 transition hover:bg-sky-500/30"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(integration)}
                        className="rounded-lg border border-emerald-300/35 bg-emerald-500/20 p-2 text-emerald-100 transition hover:bg-emerald-500/30"
                        title="Dupliquer (nouvelle date)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
                        className="rounded-lg border border-rose-300/35 bg-rose-500/20 p-2 text-rose-100 transition hover:bg-rose-500/30"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
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
