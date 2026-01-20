"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AcademyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [promo, setPromo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPromo() {
      try {
        const response = await fetch("/api/academy/my-promo", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.promo) {
            setPromo(data.promo);
          }
        }
      } catch (error) {
        console.error("Erreur chargement promo:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPromo();
  }, []);

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
            Aucune promo active
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Vous n'êtes pas inscrit à une promo active pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
          🎓 Mon parcours Academy
        </h1>
        <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            {promo.name}
          </h2>
          {promo.description && (
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {promo.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Début: {new Date(promo.startDate).toLocaleDateString('fr-FR')}</span>
            {promo.endDate && (
              <span>Fin: {new Date(promo.endDate).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation du parcours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href={`/academy/promo/${promo.id}/parcours`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Mon parcours (J1–J15)
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Suivez votre progression jour par jour
          </p>
        </Link>

        <Link
          href={`/academy/promo/${promo.id}/formulaires`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Formulaires
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Complétez vos formulaires de suivi
          </p>
        </Link>

        <Link
          href={`/academy/promo/${promo.id}/ressources`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Ressources
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Accédez aux ressources et documents
          </p>
        </Link>

        <Link
          href={`/academy/promo/${promo.id}/planning`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Planning
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Consultez le planning des réunions
          </p>
        </Link>

        <Link
          href={`/academy/promo/${promo.id}/faq`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            FAQ / Aide
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Questions fréquentes et support
          </p>
        </Link>

        <Link
          href={`/academy/promo/${promo.id}/auto-evaluations`}
          className="rounded-lg border p-6 hover:border-[#9146ff] transition-colors"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Auto-évaluations publiques
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Découvrez les auto-évaluations partagées par les membres
          </p>
        </Link>
      </div>
    </div>
  );
}
