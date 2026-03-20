"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Link2, Pencil, Plus, Power, ShieldCheck, Trash2 } from "lucide-react";

type LocationLink = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

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

  const activeCount = links.filter((link) => link.isActive).length;
  const inactiveCount = links.length - activeCount;

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <Link href="/admin/events" className="text-gray-300 hover:text-white transition-colors inline-block mb-3">
          ← Retour aux evenements
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Evenements communautaires</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Liens des salons vocaux
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page centralise les liens Discord vocaux utilises dans la planification. Elle permet de garantir que chaque
              evenement pointe vers un salon valide, actif et simple a reutiliser.
            </p>
          </div>
          <Link href="/admin/communaute/evenements/calendrier" className={subtleButtonClass}>
            Ouvrir calendrier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total liens</p>
          <p className="mt-2 text-3xl font-semibold">{links.length}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{activeCount}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Inactifs</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{inactiveCount}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Gestion des liens vocaux</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ajoute ou modifie un lien pour qu il soit reutilisable dans les formulaires d evenement.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Nom du vocal</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-4 py-2.5 text-white focus:border-indigo-300/45 focus:outline-none"
                placeholder="Ex: Vocal Communaute"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Lien</label>
              <input
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                className="w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-4 py-2.5 text-white focus:border-indigo-300/45 focus:outline-none"
                placeholder="https://discord.com/channels/..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:brightness-110 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-600/70 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Explication de la page</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              1. Creer un lien vocal clair et nominatif pour les equipes event.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              2. Garder uniquement les liens actifs pour eviter les erreurs en planification.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              3. Desactiver au lieu de supprimer quand un salon peut revenir plus tard.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <span className="inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Regle operationnelle
            </span>
            <p className="mt-1">
              Chaque lien vocal doit etre teste et actif avant publication d un evenement.
            </p>
          </div>
        </article>
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Liens enregistres</h2>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : links.length === 0 ? (
            <p className="text-gray-400">Aucun lien configure.</p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="rounded-xl border border-[#353a50] bg-[#121623]/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 font-semibold text-slate-100">
                        <Link2 className="h-4 w-4 text-cyan-300" />
                        {link.name}
                      </p>
                      <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-indigo-200 hover:text-indigo-100">
                        {link.url}
                      </a>
                      <p className={`text-xs mt-2 ${link.isActive ? "text-green-400" : "text-gray-500"}`}>
                        {link.isActive ? "Actif" : "Inactif"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => startEdit(link)}
                        className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 p-2 text-cyan-100 hover:brightness-110"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(link)}
                        className="rounded-lg border border-amber-300/35 bg-amber-300/10 p-2 text-amber-100 hover:brightness-110"
                        title={link.isActive ? "Desactiver" : "Activer"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeLink(link)}
                        className="rounded-lg border border-rose-300/35 bg-rose-300/10 p-2 text-rose-100 hover:brightness-110"
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
      </section>
    </div>
  );
}
