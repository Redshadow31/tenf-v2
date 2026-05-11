"use client";

import type { SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsDownUp, Copy, Layers, ListTree, Search } from "lucide-react";
import type { StaffApplicationAnswers } from "@/lib/staffApplicationsStorage";

type SectionDef = {
  id: string;
  title: string;
  description?: string;
  keys: (keyof StaffApplicationAnswers)[];
};

const SECTIONS: SectionDef[] = [
  {
    id: "identite",
    title: "Identité & matériel",
    description: "Qui est le candidat et sous quelles contraintes techniques.",
    keys: [
      "pseudo_discord",
      "pseudo_twitch",
      "age",
      "pays_fuseau",
      "micro_ok",
      "vocal_reunion",
      "role_postule",
    ],
  },
  {
    id: "motivations",
    title: "Motivations",
    description: "Pourquoi TENF, le rôle visé, et le texte de motivation.",
    keys: ["pourquoi_tenf", "pourquoi_role", "motivation_560"],
  },
  {
    id: "dispo",
    title: "Disponibilités & engagement",
    keys: ["disponibilites", "engagement_hebdo", "engagement_hebdo_variable"],
  },
  {
    id: "experience",
    title: "Expérience",
    keys: ["experience_modo", "experience_details", "experience_similaire"],
  },
  {
    id: "modo_comp",
    title: "Compétences modération (théorie)",
    keys: [
      "niveau_discord",
      "principes_proportionnalite",
      "principes_proportionnalite_explication",
      "difference_sanctions",
      "difference_sanctions_exemple",
      "redaction_cr",
    ],
  },
  {
    id: "scenarios",
    title: "Scénarios & cas pratiques",
    keys: [
      "scenario_critique_staff",
      "scenario_clash_vocal",
      "scenario_dm_grave",
      "scenario_spam_promo",
      "scenario_modo_sec",
      "scenario_manipulation",
      "scenario_intrusif_vocal",
    ],
  },
  {
    id: "communication",
    title: "Communication & posture",
    keys: [
      "style_communication",
      "style_communication_autre",
      "contradiction",
      "quand_jai_tort",
      "limites_declencheurs",
      "prise_de_recul",
    ],
  },
  {
    id: "stress",
    title: "Charge mentale, stress & cadre",
    keys: [
      "energie_mentale",
      "periode_impact",
      "periode_gestion",
      "reaction_stress",
      "reaction_stress_autre",
      "preference_cadre",
      "preference_cadre_detail",
    ],
  },
  {
    id: "equipe",
    title: "Travail d’équipe & limites",
    keys: [
      "passer_relais",
      "passer_relais_exemple",
      "desaccord_staff",
      "accepte_pause_retrait",
      "accepte_pause_retrait_pourquoi",
      "ami_demande_infos",
      "accepte_documenter",
    ],
  },
  {
    id: "poles",
    title: "Pôles TENF & objectif",
    keys: ["poles_interet", "objectif_apprentissage"],
  },
  {
    id: "consentements",
    title: "Consentements réglementaires",
    keys: ["consentement_traitement", "comprend_entretien", "accepte_confidentialite"],
  },
  {
    id: "libre",
    title: "Commentaire libre",
    keys: ["commentaire_libre"],
  },
];

/** Sommaire (titres courts pour navigation modale) */
export const CANDIDATE_FICHE_SECTION_NAV = SECTIONS.map((s) => ({ id: s.id, title: s.title }));

const LABELS: Partial<Record<keyof StaffApplicationAnswers, string>> = {
  pseudo_discord: "Pseudo Discord (formulaire)",
  pseudo_twitch: "Pseudo Twitch",
  age: "Âge",
  pays_fuseau: "Pays / fuseau",
  micro_ok: "Micro correct",
  vocal_reunion: "Participation vocale aux réunions",
  role_postule: "Rôle postulé",
  pourquoi_tenf: "Pourquoi TENF ?",
  pourquoi_role: "Pourquoi ce rôle ?",
  motivation_560: "Motivation (texte long)",
  disponibilites: "Disponibilités",
  engagement_hebdo: "Engagement hebdomadaire",
  engagement_hebdo_variable: "Précision engagement (variable)",
  experience_modo: "Expérience modération",
  experience_details: "Détails expérience modération",
  experience_similaire: "Expérience similaire (communauté, bénévolat…)",
  niveau_discord: "Niveau maîtrise Discord (1–5)",
  principes_proportionnalite: "Principes de proportionnalité (accord)",
  principes_proportionnalite_explication: "Explication proportionnalité",
  difference_sanctions: "Différencier les sanctions (accord)",
  difference_sanctions_exemple: "Exemple différenciation sanctions",
  redaction_cr: "Rédaction de comptes-rendus (OK)",
  scenario_critique_staff: "Scénario : critique du staff",
  scenario_clash_vocal: "Scénario : clash vocal",
  scenario_dm_grave: "Scénario : DM grave",
  scenario_spam_promo: "Scénario : spam / promo",
  scenario_modo_sec: "Scénario : modération seconde",
  scenario_manipulation: "Scénario : manipulation",
  scenario_intrusif_vocal: "Scénario : intrusif en vocal",
  style_communication: "Style de communication",
  style_communication_autre: "Précision style (autre)",
  contradiction: "Gestion de la contradiction",
  quand_jai_tort: "Quand j’ai tort",
  limites_declencheurs: "Limites & déclencheurs",
  prise_de_recul: "Prise de recul",
  energie_mentale: "Énergie mentale (1–5)",
  periode_impact: "Période d’impact personnel",
  periode_gestion: "Gestion de la période sensible",
  reaction_stress: "Réactions au stress",
  reaction_stress_autre: "Précision stress (autre)",
  preference_cadre: "Préférence cadre / humain",
  preference_cadre_detail: "Détail préférence cadre",
  passer_relais: "Passage de relais (accord)",
  passer_relais_exemple: "Exemple passage de relais",
  desaccord_staff: "Désaccord avec le staff",
  accepte_pause_retrait: "Accepte pause / retrait",
  accepte_pause_retrait_pourquoi: "Pourquoi pause / retrait",
  ami_demande_infos: "Si un ami demande des infos staff",
  accepte_documenter: "Accepte de documenter",
  poles_interet: "Pôles d’intérêt TENF",
  objectif_apprentissage: "Objectif d’apprentissage",
  consentement_traitement: "Consentement traitement des données",
  comprend_entretien: "Comprend la nature de l’entretien",
  accepte_confidentialite: "Accepte confidentialité staff",
  commentaire_libre: "Commentaire libre",
};

function formatEnumLabel(key: keyof StaffApplicationAnswers, value: string): string {
  const v = value.trim();
  if (key === "vocal_reunion") {
    const m: Record<string, string> = { oui: "Oui", non: "Non", parfois: "Parfois" };
    return m[v] || v;
  }
  if (key === "style_communication") {
    const m: Record<string, string> = {
      direct: "Direct",
      empathique: "Empathique",
      structure: "Structuré",
      mixte: "Mixte",
      autre: "Autre",
    };
    return m[v] || v;
  }
  if (key === "periode_impact") {
    const m: Record<string, string> = {
      non: "Non",
      oui_legere: "Oui, légère",
      oui_importante: "Oui, importante",
    };
    return m[v] || v;
  }
  if (key === "preference_cadre") {
    const m: Record<string, string> = { cadre: "Cadre", humain: "Humain", mix: "Mixte" };
    return m[v] || v;
  }
  if (key === "engagement_hebdo") {
    const m: Record<string, string> = { "2h": "2 h", "4h": "4 h", "6h": "6 h", variable: "Variable" };
    return m[v] || v;
  }
  if (key === "role_postule") {
    const m: Record<string, string> = {
      moderateur: "Modérateur",
      soutien: "Soutien TENF",
      les_deux: "Les deux",
    };
    return m[v] || v;
  }
  return v;
}

function formatUnknownValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((x) => formatUnknownValue(x)).join(", ");
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t || "—";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatAnswerValue(key: keyof StaffApplicationAnswers, value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    const stressLabels: Record<string, string> = {
      renfermer: "Se renfermer",
      enerver: "S’énerver",
      trop_parler: "Trop parler",
      controle: "Rester maître de soi",
      pleurer: "Pleurer / lâcher prise",
      autre: "Autre",
    };
    if (key === "reaction_stress") {
      return value.map((x) => stressLabels[String(x)] || String(x)).join(", ");
    }
    return value.map(String).join(", ");
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return "—";
    if (
      key === "vocal_reunion" ||
      key === "style_communication" ||
      key === "periode_impact" ||
      key === "preference_cadre" ||
      key === "engagement_hebdo" ||
      key === "role_postule"
    ) {
      return formatEnumLabel(key, t);
    }
    return t;
  }
  return String(value);
}

function rowMatchesQuery(label: string, valueStr: string, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  return label.toLowerCase().includes(n) || valueStr.toLowerCase().includes(n);
}

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";
const focusRingModalClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080f]";

function detailsElementFromToggleEvent(
  e: SyntheticEvent<HTMLDetailsElement>
): HTMLDetailsElement | null {
  if (e.currentTarget) return e.currentTarget;
  const t = e.target;
  if (t instanceof HTMLDetailsElement) return t;
  if (t instanceof Element) {
    const d = t.closest("details");
    return d instanceof HTMLDetailsElement ? d : null;
  }
  return null;
}

export default function CandidateAnswersFiche({
  answers,
  variant = "default",
}: {
  answers: StaffApplicationAnswers;
  variant?: "default" | "modal";
}) {
  const isModal = variant === "modal";
  const ringClass = isModal ? focusRingModalClass : focusRingClass;
  const [ficheSearch, setFicheSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const knownKeySet = useMemo(() => new Set(SECTIONS.flatMap((s) => s.keys)), []);
  const rawRecord = answers as unknown as Record<string, unknown>;
  const extraKeys = useMemo(() => {
    return Object.keys(rawRecord).filter((k) => !knownKeySet.has(k as keyof StaffApplicationAnswers));
  }, [answers, knownKeySet]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const s of SECTIONS) m[s.id] = true;
    return m;
  });

  useEffect(() => {
    const m: Record<string, boolean> = {};
    for (const s of SECTIONS) m[s.id] = true;
    if (extraKeys.length > 0) m.extra = true;
    setOpenMap(m);
  }, [answers, extraKeys.length]);

  function copyValue(key: string, text: string) {
    if (!text || text === "—") return;
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  function scrollToSection(sectionId: string) {
    setOpenMap((p) => ({ ...p, [sectionId]: true }));
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`postulation-fiche-${sectionId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function setAllDetailsOpen(open: boolean) {
    setOpenMap((prev) => {
      const next: Record<string, boolean> = {};
      for (const s of SECTIONS) next[s.id] = open;
      if (extraKeys.length > 0) next.extra = open;
      return next;
    });
  }

  return (
    <div className={isModal ? "space-y-5" : "space-y-4"}>
      {isModal ? (
        <div className="sticky top-0 z-20 -mx-1 space-y-3 border-b border-white/[0.08] bg-[#07080f]/95 pb-3 pt-1 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
              <Layers className="h-4 w-4" aria-hidden />
              Sommaire
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAllDetailsOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20 ${ringClass}`}
              >
                <ListTree className="h-3.5 w-3.5" aria-hidden />
                Tout ouvrir
              </button>
              <button
                type="button"
                onClick={() => setAllDetailsOpen(false)}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.08] ${ringClass}`}
              >
                <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden />
                Tout replier
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CANDIDATE_FICHE_SECTION_NAV.map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => scrollToSection(nav.id)}
                title={nav.title}
                className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-[11px] font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-white ${ringClass}`}
              >
                <span className="line-clamp-1 max-w-[10rem]">{nav.title}</span>
              </button>
            ))}
            {extraKeys.length > 0 ? (
              <button
                type="button"
                onClick={() => scrollToSection("extra")}
                className={`shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/20 ${ringClass}`}
              >
                + Extra ({extraKeys.length})
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={ficheSearch}
          onChange={(e) => setFicheSearch(e.target.value)}
          placeholder="Filtrer les champs de la fiche…"
          className={`w-full rounded-xl border border-white/12 bg-black/35 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 ${isModal ? "border-violet-500/20 bg-black/50 py-3" : ""} ${ringClass}`}
        />
      </div>
      <p className={`text-xs text-slate-500 ${isModal ? "text-sm leading-relaxed text-slate-400" : ""}`}>
        {isModal ? (
          <>
            Parcours interactif : replie les blocs pour te concentrer sur une partie, ou utilise le sommaire pour
            aller vite à une thématique. La recherche filtre à la fois les titres et les contenus.
          </>
        ) : (
          <>
            Toutes les réponses enregistrées sont listées ci-dessous (y compris les champs ajoutés dans des versions
            ultérieures du formulaire).
          </>
        )}
      </p>

      {SECTIONS.map((section) => {
        const rows = section.keys
          .map((key) => ({
            key,
            label: LABELS[key] || String(key),
            valueStr: formatAnswerValue(key, answers[key] as unknown),
          }))
          .filter((row) => rowMatchesQuery(row.label, row.valueStr, ficheSearch));

        if (rows.length === 0) return null;

        return (
          <details
            key={section.id}
            id={`postulation-fiche-${section.id}`}
            open={openMap[section.id] ?? true}
            onToggle={(e) => {
              const el = detailsElementFromToggleEvent(e);
              if (!el) return;
              const nextOpen = el.open;
              setOpenMap((p) => ({ ...p, [section.id]: nextOpen }));
            }}
            className={`group scroll-mt-28 rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 open:border-violet-500/25 ${
              isModal ? "shadow-lg shadow-black/30 open:shadow-violet-950/20" : ""
            }`}
          >
            <summary
              className={`flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-left [&::-webkit-details-marker]:hidden ${ringClass} rounded-2xl ${isModal ? "md:px-5 md:py-4" : ""}`}
            >
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-white ${isModal ? "text-base md:text-lg" : ""}`}>{section.title}</p>
                {section.description ? (
                  <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {rows.length} champ{rows.length > 1 ? "s" : ""}
              </span>
            </summary>
            <div className="border-t border-white/[0.06] px-3 pb-3 pt-1 md:px-4">
              <dl className="space-y-2">
                {rows.map(({ key, label, valueStr }) => {
                  const isLong = valueStr.length > 140;
                  const longCls = isLong
                    ? isModal
                      ? "max-h-72 overflow-y-auto pr-1 md:max-h-96"
                      : "max-h-40 overflow-y-auto pr-1"
                    : "";
                  return (
                    <div
                      key={String(key)}
                      className={`rounded-xl border border-white/[0.05] bg-black/25 px-3 py-2.5 transition hover:border-violet-500/25 ${
                        isModal ? "hover:bg-violet-950/10" : "hover:border-violet-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/90">{label}</dt>
                        <button
                          type="button"
                          onClick={() => copyValue(String(key), valueStr)}
                          className={`shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:border-violet-400/40 hover:text-white ${ringClass}`}
                          title="Copier la valeur"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <dd
                        className={`mt-1 text-sm leading-relaxed text-slate-200 ${isModal ? "md:text-[15px] md:leading-relaxed" : ""} ${longCls} whitespace-pre-wrap`}
                      >
                        {copiedKey === String(key) ? (
                          <span className="text-emerald-300/90">Copié dans le presse-papiers.</span>
                        ) : (
                          valueStr
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </details>
        );
      })}

      {extraKeys.length > 0 ? (
        <details
          id="postulation-fiche-extra"
          open={openMap.extra ?? true}
          onToggle={(e) => {
            const el = detailsElementFromToggleEvent(e);
            if (!el) return;
            const nextOpen = el.open;
            setOpenMap((p) => ({ ...p, extra: nextOpen }));
          }}
          className="group scroll-mt-28 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] open:border-amber-400/40"
        >
          <summary
            className={`flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-amber-100 [&::-webkit-details-marker]:hidden ${ringClass}`}
          >
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
            Champs supplémentaires (hors schéma courant) — {extraKeys.length}
          </summary>
          <div className="border-t border-amber-400/15 px-3 pb-3 pt-2">
            <dl className="space-y-2">
              {extraKeys
                .filter((k) => {
                  const v = formatUnknownValue(rawRecord[k]);
                  return rowMatchesQuery(k, v, ficheSearch);
                })
                .map((k) => {
                  const valueStr = formatUnknownValue(rawRecord[k]);
                  return (
                    <div key={k} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">{k}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{valueStr}</dd>
                    </div>
                  );
                })}
            </dl>
          </div>
        </details>
      ) : null}
    </div>
  );
}
