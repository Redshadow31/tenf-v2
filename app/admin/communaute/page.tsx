import Link from "next/link";
import { Activity, ArrowRight, Bell, CalendarDays, Sparkles, Users } from "lucide-react";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

const pillars = [
  {
    href: "/admin/communaute/evenements",
    label: "Evenements",
    description: "Planning, participation, recap et spotlight pour animer la communaute.",
    owner: "Equipe event",
    coverage: 84,
    icon: CalendarDays,
  },
  {
    href: "/admin/communaute/engagement",
    label: "Engagement",
    description: "Suivi follow, raids, points Discord et qualite de traitement operationnel.",
    owner: "Equipe engagement",
    coverage: 76,
    icon: Activity,
  },
  {
    href: "/admin/communaute/anniversaires",
    label: "Anniversaires",
    description: "Animation relationnelle et valorisation des membres tout au long de l'annee.",
    owner: "Equipe communaute",
    coverage: 92,
    icon: Sparkles,
  },
];

const quickLinks = [
  { href: "/admin/communaute/evenements/calendrier", label: "Calendrier des evenements", tone: "indigo" },
  { href: "/admin/communaute/evenements/participation", label: "Suivi participation", tone: "cyan" },
  { href: "/admin/communaute/evenements/recap", label: "Recap & post-event", tone: "sky" },
  { href: "/admin/communaute/evenements/spotlight", label: "Spotlight operationnel", tone: "fuchsia" },
  { href: "/admin/communaute/engagement/follow", label: "Follow global", tone: "emerald" },
  { href: "/admin/communaute/engagement/signalements-raids", label: "Signalements raids", tone: "amber" },
  { href: "/admin/communaute/engagement/points-discord", label: "Points Discord raids", tone: "rose" },
  { href: "/admin/communaute/anniversaires/mois", label: "Anniversaires du mois", tone: "violet" },
];

const priorityAlerts = [
  {
    href: "/admin/communaute/engagement/signalements-raids",
    label: "Verifier les raids en fallback manuel non traites",
    impact: "Haut",
    tone: "border-rose-400/35 bg-rose-400/10 text-rose-100",
  },
  {
    href: "/admin/communaute/evenements/spotlight/presences",
    label: "Controler les presences des derniers spotlight",
    impact: "Moyen",
    tone: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  },
  {
    href: "/admin/communaute/engagement/follow",
    label: "Relancer les follows staff en retard de validation",
    impact: "Moyen",
    tone: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100",
  },
];

function toneClass(tone: string): string {
  if (tone === "indigo") return "border-indigo-300/35 bg-indigo-300/10 text-indigo-100";
  if (tone === "cyan") return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
  if (tone === "sky") return "border-sky-300/35 bg-sky-300/10 text-sky-100";
  if (tone === "fuchsia") return "border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100";
  if (tone === "emerald") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  if (tone === "amber") return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (tone === "rose") return "border-rose-300/35 bg-rose-300/10 text-rose-100";
  return "border-violet-300/35 bg-violet-300/10 text-violet-100";
}

export default function CommunauteDashboardPage() {
  const avgCoverage = Math.round(pillars.reduce((sum, item) => sum + item.coverage, 0) / pillars.length);
  const totalModules = quickLinks.length + pillars.length;

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Administration communaute</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre de pilotage communaute
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page sert de cockpit central pour piloter l'animation communautaire: evenements, engagement et relation
              membres. Elle donne une vision rapide de la sante operationnelle et les acces prioritaires pour agir vite.
            </p>
          </div>
          <Link
            href="/admin/communaute/evenements"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45"
          >
            Ouvrir pôle evenements
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Pôles pilotés</p>
          <p className="mt-2 text-3xl font-semibold">{pillars.length}</p>
          <p className="mt-1 text-xs text-slate-400">Evenements, engagement, anniversaires</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Modules accessibles</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{totalModules}</p>
          <p className="mt-1 text-xs text-slate-400">Parcours complet de gestion communaute</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Alertes prioritaires</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{priorityAlerts.length}</p>
          <p className="mt-1 text-xs text-slate-400">Actions a traiter en premier</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Couverture globale</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{avgCoverage}%</p>
          <p className="mt-1 text-xs text-slate-400">Sante operationnelle des 3 pôles</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Vue d'ensemble operationnelle</h2>
          <p className="mt-1 text-sm text-slate-400">Progression visuelle par pôle avec niveau de couverture estime.</p>
          <div className="mt-4 space-y-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Link
                  key={pillar.href}
                  href={pillar.href}
                  className="block rounded-xl border border-[#353a50] bg-[#121623]/80 p-4 transition hover:border-indigo-300/45 hover:bg-[#171d2f]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Icon className="h-4 w-4 text-indigo-200" />
                        {pillar.label}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{pillar.description}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-slate-500">Owner: {pillar.owner}</p>
                    </div>
                    <span className="text-sm font-semibold text-sky-200">{pillar.coverage}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800/85">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]"
                      style={{ width: `${pillar.coverage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Alertes critiques</h2>
          <p className="mt-1 text-sm text-slate-400">Points a verifier a chaque passage quotidien.</p>
          <div className="mt-4 space-y-2">
            {priorityAlerts.map((alert) => (
              <Link key={alert.href} href={alert.href} className={`block rounded-xl border px-3 py-2 text-sm transition hover:brightness-110 ${alert.tone}`}>
                <span className="font-medium">{alert.label}</span>
                <span className="mt-1 block text-xs opacity-90">Impact: {alert.impact}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-indigo-300/25 bg-indigo-400/10 p-3 text-xs text-indigo-100">
            <p className="font-medium">Mode d'emploi rapide</p>
            <p className="mt-1">
              Commencer par les alertes, puis ouvrir le pôle concerné pour traiter les actions et mettre a jour le suivi.
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Link
              key={pillar.href}
              href={pillar.href}
              className="group rounded-2xl border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.17),rgba(15,23,42,0.66))] p-5 transition hover:-translate-y-[2px] hover:border-indigo-200/45 hover:shadow-[0_16px_34px_rgba(67,56,202,0.35)]"
            >
              <div className="inline-flex rounded-xl border border-indigo-200/35 bg-indigo-500/18 p-2.5 text-indigo-100">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{pillar.label}</h3>
              <p className="mt-2 text-sm text-slate-300">{pillar.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-200 transition group-hover:translate-x-0.5">
                Ouvrir le pôle
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Parcours recommande de la page</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Etape 1</p>
            <p className="mt-1 font-medium">Traiter les alertes</p>
            <p className="mt-1 text-xs text-slate-400">Prioriser les risques avec impact haut.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Etape 2</p>
            <p className="mt-1 font-medium">Ouvrir le bon pôle</p>
            <p className="mt-1 text-xs text-slate-400">Evenements, engagement ou anniversaires.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Etape 3</p>
            <p className="mt-1 font-medium">Executer les actions</p>
            <p className="mt-1 text-xs text-slate-400">Validation, relance et correction des donnees.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Etape 4</p>
            <p className="mt-1 font-medium">Cloturer le cycle</p>
            <p className="mt-1 text-xs text-slate-400">Verifier la couverture et partager le recap staff.</p>
          </div>
        </div>
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Acces rapides communaute</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-xl border px-4 py-3 text-sm transition hover:brightness-110 ${toneClass(item.tone)}`}>
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-xs opacity-90">{item.href}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-cyan-100">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            <strong>Explication de la page:</strong> ce dashboard ne remplace pas les modules metier, il les orchestre. Utiliser cette
            vue pour orienter les priorites quotidiennes et garder une execution commune entre les equipes.
          </p>
        </div>
      </section>
    </div>
  );
}

