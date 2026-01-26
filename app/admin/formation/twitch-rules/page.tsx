"use client";

import { useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { ArrowLeft, BookOpen, FileText, Presentation } from "lucide-react";

type TabType = "discours" | "presentation";

export default function TwitchRulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("discours");

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

        {/* Onglets */}
        <div className="mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("discours")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "discours"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5" />
              Discours
            </button>
            <button
              onClick={() => setActiveTab("presentation")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "presentation"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Presentation className="w-5 h-5" />
              Présentation
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          {activeTab === "discours" && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Discours
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Contenu du discours pour la formation Twitch
                  </p>
                </div>
              </div>

              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  Cette section contiendra le contenu du discours pour la formation sur Twitch et ses règles.
                </p>
                <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                  Le contenu sera ajouté prochainement.
                </p>
              </div>
            </div>
          )}

          {activeTab === "presentation" && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Presentation className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Présentation
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Présentation visuelle pour la formation Twitch
                  </p>
                </div>
              </div>

              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  Cette section contiendra la présentation visuelle pour la formation sur Twitch et ses règles.
                </p>
                <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                  Le contenu sera ajouté prochainement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
