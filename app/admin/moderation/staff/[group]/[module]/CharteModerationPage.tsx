"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CharteSection = {
  id: number;
  emoji: string;
  title: string;
  intro?: string;
  bullets?: string[];
  warnings?: string[];
  steps?: string[];
  comparison?: Array<{ bad: string; good: string }>;
  note?: string;
};

const sections: CharteSection[] = [
  {
    id: 1,
    emoji: "🎯",
    title: "Principe fondamental",
    intro: "Un modérateur TENF ne réagit pas : il analyse.",
    warnings: [
      "Réaction émotionnelle = interdite",
      "Jugement personnel = interdit",
      "Interprétation = interdite",
    ],
    bullets: ["Seuls comptent les faits observables, les règles écrites et le contexte réel."],
  },
  {
    id: 2,
    emoji: "🧠",
    title: "Règle d'or : Faits > Ressenti",
    intro: "Avant toute action, le modérateur se pose 3 questions obligatoires :",
    steps: [
      "Qu'est-ce qui s'est réellement passé ?",
      "Quelle règle est concernée ?",
      "Est-ce que j'ai une preuve claire ?",
    ],
    note: "Si une réponse est floue : on n'agit pas seul.",
  },
  {
    id: 3,
    emoji: "🚫",
    title: "Interdictions absolues",
    bullets: [
      "Interpréter une intention",
      "Juger une personnalité",
      "Réagir sous le coup de l'émotion",
      "Prendre parti",
      "Sanctionner sans base claire",
      "Sur-réagir à une situation mineure",
    ],
  },
  {
    id: 4,
    emoji: "⚖️",
    title: "Méthode obligatoire de modération",
    steps: [
      "Observation : lire entièrement, vérifier le contexte, ne pas intervenir immédiatement.",
      "Identification : isoler le message problématique et la règle concernée.",
      "Vérification : distinguer fait et interprétation, confirmer la preuve.",
      "Action adaptée : rien / rappel calme / intervention modérée / remontée staff.",
    ],
  },
  {
    id: 5,
    emoji: "💬",
    title: "Communication encadrée",
    bullets: ["Ton neutre", "Factuel", "Clair", "Calme"],
    warnings: ["Sarcasme", "Agressivité", "Jugement", "Phrases accusatrices"],
    note: "Exemple : « Merci de rester dans le cadre des règles du serveur. »",
  },
  {
    id: 6,
    emoji: "🚨",
    title: "Gestion des conflits (procédure obligatoire)",
    steps: [
      "Stopper l'escalade",
      "Séparer les personnes si nécessaire",
      "Analyser les faits",
      "Ne jamais prendre parti",
      "Appliquer les règles uniquement",
    ],
    note: "Si doute : on remonte, on ne décide pas.",
  },
  {
    id: 7,
    emoji: "⚠️",
    title: "Cas où le modérateur ne doit pas agir seul",
    bullets: [
      "Conflit entre plusieurs streamers",
      "Situation émotionnelle forte",
      "Cas répété",
      "Comportement ambigu",
      "Problème impliquant un membre actif important",
    ],
    note: "Dans ces cas : signalement staff obligatoire.",
  },
  {
    id: 8,
    emoji: "🧩",
    title: "Différence essentielle",
    comparison: [
      { bad: "Je pense qu'il...", good: "Voici ce qui s'est passé..." },
      { bad: "Je ressens que...", good: "La règle X a été enfreinte" },
      { bad: "Il est problématique", good: "Ce message pose problème car..." },
      { bad: "Réaction rapide", good: "Analyse posée" },
    ],
  },
  {
    id: 9,
    emoji: "🔒",
    title: "Confidentialité stricte",
    warnings: [
      "Partager les discussions staff",
      "Parler des sanctions en public",
      "Exposer un membre",
    ],
  },
  {
    id: 10,
    emoji: "🧠",
    title: "Gestion des émotions du modérateur",
    intro: "Un modérateur énervé, frustré, fatigué ou impliqué personnellement ne doit pas intervenir.",
    bullets: ["Passer le relais", "Prévenir un autre modérateur"],
  },
  {
    id: 11,
    emoji: "📊",
    title: "Système de responsabilité",
    bullets: ["Chaque action doit être justifiable", "Expliquable", "Traçable"],
    note: "Question de contrôle : « Pourquoi as-tu fait ça ? »",
  },
  {
    id: 12,
    emoji: "🛠️",
    title: "Formation obligatoire",
    bullets: [
      "Suivre la formation TENF",
      "Faire les exercices mensuels",
      "Accepter les corrections",
    ],
    note: "Refuser d'apprendre = incompatible avec le rôle.",
  },
  {
    id: 13,
    emoji: "🚫",
    title: "Abus de pouvoir (tolérance zéro)",
    warnings: [
      "Sanction injustifiée",
      "Favoritisme",
      "Décision émotionnelle",
      "Utilisation du rôle pour dominer",
    ],
    note: "Peut entraîner un retrait immédiat.",
  },
  {
    id: 14,
    emoji: "📈",
    title: "Évaluation continue",
    bullets: [
      "Neutralité",
      "Capacité d'analyse",
      "Communication",
      "Gestion des situations",
    ],
  },
  {
    id: 15,
    emoji: "❤️",
    title: "ADN TENF",
    intro: "TENF n'est pas un serveur autoritaire. C'est un serveur humain, structuré et réfléchi.",
    bullets: ["La modération doit être intelligente", "Juste", "Cohérente"],
  },
  {
    id: 16,
    emoji: "✅",
    title: "Engagement obligatoire",
    intro: "En validant cette charte, le modérateur s'engage à :",
    bullets: [
      "Agir avec méthode",
      "Ne pas agir sous émotion",
      "Respecter les règles",
      "Accepter les retours",
      "Évoluer",
    ],
  },
];

const tabs = [
  { key: "fondamentaux", label: "Fondamentaux", sectionIds: [1, 2, 3, 4] },
  { key: "posture", label: "Posture & conflits", sectionIds: [5, 6, 7] },
  { key: "cadre", label: "Cadre professionnel", sectionIds: [8, 9, 10, 11] },
  { key: "qualite", label: "Qualité & progression", sectionIds: [12, 13, 14] },
  { key: "engagement", label: "ADN & engagement", sectionIds: [15, 16] },
];

export default function CharteModerationPage() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [validated, setValidated] = useState<Record<number, boolean>>({});
  const [globalEngagement, setGlobalEngagement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitInfo, setSubmitInfo] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const completedCount = useMemo(
    () => sections.filter((section) => validated[section.id]).length,
    [validated],
  );
  const allBlocksValidated = completedCount === sections.length;
  const canSubmit = allBlocksValidated && globalEngagement;
  const progress = Math.round((completedCount / sections.length) * 100);

  const activeSections = useMemo(() => {
    const ids = tabs[activeTabIndex]?.sectionIds ?? [];
    return sections.filter((section) => ids.includes(section.id));
  }, [activeTabIndex]);

  const toggleSection = (id: number) => {
    setValidated((prev) => ({ ...prev, [id]: !prev[id] }));
    setSubmitted(false);
    setSubmitError(null);
  };

  useEffect(() => {
    let cancelled = false;
    const loadViewerValidation = async () => {
      try {
        const response = await fetch("/api/admin/moderation/staff/charte-validations", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = await response.json();
        const viewerValidation = body?.viewerValidation;
        if (!viewerValidation || cancelled) return;
        setSubmitted(true);
        setSubmitInfo(
          `Déjà validée le ${new Date(viewerValidation.validatedAt).toLocaleString("fr-FR")} par ${viewerValidation.validatedByUsername}.`
        );
      } catch {
        // Ignore: la page reste utilisable même si le statut n'est pas lisible.
      }
    };
    void loadViewerValidation();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitValidation = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitInfo(null);
    try {
      const response = await fetch("/api/admin/moderation/staff/charte-validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charterVersion: "Charte v2",
          feedback,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Impossible de valider la charte.");
      }
      setSubmitted(true);
      const entry = body.entry;
      setSubmitInfo(
        `Validation enregistrée le ${new Date(entry.validatedAt).toLocaleString("fr-FR")} par ${entry.validatedByUsername}.`
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-3xl border border-indigo-300/20 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_rgba(2,6,23,0.95)_55%)] p-6 shadow-2xl shadow-indigo-950/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/80">
                Admin / Modération staff / Info
              </p>
              <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
                Charte de Modération TENF
              </h1>
              <p className="mt-2 text-sm text-slate-200/90 md:text-base">
                Version renforcée anti-émotionnelle : une méthode claire, des règles lisibles,
                une validation progressive.
              </p>
              <Link
                href="/admin/moderation/staff/info"
                className="mt-4 inline-flex rounded-lg border border-indigo-200/30 bg-indigo-950/30 px-3 py-2 text-sm text-indigo-100 transition hover:border-indigo-200/60 hover:bg-indigo-900/40"
              >
                ← Retour au groupe info
              </Link>
            </div>
            <div className="rounded-xl border border-indigo-200/20 bg-indigo-950/40 px-4 py-3 text-sm text-indigo-100">
              <p className="text-xs uppercase tracking-wide text-indigo-200/80">Mini règle</p>
              <p className="mt-1 font-semibold">Pas sûr = je n'agis pas seul.</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-100/90">
              <span>Progression de lecture et validation</span>
              <span>
                {completedCount}/{sections.length} blocs validés ({progress}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-indigo-950/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-3">
          <div className="grid gap-2 md:grid-cols-5">
            {tabs.map((tab, index) => {
              const isActive = index === activeTabIndex;
              const tabDone = tab.sectionIds.every((id) => validated[id]);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTabIndex(index)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border-indigo-300/60 bg-indigo-500/20 text-white"
                      : "border-slate-700/80 bg-slate-900 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <span className="block font-medium">{tab.label}</span>
                  <span className="text-xs text-slate-400">
                    {tabDone ? "Bloc validé" : "À compléter"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          {activeSections.map((section) => {
            const checked = Boolean(validated[section.id]);
            return (
              <article
                key={section.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Article {section.id}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      {section.emoji} {section.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      checked
                        ? "border-emerald-300/60 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {checked ? "Bloc validé" : "Valider ce bloc"}
                  </button>
                </div>

                {section.intro ? <p className="text-sm text-slate-200">{section.intro}</p> : null}

                {section.steps?.length ? (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-200">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.warnings?.length ? (
                  <div className="mt-3 rounded-xl border border-rose-400/35 bg-rose-950/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-rose-200/90">Interdits</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100">
                      {section.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {section.comparison?.length ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/80 text-slate-100">
                        <tr>
                          <th className="px-3 py-2 font-medium">Mauvaise modération</th>
                          <th className="px-3 py-2 font-medium">Bonne modération</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.comparison.map((row) => (
                          <tr key={row.bad} className="border-t border-slate-800 bg-slate-900/80">
                            <td className="px-3 py-2 text-rose-200">{row.bad}</td>
                            <td className="px-3 py-2 text-emerald-200">{row.good}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {section.note ? (
                  <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
                    {section.note}
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <button
            type="button"
            onClick={() => setActiveTabIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeTabIndex === 0}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Onglet précédent
          </button>
          <p className="text-sm text-slate-300">
            Onglet {activeTabIndex + 1} / {tabs.length}
          </p>
          <button
            type="button"
            onClick={() => setActiveTabIndex((prev) => Math.min(tabs.length - 1, prev + 1))}
            disabled={activeTabIndex === tabs.length - 1}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Onglet suivant →
          </button>
        </section>

        <section className="rounded-2xl border border-emerald-300/25 bg-emerald-950/20 p-5">
          <h3 className="text-lg font-semibold text-emerald-100">Validation finale de la charte</h3>
          <p className="mt-2 text-sm text-emerald-100/90">
            La validation finale s'active uniquement après validation de tous les blocs.
          </p>

          <label className="mt-4 flex items-start gap-3 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={globalEngagement}
              onChange={(event) => {
                setGlobalEngagement(event.target.checked);
                setSubmitted(false);
              }}
              disabled={!allBlocksValidated}
              className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-emerald-400 focus:ring-emerald-300/40 disabled:opacity-40"
            />
            <span>
              Je confirme que j'appliquerai cette charte avec neutralité, méthode et responsabilité.
            </span>
          </label>

          <button
            type="button"
            onClick={() => void submitValidation()}
            disabled={!canSubmit || submitting}
            className="mt-4 rounded-lg border border-emerald-300/45 bg-emerald-400/20 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Validation en cours..." : "Valider la charte complète"}
          </button>

          <label className="mt-4 block text-sm text-emerald-100/90">
            Retour optionnel pour les admins (visible dans le suivi des validations)
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={1200}
              className="mt-2 min-h-[92px] w-full rounded-lg border border-emerald-300/25 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-300/50"
              placeholder="Ex: points clairs / zones à préciser."
            />
          </label>

          {submitted && canSubmit ? (
            <p className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
              Charte validée. Merci pour ton engagement professionnel en modération TENF.
            </p>
          ) : null}
          {submitInfo ? (
            <p className="mt-3 rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
              {submitInfo}
            </p>
          ) : null}
          {submitError ? (
            <p className="mt-3 rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {submitError}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
