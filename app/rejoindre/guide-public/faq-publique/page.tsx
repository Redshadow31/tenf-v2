import Link from "next/link";
import { HelpCircle, Sparkles } from "lucide-react";
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

const publicFaq = [
  {
    question: "Faut-il payer pour creer un espace TENF ?",
    answer: "Non. L'acces de base et la creation de compte via Discord sont gratuits.",
  },
  {
    question: "Dois-je deja etre streamer pour rejoindre ?",
    answer:
      "Pas obligatoirement. Tu peux decouvrir la communaute avant, puis suivre les etapes d'integration quand tu es pret.",
  },
  {
    question: "Je n'ai pas de mot de passe TENF, c'est normal ?",
    answer:
      "Oui. Sur TENF, l'authentification passe principalement par Discord, donc pas de mot de passe classique a memoriser pour le compte public.",
  },
  {
    question: "Que faire si la connexion Discord echoue ?",
    answer:
      "Reessaye une fois, puis verifie que tu es bien connecte a Discord dans ton navigateur. Si l'erreur persiste, utilise la FAQ ou contacte le support staff.",
  },
  {
    question: "Combien de temps pour activer mon espace ?",
    answer:
      "L'espace est cree automatiquement des la premiere connexion validee. Dans certains cas, un rafraichissement de la page peut etre necessaire.",
  },
  {
    question: "Ou poser une question avant de rejoindre ?",
    answer:
      "Tu peux consulter la page FAQ rejoindre, puis passer par les canaux de contact TENF si besoin d'un accompagnement.",
  },
];

export default function GuidePublicFaqPubliquePage() {
  const accent = "#ec4899";
  const currentHref = "/rejoindre/guide-public/faq-publique";
  const currentIndex = getStepIndex(currentHref);
  const currentStep = guideSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideSteps[currentIndex - 1] : null;

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
          <div className="space-y-2">
            {publicFaq.map((item) => (
              <article key={item.question} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <h2 className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                  {item.question}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.answer}
                </p>
              </article>
            ))}
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
