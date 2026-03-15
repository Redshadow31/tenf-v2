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

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events?admin=true", {
        cache: 'no-store',
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
    setLocationMode("none");
    setExternalLocationUrl("");
    setDiscordLocationId("");
  };

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
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Planification des Événements
        </h1>
        <p className="text-gray-400">
          Créez et gérez les événements de la communauté
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-gray-700 bg-[#1a1a1d] p-1">
        <button
          type="button"
          onClick={() => setActivePlanningTab("events")}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activePlanningTab === "events" ? "bg-[#9146ff] text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          Événements
        </button>
        <button
          type="button"
          onClick={() => setActivePlanningTab("public-film-announcement")}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activePlanningTab === "public-film-announcement" ? "bg-[#9146ff] text-white" : "text-gray-300 hover:text-white"
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
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
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
            {/* Upload d'image */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Image de l'événement
              </label>
              {!imagePreview && !formData.imageUrl ? (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-[#9146ff] transition-colors">
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
                      Dimensions: 800x200px • Taille max: 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || formData.imageUrl || ''}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {formData.image && !formData.imageUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-2">
                        L'image sera uploadée automatiquement lors de la création de l'événement
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
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff] resize-none"
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
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      locationMode === "none"
                        ? "bg-[#9146ff] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
                    }`}
                  >
                    Aucun
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("external")}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      locationMode === "external"
                        ? "bg-[#9146ff] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
                    }`}
                  >
                    Lien externe
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("discord")}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      locationMode === "discord"
                        ? "bg-[#9146ff] border-[#9146ff] text-white"
                        : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
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
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
              disabled={saving}
              className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Enregistrer les modifications" : "Créer l'événement")}
            </button>
          </form>
        </div>

        {/* Liste des événements */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
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
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
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
                            className="w-full h-32 object-cover rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(event)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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

