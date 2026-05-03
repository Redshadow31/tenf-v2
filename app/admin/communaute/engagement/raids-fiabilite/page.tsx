import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  Radio,
  ShieldAlert,
  Archive,
} from "lucide-react";

const BASE = "/admin/communaute/engagement";

const cards = [
  {
    href: `${BASE}/raids-eventsub`,
    title: "Raids — EventSub",
    body: "Connexion Twitch, sync des lives, volumes et erreurs de traitement. C’est le cœur technique du suivi.",
    icon: Radio,
    tone: "from-violet-500/20 to-transparent border-violet-500/30",
  },
  {
    href: `${BASE}/signalements-raids`,
    title: "File signalements",
    body: "Les membres déclarent un raid : vérifie qu’il n’existe pas déjà en auto, puis valide ou corrige la cible.",
    icon: ShieldAlert,
    tone: "from-amber-500/15 to-transparent border-amber-500/30",
  },
  {
    href: `${BASE}/historique-raids`,
    title: "Historique consolidé",
    body: "Vue mensuelle des raids manuels + EventSub, stats streamers et outils de nettoyage pour la fiabilité.",
    icon: Archive,
    tone: "from-emerald-500/15 to-transparent border-emerald-500/30",
  },
];

export default function RaidsFiabiliteLandingPage() {
  return (
    <div className="min-h-screen bg-[#07080f] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={BASE}
          className="inline-flex items-center gap-2 text-sm text-indigo-200/90 transition hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au hub engagement
        </Link>

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.16),rgba(14,15,23,0.94)_42%)] p-8 shadow-[0_24px_70px_rgba(2,6,23,0.55)]">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200/80">Espace staff — communauté TENF</p>
            <h1 className="mt-3 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
              <Activity className="h-10 w-10 text-violet-300" />
              Raids &amp; fiabilité
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              Un triptyque clair : <strong className="text-white">technique</strong> (EventSub),{" "}
              <strong className="text-white">humain</strong> (signalements membres) et{" "}
              <strong className="text-white">mémoire</strong> (historique). Choisis une entrée ci-dessous — la barre de navigation
              commune reste visible sur chaque sous-page.
            </p>
          </div>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`group flex flex-col rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(2,6,23,0.45)] ${c.tone}`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-violet-200">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-indigo-100">{c.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{c.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-200">
                  Ouvrir
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
