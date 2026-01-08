"use client";

import Link from "next/link";

export default function PresenceRetourPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/evaluations"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à l'intégration
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Présence et retour</h1>
        <p className="text-gray-400">
          Suivre les présences et les retours de follow
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400">
          Page de présence et retour en cours de développement...
        </p>
      </div>
    </div>
  );
}

