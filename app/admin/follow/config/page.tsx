"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, GripVertical, AlertCircle, CheckCircle2, Users } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import type { FollowStaffEntry } from "@/lib/followStaffStorage";

export default function FollowStaffConfigPage() {
  const [staff, setStaff] = useState<FollowStaffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isFounder) loadStaff();
  }, [isFounder]);

  async function checkAccess() {
    try {
      const res = await fetch("/api/admin/access");
      if (res.status === 403) {
        window.location.href = "/unauthorized";
        return;
      }
      if (res.ok) setIsFounder(true);
    } catch (e) {
      setError("Erreur vérification");
    } finally {
      setLoading(false);
    }
  }

  async function loadStaff() {
    try {
      setError(null);
      const res = await fetch("/api/admin/follow-staff", { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (e: any) {
      setError(e.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(updated: FollowStaffEntry[]) {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/admin/follow-staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur sauvegarde");
      setStaff(data.staff || updated);
      setSuccess("Liste enregistrée");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Erreur sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    const displayName = newDisplayName.trim();
    if (!slug || !displayName) {
      setError("Slug et nom affiché requis");
      return;
    }
    if (staff.some((s) => s.slug === slug)) {
      setError("Ce slug existe déjà");
      return;
    }
    const updated = [...staff, { slug, displayName, isActive: true, order: staff.length }];
    setStaff(updated);
    setNewSlug("");
    setNewDisplayName("");
    setError(null);
    handleSave(updated);
  }

  function handleToggleActive(index: number) {
    const updated = staff.map((s, i) =>
      i === index ? { ...s, isActive: !s.isActive } : s
    );
    setStaff(updated);
    handleSave(updated);
  }

  function handleRemove(index: number) {
    if (!confirm("Désactiver ce membre ? Il restera dans l'historique mais n'apparaîtra plus dans le hub.")) return;
    const updated = staff.map((s, i) =>
      i === index ? { ...s, isActive: false } : s
    );
    setStaff(updated);
    handleSave(updated);
  }

  function handleMove(from: number, to: number) {
    const updated = [...staff];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    const withOrder = updated.map((s, i) => ({ ...s, order: i }));
    setStaff(withOrder);
    handleSave(withOrder);
  }

  function slugFromDisplayName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (loading && !isFounder) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--color-primary)" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isFounder) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="rounded-lg border border-red-500/50 p-8">
          <h1 className="text-xl font-bold text-red-400">Accès réservé aux fondateurs</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="Configuration staff - Suivi des follows"
        navLinks={[
          { href: "/admin/follow", label: "Dashboard Suivi Follow" },
          { href: "/admin/follow/config", label: "Configuration staff", active: true },
        ]}
      />

      <div className="mx-auto max-w-4xl px-8 py-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 p-4" style={{ backgroundColor: "var(--color-card)" }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm" style={{ color: "var(--color-text)" }}>{error}</p>
            <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/50 p-4" style={{ backgroundColor: "var(--color-card)" }}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
            <p className="text-sm" style={{ color: "var(--color-text)" }}>{success}</p>
          </div>
        )}

        <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Gérez ici les membres du staff qui ont une page de suivi des follows. Désactiver un membre le masque du hub mais conserve l'historique.
          </p>
        </div>

        <div className="mb-8 rounded-lg border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            <Plus className="h-5 w-5" />
            Ajouter un membre
          </h2>
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => {
                setNewDisplayName(e.target.value);
                if (!newSlug) setNewSlug(slugFromDisplayName(e.target.value));
              }}
              placeholder="Nom affiché (ex: Clara)"
              className="rounded-lg border px-4 py-2"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="Slug URL (ex: clara)"
              className="rounded-lg border px-4 py-2"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newSlug.trim() || !newDisplayName.trim()}
              className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {saving ? "..." : "Ajouter"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                Membres du staff ({staff.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--color-primary)" }} />
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
              Aucun membre configuré.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {staff.map((entry, index) => (
                <div
                  key={entry.slug}
                  className="flex items-center gap-4 px-6 py-4"
                  style={{ backgroundColor: "var(--color-card)" }}
                >
                  <div
                    className="cursor-grab text-gray-500 hover:text-gray-300"
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== index) {
                        handleMove(draggedIndex, index);
                        setDraggedIndex(index);
                      }
                    }}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: "var(--color-text)" }}>{entry.displayName}</div>
                    <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      /admin/follow/{entry.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(index)}
                      className={`rounded-lg px-3 py-1 text-sm font-medium ${
                        entry.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {entry.isActive ? "Actif" : "En pause"}
                    </button>
                    <Link
                      href={`/admin/follow/${entry.slug}`}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Voir page
                    </Link>
                    <button
                      onClick={() => handleRemove(index)}
                      className="rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-500/10"
                      title="Désactiver (masquer du hub)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
