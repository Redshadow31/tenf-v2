"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";

type LocationLink = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
};

export default function EventLocationLinksPage() {
  const [links, setLinks] = useState<LocationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "" });

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
      alert("Erreur lors du chargement des liens.");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      alert("Nom et URL requis.");
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
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'enregistrer");
      }

      resetForm();
      await loadLinks();
      alert(isEdit ? "Lien mis a jour." : "Lien ajoute.");
    } catch (error) {
      console.error("[liens-vocaux] Erreur sauvegarde:", error);
      alert(error instanceof Error ? error.message : "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(link: LocationLink) {
    setEditingId(link.id);
    setForm({ name: link.name, url: link.url });
  }

  async function toggleActive(link: LocationLink) {
    try {
      const response = await fetch(`/api/admin/events/location-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Impossible de modifier l'etat");
      await loadLinks();
    } catch (error) {
      console.error("[liens-vocaux] Erreur activation:", error);
      alert("Erreur lors de la mise a jour.");
    }
  }

  async function removeLink(link: LocationLink) {
    if (!confirm(`Supprimer le lien "${link.name}" ?`)) return;
    try {
      const response = await fetch(`/api/admin/events/location-links/${link.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Impossible de supprimer");
      await loadLinks();
    } catch (error) {
      console.error("[liens-vocaux] Erreur suppression:", error);
      alert("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/events" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour aux evenements
        </Link>
        <h1 className="text-4xl font-bold mb-2">Liens des salons vocaux</h1>
        <p className="text-gray-400">Ajoutez des vocaux Discord nommes pour les reutiliser dans la planification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Modifier un lien" : "Ajouter un lien"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Nom du vocal</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Ex: Vocal Communaute"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Lien</label>
              <input
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2"
                placeholder="https://discord.com/channels/..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#9146ff] hover:bg-[#7c3aed] px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Liens enregistres</h2>
          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : links.length === 0 ? (
            <p className="text-gray-400">Aucun lien configure.</p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{link.name}</p>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-[#9146ff] break-all">
                        {link.url}
                      </a>
                      <p className={`text-xs mt-2 ${link.isActive ? "text-green-400" : "text-gray-500"}`}>
                        {link.isActive ? "Actif" : "Inactif"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => startEdit(link)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(link)}
                        className="p-2 bg-amber-600 hover:bg-amber-700 rounded-lg"
                        title={link.isActive ? "Desactiver" : "Activer"}
                      >
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                      <button
                        onClick={() => removeLink(link)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
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
