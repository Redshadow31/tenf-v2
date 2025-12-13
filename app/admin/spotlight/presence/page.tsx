"use client";

import Link from "next/link";

export default function PresenceSpotlightPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Présence Spotlight</h1>
        <p className="text-gray-400">Évaluer les présences aux spotlights</p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Évaluation des présences
          </h2>
          <p className="text-gray-400 mb-6">
            Cette section permettra d'évaluer les présences aux spotlights.
          </p>
          <p className="text-sm text-gray-500">
            Fonctionnalité à venir
          </p>
        </div>
      </div>
    </div>
  );
}

