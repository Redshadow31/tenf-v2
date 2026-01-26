"use client";

import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function TwitchRulesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="TENF Academy : Comprendre Twitch et ses règles"
        navLinks={[
          { href: "/admin/dashboard", label: "Tableau de bord" },
          { href: "/admin/formation", label: "Formation TENF" },
          { href: "/admin/formation/twitch-rules", label: "Comprendre Twitch et ses règles", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <Link
            href="/admin/formation"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Hub Formation
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            TENF Academy : Comprendre Twitch et ses règles
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Formation complète sur Twitch, ses règles, ses fonctionnalités et les bonnes pratiques
          </p>
        </div>

        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary)',
              }}
            >
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Contenu de la formation
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Cette page sera bientôt disponible avec le contenu complet de la formation
              </p>
            </div>
          </div>

          <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
            <p>
              Cette section contiendra :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les règles et conditions d'utilisation de Twitch</li>
              <li>Les fonctionnalités principales de la plateforme</li>
              <li>Les bonnes pratiques pour les streamers</li>
              <li>Les guidelines spécifiques à TENF</li>
              <li>Des ressources et outils utiles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
