"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, CalendarRange, Gift, Sparkles, Stars, Users } from "lucide-react";

const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-6 shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] p-6 md:p-7 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";

const birthdaySections = [
  {
    id: "month",
    title: "Anniversaires du mois",
    description:
      "Vue mensuelle des anniversaires classiques et affiliations Twitch pour preparer les messages et animations.",
    icon: CalendarHeart,
    getHref: (isCommunity: boolean) =>
      isCommunity ? "/admin/communaute/anniversaires/mois" : "/admin/events/anniversaires/mois",
    color: "from-pink-600 to-fuchsia-800",
  },
  {
    id: "all",
    title: "Tous les anniversaires",
    description: "Historique global de la communaute pour retrouver les dates importantes et planifier a l avance.",
    icon: CalendarRange,
    getHref: (isCommunity: boolean) =>
      isCommunity ? "/admin/communaute/anniversaires/tous" : "/admin/events/anniversaires/tous",
    color: "from-violet-600 to-indigo-800",
  },
];

export default function EventsAnniversairesHubPage() {
  const pathname = usePathname() || "";
  const isCommunity = pathname.startsWith("/admin/communaute");
  const backHref = isCommunity ? "/admin/communaute/evenements" : "/admin/events";
  const modulesCount = birthdaySections.length;

  return (
    <div className="text-white space-y-6">
      <div className={glassCardClass}>
        <Link href={backHref} className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au hub Événements
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Animation communautaire</p>
            <h1 className="mt-2 text-4xl font-bold mb-2 bg-gradient-to-r from-white via-[#ffd6ef] to-[#c4b5fd] bg-clip-text text-transparent">
              Anniversaires & moments communautaires
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Cockpit de pilotage des anniversaires et affiliations Twitch: prépare les célébrations, sécurise les rappels et
              maintiens un rythme de reconnaissance régulier pour les membres.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-300/25 bg-[#101522]/70 px-4 py-3 text-sm text-indigo-100">
            Coordination messages · Highlights · Rituels communauté
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={sectionCardClass}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Modules actifs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{modulesCount}</p>
          <p className="mt-1 text-xs text-slate-400">Mensuel + historique global</p>
        </article>
        <article className={sectionCardClass}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Objectif</p>
          <p className="mt-2 text-sm text-white">
            Ne rater aucun moment important et maintenir une reconnaissance régulière.
          </p>
        </article>
        <article className={sectionCardClass}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Cadence</p>
          <p className="mt-2 text-sm text-white">
            Préparation mensuelle + suivi continu pour garder une animation naturelle et personnalisée.
          </p>
        </article>
        <article className={sectionCardClass}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Impact</p>
          <p className="mt-2 text-sm text-white">
            Renforce l&apos;engagement, la reconnaissance des membres et la mémoire collective de TENF.
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={sectionCardClass}>
          <h2 className="text-lg font-semibold text-slate-100">Explication de la page</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              1. Identifier les anniversaires du mois et planifier les messages en amont.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              2. Suivre les affiliations Twitch pour intégrer ces moments au planning communautaire.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              3. Capitaliser sur l'historique pour anticiper les prochaines actions d'animation.
            </p>
          </div>
        </article>
        <article className={sectionCardClass}>
          <h2 className="text-lg font-semibold text-slate-100">Repères opérationnels</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
              <Users className="mr-1 inline h-4 w-4" />
              Prioriser les membres actifs du mois.
            </p>
            <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-emerald-100">
              <Stars className="mr-1 inline h-4 w-4" />
              Préparer les templates de célébration à l'avance.
            </p>
          </div>
        </article>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {birthdaySections.map((section) => {
          const Icon = section.icon;
          const href = section.getHref(isCommunity);
          return (
            <Link
              key={section.id}
              href={href}
              className={`${sectionCardClass} transition-all hover:border-white/25 hover:-translate-y-[1px] group`}
            >
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${section.color} text-3xl mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{section.title}</h2>
              <p className="text-gray-400 text-sm">{section.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-gray-200">
                <Sparkles className="h-3.5 w-3.5" />
                Ouvrir le module
              </div>
            </Link>
          );
        })}
      </div>

      <section className={`${sectionCardClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-[#f9a8d4]" />
          <h3 className="text-lg font-semibold">Idées de moments communautaires</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-gray-300">
            Message personnalisé sur Discord + mise en avant du membre en story interne.
          </p>
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-gray-300">
            Rappel automatisé des affiliations Twitch à célébrer sur le mois courant.
          </p>
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-gray-300">
            Pack de templates “joyeux anniversaire” prêt à l’emploi pour le staff animation.
          </p>
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-gray-300">
            Point mensuel “moments forts” pour enrichir le récap événementiel.
          </p>
        </div>
      </section>
    </div>
  );
}

