import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, HelpCircle, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { guideMemberSteps } from "./guideMeta";

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

const guidePages = [
  {
    title: "Premiere connexion",
    href: "/rejoindre/guide-espace-membre/premiere-connexion",
    description: "Verifier ses acces et finaliser son profil des l'arrivee dans l'espace membre.",
    icon: Sparkles,
    badge: "Demarrage",
    accent: "#06b6d4",
  },
  {
    title: "Tableau de bord",
    href: "/rejoindre/guide-espace-membre/tableau-de-bord",
    description: "Comprendre les blocs cles pour piloter son activite au quotidien.",
    icon: LayoutDashboard,
    badge: "Navigation",
    accent: "#8b5cf6",
  },
  {
    title: "Fonctionnalites principales",
    href: "/rejoindre/guide-espace-membre/fonctionnalites-principales",
    description: "Identifier les modules a utiliser selon ses objectifs membre.",
    icon: BookOpen,
    badge: "Utilisation",
    accent: "#f59e0b",
  },
  {
    title: "Parametres et securite",
    href: "/rejoindre/guide-espace-membre/parametres-securite",
    description: "Configurer son compte et appliquer les reflexes de securite.",
    icon: Settings,
    badge: "Protection",
    accent: "#ef4444",
  },
  {
    title: "FAQ membre",
    href: "/rejoindre/guide-espace-membre/faq-membre",
    description: "Resoudre rapidement les problemes d'acces, profil et permissions.",
    icon: HelpCircle,
    badge: "Support",
    accent: "#ec4899",
  },
];

const memberTabsDetails = [
  {
    title: "Dashboard",
    href: "/member/dashboard",
    youFind: "Priorites de la semaine, progression mensuelle, actions conseillees.",
    benefit: "Tu sais quoi faire tout de suite sans perdre du temps a chercher.",
  },
  {
    title: "Profil",
    href: "/member/profil",
    youFind: "Etat de ton profil, checklist de completion, liens de mise a jour.",
    benefit: "Un profil complet augmente ta clarte et ta visibilite dans la communaute.",
  },
  {
    title: "Activite",
    href: "/member/activite",
    youFind: "Historique de tes actions et participation recente.",
    benefit: "Tu peux suivre ta regularite et corriger rapidement les semaines creuses.",
  },
  {
    title: "Progression",
    href: "/member/progression",
    youFind: "Niveau global, progression par axes, jalons atteints.",
    benefit: "Tu visualises tes resultats concrets et tes prochains paliers.",
  },
  {
    title: "Raids",
    href: "/member/raids/historique",
    youFind: "Declarations, historique et statistiques de raids.",
    benefit: "Tu validates plus facilement tes objectifs mensuels d'entraide.",
  },
  {
    title: "Evenements",
    href: "/member/evenements",
    youFind: "Calendrier, inscriptions et suivi des presences.",
    benefit: "Tu restes actif dans la communaute et tu ameliore ta visibilite.",
  },
  {
    title: "Formations",
    href: "/member/formations",
    youFind: "Parcours, formations disponibles et formations validees.",
    benefit: "Tu progresses plus vite avec un plan d'apprentissage structure.",
  },
  {
    title: "Objectifs",
    href: "/member/objectifs",
    youFind: "Objectifs du mois et suivi de leur avancement.",
    benefit: "Tu gardes un cap clair et tu evites la dispersion.",
  },
  {
    title: "Engagement",
    href: "/member/engagement/score",
    youFind: "Score d'implication, details et recommandations.",
    benefit: "Tu identifies les actions qui ont le plus d'impact sur ta progression.",
  },
  {
    title: "Notifications",
    href: "/member/notifications",
    youFind: "Alertes utiles, rappels et informations importantes.",
    benefit: "Tu ne rates pas les etapes importantes ni les opportunites.",
  },
];

export default function GuideEspaceMembrePage() {
  const quickStart = [
    "Commence par Premiere connexion pour verifier ton compte et ton profil.",
    "Passe ensuite sur Tableau de bord pour identifier tes raccourcis quotidiens.",
    "Termine par Parametres et securite pour verrouiller ton espace membre.",
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10"
          style={{
            borderColor: "rgba(139, 92, 246, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, var(--color-card)) 0%, var(--color-card) 45%, color-mix(in srgb, #06b6d4 12%, var(--color-card)) 100%)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(139, 92, 246, 0.26)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(6, 182, 212, 0.2)" }}
          />
          <div className="relative">
            <p
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
            >
              <Sparkles size={14} /> Espace membre TENF
            </p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Guide Espace Membre
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              Le guide est structure en plusieurs pages pour t'aider a prendre en main ton espace membre, utiliser les
              bonnes fonctionnalites et rester autonome au quotidien.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/rejoindre/guide-espace-membre/premiere-connexion" className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                Commencer le guide <ArrowUpRight size={14} />
              </Link>
              <Link href="/member/dashboard" className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--color-text)" }}>
                Ouvrir mon dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Lecture", value: "5 pages" },
            { label: "Niveau", value: "Membre connecte" },
            { label: "Acces", value: "Espace membre" },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.value}
              </p>
            </article>
          ))}
        </div>

        <section
          className="mt-6 rounded-2xl border p-5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.2)" }}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            <Compass size={16} style={{ color: "var(--color-primary)" }} />
            Parcours recommande pour les nouveaux membres
          </p>
          <div className="mt-3 grid gap-2">
            {quickStart.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                {item}
              </p>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guidePages.map((page) => (
            <article
              key={page.href}
              className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderColor: hexToRgba(page.accent, 0.26),
                background:
                  `linear-gradient(160deg, color-mix(in srgb, var(--color-card) 90%, ${hexToRgba(page.accent, 0.25)}), var(--color-card))`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ borderColor: hexToRgba(page.accent, 0.45), color: hexToRgba(page.accent, 0.96) }}
                  >
                    {page.badge}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {page.title}
                  </h2>
                </div>
                <div
                  className="rounded-xl border p-2.5"
                  style={{
                    borderColor: hexToRgba(page.accent, 0.35),
                    backgroundColor: hexToRgba(page.accent, 0.15),
                  }}
                >
                  <page.icon size={18} style={{ color: hexToRgba(page.accent, 0.96) }} />
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {page.description}
              </p>
              <div className="mt-3 space-y-1 text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <p>
                  Temps estime:{" "}
                  <span style={{ color: "var(--color-text)" }}>
                    {guideMemberSteps.find((step) => step.href === page.href)?.readTime || "-"}
                  </span>
                </p>
                <p>
                  Resultat attendu:{" "}
                  <span style={{ color: "var(--color-text)" }}>
                    {guideMemberSteps.find((step) => step.href === page.href)?.expectedResult || "-"}
                  </span>
                </p>
              </div>
              <Link
                href={page.href}
                className="mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-[1px]"
                style={{ borderColor: hexToRgba(page.accent, 0.45), color: hexToRgba(page.accent, 0.96) }}
              >
                Ouvrir la page <ArrowUpRight size={14} />
              </Link>
            </article>
          ))}
        </div>

        <section
          className="mt-6 rounded-2xl border p-5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.2)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Ce que tu retrouves dans chaque onglet membre
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Pour chaque onglet, voici l'essentiel a retenir: ce que tu y trouves et l'avantage direct pour toi.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {memberTabsDetails.map((tab) => (
              <article key={tab.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {tab.title}
                  </p>
                  <Link href={tab.href} className="text-xs underline" style={{ color: "var(--color-primary)" }}>
                    Ouvrir
                  </Link>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Tu y retrouves:</strong> {tab.youFind}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {tab.benefit}
                </p>
              </article>
            ))}
          </div>
        </section>

        <Link href="/rejoindre" className="mt-8 inline-flex underline" style={{ color: "var(--color-primary)" }}>
          Retour a Rejoindre TENF
        </Link>
      </div>
    </main>
  );
}
