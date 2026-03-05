"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const DISCORD_SHOP_URL = "https://discord.com/channels/535244857891880970/1278839967962894459";

type TabId =
  | "vision"
  | "parcours"
  | "reglement"
  | "points"
  | "boutique"
  | "spotlight"
  | "faq";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "vision", label: "Bienvenue & vision" },
  { id: "parcours", label: "Parcours membre" },
  { id: "reglement", label: "Règlement & sécurité" },
  { id: "points", label: "Système de points" },
  { id: "boutique", label: "Boutique des points" },
  { id: "spotlight", label: "Spotlight" },
  { id: "faq", label: "FAQ & contact" },
];

function Pill({ kind, text }: { kind: "required" | "recommended" | "forbidden"; text: string }) {
  const classes =
    kind === "required"
      ? "bg-blue-900/30 text-blue-300 border-blue-700"
      : kind === "recommended"
      ? "bg-green-900/30 text-green-300 border-green-700"
      : "bg-red-900/30 text-red-300 border-red-700";

  return <span className={`px-2 py-1 rounded text-xs border ${classes}`}>{text}</span>;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function FonctionnementTenfV2Page() {
  const [activeTab, setActiveTab] = useState<TabId>("vision");

  const activeLabel = useMemo(
    () => tabs.find((t) => t.id === activeTab)?.label || "",
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold">Fonctionnement TENF - Version 2 (preview)</h1>
            <span className="text-xs px-2 py-1 rounded border border-yellow-600 bg-yellow-900/30 text-yellow-300">
              Prévisualisation
            </span>
          </div>
          <p className="text-gray-300">
            Cette page est une version test pour améliorer la lisibilité avant intégration sur la version principale.
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill kind="required" text="Obligatoire" />
            <Pill kind="recommended" text="Conseillé" />
            <Pill kind="forbidden" text="Interdit" />
          </div>
          <div>
            <Link href="/fonctionnement-tenf" className="text-indigo-300 hover:text-indigo-200 underline">
              Voir la version actuelle
            </Link>
          </div>
        </div>

        <div className="sticky top-2 z-10 bg-[#0e0e10]/90 backdrop-blur py-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#9146ff] border-[#9146ff] text-white"
                    : "bg-[#1a1a1d] border-gray-700 text-gray-300 hover:bg-[#242428]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-400">Onglet actif: {activeLabel}</div>

        {activeTab === "vision" && (
          <SectionCard title="Bienvenue & vision">
            <p className="text-gray-200">
              TENF est un serveur d'entraide Twitch: progression, visibilité, cadre bienveillant et engagement réciproque.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>- Objectif: aider les créateurs à évoluer durablement.</li>
              <li>- Valeurs: respect, constance, entraide concrète, transparence.</li>
              <li>- Attendu: participer à la vie du serveur, pas seulement consommer des avantages.</li>
            </ul>
          </SectionCard>
        )}

        {activeTab === "parcours" && (
          <SectionCard title="Parcours membre">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">1. Arrivée & présentation</div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">2. Intégration & règles</div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">3. Activité & points</div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">4. Opportunités (spotlight, coaching)</div>
            </div>
            <p className="text-sm text-gray-300">
              <Pill kind="required" text="Obligatoire" /> Lire les règles et faire une présentation claire.
            </p>
            <p className="text-sm text-gray-300">
              <Pill kind="recommended" text="Conseillé" /> Participer régulièrement (chat/vocal/raids).
            </p>
          </SectionCard>
        )}

        {activeTab === "reglement" && (
          <SectionCard title="Règlement & sécurité">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Pill kind="required" text="Obligatoire" /> Respect des membres, du staff et des consignes de modération.
              </li>
              <li>
                <Pill kind="required" text="Obligatoire" /> Confidentialité des échanges internes staff.
              </li>
              <li>
                <Pill kind="forbidden" text="Interdit" /> Harcèlement, doxx, leak, intimidation, spam agressif.
              </li>
              <li>
                <Pill kind="forbidden" text="Interdit" /> Contournement de sanction via multi-comptes.
              </li>
            </ul>
            <p className="text-sm text-gray-400">
              En cas de souci: signalement au staff avec contexte factuel (captures, date, salon).
            </p>
          </SectionCard>
        )}

        {activeTab === "points" && (
          <SectionCard title="Système de points">
            <p className="text-sm text-gray-300">
              Les points récompensent la participation utile à la communauté (présence, entraide, événements, implication).
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>- Plus ta participation est régulière, plus ta progression est stable.</li>
              <li>- Les points peuvent être utilisés dans la boutique dédiée.</li>
              <li>- Le staff peut ajuster en cas d'abus ou d'anomalie.</li>
            </ul>
          </SectionCard>
        )}

        {activeTab === "boutique" && (
          <SectionCard title="Boutique des points">
            <p className="text-sm text-gray-300">
              Les achats passent par Discord, puis ticket obligatoire pour exécution.
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <Pill kind="required" text="Obligatoire" /> Ouvrir un ticket après achat avec pseudo + récompense.
              </p>
              <p>
                <Pill kind="recommended" text="Conseillé" /> Donner tes disponibilités si planification nécessaire.
              </p>
            </div>
            <a
              href={DISCORD_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold"
            >
              Ouvrir la boutique Discord
            </a>
          </SectionCard>
        )}

        {activeTab === "spotlight" && (
          <SectionCard title="Spotlight">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>- Mise en avant d'une heure pour présenter ton univers.</li>
              <li>- Réservation anticipée recommandée (minimum 7 jours).</li>
              <li>- 1 spotlight par mois et par créateur (selon règles actuelles).</li>
              <li>- Soutien collectif attendu (présence/interaction/raid de fin).</li>
            </ul>
            <p className="text-sm text-gray-300">
              <Pill kind="forbidden" text="Interdit" /> Multistream pendant le spotlight si la règle locale l'interdit.
            </p>
          </SectionCard>
        )}

        {activeTab === "faq" && (
          <SectionCard title="FAQ & contact">
            <div className="space-y-2 text-sm text-gray-200">
              <details className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <summary className="cursor-pointer font-semibold">Je viens d'acheter, que faire ?</summary>
                <p className="mt-2 text-gray-300">
                  Ouvre un ticket avec: récompense, pseudo Twitch, disponibilités, et détails utiles.
                </p>
              </details>
              <details className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <summary className="cursor-pointer font-semibold">Comment signaler un problème ?</summary>
                <p className="mt-2 text-gray-300">
                  Contacte le staff avec des faits (quand, où, qui, preuves), sans escalade publique.
                </p>
              </details>
              <details className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <summary className="cursor-pointer font-semibold">Je ne comprends pas une règle</summary>
                <p className="mt-2 text-gray-300">
                  Demande une clarification en salon support, le staff te répond avec le cas d'usage.
                </p>
              </details>
            </div>
            <p className="text-sm text-gray-400">
              Point de contact recommandé: un salon support dédié + mention claire du rôle staff à ping.
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
