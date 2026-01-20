"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AcademyPromoPage() {
  const params = useParams();
  const promoId = params.id as string;
  const [promo, setPromo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (promoId) {
      loadPromo();
    }
  }, [promoId]);

  const loadPromo = async () => {
    try {
      const response = await fetch(`/api/academy/my-promo`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.promo && data.promo.id === promoId) {
          setPromo(data.promo);
        }
      }
    } catch (error) {
      console.error("Erreur chargement promo:", error);
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

  if (!promo) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border p-8 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Promo non trouvée
          </h2>
          <Link
            href="/academy"
            className="inline-block rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] px-6 py-3 text-white font-medium transition-colors"
          >
            Retour à l'Academy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/academy/dashboard"
          className="text-gray-400 hover:text-white transition-colors inline-block"
        >
          ← Retour au dashboard
        </Link>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
          {promo.name}
        </h1>
        {promo.description && (
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            {promo.description}
          </p>
        )}
      </div>

      <div className="rounded-lg border p-8 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Contenu de la promo à venir...
        </p>
      </div>
    </div>
  );
}
