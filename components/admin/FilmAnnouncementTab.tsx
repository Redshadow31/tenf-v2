"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";

type AnnouncementPayload = {
  category: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
};

const DEFAULT_ANNOUNCEMENT: AnnouncementPayload = {
  category: "Soirée Film",
  title: "Soirée Film communautaire",
  description: "Connecte-toi avec un profil actif TENF pour découvrir la programmation complète des soirées film.",
  image: "",
  ctaLabel: "",
  ctaUrl: "",
  isActive: true,
};

export default function FilmAnnouncementTab() {
  const [formData, setFormData] = useState<AnnouncementPayload>(DEFAULT_ANNOUNCEMENT);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events/public-announcements?category=Soir%C3%A9e%20Film", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger l'annonce");
      }

      if (data?.announcement) {
        setFormData({
          category: data.announcement.category || "Soirée Film",
          title: data.announcement.title || DEFAULT_ANNOUNCEMENT.title,
          description: data.announcement.description || "",
          image: data.announcement.image || "",
          ctaLabel: data.announcement.ctaLabel || "",
          ctaUrl: data.announcement.ctaUrl || "",
          isActive: data.announcement.isActive !== false,
        });
        setImageFile(null);
        setImagePreview(data.announcement.image || null);
      } else {
        setFormData(DEFAULT_ANNOUNCEMENT);
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("[FilmAnnouncementTab] load error:", error);
      setMessage("Impossible de charger l'annonce générique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("L'image ne doit pas dépasser 5MB.");
      return;
    }

    setImageFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.title.trim()) {
      setMessage("Le titre est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = formData.image;
      if (imageFile) {
        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFile);

        const uploadResponse = await fetch("/api/admin/events/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData?.error || "Impossible d'uploader l'image");
        }
        finalImageUrl = uploadData.imageUrl || "";
      }

      const response = await fetch("/api/admin/events/public-announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: finalImageUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'enregistrer l'annonce");
      }
      setFormData({
        category: data.announcement.category || "Soirée Film",
        title: data.announcement.title || "",
        description: data.announcement.description || "",
        image: data.announcement.image || "",
        ctaLabel: data.announcement.ctaLabel || "",
        ctaUrl: data.announcement.ctaUrl || "",
        isActive: data.announcement.isActive !== false,
      });
      setImageFile(null);
      setImagePreview(data.announcement.image || null);
      setMessage("✅ Annonce publique enregistrée.");
    } catch (error) {
      console.error("[FilmAnnouncementTab] save error:", error);
      setMessage(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400">Chargement de l'annonce générique...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Annonce publique - Soirée Film</h2>
        <p className="text-sm text-gray-400 mb-5">
          Cette annonce remplace le contenu réel des événements "Soirée Film" sur la page publique pour les visiteurs anonymes
          et les membres inactifs.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="film-announcement-active"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-[#9146ff] bg-[#0e0e10] border-gray-700 rounded focus:ring-[#9146ff]"
            />
            <label htmlFor="film-announcement-active" className="text-sm text-gray-300">
              Activer le remplacement public de la catégorie Soirée Film
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Titre public *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description publique</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Image de l'annonce</label>
            {!imagePreview && !formData.image ? (
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-[#9146ff] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="film-announcement-image-upload"
                />
                <label htmlFor="film-announcement-image-upload" className="cursor-pointer block">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-2">Cliquez pour importer une image (webp, jpg, png)</p>
                  <span className="text-xs text-gray-500">Dimensions conseillées: 800x200px • Taille max: 5MB</span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview || formData.image}
                  alt="Aperçu annonce"
                  className="w-full h-44 object-cover rounded-lg border border-gray-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {imageFile && (
                  <p className="text-xs text-gray-400 mt-2">
                    L'image sera uploadée automatiquement lors de l'enregistrement de l'annonce.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Bouton CTA (optionnel)</label>
              <input
                type="text"
                value={formData.ctaLabel}
                onChange={(e) => setFormData((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                placeholder="Ex: Connexion Discord"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Lien CTA (optionnel)</label>
              <input
                type="url"
                value={formData.ctaUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving || uploadingImage ? "Enregistrement..." : "Enregistrer l'annonce"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-900/20 text-blue-200 text-sm px-4 py-3">{message}</div>
        )}
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Aperçu public</h3>
        <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
          {imagePreview || formData.image ? (
            <img src={imagePreview || formData.image} alt={formData.title} className="w-full h-40 object-cover" />
          ) : (
            <div className="h-40 bg-gradient-to-r from-[#1f1f24] to-[#141417]" />
          )}
          <div className="p-4 space-y-3">
            <span className="inline-block text-xs px-2 py-1 rounded-full border bg-blue-600/30 text-blue-200 border-blue-500/30">
              Soirée Film
            </span>
            <h4 className="text-white text-lg font-semibold">{formData.title || "Titre de l'annonce"}</h4>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {formData.description || "Description de l'annonce générique."}
            </p>
            {formData.ctaLabel && (
              <span className="inline-block px-3 py-2 rounded-lg text-sm font-semibold bg-[#9146ff] text-white">
                {formData.ctaLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
