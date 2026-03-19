"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, CalendarRange, Gift, Sparkles } from "lucide-react";

const sectionCardClass =
  "rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(28,28,36,0.95),rgba(17,17,24,0.96))] p-6 shadow-[0_16px_34px_rgba(0,0,0,0.3)]";

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
  const pathname = usePathname();
  const isCommunity = pathname.startsWith("/admin/communaute");
  const backHref = isCommunity ? "/admin/communaute/evenements" : "/admin/events";

  return (
    <div className="text-white space-y-6">
      <div className={`${sectionCardClass} p-6 md:p-7`}>
        <Link href={backHref} className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au hub Événements
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-[#ffd6ef] to-[#c4b5fd] bg-clip-text text-transparent">
              Anniversaires & moments communautaires
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Pilote les moments clés de la communauté: anniversaires, affiliations Twitch et rappels de célébration.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
            Coordination messages · Highlights · Rituels communauté
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <article className={sectionCardClass}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Objectif</p>
          <p className="mt-2 text-sm text-white">
            Ne rater aucun moment important et maintenir un rythme de célébration communautaire régulier.
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

