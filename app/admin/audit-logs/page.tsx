"use client";

import Link from "next/link";
import { Activity, Globe2 } from "lucide-react";

const sections = [
  {
    title: "Logs de connexion",
    description: "Historique filtre des connexions, carte monde, tableau detaille et tendance horaire.",
    href: "/admin/audit-logs/connexions",
    icon: Globe2,
    color: "from-indigo-600 to-blue-800",
  },
  {
    title: "Temps reel",
    description: "Vue live des connexions actives avec regroupement par pays et indicateurs instantanes.",
    href: "/admin/audit-logs/temps-reel",
    icon: Activity,
    color: "from-emerald-600 to-teal-800",
  },
];

export default function AuditLogsHubPage() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/dashboard" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour au Dashboard
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Audit & Logs</h1>
        <p className="text-gray-400">Suivi des connexions membres et visiteurs en historique et en direct.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-lg border border-gray-700 bg-[#1a1a1d] p-6 transition-all hover:border-[#9146ff] hover:shadow-lg hover:shadow-[#9146ff]/20"
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${section.color} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">{section.title}</h2>
              <p className="text-sm text-gray-400">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
