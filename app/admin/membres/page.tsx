"use client";

import Link from "next/link";

export default function MembresHubPage() {
  const sections = [
    {
      href: "/admin/membres/gestion",
      title: "Gestion",
      description: "Liste complète et gestion des membres",
      icon: "⚙️",
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/admin/membres/erreurs",
      title: "Erreurs & incohérences",
      description: "Problèmes détectés automatiquement",
      icon: "🚨",
      color: "from-red-500 to-red-600",
    },
    {
      href: "/admin/membres/incomplets",
      title: "Comptes incomplets",
      description: "Membres avec configuration partielle",
      icon: "🧩",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      href: "/admin/membres/synchronisation",
      title: "Synchronisation",
      description: "État des sync Discord / Twitch",
      icon: "🔄",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Membres</h1>
        <p className="text-gray-400">Gestion complète des membres TENF</p>
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
