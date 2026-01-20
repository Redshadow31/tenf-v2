"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AcademyParticipantsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

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
        <h1 className="text-4xl font-bold text-white mb-2">Participants Academy</h1>
        <p className="text-gray-400">Voir et gérer les participants</p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400 text-center py-8">
          Page en cours de développement.
        </p>
      </div>
    </div>
  );
}
