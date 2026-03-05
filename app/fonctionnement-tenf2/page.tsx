"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const DISCORD_SHOP_URL = "https://discord.com/channels/535244857891880970/1278839967962894459";

type TabId =
  | "vision"
  | "parcours"
  | "entraide"
  | "animation"
  | "conseils"
  | "reglement"
  | "points"
  | "boutique"
  | "spotlight"
  | "glossaire"
  | "faq";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "vision", label: "Bienvenue & vision" },
  { id: "parcours", label: "Parcours membre" },
  { id: "entraide", label: "Entraide concrète" },
  { id: "animation", label: "Animation & événements" },
  { id: "conseils", label: "Conseils streaming" },
  { id: "reglement", label: "Règlement & sécurité" },
  { id: "points", label: "Système de points" },
  { id: "boutique", label: "Boutique des points" },
  { id: "spotlight", label: "Spotlight" },
  { id: "glossaire", label: "Glossaire" },
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
              TENF est un serveur d'entraide Twitch orienté progression réelle: meilleure régularité, meilleure qualité de live,
              et meilleure visibilité grâce à l'entraide du collectif.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>- Objectif: aider les créateurs à évoluer durablement.</li>
              <li>- Valeurs: respect, constance, entraide concrète, transparence.</li>
              <li>- Attendu: participer à la vie du serveur, pas seulement consommer des avantages.</li>
            </ul>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Pour qui ?</h3>
                <p className="text-gray-300">Créateurs Twitch souhaitant progresser et collaborer.</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Ce que tu gagnes</h3>
                <p className="text-gray-300">Feedback, visibilité, événements, accompagnement.</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Ce que tu apportes</h3>
                <p className="text-gray-300">Présence, soutien aux autres, respect du cadre.</p>
              </div>
            </div>
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
            <ul className="text-sm text-gray-400 space-y-1">
              <li>- Semaine 1: onboarding + découverte des salons.</li>
              <li>- Semaine 2-3: participation régulière (entraide concrète).</li>
              <li>- Semaine 4+: accès progressif à plus d'opportunités selon implication.</li>
            </ul>
            <div className="border border-gray-700 rounded-lg p-4 bg-[#111114] text-sm text-gray-300">
              <h3 className="font-semibold mb-2">Processus d'intégration (inspiré V1)</h3>
              <ul className="space-y-1">
                <li>- Présentation claire: qui tu es, ton univers, ton rythme.</li>
                <li>- Validation du cadre: règles, posture, respect de la modération.</li>
                <li>- Première phase d'observation: participation régulière et attitude collaborative.</li>
                <li>- Montée progressive: plus d'opportunités selon engagement réel.</li>
              </ul>
            </div>
          </SectionCard>
        )}

        {activeTab === "entraide" && (
          <SectionCard title="Entraide concrète">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-700 rounded-lg p-4 bg-[#111114]">
                <h3 className="font-semibold mb-2">Exemples d'entraide attendus</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Passer sur les lives des membres et interagir utilement.</li>
                  <li>- Donner un feedback constructif (fond + forme).</li>
                  <li>- Relayer les événements et raids quand possible.</li>
                  <li>- Aider sur les aspects techniques (OBS, overlays, etc.).</li>
                </ul>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 bg-[#111114]">
                <h3 className="font-semibold mb-2">Ce qui n'est pas de l'entraide</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Demander de l'aide sans jamais aider en retour.</li>
                  <li>- Faire du "copier-coller" de conseils sans contexte.</li>
                  <li>- Disparaître après une mise en avant.</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        )}

        {activeTab === "animation" && (
          <SectionCard title="Animation & événements">
            <p className="text-sm text-gray-300">
              TENF propose des formats réguliers pour dynamiser la communauté: événements serveur, sessions thématiques, spotlight, lives de soutien.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Comment participer</h3>
                <p className="text-gray-300">Surveille les annonces, inscris-toi, sois présent et ponctuel.</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Comment proposer</h3>
                <p className="text-gray-300">Propose une idée avec objectif, format, durée, et public visé.</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Bonnes pratiques</h3>
                <p className="text-gray-300">Clarté, respect des horaires, communication propre avant/après.</p>
              </div>
            </div>
          </SectionCard>
        )}

        {activeTab === "conseils" && (
          <SectionCard title="Conseils streaming (inspiré V1)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-gray-700 rounded-lg p-4 bg-[#111114]">
                <h3 className="font-semibold mb-2">Avant le live</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Prépare un mini plan (début, milieu, fin).</li>
                  <li>- Vérifie audio/cam/scènes.</li>
                  <li>- Annonce le live en amont sur Discord.</li>
                </ul>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 bg-[#111114]">
                <h3 className="font-semibold mb-2">Pendant le live</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Parle même quand le chat est calme.</li>
                  <li>- Pose des questions simples au chat.</li>
                  <li>- Rappelle ton objectif de session.</li>
                </ul>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 bg-[#111114]">
                <h3 className="font-semibold mb-2">Après le live</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Note ce qui a bien marché.</li>
                  <li>- Coupe un clip clé.</li>
                  <li>- Demande un feedback ciblé (1 point précis).</li>
                </ul>
              </div>
            </div>
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
            <p className="text-sm text-gray-400">
              Conseil: vise la régularité. Une activité stable vaut mieux qu'un pic ponctuel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Tu gagnes des points quand</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>- tu soutiens les lives des membres,</li>
                  <li>- tu participes aux events,</li>
                  <li>- tu contribues positivement sur Discord.</li>
                </ul>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Tu peux en perdre/être bloqué si</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>- abus manifeste,</li>
                  <li>- comportements contraires au cadre,</li>
                  <li>- tentatives de contournement.</li>
                </ul>
              </div>
            </div>
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
            <div className="border border-gray-700 rounded-lg p-4 bg-[#111114] text-sm text-gray-300">
              <h3 className="font-semibold mb-2">Exemple ticket (inspiré V1)</h3>
              <pre className="whitespace-pre-wrap text-xs text-gray-400">
Récompense achetée: [Nom]
Pseudo Twitch: [Ton pseudo]
Disponibilités: [Créneau]
Détails utiles: [Contexte / lien VOD]
              </pre>
            </div>
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
            <div className="border border-gray-700 rounded-lg p-3 bg-[#111114] text-sm text-gray-300">
              Format conseillé d'une heure: présentation, échanges, univers, interaction, clôture + raid.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Ce que le Spotlight n'est pas</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>- Ce n'est pas un examen.</li>
                  <li>- Ce n'est pas un concours de vues.</li>
                  <li>- Ce n'est pas un jugement de valeur du créateur.</li>
                </ul>
              </div>
              <div className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <h3 className="font-semibold mb-1">Ce qui aide vraiment</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>- arrivée du chat dans les premières minutes,</li>
                  <li>- interactions bienveillantes,</li>
                  <li>- raid de continuité en fin de session.</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        )}

        {activeTab === "glossaire" && (
          <SectionCard title="Glossaire">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <p><strong>Spotlight:</strong> mise en avant d'un créateur pendant un créneau dédié.</p>
              <p><strong>Raid:</strong> redirection d'une audience Twitch vers une autre chaîne.</p>
              <p><strong>Ticket:</strong> demande formelle sur Discord pour traiter un achat/sujet.</p>
              <p><strong>Cooldown:</strong> délai minimal avant de reprendre la même récompense.</p>
              <p><strong>Soutien TENF:</strong> membre staff dédié au soutien/coordination selon accès.</p>
              <p><strong>Modération:</strong> application du cadre, prévention des conflits, sécurité.</p>
            </div>
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
              <details className="border border-gray-700 rounded-lg p-3 bg-[#111114]">
                <summary className="cursor-pointer font-semibold">Je veux proposer une amélioration du serveur</summary>
                <p className="mt-2 text-gray-300">
                  Propose-la avec un format court: problème observé, solution, bénéfice attendu, effort estimé.
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
