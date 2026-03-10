"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck, FileSearch, Star } from "lucide-react";

const spotlightSections = [
  {
    id: "evaluer",
    title: "Évaluer le streamer",
    description: "Notation qualitative des spotlights et saisie des commentaires modérateur.",
    icon: ClipboardCheck,
    href: "/admin/spotlight/evaluation",
    color: "from-[#9146ff] to-[#5a32b4]",
  },
  {
    id: "consulter",
    title: "Consulter les évaluations",
    description: "Recherche par streamer et historique des évaluations Spotlight.",
    icon: FileSearch,
    href: "/admin/spotlight/membres",
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "presences",
    title: "Présences validées Spotlight",
    description: "Données issues de la validation des présences pour les événements catégorie Spotlight.",
    icon: Star,
    href: "/admin/events/spotlight/presences",
    color: "from-fuchsia-600 to-purple-700",
  },
  {
    id: "analytics",
    title: "Analyse Spotlight (mois / tout)",
    description: "Analyse avancée des spotlights, tendances mensuelles et participation.",
    icon: BarChart3,
    href: "/admin/events/spotlight/analytics",
    color: "from-emerald-600 to-teal-700",
  },
];

export default function EventsSpotlightHubPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/events" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au hub Événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Spotlight (Vie communautaire)</h1>
        <p className="text-gray-400">
          Sous-groupe Spotlight intégré aux événements : évaluation, consultation et analytics ciblés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spotlightSections.map((section) => {
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
              <h2 className="text-xl font-semibold text-white mb-2">{section.title}</h2>
              <p className="text-gray-400 text-sm">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
