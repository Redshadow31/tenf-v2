"use client";

import Link from "next/link";
import { CalendarHeart, CalendarRange } from "lucide-react";

const birthdaySections = [
  {
    id: "month",
    title: "Anniversaires du mois",
    description: "Liste des anniversaires du mois en deux onglets: classique et affiliation Twitch.",
    icon: CalendarHeart,
    href: "/admin/events/anniversaires/mois",
    color: "from-pink-600 to-fuchsia-800",
  },
  {
    id: "all",
    title: "Tous les anniversaires",
    description: "Vue globale de tous les anniversaires et anniversaires d'affiliation.",
    icon: CalendarRange,
    href: "/admin/events/anniversaires/tous",
    color: "from-violet-600 to-indigo-800",
  },
];

export default function EventsAnniversairesHubPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/events" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au hub Événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Anniversaires (Vie communautaire)</h1>
        <p className="text-gray-400">
          Sous-groupe Anniversaires avec vue mensuelle et vue globale en deux onglets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {birthdaySections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20 group"
            >
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${section.color} text-3xl mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{section.title}</h2>
              <p className="text-gray-400 text-sm">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

