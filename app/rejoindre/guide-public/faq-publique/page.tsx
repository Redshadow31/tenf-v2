"use client";

import Link from "next/link";
import { HelpCircle, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { getStepIndex, guideSteps } from "../guideMeta";

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

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: "Compte" | "Connexion" | "Integration" | "Support";
  actionLabel: string;
  actionHref: string;
};

const faqItems: FaqItem[] = [
  {
    id: "faq-payer",
    category: "Compte",
    question: "Faut-il payer pour creer un espace TENF ?",
    answer:
      "Non. Sur le site et les Discord d'entraide TENF, tout est gratuit et benevole. Il existe des liens de dons et une boutique merch, mais il n'y a aucune obligation d'achat. Les dons/achats ne donnent aucune visibilite particuliere. Des options payantes sont peut-etre envisagees plus tard, mais ce n'est pas d'actualite et cela ne concerne pas ce qui existe deja aujourd'hui.",
    actionLabel: "Creer mon espace",
    actionHref: "/auth/login",
  },
  {
    id: "faq-streamer",
    category: "Integration",
    question: "Dois-je deja etre streamer pour rejoindre ?",
    answer:
      "Pas obligatoirement. Tu peux d'abord decouvrir la communaute, puis suivre les etapes d'integration quand tu es pret a t'impliquer.",
    actionLabel: "Voir l'integration",
    actionHref: "/integration",
  },
  {
    id: "faq-mot-de-passe",
    category: "Connexion",
    question: "Je n'ai pas de mot de passe TENF, c'est normal ?",
    answer:
      "Oui. TENF utilise principalement l'authentification Discord. Tu n'as donc pas de mot de passe TENF classique a memoriser.",
    actionLabel: "Ouvrir la connexion",
    actionHref: "/auth/login",
  },
  {
    id: "faq-connexion-discord",
    category: "Connexion",
    question: "Que faire si la connexion Discord echoue ?",
    answer:
      "Reessaye une fois, puis verifie que tu es connecte au bon compte Discord dans ton navigateur. Si l'erreur persiste, utilise la FAQ detaillee et contacte le support.",
    actionLabel: "Voir la FAQ detaillee",
    actionHref: "/rejoindre/faq",
  },
  {
    id: "faq-delai-activation",
    category: "Compte",
    question: "Combien de temps pour activer mon espace ?",
    answer:
      "L'espace est cree automatiquement des la premiere connexion validee. Dans certains cas, un simple rafraichissement de page suffit.",
    actionLabel: "Verifier mon compte",
    actionHref: "/member/profil",
  },
  {
    id: "faq-contact",
    category: "Support",
    question: "Ou poser une question avant de rejoindre ?",
    answer:
      "Consulte d'abord les guides et la FAQ detaillee. Si besoin, contacte le support TENF via les canaux d'aide.",
    actionLabel: "Contacter le support",
    actionHref: "/rejoindre/faq",
  },
];

const categories: Array<FaqItem["category"]> = ["Compte", "Connexion", "Integration", "Support"];
const topFaqIds = ["faq-payer", "faq-mot-de-passe", "faq-connexion-discord"];

export default function GuidePublicFaqPubliquePage() {
  const accent = "#ec4899";
  const currentHref = "/rejoindre/guide-public/faq-publique";
  const currentIndex = getStepIndex(currentHref);
  const currentStep = guideSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideSteps[currentIndex - 1] : null;
  const [query, setQuery] = useState("");

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter((item) =>
      [item.question, item.answer, item.category].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 55%, var(--color-card)) 0%, var(--color-card) 70%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.22) }} />
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: hexToRgba(accent, 0.45), color: "var(--color-text)" }}>
            <Sparkles size={14} /> Support
          </p>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <HelpCircle size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            FAQ publique
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Reponses aux questions les plus frequentes avant integration.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Etape <span style={{ color: "var(--color-text)" }}>{currentIndex + 1}</span> / {guideSteps.length} - Temps estime:{" "}
            <span style={{ color: "var(--color-text)" }}>{currentStep.readTime}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Resultat attendu: <span style={{ color: "var(--color-text)" }}>{currentStep.expectedResult}</span>
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto sm:min-w-[320px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans la FAQ..."
                aria-label="Rechercher dans la FAQ publique"
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
              Top 3 questions frequentes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topFaqIds.map((id) => {
                const item = faqItems.find((faq) => faq.id === id);
                if (!item) return null;
                return (
                  <a key={id} href={`#${id}`} className="rounded-full border px-3 py-1 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                    {item.question}
                  </a>
                );
              })}
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/rejoindre/faq"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Voir la FAQ detaillee
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Creer mon espace maintenant
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Bloque en 2 minutes ? Fais ce test rapide
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Verifier que tu es connecte au bon compte Discord.",
              "Reessayer la connexion depuis /auth/login.",
              "Consulter la FAQ detaillee si l'erreur reste presente.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/rejoindre/faq" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Ouvrir la FAQ detaillee
            </Link>
            <Link href="/auth/login" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Reessayer la connexion
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Cette page t'a aide ?
            </p>
            <div className="flex gap-2">
              <Link href="/auth/login" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Oui, je suis pret
              </Link>
              <Link href="/rejoindre/faq" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Non, je veux plus d'aide
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {prevStep ? (
              <Link href={prevStep.href} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Precedent: {prevStep.title}
              </Link>
            ) : null}
            <Link href="/rejoindre/guide-public" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Terminer et revenir a l'accueil du guide
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
