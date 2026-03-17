"use client";

import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
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
  actionLabel: string;
  actionHref: string;
};

const faqItems: MemberFaqItem[] = [
  {
    id: "faq-acces-dashboard",
    category: "Acces",
    question: "Je suis connecte mais je ne vois pas le dashboard membre.",
    answer:
      "Commence par rafraichir la page et verifier ton compte Discord actif. Si le probleme continue, reconnecte-toi puis verifie tes permissions.",
    actionLabel: "Ouvrir le dashboard",
    actionHref: "/member/dashboard",
  },
  {
    id: "faq-profil-incomplet",
    category: "Profil",
    question: "Pourquoi mon profil est signale comme incomplet ?",
    answer:
      "Certains champs sont necessaires pour activer toutes les fonctions membre. Ouvre la page profil et complete les informations prioritaires.",
    actionLabel: "Completer mon profil",
    actionHref: "/member/profil/completer",
  },
  {
    id: "faq-modules-prio",
    category: "Navigation",
    question: "Par quel module commencer si je manque de temps ?",
    answer:
      "Priorise le dashboard, puis objectifs et notifications. Ce trio suffit pour garder une routine claire et rester actif.",
    actionLabel: "Voir mes objectifs",
    actionHref: "/member/objectifs",
  },
  {
    id: "faq-notifs",
    category: "Navigation",
    question: "Je ne recois pas certaines alertes, que faire ?",
    answer:
      "Verifie d'abord tes parametres de notifications, puis controle les permissions du navigateur et de Discord.",
    actionLabel: "Gerer les notifications",
    actionHref: "/member/notifications",
  },
  {
    id: "faq-support",
    category: "Support",
    question: "Quand dois-je contacter le support TENF ?",
    answer:
      "Si le blocage persiste apres verification des etapes du guide et de la FAQ, contacte le support avec une description claire du probleme.",
    actionLabel: "Ouvrir la FAQ generale",
    actionHref: "/rejoindre/faq",
  },
];

const categories: Array<MemberFaqItem["category"]> = ["Acces", "Profil", "Navigation", "Support"];

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
                      <article key={item.id} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                        <h3 className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                          {item.question}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {item.answer}
                        </p>
                        <Link href={item.actionHref} className="mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                          {item.actionLabel}
                        </Link>
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
