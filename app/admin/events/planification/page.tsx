"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Image as ImageIcon, Edit, Trash2 } from "lucide-react";
import FilmAnnouncementTab from "@/components/admin/FilmAnnouncementTab";
import {
  PARIS_TIMEZONE,
  formatEventDateTimeInTimezone,
  parisLocalDateTimeToUtcIso,
  utcIsoToParisDateTimeLocalInput,
} from "@/lib/timezone";
import {
  buildEventLocationDisplay,
  isValidHttpUrl,
  normalizeLocationUrl,
  type EventLocationLink,
} from "@/lib/eventLocation";

const panelClass =
  "rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(28,28,36,0.95),rgba(17,17,24,0.96))] shadow-[0_16px_34px_rgba(0,0,0,0.3)]";
const inputClass =
  "w-full bg-[#0d0d14] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#b88bff] focus:ring-2 focus:ring-[#9146ff]/25";
const subtleButtonClass =
  "rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/[0.08] hover:border-[#b88bff]/60";
const primaryButtonClass =
  "rounded-xl bg-gradient-to-r from-[#9146ff] to-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-[#a364ff] hover:to-[#8c45ff] disabled:opacity-60";

interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryConfig[] = [
  {
    value: "Spotlight",
    label: "Spotlight",
    color: "text-[#9146ff]",
    bgColor: "bg-[#9146ff]/20",
    borderColor: "border-[#9146ff]/30",
  },
  {
    value: "Soirée Film",
    label: "Soirée Film",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Formation",
    label: "Formation",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  {
    value: "Jeux communautaire",
    label: "Jeux communautaire",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    value: "Apéro",
    label: "Apéro",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    value: "Organisation Aventura 2026",
    label: "Organisation Aventura 2026",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
];

// Fonction utilitaire pour obtenir la config d'une catégorie
const getCategoryConfig = (categoryValue: string): CategoryConfig => {
  return categories.find(cat => cat.value === categoryValue) || categories[0];
};

export default function PlanificationPage() {
  const [creationMode, setCreationMode] = useState<"new" | "linked">("new");
  const [linkedSourceEventId, setLinkedSourceEventId] = useState("");
  const [seriesLabel, setSeriesLabel] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Spotlight",
    date: "",
    location: "",
    isPublished: false,
    image: null as File | null,
    imageUrl: "" as string | null,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensionError, setImageDimensionError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [locationMode, setLocationMode] = useState<"none" | "external" | "discord">("none");
  const [externalLocationUrl, setExternalLocationUrl] = useState("");
  const [discordLocationId, setDiscordLocationId] = useState("");
  const [managedLocationLinks, setManagedLocationLinks] = useState<EventLocationLink[]>([]);
  const [activePlanningTab, setActivePlanningTab] = useState<"events" | "public-film-announcement">("events");

  useEffect(() => {
    loadEvents();
    loadManagedLocationLinks();
  }, []);

  const readImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        URL.revokeObjectURL(objectUrl);
        resolve({ width, height });
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image invalide"));
      };
      image.src = objectUrl;
    });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events?admin=true", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrer uniquement les événements à venir
        const now = new Date();
        const upcomingEvents = (data.events || []).filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate >= now;
        });
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadManagedLocationLinks = async () => {
    try {
      const response = await fetch("/api/admin/events/location-links", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setManagedLocationLinks((data.links || []) as EventLocationLink[]);
      }
    } catch (error) {
      console.error("Erreur chargement liens de lieux:", error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageDimensionError(null);
    setImageInfo(null);

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('❌ Le fichier doit être une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      const dimensions = await readImageDimensions(file);
      setImageInfo(dimensions);
      if (dimensions.width !== 800 || dimensions.height !== 200) {
        setImageDimensionError(
          `Format requis: 800×200 px. Image actuelle: ${dimensions.width}×${dimensions.height} px.`
        );
        return;
      }
    } catch {
      alert("❌ Impossible de lire les dimensions de l'image");
      return;
    }

    setFormData({ ...formData, image: file });

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, imageUrl: null });
    setImagePreview(null);
    setImageDimensionError(null);
    setImageInfo(null);
  };

  const handleStartEdit = (event: any) => {
    // Le formulaire admin reste en heure de Paris.
    const dateTimeLocal = utcIsoToParisDateTimeLocalInput(event.startAtUtc || event.date);

    const currentLocation = typeof event.location === "string" ? event.location : "";
    const normalizedEventLocation = normalizeLocationUrl(currentLocation);
    const matchedManagedLink =
      normalizedEventLocation &&
      managedLocationLinks.find((item) => normalizeLocationUrl(item.url) === normalizedEventLocation);

    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "Spotlight",
      date: dateTimeLocal,
      location: event.location || "",
      isPublished: event.isPublished || false,
      image: null,
      imageUrl: event.image || null,
    });
    setImagePreview(event.image || null);
    setImageDimensionError(null);
    setCreationMode("new");
    setLinkedSourceEventId(event.sourceEventId || "");
    setSeriesLabel(event.seriesName || "");
    if (matchedManagedLink) {
      setLocationMode("discord");
      setDiscordLocationId(matchedManagedLink.id);
      setExternalLocationUrl("");
    } else if (currentLocation && isValidHttpUrl(currentLocation)) {
      setLocationMode("external");
      setExternalLocationUrl(currentLocation);
      setDiscordLocationId("");
    } else {
      setLocationMode("none");
      setExternalLocationUrl("");
      setDiscordLocationId("");
    }
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setIsEditMode(false);
    setFormData({
      title: "",
      description: "",
      category: "Spotlight",
      date: "",
      location: "",
      isPublished: false,
      image: null,
      imageUrl: null,
    });
    setImagePreview(null);
    setImageDimensionError(null);
    setImageInfo(null);
    setCreationMode("new");
    setLinkedSourceEventId("");
    setSeriesLabel("");
    setLocationMode("none");
    setExternalLocationUrl("");
    setDiscordLocationId("");
  };

  useEffect(() => {
    if (isEditMode || creationMode !== "linked" || !linkedSourceEventId) return;
    const sourceEvent = events.find((event) => event.id === linkedSourceEventId);
    if (!sourceEvent) return;

    const dateTimeLocal = utcIsoToParisDateTimeLocalInput(sourceEvent.startAtUtc || sourceEvent.date);
    setFormData((prev) => ({
      ...prev,
      title: sourceEvent.title || prev.title,
      description: sourceEvent.description || prev.description,
      category: sourceEvent.category || prev.category,
      location: sourceEvent.location || prev.location,
      imageUrl: sourceEvent.image || prev.imageUrl,
      date: prev.date || dateTimeLocal,
    }));
    setImagePreview(sourceEvent.image || null);
    setImageDimensionError(null);
    setSeriesLabel(sourceEvent.seriesName || sourceEvent.title || "");
  }, [linkedSourceEventId, creationMode, isEditMode, events]);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Événement supprimé avec succès !");
        await loadEvents();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || "Impossible de supprimer l'événement"}`);
      }
    } catch (error) {
      console.error("Erreur suppression événement:", error);
      alert("❌ Erreur lors de la suppression");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Veuillez remplir le titre et la date");
      return;
    }

    let resolvedLocation = "";
    if (locationMode === "external") {
      const value = externalLocationUrl.trim();
      if (!value) {
        alert("Veuillez renseigner un lien externe.");
        return;
      }
      if (!isValidHttpUrl(value)) {
        alert("Lien externe invalide (http/https uniquement).");
        return;
      }
      resolvedLocation = value;
    }

    if (locationMode === "discord") {
      const selected = managedLocationLinks.find((item) => item.id === discordLocationId);
      if (!selected) {
        alert("Veuillez choisir un salon vocal configure.");
        return;
      }
      resolvedLocation = selected.url;
    }

    // Si une image est sélectionnée mais pas encore uploadée, uploader d'abord
    let finalImageUrl = formData.imageUrl;
    if (formData.image && !formData.imageUrl) {
      try {
        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', formData.image);

        const uploadResponse = await fetch('/api/admin/events/upload-image', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalImageUrl = uploadData.imageUrl;
        } else {
          const error = await uploadResponse.json();
          alert(`❌ Erreur upload image: ${error.error || 'Impossible d\'uploader l\'image'}`);
          setUploadingImage(false);
          return;
        }
      } catch (error) {
        console.error('Erreur upload image:', error);
        alert('❌ Erreur lors de l\'upload de l\'image');
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      setSaving(true);
      
      // L'admin saisit en heure de Paris -> conversion explicite vers UTC avant envoi.
      const startAtUtc = parisLocalDateTimeToUtcIso(formData.date);
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startAtParisLocal: formData.date,
        startAtUtc,
        // Compatibilité avec les routes existantes qui lisent encore "date"
        date: startAtUtc,
        location: resolvedLocation,
        isPublished: formData.isPublished,
        image: finalImageUrl || undefined,
        seriesId:
          !isEditMode && creationMode === "linked" && linkedSourceEventId
            ? (events.find((event) => event.id === linkedSourceEventId)?.seriesId || linkedSourceEventId)
            : undefined,
        seriesName:
          !isEditMode && creationMode === "linked" && linkedSourceEventId
            ? (seriesLabel.trim() || events.find((event) => event.id === linkedSourceEventId)?.seriesName || events.find((event) => event.id === linkedSourceEventId)?.title || "")
            : undefined,
        sourceEventId:
          !isEditMode && creationMode === "linked" && linkedSourceEventId
            ? linkedSourceEventId
            : undefined,
      };

      let response;
      if (isEditMode && editingEvent) {
        // Mise à jour d'un événement existant
        response = await fetch(`/api/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      } else {
        // Création d'un nouvel événement
        response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      }

      if (response.ok) {
        alert(isEditMode ? "✅ Événement modifié avec succès !" : "✅ Événement créé avec succès !");
        handleCancelEdit();
        await loadEvents();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || (isEditMode ? "Impossible de modifier l'événement" : "Impossible de créer l'événement")}`);
      }
    } catch (error) {
      console.error(`Erreur ${isEditMode ? 'modification' : 'création'} événement:`, error);
      alert(`❌ Erreur lors de la ${isEditMode ? 'modification' : 'création'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white space-y-6">
      <div className={`mb-2 p-6 ${panelClass}`}>
        <Link
          href="/admin/events"
          className="text-gray-300 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-[#e6d5ff] to-[#b88bff] bg-clip-text text-transparent">
          Planification des Événements
        </h1>
        <p className="text-gray-300">
          Espace de pilotage: création, publication, visuels, et suivi opérationnel des événements communauté.
        </p>
      </div>

      <div className="mb-1 inline-flex rounded-xl border border-white/10 bg-black/20 p-1.5">
        <button
          type="button"
          onClick={() => setActivePlanningTab("events")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activePlanningTab === "events"
              ? "bg-gradient-to-r from-[#9146ff] to-[#7c3aed] text-white"
              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          Événements
        </button>
        <button
          type="button"
          onClick={() => setActivePlanningTab("public-film-announcement")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activePlanningTab === "public-film-announcement"
              ? "bg-gradient-to-r from-[#9146ff] to-[#7c3aed] text-white"
              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          Annonce publique Soirée Film
        </button>
      </div>

      {activePlanningTab === "public-film-announcement" ? (
        <FilmAnnouncementTab />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isEditMode ? "Modifier l'événement" : "Créer un événement"}
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
            {!isEditMode && (
              <div className="rounded-lg border border-[#9146ff]/30 bg-[#9146ff]/10 p-3 space-y-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d7beff] font-semibold">
                  Mode de création
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("new");
                      setLinkedSourceEventId("");
                      setSeriesLabel("");
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      creationMode === "new"
                        ? "border-[#9146ff] bg-gradient-to-r from-[#9146ff] to-[#7c3aed] text-white"
                        : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#b88bff]"
                    }`}
                  >
                    Créer un nouvel événement
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode("linked")}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      creationMode === "linked"
                        ? "border-[#9146ff] bg-gradient-to-r from-[#9146ff] to-[#7c3aed] text-white"
                        : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#b88bff]"
                    }`}
                  >
                    Créer depuis un événement existant
                  </button>
                </div>

                {creationMode === "linked" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      Événement de référence
                    </label>
                    <select
                      value={linkedSourceEventId}
                      onChange={(e) => setLinkedSourceEventId(e.target.value)}
                    className={inputClass}
                    >
                      <option value="">Choisir un événement existant...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} ({formatEventDateTimeInTimezone(event.startAtUtc || event.date, PARIS_TIMEZONE).fullLabel})
                        </option>
                      ))}
                    </select>
                    <label className="block text-sm font-semibold text-gray-300 mt-2">
                      Nom de série (regroupement)
                    </label>
                    <input
                      type="text"
                      value={seriesLabel}
                      onChange={(e) => setSeriesLabel(e.target.value)}
                      placeholder="Ex: Formation Discord Débutant"
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400">
                      Cette série permettra de regrouper les occurrences d&apos;un même type d&apos;événement.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload d'image */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Image de l'événement
              </label>
              {!imagePreview && !formData.imageUrl ? (
                <div className="rounded-xl border-2 border-dashed border-gray-700 p-5 text-center hover:border-[#b88bff] transition-colors bg-black/20">
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
                    <p className="text-sm text-gray-300 mb-2">
                      Cliquez pour importer une image (webp, jpg, png)
                    </p>
                    <span className="text-xs text-[#d7beff] font-semibold">
                      Format strict: 800×200 px (ratio 4:1) • Taille max: 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || formData.imageUrl || ''}
                    alt="Aperçu"
                    className="w-full aspect-[4/1] object-cover rounded-xl border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-gray-200">
                    800×200 requis
                  </div>
                  {formData.image && !formData.imageUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-2">
                        L'image sera uploadée automatiquement lors de la création de l'événement
                      </p>
                    </div>
                  )}
                </div>
              )}
              {imageInfo ? (
                <p className="mt-2 text-xs text-gray-400">
                  Image détectée: {imageInfo.width}×{imageInfo.height}px
                </p>
              ) : null}
              {imageDimensionError ? (
                <p className="mt-2 text-xs text-rose-300">{imageDimensionError}</p>
              ) : null}
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
                className={inputClass}
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
                className={`${inputClass} resize-none`}
                placeholder="Vous pouvez utiliser du Markdown : **gras**, *italique*, listes - ..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Formatage Markdown disponible : <strong>**gras**</strong>, <em>*italique*</em>, listes <code>- item</code>, retours à la ligne
              </p>
              <details className="mt-3 rounded-lg border border-gray-700 bg-[#0e0e10] p-3">
                <summary className="cursor-pointer text-xs text-gray-300 font-semibold">
                  📝 Aide Markdown Discord complète
                </summary>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-400 leading-relaxed">
{`📝 Mise en forme de texte Discord (Markdown)
1️⃣ Gras, italique et souligné
**texte en gras**
*texte en italique*
***gras + italique***
__texte souligné__
~~texte barré~~

2️⃣ Citation
> citation simple
>> citation imbriquée

3️⃣ Bloc de code
\`code\`

\`\`\`
bloc de code
\`\`\`

4️⃣ Code avec couleur (langages)
\`\`\`diff
+ texte vert
- texte rouge
\`\`\`

Autres styles :
\`\`\`yaml
titre: texte stylé
\`\`\`
\`\`\`css
texte coloré
\`\`\`

5️⃣ Titres (simulé)
# Grand titre
## Titre
### Sous titre

6️⃣ Listes
- élément 1
- élément 2
- élément 3

ou
• élément 1
• élément 2
• élément 3

7️⃣ Spoiler
||texte caché||

💡 Astuce TENF :
# 📢 Annonce importante

**Nouvelle réunion d'intégration**

📅 Date : vendredi  
🕘 Heure : 21h  

> Merci de vous inscrire dans le salon #inscriptions`}
                </pre>
              </details>
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
                className={inputClass}
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

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date & heure (Europe/Paris) *
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={inputClass}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Saisie en heure de Paris ({PARIS_TIMEZONE}), stockage en UTC.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Lieu
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationMode("none")}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      locationMode === "none"
                        ? "bg-gradient-to-r from-[#9146ff] to-[#7c3aed] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#b88bff]"
                    }`}
                  >
                    Aucun
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("external")}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      locationMode === "external"
                        ? "bg-gradient-to-r from-[#9146ff] to-[#7c3aed] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#b88bff]"
                    }`}
                  >
                    Lien externe
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("discord")}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      locationMode === "discord"
                        ? "bg-gradient-to-r from-[#9146ff] to-[#7c3aed] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#b88bff]"
                    }`}
                  >
                    Salon vocal Discord
                  </button>
                </div>

                {locationMode === "external" && (
                  <div>
                    <input
                      type="url"
                      value={externalLocationUrl}
                      onChange={(e) => setExternalLocationUrl(e.target.value)}
                      placeholder="https://www.twitch.tv/antho62221"
                      className={inputClass}
                    />
                    {(() => {
                      const preview = buildEventLocationDisplay(externalLocationUrl, managedLocationLinks);
                      if (!preview) return null;
                      return (
                        <p className="text-xs text-gray-400 mt-2">
                          Apercu public: <span className="text-white">{preview.label}</span>
                        </p>
                      );
                    })()}
                  </div>
                )}

                {locationMode === "discord" && (
                  <div className="space-y-2">
                    <select
                      value={discordLocationId}
                      onChange={(e) => setDiscordLocationId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choisir un vocal</option>
                      {managedLocationLinks
                        .filter((item) => item.isActive !== false)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                    <Link
                      href="/admin/events/liens-vocaux"
                      className="inline-block text-xs text-[#9146ff] hover:text-[#7c3aed]"
                    >
                      Gerer les salons vocaux
                    </Link>
                  </div>
                )}
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
                className="w-4 h-4 text-[#9146ff] bg-[#0e0e10] border-gray-700 rounded focus:ring-[#9146ff]"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-300">
                Publier sur /events (visible publiquement)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingImage || !!imageDimensionError}
              className={`w-full ${primaryButtonClass}`}
            >
              {saving ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Enregistrer les modifications" : "Créer l'événement")}
            </button>
          </form>
        </div>

        {/* Liste des événements */}
        <div className={`${panelClass} p-6`}>
          <h2 className="text-xl font-semibold text-white mb-6">
            Événements créés
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
            </div>
          ) : events.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucun événement créé
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0e0e10] border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mb-2">
                        {formatEventDateTimeInTimezone(event.startAtUtc || event.date, PARIS_TIMEZONE).fullLabel}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-400 mb-2">
                          📍 {buildEventLocationDisplay(event.location, managedLocationLinks)?.label || event.location}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const catConfig = getCategoryConfig(event.category);
                          return (
                            <span className={`text-xs px-2 py-1 rounded border ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}>
                              {event.category}
                            </span>
                          );
                        })()}
                        {event.seriesName && (
                          <span className="text-xs px-2 py-1 rounded border bg-cyan-500/15 text-cyan-200 border-cyan-400/30">
                            Série: {event.seriesName}
                          </span>
                        )}
                        {event.isPublished && (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            Publié
                          </span>
                        )}
                      </div>
                      {event.image && (
                        <div className="mt-2">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full aspect-[4/1] object-cover rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(event)}
                        className={subtleButtonClass}
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 transition-colors hover:bg-rose-500/20"
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
      )}
    </div>
  );
}

