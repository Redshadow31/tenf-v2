"use client";

import Link from "next/link";

export default function EvaluationsHubPage() {
  const sections = [
    {
      href: "/admin/evaluations/planification",
      title: "Planification",
      description: "Gérer la planification de l'intégration",
      icon: "📅",
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/admin/evaluations/inscription",
      title: "Inscription",
      description: "Gérer les inscriptions à l'intégration",
      icon: "📝",
      color: "from-green-500 to-green-600",
    },
    {
      href: "/admin/evaluations/inscription-moderateur",
      title: "Inscription modérateur",
      description: "Inscription du staff modération aux intégrations",
      icon: "🛡️",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      href: "/admin/evaluations/presence-retour",
      title: "Présence et retour",
      description: "Suivre les présences et les retours de follow",
      icon: "👥",
      color: "from-purple-500 to-purple-600",
    },
    {
      href: "/admin/evaluations/statistique",
      title: "Statistique",
      description: "Consulter les statistiques et résultats de l'intégration",
      icon: "📊",
      color: "from-amber-500 to-amber-600",
    },
    {
      href: "/admin/evaluations/presentation",
      title: "Présentation",
      description: "Gérer les présentations des intégrations",
      icon: "📄",
      color: "from-teal-500 to-teal-600",
    },
    {
      href: "/admin/evaluations/discours",
      title: "Discours",
      description: "Gérer les discours des intégrations",
      icon: "🎤",
      color: "from-rose-500 to-rose-600",
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Intégration</h1>
        <p className="text-gray-400">Gestion complète de l'intégration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20"
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${section.color} text-3xl`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#9146ff] transition-colors">
                  {section.title}
                </h2>
                <p className="text-gray-400 text-sm">{section.description}</p>
              </div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-[#9146ff] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
