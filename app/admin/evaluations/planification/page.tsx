"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, X, Image as ImageIcon, Edit, Trash2, Copy } from "lucide-react";
import { LOCATION_OPTIONS } from "@/lib/locationOptions";

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

export default function PlanificationPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Intégration standard",
    date: "",
    location: "", // DÉPRÉCIÉ: pour compatibilité avec anciennes données
    locationName: "",
    locationUrl: "",
    isPublished: false,
    image: null as File | null,
    imageUrl: "" as string | null,
  });
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
    setFormData({
      title: "",
      description: "",
      category: "Intégration standard",
      date: "",
      location: "",
      locationName: "",
      locationUrl: "",
      isPublished: false,
      image: null,
      imageUrl: null,
    });
    setImagePreview(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Veuillez remplir le titre et la date");
      return;
    }

    // Si une image est sélectionnée mais pas encore uploadée, uploader d'abord
    let finalImageUrl = formData.imageUrl;
    if (formData.image && !formData.imageUrl) {
      try {
        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', formData.image);

        // Utiliser l'API d'upload d'images des événements (ou créer une API spécifique)
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
      
      const integrationData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        // Pour compatibilité avec anciennes données, garder location si locationName/Url sont vides
        location: formData.locationName && formData.locationUrl ? undefined : formData.location || undefined,
        locationName: formData.locationName || undefined,
        locationUrl: formData.locationUrl || undefined,
        isPublished: formData.isPublished,
        image: finalImageUrl || undefined,
      };

      let response;
      if (isEditMode && editingIntegration) {
        // Mise à jour d'une intégration existante
        response = await fetch(`/api/integrations/${editingIntegration.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(integrationData),
        });
      } else {
        // Création d'une nouvelle intégration
        response = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(integrationData),
        });
      }

      if (response.ok) {
        alert(isEditMode ? "✅ Intégration modifiée avec succès !" : "✅ Intégration créée avec succès !");
        handleCancelEdit();
        await loadIntegrations();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || (isEditMode ? "Impossible de modifier l'intégration" : "Impossible de créer l'intégration")}`);
      }
    } catch (error) {
      console.error(`Erreur ${isEditMode ? 'modification' : 'création'} intégration:`, error);
      alert(`❌ Erreur lors de la ${isEditMode ? 'modification' : 'création'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/integration"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à l'intégration
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Planification des Intégrations
        </h1>
        <p className="text-gray-400">
          Créez et gérez les intégrations de la communauté
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
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
                Image de l'intégration
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
                      Taille max: 5MB
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
                Date *
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
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                      URL de la localisation
                    </label>
                    <input
                      type="url"
                      value={formData.locationUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, locationUrl: e.target.value })
                      }
                      placeholder="https://discord.com/channels/..."
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le nom sélectionné sera affiché comme lien vers cette URL côté public
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
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                className="w-4 h-4 text-[#9146ff] bg-[#0e0e10] border-gray-700 rounded focus:ring-[#9146ff]"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-300">
                Publier sur /integration (visible publiquement)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Enregistrer les modifications" : "Créer l'intégration")}
            </button>
          </form>
        </div>

        {/* Liste des intégrations */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Intégrations créées
          </h2>
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
                <div
                  key={integration.id}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                >
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
                            className="text-[#9146ff] hover:text-[#7c3aed] underline"
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
                            className="w-full h-32 object-cover rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleStartEdit(integration)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(integration)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Dupliquer (nouvelle date)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
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
    </div>
  );
}
