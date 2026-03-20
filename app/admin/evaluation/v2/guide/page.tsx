"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, ClipboardCheck, ShieldCheck } from "lucide-react";

type GuideTab = "scoring" | "ops";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-indigo-300/35 bg-indigo-500/15 px-2.5 py-1 text-xs text-indigo-100">
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
    <section className={`${sectionCardClass} space-y-4 p-5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/45`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{props.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            {props.description}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-300/35 bg-indigo-500/15 text-lg" aria-hidden="true">
          {props.icon}
        </div>
      </div>

      <div className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {props.breakdownTitle}
        </p>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {props.breakdown.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-indigo-300/40 bg-indigo-500/15 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
            Formule
          </p>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Calcul:</span> {props.formula}
          </p>
        </div>
        <div className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pourquoi cet axe
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            {props.why}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
        <p className="text-sm font-semibold mb-1">Exemple concret</p>
        <p className="text-sm leading-relaxed text-slate-200">
          {props.example}
        </p>
      </div>
    </section>
  );
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

export default function EvaluationV2GuidePage() {
  const [activeTab, setActiveTab] = useState<GuideTab>("scoring");

  return (
    <div className="space-y-6 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`${glassCardClass} p-5 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link href="/admin/evaluation" className="text-sm text-slate-300 hover:text-indigo-100">
                ← Retour au pilotage évaluation
              </Link>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-indigo-200/90">Référentiel scoring v2</p>
              <h1 className="mt-1 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                Guide v2 - Nouveau système
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300 md:text-base">
                Référence officielle du nouveau modèle: note principale /20, bonus séparés /5, total /25. Cette page décrit le
                fonctionnement métier, les barèmes, et les règles de pilotage manuel.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/admin/evaluation/v2?system=new" className={subtleButtonClass}>
                Ouvrir Évaluation v2 (new)
              </Link>
              <Link href="/admin/evaluation/v2/pilotage?system=new" className={subtleButtonClass}>
                Ouvrir Pilotage manuel v2 (new)
              </Link>
              <Link href="/admin/evaluation/v2/sources" className={subtleButtonClass}>
                Ouvrir Données manquantes v2
              </Link>
            </div>
          </div>
        </header>

        <section className={`${sectionCardClass} p-4 md:p-5`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-indigo-300/30 bg-indigo-500/12 p-3">
              <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-indigo-100">
                <BookOpen className="h-4 w-4" />
                Rôle du guide
              </p>
              <p className="text-sm text-slate-300">Donner une lecture unique des règles de scoring pour éviter les divergences d'interprétation.</p>
            </article>
            <article className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
              <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <ClipboardCheck className="h-4 w-4" />
                Utilisation
              </p>
              <p className="text-sm text-slate-300">À consulter avant tout override manuel, audit des données et validation finale du mois.</p>
            </article>
            <article className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
              <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                Règle d'or
              </p>
              <p className="text-sm text-slate-300">Toute modification manuelle doit rester justifiée et traçable pour sécuriser la clôture mensuelle.</p>
            </article>
          </div>
        </section>

        <main className={`${sectionCardClass} space-y-5 p-4 md:p-5`}>
          <div className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-1">
            {[
              { id: "scoring", label: "Scoring v2 (new)" },
              { id: "ops", label: "Pilotage & qualité des données" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GuideTab)}
                className={`rounded-lg border px-4 py-2 text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-indigo-200/55 bg-indigo-500/45 text-white"
                    : "border-[#3a3f56] bg-[#101524]/70 text-slate-200 hover:border-indigo-300/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "scoring" && (
            <div className="space-y-5">
              <section className={`${sectionCardClass} p-5 md:p-6`}>
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

              <section className="space-y-4 rounded-2xl border border-indigo-300/35 bg-indigo-500/14 p-5 md:p-6">
                <h3 className="text-xl font-semibold tracking-tight">Bonus séparés (/5 max)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
                    <p className="font-medium">Équité horaire</p>
                    <p className="mt-1 text-sm text-slate-300">
                      +1 ou +2 points selon la contrainte de fuseau horaire.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
                    <p className="font-medium">Responsabilité staff/modération</p>
                    <p className="mt-1 text-sm text-slate-300">
                      +0 à +3 points selon la responsabilité effective.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold">Total final:</span> note principale /20 + bonus /5 = score /25.
                </p>
              </section>
            </div>
          )}

          {activeTab === "ops" && (
            <div className="space-y-5 text-sm">
              <section className="rounded-2xl border border-indigo-300/35 bg-indigo-500/14 p-5 md:p-6">
                <h2 className="text-xl font-semibold tracking-tight">Pilotage manuel - nouveau système</h2>
                <p className="mt-1 leading-relaxed text-slate-300">
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
                    <div key={step} className="rounded-xl border border-[#3a3f56] bg-[#13182a]/75 p-3">
                      {step}
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${sectionCardClass} p-5 md:p-6`}>
                <h3 className="text-lg font-semibold">Architecture data et moteur</h3>
                <ul className="mt-3 space-y-2 text-slate-300">
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Preuves mensuelles:</strong> chaque action est stockée avec type, source, statut, valeur, metadata.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Synthèse mensuelle:</strong> points par axe, bonus, total, santé des sources, champs override.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Moteur central:</strong> un seul service calcule la note mensuelle (cohérence garantie).</span></li>
                </ul>
              </section>

              <section className={`${sectionCardClass} p-5 md:p-6`}>
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
                <p className="mt-3 text-sm text-slate-300">
                  Ces alertes servent à pointer immédiatement les dossiers à vérifier avant validation finale.
                </p>
              </section>

              <section className={`${sectionCardClass} p-5 md:p-6`}>
                <h3 className="text-lg font-semibold">Plan d'action recommandé</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-rose-300/35 bg-rose-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-rose-200">Priorité 1</p>
                    <p className="mt-1 text-sm text-slate-200">Corriger les dossiers avec drapeaux critiques ou données manquantes.</p>
                  </div>
                  <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-amber-200">Priorité 2</p>
                    <p className="mt-1 text-sm text-slate-200">Auditer les overrides manuels avec justification explicite.</p>
                  </div>
                  <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">Priorité 3</p>
                    <p className="mt-1 text-sm text-slate-200">Valider la synthèse puis verrouiller la période.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/admin/evaluation/v2/pilotage?system=new" className={subtleButtonClass}>
                    Ouvrir le pilotage opérationnel
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
