"use client";

import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { BookOpen, ArrowRight } from "lucide-react";

export default function FormationHubPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="📚 Formation TENF - Hub"
        navLinks={[
          { href: "/admin/dashboard", label: "Tableau de bord" },
          { href: "/admin/formation", label: "Formation TENF", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Formation TENF
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Centre de ressources et de formation pour les membres TENF
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/formation/twitch-rules"
            className="rounded-lg border p-6 transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(145, 70, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  TENF Academy : Comprendre Twitch et ses règles
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Formation complète sur Twitch, ses règles, ses fonctionnalités et les bonnes pratiques pour les streamers TENF.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                  Accéder à la formation
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
