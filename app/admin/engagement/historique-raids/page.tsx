"use client";

import Link from "next/link";

export default function AdminEngagementHistoriqueRaidsPage() {
  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/raids" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour à Engagement
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Historique des raids</h1>
        <p className="text-gray-400">
          Vue future pour consulter l’historique consolidé des raids entre la plateforme et Discord.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <p className="font-semibold text-yellow-300">Fonctionnalité à venir</p>
            <p className="text-sm text-yellow-200">Le module historique sera activé avec le bot Discord.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        <p className="text-sm text-gray-300">
          Placeholder ajouté sans modifier les pages de raids/follow déjà en production.
        </p>
      </div>
    </div>
  );
}
