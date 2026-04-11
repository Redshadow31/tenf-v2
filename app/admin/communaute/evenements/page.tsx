import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, Megaphone, Users } from "lucide-react";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

const eventModules = [
  {
    href: "/admin/communaute/evenements/calendrier",
    label: "Calendrier",
    description: "Planifier les evenements, visualiser les dates et eviter les conflits de programmation.",
    owner: "Coordination planning",
    priority: "Critique",
    completion: 78,
    icon: CalendarCheck2,
  },
  {
    href: "/admin/communaute/evenements/participation",
    label: "Participation",
    description: "Suivre les taux de presence et identifier les formats qui performent le mieux.",
    owner: "Analyste communaute",
    priority: "Haute",
    completion: 64,
    icon: Users,
  },
  {
    href: "/admin/communaute/evenements/recap",
    label: "Recap",
    description: "Centraliser les bilans post-event, les decisions et les actions de suivi.",
    owner: "Lead animation",
    priority: "Haute",
    completion: 71,
    icon: CheckCircle2,
  },
  {
    href: "/admin/communaute/evenements/spotlight",
    label: "Spotlight",
    description: "Piloter les cycles spotlight: membres, evaluation, presence et recover.",
    owner: "Pole spotlight",
    priority: "Critique",
    completion: 59,
    icon: Megaphone,
  },
];

const quickActions = [
  { href: "/admin/communaute/evenements/suivi", label: "Suivi par type", tone: "amber" },
  { href: "/admin/communaute/evenements/liste", label: "Liste des evenements", tone: "indigo" },
  { href: "/admin/communaute/evenements/propositions", label: "Propositions", tone: "sky" },
  { href: "/admin/communaute/evenements/liens-vocaux", label: "Liens vocaux", tone: "cyan" },
  { href: "/admin/communaute/evenements/archives", label: "Archives", tone: "slate" },
  { href: "/admin/communaute/evenements/spotlight/gestion", label: "Gestion spotlight", tone: "fuchsia" },
  { href: "/admin/communaute/evenements/spotlight/presences", label: "Presences spotlight", tone: "emerald" },
  { href: "/admin/communaute/evenements/spotlight/analytics", label: "Analytics spotlight", tone: "amber" },
  { href: "/admin/communaute/evenements/spotlight/recover", label: "Recover spotlight", tone: "rose" },
];

const trackerRows = [
  { item: "Evenement hebdo valide", owner: "Coordination", urgency: "Moyenne", risk: "Faible", score: 88 },
  { item: "Spotlight sans recap J+1", owner: "Pole spotlight", urgency: "Haute", risk: "Moyen", score: 62 },
  { item: "Faible participation 2 semaines", owner: "Analyste", urgency: "Haute", risk: "Eleve", score: 47 },
  { item: "Propositions en attente > 7 jours", owner: "Animation", urgency: "Moyenne", risk: "Moyen", score: 55 },
];

function toneClass(tone: string): string {
  if (tone === "indigo") return "border-indigo-300/35 bg-indigo-300/10 text-indigo-100";
  if (tone === "sky") return "border-sky-300/35 bg-sky-300/10 text-sky-100";
  if (tone === "cyan") return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
  if (tone === "fuchsia") return "border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100";
  if (tone === "emerald") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  if (tone === "amber") return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (tone === "rose") return "border-rose-300/35 bg-rose-300/10 text-rose-100";
  return "border-slate-300/35 bg-slate-300/10 text-slate-100";
}

export default function CommunauteEvenementsPage() {
  const avgCompletion = Math.round(eventModules.reduce((acc, item) => acc + item.completion, 0) / eventModules.length);
  const totalAlerts = trackerRows.filter((row) => row.score < 60).length;

  const donutStyle = {
    background: `conic-gradient(
      rgba(56,189,248,0.95) 0 42%,
      rgba(52,211,153,0.95) 42% 74%,
      rgba(251,191,36,0.95) 74% 89%,
      rgba(244,63,94,0.9) 89% 100%
    )`,
  };

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Communaute - Evenements</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Hub de pilotage evenements
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page est le point d'entree operationnel pour planifier, executer et analyser les evenements communautaires.
              Elle permet d'identifier les priorites du jour et d'acceder rapidement a chaque module de suivi.
            </p>
          </div>
          <Link
            href="/admin/communaute/evenements/calendrier"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45"
          >
            Ouvrir calendrier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Modules actifs</p>
          <p className="mt-2 text-3xl font-semibold">{eventModules.length}</p>
          <p className="mt-1 text-xs text-slate-400">Calendrier, participation, recap, spotlight</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Suivi visuel</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{quickActions.length}</p>
          <p className="mt-1 text-xs text-slate-400">Outils de suivi et navigation rapide</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Couverture moyenne</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{avgCompletion}%</p>
          <p className="mt-1 text-xs text-slate-400">Niveau de maturite operationnelle</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Alertes prioritaires</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{totalAlerts}</p>
          <p className="mt-1 text-xs text-slate-400">Points qui demandent action immediate</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Suivi visuel des poles event</h2>
          <p className="mt-1 text-sm text-slate-400">Progression par module pour voir en un coup d'oeil les zones en retard.</p>
          <div className="mt-4 space-y-3">
            {eventModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="block rounded-xl border border-[#353a50] bg-[#121623]/80 p-4 transition hover:border-indigo-300/45 hover:bg-[#171d2f]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Icon className="h-4 w-4 text-indigo-200" />
                        {module.label}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{module.description}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                        Owner: {module.owner} - Priorite: {module.priority}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-cyan-200">{module.completion}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800/85">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]"
                      style={{ width: `${module.completion}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Repartition des enjeux</h2>
          <p className="mt-1 text-sm text-slate-400">Graphique camembert simplifie pour prioriser les efforts.</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 rounded-full p-3" style={donutStyle}>
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1020] text-xs font-semibold text-slate-100">
                Event Ops
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                Planification 42%
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Execution 32%
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Recap 15%
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-300" />
                Correctifs 11%
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-indigo-300/25 bg-indigo-400/10 p-3 text-xs text-indigo-100">
            Explication: utiliser ce bloc comme repere visuel pour equilibrer charge planning, execution live et actions
            post-evenement.
          </div>
        </article>
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Outil de suivi priorise</h2>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#353a50] text-left text-xs uppercase tracking-[0.08em] text-slate-400">
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">Owner</th>
                <th className="px-2 py-2">Urgence</th>
                <th className="px-2 py-2">Risque</th>
                <th className="px-2 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {trackerRows.map((row) => (
                <tr key={row.item} className="border-b border-white/5">
                  <td className="px-2 py-2 text-slate-200">{row.item}</td>
                  <td className="px-2 py-2 text-slate-300">{row.owner}</td>
                  <td className="px-2 py-2 text-slate-300">{row.urgency}</td>
                  <td className="px-2 py-2 text-slate-300">{row.risk}</td>
                  <td className="px-2 py-2">
                    <div className="inline-flex items-center gap-2">
                      <span className={`font-semibold ${row.score < 60 ? "text-rose-300" : "text-emerald-300"}`}>{row.score}</span>
                      <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Acces rapides evenements</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-xl border px-4 py-3 text-sm transition hover:brightness-110 ${toneClass(item.tone)}`}>
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-xs opacity-85">{item.href}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

