"use client";

import Link from "next/link";
import { useState } from "react";

type GuideTab = "scoring" | "ops";

function Pill({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs border"
      style={{ borderColor: "rgba(145,70,255,0.55)", backgroundColor: "rgba(145,70,255,0.14)" }}
    >
      {label}
    </span>
  );
}

function AxisCard(props: {
  icon: string;
  title: string;
  description: string;
  breakdownTitle: string;
  breakdown: string[];
  formula: string;
  why: string;
  example: string;
}) {
  return (
    <section
      className="rounded-2xl border p-5 md:p-6 space-y-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-28px_rgba(124,58,237,0.55)]"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{props.title}</h3>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {props.description}
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-xl border flex items-center justify-center text-lg"
          style={{ borderColor: "rgba(145,70,255,0.55)", backgroundColor: "rgba(145,70,255,0.14)" }}
          aria-hidden="true"
        >
          {props.icon}
        </div>
      </div>

      <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
          {props.breakdownTitle}
        </p>
        <ul className="space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {props.breakdown.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border p-3" style={{ borderColor: "rgba(145,70,255,0.55)", backgroundColor: "rgba(145,70,255,0.12)" }}>
          <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "#c4b5fd" }}>
            Formule
          </p>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Calcul:</span> {props.formula}
          </p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Pourquoi cet axe
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {props.why}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-3" style={{ borderColor: "rgba(79,70,229,0.55)", backgroundColor: "rgba(79,70,229,0.14)" }}>
        <p className="text-sm font-semibold mb-1">Exemple concret</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {props.example}
        </p>
      </div>
    </section>
  );
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </p>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function EvaluationV2GuidePage() {
  const [activeTab, setActiveTab] = useState<GuideTab>("scoring");

  return (
    <div className="min-h-screen text-white p-4 md:p-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header
          className="rounded-2xl border p-5 md:p-7"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(145deg, rgba(145,70,255,0.20) 0%, rgba(145,70,255,0.08) 35%, rgba(255,255,255,0) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link href="/admin/evaluation" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                ← Retour au pilotage évaluation
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">Guide v2 - Nouveau système</h1>
              <p className="text-sm md:text-base mt-2 max-w-4xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Référence officielle du nouveau modèle: note principale /20, bonus séparés /5, total /25. Cette page décrit le
                fonctionnement métier, les barèmes, et les règles de pilotage manuel.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/evaluation/v2?system=new"
                className="rounded-xl px-3 py-2 text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                Ouvrir Évaluation v2 (new)
              </Link>
              <Link
                href="/admin/evaluation/v2/pilotage?system=new"
                className="rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "#9146ff", color: "white" }}
              >
                Ouvrir Pilotage manuel v2 (new)
              </Link>
              <Link
                href="/admin/evaluation/v2/sources"
                className="rounded-xl px-3 py-2 text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                Ouvrir Données manquantes v2
              </Link>
            </div>
          </div>
        </header>

        <main className="rounded-2xl border p-4 md:p-5 space-y-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap gap-2 p-1 rounded-xl border w-fit" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            {[
              { id: "scoring", label: "Scoring v2 (new)" },
              { id: "ops", label: "Pilotage & qualité des données" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GuideTab)}
                className="px-4 py-2 rounded-lg text-sm border transition-all duration-200 hover:brightness-110"
                style={{
                  borderColor: activeTab === tab.id ? "#9146ff" : "var(--color-border)",
                  backgroundColor: activeTab === tab.id ? "#9146ff" : "var(--color-surface)",
                  color: activeTab === tab.id ? "white" : "var(--color-text)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "scoring" && (
            <div className="space-y-5">
              <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h2 className="text-lg font-semibold tracking-tight">Structure officielle des notes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                  <KpiCard title="Note principale" value="/20" subtitle="4 axes notés /5" />
                  <KpiCard title="Bonus séparés" value="/5" subtitle="Équité horaire + responsabilité staff" />
                  <KpiCard title="Total final" value="/25" subtitle="Base /20 + bonus /5 capés" />
                  <KpiCard title="Arrondi" value="2 déc." subtitle="Toutes les notes arrondies" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Pill label="Soutien visible /5" />
                  <Pill label="Engagement Discord /5" />
                  <Pill label="Soutien réseau /5" />
                  <Pill label="Fiabilité /5" />
                  <Pill label="Bonus /5 max" />
                </div>
              </section>

              <AxisCard
                icon="📣"
                title="Soutien visible (/5)"
                description="Présence visible dans la communauté à travers les actions publiques."
                breakdownTitle="Composantes et points"
                breakdown={[
                  "Raids utiles: /2",
                  "Spotlight: /2",
                  "Events communautaires: /1",
                  "Total axe = /5 (addition directe, sans re-normalisation).",
                ]}
                formula="Soutien visible = raids(/2) + spotlight(/2) + events(/1)"
                why="Cet axe regroupe les trois formes de soutien les plus visibles au sein de TENF."
                example="Exemple: raids 1.00/2, spotlight 1.25/2, events 0.50/1 => score final = 2.75/5."
              />

              <AxisCard
                icon="💬"
                title="Engagement Discord (/5)"
                description="Contribution sur Discord, en combinant écrit, vocal et utilité."
                breakdownTitle="Composantes et points"
                breakdown={[
                  "Écrit: score /5 via barème de messages.",
                  "Vocal: score /5 via barème de minutes vocales.",
                  "Participation utile: /5 (équilibre écrit/vocal + volume utile).",
                  "Total axe = moyenne des 3 composantes.",
                ]}
                formula="Engagement Discord = moyenne(écrit, vocal, participation utile)"
                why="L’objectif est d’évaluer une présence de qualité, pas seulement du volume brut."
                example="Exemple: écrit 3.00, vocal 2.00, utile 3.50 => score final = (3 + 2 + 3.5)/3 = 2.83."
              />

              <AxisCard
                icon="🕸️"
                title="Soutien réseau (/5)"
                description="Vision humaine du réseau TENF (au-delà du simple follow)."
                breakdownTitle="Composantes et points"
                breakdown={[
                  "Soutien follow simplifié: /5",
                  "Participation aux autres chaînes: /5",
                  "Conformité entraide globale: /5",
                  "Total axe = moyenne des 3 composantes.",
                ]}
                formula="Soutien réseau = moyenne(soutien follow, participation réseau, entraide globale)"
                why="Le terme Soutien réseau correspond mieux à la culture TENF que la seule logique 'follow'."
                example="Exemple: follow 3.00, participation 4.00, entraide 3.50 => score final = 3.50/5."
              />

              <AxisCard
                icon="🛡️"
                title="Fiabilité (/5)"
                description="Stabilité opérationnelle du membre dans la durée."
                breakdownTitle="Composantes et points"
                breakdown={[
                  "Régularité sur le mois: /5",
                  "Présence aux obligations: /5",
                  "Comportement: /5",
                  "Réactivité staff/infos importantes: /5",
                  "Absence d’abus: appliquée en pénalité si nécessaire.",
                ]}
                formula="Fiabilité = moyenne(composantes) - pénalité abus (puis bornage 0..5)"
                why="Cet axe corrige un angle mort: membres actifs ponctuellement mais instables ou peu fiables."
                example="Exemple: régularité 4.0, obligations 3.5, comportement 4.5, réactivité 4.0, pénalité 0.5 => score final ≈ 3.9."
              />

              <section className="rounded-2xl border p-5 md:p-6 space-y-4" style={{ borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,0.14)" }}>
                <h3 className="text-xl font-semibold tracking-tight">Bonus séparés (/5 max)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="font-medium">Équité horaire</p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      +1 ou +2 points selon la contrainte de fuseau horaire.
                    </p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    <p className="font-medium">Responsabilité staff/modération</p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      +0 à +3 points selon la responsabilité effective.
                    </p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="font-semibold">Total final:</span> note principale /20 + bonus /5 = score /25.
                </p>
              </section>
            </div>
          )}

          {activeTab === "ops" && (
            <div className="space-y-5 text-sm">
              <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,0.14)" }}>
                <h2 className="text-xl font-semibold tracking-tight">Pilotage manuel - nouveau système</h2>
                <p className="mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Le manuel écrase la note automatique champ par champ. Toute modification impose une raison explicite.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-4">
                  {[
                    "1. Choisir le mois",
                    "2. Vérifier auto vs besoin métier",
                    "3. Ajuster seulement les champs nécessaires",
                    "4. Saisir la raison obligatoire",
                    "5. Sauvegarder la ligne",
                  ].map((step) => (
                    <div key={step} className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                      {step}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-lg font-semibold">Architecture data et moteur</h3>
                <ul className="mt-3 space-y-2" style={{ color: "var(--color-text-secondary)" }}>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Preuves mensuelles:</strong> chaque action est stockée avec type, source, statut, valeur, metadata.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Synthèse mensuelle:</strong> points par axe, bonus, total, santé des sources, champs override.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Moteur central:</strong> un seul service calcule la note mensuelle (cohérence garantie).</span></li>
                </ul>
              </section>

              <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-lg font-semibold">Drapeaux d’alerte admin</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "donnee_manquante",
                    "follow_indisponible",
                    "mois_incomplet",
                    "override_manuel",
                    "membre_non_eligible",
                    "score_incoherent",
                  ].map((flag) => (
                    <Pill key={flag} label={flag} />
                  ))}
                </div>
                <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
                  Ces alertes servent à pointer immédiatement les dossiers à vérifier avant validation finale.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
