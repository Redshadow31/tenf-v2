import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Shield, ShieldCheck } from "lucide-react";
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

const securityRules = [
  "Ne partage jamais ton compte Discord avec un tiers, meme temporairement.",
  "Deconnecte-toi apres utilisation sur un appareil public ou partage.",
  "Verifie regulierement ton profil, tes permissions et tes connexions actives.",
  "Active des alertes utiles pour ne pas rater une action critique.",
];

const settingsModules = [
  {
    title: "Compte et preferences",
    role: "Configuration de base",
    youFind: [
      "Informations personnelles et reglages generaux.",
      "Preferences de notification et de suivi.",
      "Parametres qui influencent ton experience quotidienne.",
    ],
    benefit: [
      "Tu adaptes ton espace a ton rythme reel.",
      "Tu reduis les oublis en recevant les bonnes alertes.",
    ],
    primaryAction: { label: "Ouvrir les parametres", href: "/member/parametres" },
    secondaryAction: { label: "Voir mes notifications", href: "/member/notifications" },
    accent: "#ef4444",
  },
  {
    title: "Profil public et coherence",
    role: "Image et lisibilite",
    youFind: [
      "Pseudo, bio, liens et coherence de presentation.",
      "Elements visibles pour les membres et la communaute.",
      "Points a mettre a jour quand ton activite evolue.",
    ],
    benefit: [
      "Ton profil devient plus clair et plus professionnel.",
      "Les autres membres comprennent vite ton univers et ton niveau.",
    ],
    primaryAction: { label: "Modifier mon profil", href: "/member/profil/modifier" },
    secondaryAction: { label: "Completer mon profil", href: "/member/profil/completer" },
    accent: "#f97316",
  },
  {
    title: "Controle securite",
    role: "Protection du compte",
    youFind: [
      "Bonnes pratiques de connexion et de deconnexion.",
      "Verification des acces sensibles.",
      "Reflexes pour eviter les pertes d'acces ou detournements.",
    ],
    benefit: [
      "Tu evites les incidents de compte les plus frequents.",
      "Tu gardes un acces stable et securise sur le long terme.",
    ],
    primaryAction: { label: "Verifier mon profil", href: "/member/profil" },
    secondaryAction: { label: "Voir la FAQ membre", href: "/rejoindre/guide-espace-membre/faq-membre" },
    accent: "#dc2626",
  },
];

const riskScenarios = [
  {
    risk: "Tu utilises un appareil partage",
    whatToDo: "Deconnexion manuelle immediate + verification session au prochain login.",
    benefit: "Tu limites le risque d'acces non autorise a ton espace membre.",
  },
  {
    risk: "Tu ne recois plus certaines alertes",
    whatToDo: "Verifier d'abord les parametres notifications puis les permissions navigateur/Discord.",
    benefit: "Tu recuperes un suivi fiable et tu ne rates plus les actions importantes.",
  },
  {
    risk: "Ton profil n'est plus a jour",
    whatToDo: "Mettre a jour bio, liens et informations de presentation des que ton activite change.",
    benefit: "Tu gardes une image cohere et plus utile pour la communaute.",
  },
];

const securityChecklist = [
  "Profil verifie et informations essentielles a jour.",
  "Notifications utiles activees.",
  "Habitude de deconnexion sur appareils externes.",
  "Verification reguliere des acces et permissions.",
];

export default function GuideMemberParametresSecuritePage() {
  const accent = "#ef4444";
  const currentHref = "/rejoindre/guide-espace-membre/parametres-securite";
  const currentIndex = getGuideMemberStepIndex(currentHref);
  const currentStep = guideMemberSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideMemberSteps[currentIndex - 1] : null;
  const nextStep = currentIndex >= 0 && currentIndex < guideMemberSteps.length - 1 ? guideMemberSteps[currentIndex + 1] : null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 50%, var(--color-card)) 0%, var(--color-card) 70%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <ShieldCheck size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Parametres et securite
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Une configuration propre reduit les erreurs courantes et protege ton espace membre au quotidien.
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
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Reglages conseilles (version detaillee)
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Chaque bloc ci-dessous t'explique ce que tu retrouves dans la section et ce que cela t'apporte concretement.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {settingsModules.map((module) => (
              <article
                key={module.title}
                className="rounded-lg border p-4"
                style={{
                  borderColor: hexToRgba(module.accent, 0.35),
                  background: `linear-gradient(160deg, color-mix(in srgb, var(--color-bg) 92%, ${hexToRgba(module.accent, 0.18)}), var(--color-bg))`,
                }}
              >
                <p
                  className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ borderColor: hexToRgba(module.accent, 0.45), color: hexToRgba(module.accent, 0.95) }}
                >
                  {module.role}
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {module.title}
                </p>
                <div className="mt-2 space-y-1">
                  {module.youFind.map((item) => (
                    <p key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>Tu y retrouves:</strong> {item}
                    </p>
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {module.benefit.map((item) => (
                    <p key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {item}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={module.primaryAction.href}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: module.accent }}
                  >
                    {module.primaryAction.label} <ArrowUpRight size={12} />
                  </Link>
                  <Link
                    href={module.secondaryAction.href}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: hexToRgba(module.accent, 0.45), color: hexToRgba(module.accent, 0.95) }}
                  >
                    {module.secondaryAction.label} <ArrowUpRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <Shield size={18} />
            Bonnes pratiques de securite
          </h2>
          <div className="mt-3 grid gap-2">
            {securityRules.map((rule) => (
              <p key={rule} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {rule}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Scenarios a risque et reaction conseillee
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {riskScenarios.map((scenario) => (
              <article key={scenario.risk} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {scenario.risk}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Action:</strong> {scenario.whatToDo}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Pourquoi c'est utile:</strong> {scenario.benefit}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <CheckCircle2 size={18} />
            Checklist rapide avant de quitter cette page
          </h2>
          <div className="mt-3 grid gap-2">
            {securityChecklist.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/member/parametres" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Je verifie mes parametres maintenant
            </Link>
            <Link href="/member/profil/modifier" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Je mets mon profil a jour
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mt-1 flex flex-wrap gap-2">
            {prevStep ? (
              <Link href={prevStep.href} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Precedent: {prevStep.title}
              </Link>
            ) : null}
            {nextStep ? (
              <Link href={nextStep.href} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                Suivant: {nextStep.title}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
