"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AcademyAccessAdminPage() {
  const [settings, setSettings] = useState<any>(null);
  const [promos, setPromos] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, promosRes, logsRes] = await Promise.all([
        fetch("/api/admin/academy/settings", { cache: 'no-store' }),
        fetch("/api/admin/academy/promos", { cache: 'no-store' }),
        fetch("/api/admin/academy/logs", { cache: 'no-store' }),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      if (promosRes.ok) {
        const data = await promosRes.json();
        setPromos(data.promos || []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAcademy = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/academy/settings", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !settings?.enabled,
        }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Erreur mise à jour settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const password = formData.get('password') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    try {
      setSaving(true);
      const response = await fetch("/api/admin/academy/promos", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          password,
          startDate,
          endDate: endDate || undefined,
          isActive: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Rediriger vers la page de gestion de la promo
        if (result.success && result.promo?.id) {
          window.location.href = `/admin/academy/promo/${result.promo.id}`;
        } else {
          await loadData();
          e.currentTarget.reset();
        }
      }
    } catch (error) {
      console.error("Erreur création promo:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <Link
          href="/admin/academy"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Gestion des accès TENF Academy</h1>
        <p className="text-gray-400">Activer/désactiver Academy et gérer les promos</p>
      </div>

      {/* Statut Academy */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Statut TENF Academy</h2>
            <p className="text-gray-400">
              {settings?.enabled ? "Academy est actuellement activée" : "Academy est actuellement désactivée"}
            </p>
          </div>
          <button
            onClick={handleToggleAcademy}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              settings?.enabled
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } disabled:opacity-50`}
          >
            {settings?.enabled ? "Désactiver" : "Activer"} Academy
          </button>
        </div>
      </div>

      {/* Promos */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Promos</h2>
        
        {/* Créer une promo */}
        <form onSubmit={handleCreatePromo} className="mb-6 space-y-4 p-4 bg-[#0e0e10] rounded-lg">
          <h3 className="text-lg font-semibold text-white">Créer une nouvelle promo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Nom de la promo"
              required
              className="px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="password"
              placeholder="Mot de passe (sera hashé)"
              required
              className="px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white placeholder-gray-400"
            />
            <input
              type="date"
              name="startDate"
              required
              className="px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white"
            />
            <input
              type="date"
              name="endDate"
              className="px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white"
            />
          </div>
          <textarea
            name="description"
            placeholder="Description (optionnel)"
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer la promo"}
          </button>
        </form>

        {/* Liste des promos */}
        <div className="space-y-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="p-4 bg-[#0e0e10] rounded-lg border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{promo.name}</h3>
                  {promo.description && (
                    <p className="text-sm text-gray-400 mt-1">{promo.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>Début: {new Date(promo.startDate).toLocaleDateString('fr-FR')}</span>
                    {promo.endDate && (
                      <span>Fin: {new Date(promo.endDate).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      promo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs récents */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Logs récents</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.slice(0, 50).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-[#0e0e10] rounded-lg border border-gray-700 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{log.action}</span>
                <span className="text-gray-400">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
              {log.metadata && (
                <div className="text-xs text-gray-500 mt-1">
                  {JSON.stringify(log.metadata)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
