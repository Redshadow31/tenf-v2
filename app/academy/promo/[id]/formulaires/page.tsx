"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

const forms = [
  { 
    slug: "auto-evaluation-debut", 
    title: "Auto-évaluation (début)", 
    desc: "Point de départ + objectifs", 
    icon: "🟣" 
  },
  { 
    slug: "retour-post-live", 
    title: "Auto-retour post-live", 
    desc: "Après mon live : ce qui a marché / à améliorer", 
    icon: "🎥" 
  },
  { 
    slug: "feedback-autre-live", 
    title: "Feedback sur un autre live", 
    desc: "Retour constructif à un participant", 
    icon: "🤝" 
  },
  { 
    slug: "auto-evaluation-fin", 
    title: "Auto-évaluation (fin)", 
    desc: "Bilan + prochains objectifs", 
    icon: "🏁" 
  },
  { 
    slug: "evaluation-academy", 
    title: "Évaluation Academy", 
    desc: "Anonyme (optionnel)", 
    icon: "⭐",
    optional: true
  },
];

export default function FormulairesHubPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/academy/check-access", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && data.activePromoId === promoId) {
            setHasAccess(true);
          } else {
            router.push("/academy/access");
          }
        } else {
          router.push("/academy/access");
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        router.push("/academy/access");
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, [promoId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirection en cours
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <Link
          href={`/academy/promo/${promoId}`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au parcours
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Formulaires</h1>
        <p className="text-gray-400">Complétez vos formulaires de suivi Academy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forms.map((form) => (
          <Link
            key={form.slug}
            href={`/academy/promo/${promoId}/formulaires/${form.slug}`}
            className="group rounded-lg border p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20"
            style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: 'var(--color-border)' 
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{form.icon}</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#9146ff] transition-colors">
                  {form.title}
                </h2>
                <p className="text-gray-400 text-sm">{form.desc}</p>
                {form.optional && (
                  <span className="inline-block mt-2 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                    Optionnel
                  </span>
                )}
              </div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-[#9146ff] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
