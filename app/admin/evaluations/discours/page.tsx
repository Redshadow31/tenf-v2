"use client";

import Link from "next/link";

export default function DiscoursPage() {
  const parties = [
    {
      href: "/admin/evaluations/discours/partie-1",
      title: "Partie 1",
      description: "Bienvenue, Fondations, Staff",
      icon: "👋",
      slides: [1, 2, 3],
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/admin/evaluations/discours/partie-2",
      title: "Partie 2",
      description: "Rôles Adaptés, Spotlight, C'est aussi...",
      icon: "📋",
      slides: [6, 4, 5],
      color: "from-green-500 to-green-600",
    },
    {
      href: "/admin/evaluations/discours/partie-3",
      title: "Partie 3",
      description: "VIP Élite, Récompenses, Bien s'Intégrer",
      icon: "⭐",
      slides: [7, 11, 12],
      color: "from-purple-500 to-purple-600",
    },
    {
      href: "/admin/evaluations/discours/partie-4",
      title: "Partie 4",
      description: "Progresser, Invitation, Prochaines Étapes",
      icon: "🎯",
      slides: [15, 13, 16],
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/evaluations"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à l'intégration
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">🎤 Guide d&apos;Intégration - Discours</h1>
        <p className="text-gray-400">Guide complet pour les modérateurs - Réunion d&apos;Intégration</p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Twitch Entraide New Family</h2>
        <p className="text-gray-400 mb-2">Guide Modérateurs v2.0 (Réorganisé)</p>
        <div className="bg-[#9146ff]/10 border-l-4 border-[#9146ff] p-4 rounded-lg inline-block">
          <p className="text-gray-300">
            <strong className="text-[#9146ff]">💜 Durée totale :</strong> 45-60 minutes | <strong className="text-[#9146ff]">📊 12 sections</strong> | <strong className="text-[#9146ff]">🎯 Objectif :</strong> Accueillir et intégrer les nouveaux membres
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parties.map((partie) => (
          <Link
            key={partie.href}
            href={partie.href}
            className="group bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20"
          >
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${partie.color} text-3xl`}>
                {partie.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#9146ff] transition-colors">
                  {partie.title}
                </h2>
                <p className="text-gray-400 text-sm mb-3">{partie.description}</p>
                <p className="text-xs text-gray-500">
                  Slides : {partie.slides.join(", ")} ({partie.slides.length} sections)
                </p>
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
