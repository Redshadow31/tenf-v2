"use client";

import Link from "next/link";
import { ArrowUpRight, HelpCircle, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { getGuideMemberStepIndex, guideMemberSteps } from "../guideMeta";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type MemberFaqItem = {
  id: string;
  category: "Acces" | "Profil" | "Navigation" | "Support";
  question: string;
  answer: string;
  quickChecks: string[];
  benefit: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
};

const faqItems: MemberFaqItem[] = [
  {
    id: "faq-acces-dashboard",
    category: "Acces",
    question: "Je suis connecte mais je ne vois pas le dashboard membre.",
    answer:
      "Ce blocage vient souvent d'une session Discord non a jour ou d'une permission qui n'est pas encore rechargee.",
    quickChecks: [
      "Rafraichir la page une premiere fois.",
      "Verifier que tu es sur le bon compte Discord dans le navigateur.",
      "Te reconnecter puis revenir sur /member/dashboard.",
    ],
    benefit: "Tu recuperes rapidement l'acces sans passer par un support technique.",
    primaryAction: { label: "Ouvrir le dashboard", href: "/member/dashboard" },
    secondaryAction: { label: "Revenir au profil", href: "/member/profil" },
  },
  {
    id: "faq-profil-incomplet",
    category: "Profil",
    question: "Pourquoi mon profil est signale comme incomplet ?",
    answer:
      "Certaines informations sont obligatoires pour activer l'ensemble des fonctionnalites membre et fiabiliser ton suivi.",
    quickChecks: [
      "Completer pseudo, bio et liens prioritaires.",
      "Verifier les reseaux et infos de presentation.",
      "Relire la checklist de completion avant validation.",
    ],
    benefit: "Ton espace devient pleinement actif et plus lisible pour la communaute.",
    primaryAction: { label: "Completer mon profil", href: "/member/profil/completer" },
    secondaryAction: { label: "Modifier mon profil", href: "/member/profil/modifier" },
  },
  {
    id: "faq-modules-prio",
    category: "Navigation",
    question: "Par quel module commencer si je manque de temps ?",
    answer:
      "Utilise une logique simple: pilotage d'abord, execution ensuite, verification a la fin.",
    quickChecks: [
      "Commencer par Dashboard pour la priorite du jour.",
      "Passer sur Objectifs pour voir le restant du mois.",
      "Verifier Notifications pour ne rien oublier.",
    ],
    benefit: "Tu restes efficace meme avec peu de temps disponible.",
    primaryAction: { label: "Voir mes objectifs", href: "/member/objectifs" },
    secondaryAction: { label: "Ouvrir le dashboard", href: "/member/dashboard" },
  },
  {
    id: "faq-notifs",
    category: "Navigation",
    question: "Je ne recois pas certaines alertes, que faire ?",
    answer:
      "Le probleme vient souvent d'un reglage desactive cote compte ou navigateur.",
    quickChecks: [
      "Verifier les preferences dans la page Notifications.",
      "Verifier les permissions navigateur (notifications autorisees).",
      "Verifier les reglages Discord si besoin.",
    ],
    benefit: "Tu recuperes un suivi fiable et tu ne rates plus les rappels critiques.",
    primaryAction: { label: "Gerer les notifications", href: "/member/notifications" },
    secondaryAction: { label: "Ouvrir les parametres", href: "/member/parametres" },
  },
  {
    id: "faq-support",
    category: "Support",
    question: "Quand dois-je contacter le support TENF ?",
    answer:
      "Contacte le support quand les checks de base sont deja faits et que le blocage persiste.",
    quickChecks: [
      "Noter la page concernee et le moment du probleme.",
      "Decrire ce que tu as deja teste.",
      "Ajouter une capture claire si possible.",
    ],
    benefit: "Le support peut t'aider plus vite avec un contexte propre.",
    primaryAction: { label: "Ouvrir la FAQ generale", href: "/rejoindre/faq" },
    secondaryAction: { label: "Retour guide membre", href: "/rejoindre/guide-espace-membre" },
  },
];

const categories: Array<MemberFaqItem["category"]> = ["Acces", "Profil", "Navigation", "Support"];
const quickAccess = [
  { label: "Probleme d'acces dashboard", href: "#faq-acces-dashboard" },
  { label: "Profil incomplet", href: "#faq-profil-incomplet" },
  { label: "Alertes absentes", href: "#faq-notifs" },
];

export default function GuideMemberFaqPage() {
  const accent = "#ec4899";
  const currentHref = "/rejoindre/guide-espace-membre/faq-membre";
  const currentIndex = getGuideMemberStepIndex(currentHref);
  const currentStep = guideMemberSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideMemberSteps[currentIndex - 1] : null;
  const [query, setQuery] = useState("");

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter((item) => [item.question, item.answer, item.category].join(" ").toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 55%, var(--color-card)) 0%, var(--color-card) 70%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <HelpCircle size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            FAQ membre
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Reponses rapides pour debloquer les questions les plus frequentes dans l'espace membre.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Etape <span style={{ color: "var(--color-text)" }}>{currentIndex + 1}</span> / {guideMemberSteps.length} - Temps estime:{" "}
            <span style={{ color: "var(--color-text)" }}>{currentStep.readTime}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Resultat attendu: <span style={{ color: "var(--color-text)" }}>{currentStep.expectedResult}</span>
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto sm:min-w-[320px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans la FAQ membre..."
                aria-label="Rechercher dans la FAQ membre"
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
              />
            </div>
            {categories.map((category) => (
              <span key={category} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {category}
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Acces rapide aux cas les plus frequents
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAccess.map((item) => (
                <a key={item.href} href={item.href} className="rounded-full border px-3 py-1 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              <ShieldCheck size={14} style={{ color: "var(--color-primary)" }} />
              Methode de resolution en 3 niveaux
            </p>
            <div className="mt-2 grid gap-2">
              {[
                "Niveau 1: verifications rapides (session, refresh, compte actif).",
                "Niveau 2: verification des reglages (profil, notifications, permissions).",
                "Niveau 3: support avec contexte clair si le blocage persiste.",
              ].map((item) => (
                <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                  - {item}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {categories.map((category) => {
              const items = filteredFaq.filter((item) => item.category === category);
              if (items.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                    {category}
                  </h2>
                  <div className="mt-2 space-y-2">
                    {items.map((item) => (
                      <article id={item.id} key={item.id} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                        <h3 className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                          {item.question}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {item.answer}
                        </p>
                        <div className="mt-2 space-y-1">
                          {item.quickChecks.map((check) => (
                            <p key={check} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                              - {check}
                            </p>
                          ))}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {item.benefit}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={item.primaryAction.href} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                            {item.primaryAction.label} <ArrowUpRight size={12} />
                          </Link>
                          <Link href={item.secondaryAction.href} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                            {item.secondaryAction.label} <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
            {filteredFaq.length === 0 ? (
              <p className="rounded-lg border px-3 py-3 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                Aucune question ne correspond a ta recherche.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mt-1 flex flex-wrap gap-2">
            {prevStep ? (
              <Link href={prevStep.href} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Precedent: {prevStep.title}
              </Link>
            ) : null}
            <Link href="/rejoindre/guide-espace-membre" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Terminer et revenir a l'accueil du guide
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
