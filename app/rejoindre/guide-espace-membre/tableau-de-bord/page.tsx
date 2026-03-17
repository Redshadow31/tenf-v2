import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  UserCircle2,
  Zap,
} from "lucide-react";
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

const dashboardBlocks = [
  {
    title: "Activite recente",
    youFind: "Tes dernieres actions validees, ton historique recent et tes signaux d'implication.",
    benefit: "Tu controles rapidement ton rythme et tu peux corriger ce qui manque.",
    icon: Activity,
    accent: "#06b6d4",
    cta: "Voir mon activite",
    href: "/member/activite",
  },
  {
    title: "Progression",
    youFind: "Ton niveau actuel, tes paliers et ta progression sur le mois.",
    benefit: "Tu visualises clairement l'effort restant pour atteindre ton objectif.",
    icon: BarChart3,
    accent: "#8b5cf6",
    cta: "Voir ma progression",
    href: "/member/progression",
  },
  {
    title: "Notifications",
    youFind: "Alertes, rappels et informations importantes liees a ton activite.",
    benefit: "Tu rates moins d'opportunites et tu restes actif au bon moment.",
    icon: Bell,
    accent: "#ec4899",
    cta: "Voir mes notifications",
    href: "/member/notifications",
  },
  {
    title: "Objectifs en cours",
    youFind: "Tes objectifs actifs et leur avancement en un coup d'oeil.",
    benefit: "Tu priorises la bonne action sans hesiter.",
    icon: CheckSquare,
    accent: "#22c55e",
    cta: "Voir mes objectifs",
    href: "/member/objectifs",
  },
  {
    title: "Evenement conseille",
    youFind: "Le prochain evenement pertinent selon ta situation actuelle.",
    benefit: "Tu gagnes du temps et restes regulier dans ta presence communautaire.",
    icon: CalendarDays,
    accent: "#f59e0b",
    cta: "Voir les evenements",
    href: "/member/evenements",
  },
  {
    title: "Actions prioritaires",
    youFind: "Les 2 a 3 prochaines actions qui ont le plus d'impact.",
    benefit: "Tu avances plus vite avec moins d'effort inutile.",
    icon: Zap,
    accent: "#ef4444",
    cta: "Voir le dashboard",
    href: "/member/dashboard",
  },
];

const realMenuSections = [
  {
    section: "Mon profil",
    items: [
      { label: "Profil", href: "/member/profil" },
      { label: "Planning", href: "/member/planning" },
    ],
    benefit: "Tu gardes ton profil clair et ton organisation stable.",
  },
  {
    section: "Participation TENF",
    items: [
      { label: "Raids", href: "/member/raids/historique" },
      { label: "Evenements", href: "/member/evenements" },
      { label: "Engagement", href: "/member/engagement/score" },
    ],
    benefit: "Tu pilotes tes actions communautaires et ton impact du mois.",
  },
  {
    section: "Objectifs & activite",
    items: [{ label: "Suivi", href: "/member/activite" }],
    benefit: "Tu vois rapidement ce qui est valide et ce qu'il reste a faire.",
  },
  {
    section: "Academy & progression",
    items: [
      { label: "TENF Academy", href: "/member/academy" },
      { label: "Formations", href: "/member/formations" },
    ],
    benefit: "Tu progresses avec un cap de developpement concret.",
  },
  {
    section: "Evaluation",
    items: [{ label: "Evaluation", href: "/member/evaluations" }],
    benefit: "Tu suis ta montee en niveau et les retours utiles.",
  },
  {
    section: "Compte",
    items: [{ label: "Compte", href: "/member/parametres" }],
    benefit: "Tu gardes des reglages propres et une experience fiable.",
  },
];

const navigationDropdownItems = [
  {
    label: "Dashboard",
    href: "/member/dashboard",
    why: "Voir la priorite du moment des l'arrivee.",
    icon: LayoutDashboard,
    accent: "#8b5cf6",
  },
  {
    label: "Postuler moderateur / soutien TENF",
    href: "/member/academy/postuler",
    why: "Passer a une implication plus avancee dans la communaute.",
    icon: ShieldCheck,
    accent: "#f59e0b",
  },
  {
    label: "Planning TENF",
    href: "/member/planning",
    why: "Organiser ta semaine avec des actions realistes.",
    icon: Compass,
    accent: "#06b6d4",
  },
  {
    label: "Mes notifications",
    href: "/member/notifications",
    why: "Ne rater aucune alerte importante.",
    icon: Bell,
    accent: "#ec4899",
  },
  {
    label: "Twitch lie",
    href: "/member/profil",
    why: "Verifier rapidement le statut de liaison Twitch.",
    icon: UserCircle2,
    accent: "#22c55e",
  },
];

export default function GuideMemberTableauDeBordPage() {
  const accent = "#8b5cf6";
  const currentHref = "/rejoindre/guide-espace-membre/tableau-de-bord";
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
            <LayoutDashboard size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Tableau de bord
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Le dashboard est ton point de pilotage: il t'aide a prioriser les actions utiles chaque semaine.
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
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <Compass size={18} />
            Blocs a maitriser en priorite
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Lis ce bloc comme un centre de pilotage: chaque carte t'indique quoi regarder et quel bouton cliquer ensuite.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {dashboardBlocks.map((block) => (
              <article
                key={block.title}
                className="group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderColor: hexToRgba(block.accent, 0.35),
                  background: `linear-gradient(155deg, color-mix(in srgb, var(--color-bg) 92%, ${hexToRgba(block.accent, 0.2)}), var(--color-bg))`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {block.title}
                  </p>
                  <div
                    className="rounded-lg border p-2"
                    style={{
                      borderColor: hexToRgba(block.accent, 0.45),
                      backgroundColor: hexToRgba(block.accent, 0.16),
                    }}
                  >
                    <block.icon size={16} style={{ color: hexToRgba(block.accent, 0.98) }} />
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Tu y retrouves:</strong> {block.youFind}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {block.benefit}
                </p>
                <Link
                  href={block.href}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition group-hover:-translate-y-[1px]"
                  style={{ borderColor: hexToRgba(block.accent, 0.48), color: hexToRgba(block.accent, 0.98) }}
                >
                  {block.cta} <ArrowUpRight size={12} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Structure reelle du menu membre (comme dans ton interface)
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Cette section reprend les categories visibles dans le menu membre et explique ce que chaque bouton apporte concretement.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {realMenuSections.map((item) => (
              <article
                key={item.section}
                className="rounded-xl border p-4"
                style={{
                  borderColor: "rgba(139,92,246,0.35)",
                  background: "linear-gradient(150deg, color-mix(in srgb, var(--color-bg) 92%, rgba(139,92,246,0.18)), var(--color-bg))",
                }}
              >
                <p
                  className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ borderColor: "rgba(139,92,246,0.45)", color: "rgba(139,92,246,0.95)" }}
                >
                  {item.section}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {item.benefit}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.items.map((menuItem) => (
                    <Link
                      key={menuItem.href}
                      href={menuItem.href}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{ borderColor: "rgba(139,92,246,0.45)", color: "rgba(139,92,246,0.95)" }}
                    >
                      {menuItem.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Bloc "Espace membre" &gt; Navigation
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Dans ce bloc, chaque bouton mene a une action immediate. Utilise-le comme raccourci de pilotage quotidien.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {navigationDropdownItems.map((item) => (
              <article
                key={item.label}
                className="group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderColor: hexToRgba(item.accent, 0.38),
                  background: `linear-gradient(155deg, color-mix(in srgb, var(--color-bg) 90%, ${hexToRgba(item.accent, 0.2)}), var(--color-bg))`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>Pourquoi l'utiliser:</strong> {item.why}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border p-2"
                    style={{
                      borderColor: hexToRgba(item.accent, 0.42),
                      backgroundColor: hexToRgba(item.accent, 0.16),
                    }}
                  >
                    <item.icon size={16} style={{ color: hexToRgba(item.accent, 0.98) }} />
                  </div>
                </div>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition group-hover:-translate-y-[1px]"
                  style={{ borderColor: hexToRgba(item.accent, 0.48), color: hexToRgba(item.accent, 0.98) }}
                >
                  Ouvrir ce bouton <ArrowUpRight size={12} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Routine simple recommandee
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Verifier les notifications et prioriser les actions urgentes.",
              "Consulter ta progression pour garder un objectif clair.",
              "Mettre a jour ton activite quand tu termines une etape.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
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
