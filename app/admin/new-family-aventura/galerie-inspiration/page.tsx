"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import type { AventuraGalleryItem } from "@/lib/newFamilyAventuraStorage";

type FormState = {
  title: string;
  category: string;
  image_url: string;
  description: string;
  is_published: boolean;
};

const defaultForm: FormState = {
  title: "",
  category: "inspiration",
  image_url: "",
  description: "",
  is_published: true,
};

export default function AdminAventuraInspirationGalleryPage() {
  const [items, setItems] = useState<AventuraGalleryItem[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCreate, setIsUploadingCreate] = useState(false);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [message, setMessage] = useState<string>("");

  const publishedCount = useMemo(
    () => items.filter((item) => item.is_published && !item.is_archived).length,
    [items],
  );

  async function loadItems() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/new-family-aventura/inspiration", { cache: "no-store" });
      const data = await response.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setMessage("Impossible de charger la galerie pour le moment.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/new-family-aventura/inspiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur d'enregistrement");
      setForm(defaultForm);
      setMessage("Photo ajoutée avec succès.");
      await loadItems();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Impossible d'ajouter la photo.";
      setMessage(text);
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImageFile(file: File): Promise<string> {
    const body = new FormData();
    body.append("image", file);
    const response = await fetch("/api/new-family-aventura/inspiration/upload", {
      method: "POST",
      body,
    });
    const data = await response.json();
    if (!response.ok || !data?.imageUrl) {
      throw new Error(data?.error || "Upload impossible.");
    }
    return data.imageUrl as string;
  }

  async function handleCreateFileUpload(file: File) {
    setIsUploadingCreate(true);
    setMessage("");
    try {
      const imageUrl = await uploadImageFile(file);
      setForm((prev) => ({ ...prev, image_url: imageUrl }));
      setMessage("Image uploadée. Tu peux enregistrer la fiche.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Upload impossible.";
      setMessage(text);
    } finally {
      setIsUploadingCreate(false);
    }
  }

  async function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleCreateFileUpload(file);
    event.target.value = "";
  }

  async function onDropUpload(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropzoneActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleCreateFileUpload(file);
  }

  async function togglePublish(item: AventuraGalleryItem) {
    try {
      const response = await fetch(`/api/new-family-aventura/inspiration/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Erreur de mise à jour");
      }
      await loadItems();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Action impossible.";
      setMessage(text);
    }
  }

  async function updateImageUrl(item: AventuraGalleryItem, image_url: string) {
    try {
      const response = await fetch(`/api/new-family-aventura/inspiration/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Erreur de mise à jour");
      }
      setMessage("Photo remplacée.");
      await loadItems();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Impossible de remplacer la photo.";
      setMessage(text);
    }
  }

  async function removeItem(id: string) {
    const confirmed = window.confirm("Supprimer cette image de la galerie ?");
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/new-family-aventura/inspiration/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Erreur de suppression");
      }
      setMessage("Photo supprimée.");
      await loadItems();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Suppression impossible.";
      setMessage(text);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Galerie inspiration - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Tu peux maintenant ajouter, publier, remplacer et supprimer les photos.
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Photos publiques actives : {publishedCount}
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Ajouter une nouvelle photo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            placeholder="Titre"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            placeholder="Catégorie (parc, ambiance, hébergement...)"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            placeholder="URL image (https://...)"
            value={form.image_url}
            onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            required
          />
          <div
            className="md:col-span-2 rounded-lg border border-dashed px-3 py-4 text-sm"
            style={{
              borderColor: isDropzoneActive ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: isDropzoneActive ? "rgba(145,70,255,0.1)" : "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDropzoneActive(true);
            }}
            onDragLeave={() => setIsDropzoneActive(false)}
            onDrop={(event) => void onDropUpload(event)}
          >
            <p>Glisse une image ici ou choisis un fichier.</p>
            <label className="mt-2 inline-flex cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              {isUploadingCreate ? "Upload..." : "Choisir un fichier"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void onFileInputChange(event)}
                disabled={isUploadingCreate}
              />
            </label>
          </div>
          <textarea
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2 min-h-[90px]"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            placeholder="Description courte"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
            />
            Publier immédiatement sur la page publique
          </label>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
        {message ? (
          <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
            {message}
          </p>
        ) : null}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading ? (
          <div
            className="rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
          >
            Chargement des photos...
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
          >
            Aucune image enregistrée pour le moment.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
              <div className="p-3 space-y-2">
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {item.category}
                </p>
                <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.title}
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {item.is_published ? "Visible publiquement" : "Masquée publiquement"}
                </p>

                <PhotoUrlEditor item={item} onSave={updateImageUrl} />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void togglePublish(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: item.is_published ? "#b45309" : "var(--color-primary)" }}
                  >
                    {item.is_published ? "Dépublier" : "Publier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function PhotoUrlEditor({
  item,
  onSave,
}: {
  item: AventuraGalleryItem;
  onSave: (item: AventuraGalleryItem, image_url: string) => Promise<void>;
}) {
  const [value, setValue] = useState(item.image_url);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setValue(item.image_url);
  }, [item.image_url]);

  async function uploadAndReplace(file: File) {
    setIsUploading(true);
    setErrorText("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/new-family-aventura/inspiration/upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok || !data?.imageUrl) {
        throw new Error(data?.error || "Upload impossible.");
      }
      setValue(data.imageUrl as string);
      await onSave(item, data.imageUrl as string);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Upload impossible.";
      setErrorText(text);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="rounded-lg border px-2 py-1.5 text-xs w-full"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="button"
        disabled={isSaving || value.trim() === item.image_url}
        onClick={async () => {
          setIsSaving(true);
          await onSave(item, value.trim());
          setIsSaving(false);
        }}
        className="px-2 py-1 rounded-md text-xs font-semibold disabled:opacity-50"
        style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
      >
        {isSaving ? "Mise à jour..." : "Remplacer la photo (URL)"}
      </button>
      <label
        className="inline-flex cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
      >
        {isUploading ? "Upload..." : "Remplacer via fichier"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await uploadAndReplace(file);
            event.target.value = "";
          }}
        />
      </label>
      {errorText ? (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

