"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AcademyPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      const response = await fetch("/api/admin/academy/promos", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setPromos(data.promos || []);
      }
    } catch (error) {
      console.error("Erreur chargement promos:", error);
    } finally {
      setLoading(false);
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
        <h1 className="text-4xl font-bold text-white mb-2">Promos Academy</h1>
        <p className="text-gray-400">Gérer les promos Academy</p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400 text-center py-8">
          Page en cours de développement. Utilisez "Accès & rôles" pour créer des promos.
        </p>
      </div>
    </div>
  );
}
