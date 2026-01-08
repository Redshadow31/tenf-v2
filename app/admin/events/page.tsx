"use client";

import Link from "next/link";
import { Calendar, List, BarChart3, Settings } from "lucide-react";

const eventSections = [
  {
    id: "planification",
    title: "Planification",
    description: "Créer et gérer les événements du calendrier",
    icon: Calendar,
    href: "/admin/events/planification",
    color: "from-[#9146ff] to-[#5a32b4]",
  },
  {
    id: "liste",
    title: "Liste des événements",
    description: "Voir tous les événements et leurs inscriptions",
    icon: List,
    href: "/admin/events/liste",
    color: "from-blue-600 to-blue-800",
  },
  {
    id: "recap",
    title: "Récapitulatif",
    description: "Statistiques et récapitulatif des événements",
    icon: BarChart3,
    href: "/admin/events/recap",
    color: "from-green-600 to-green-800",
  },
];

export default function EventsHubPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Gestion des Événements
        </h1>
        <p className="text-gray-400">
          Gérez les événements de la communauté TENF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20 group"
            >
              <div className={`flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${section.color} text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {section.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
