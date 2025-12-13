"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

interface StaffMember {
  slug: string;
  name: string;
  displayName: string;
}

const STAFF_MEMBERS: StaffMember[] = [
  { slug: "red", name: "Red", displayName: "Red" },
  { slug: "clara", name: "Clara", displayName: "Clara" },
  { slug: "nexou", name: "Nexou", displayName: "Nexou" },
  { slug: "tabs", name: "Tabs", displayName: "Tabs" },
  { slug: "nangel", name: "Nangel", displayName: "Nangel" },
  { slug: "jenny", name: "Jenny", displayName: "Jenny" },
  { slug: "selena", name: "Selena", displayName: "Selena" },
  { slug: "dark", name: "Dark", displayName: "Dark" },
  { slug: "yaya", name: "Yaya", displayName: "Yaya" },
  { slug: "rubby", name: "Rubby", displayName: "Rubby" },
  { slug: "livio", name: "Livio", displayName: "Livio" },
  { slug: "rebelle", name: "Rebelle", displayName: "Rebelle" },
  { slug: "sigurdson", name: "Sigurdson", displayName: "Sigurdson" },
  { slug: "nico", name: "Nico", displayName: "Nico" },
  { slug: "willy", name: "Willy", displayName: "Willy" },
  { slug: "b1nx", name: "B1nx", displayName: "B1nx" },
  { slug: "spydy", name: "Spydy", displayName: "Spydy" },
  { slug: "simon", name: "Simon", displayName: "Simon" },
  { slug: "zylkao", name: "Zylkao", displayName: "Zylkao" },
];

export default function FollowHubPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await getDiscordUser();
      if (user) {
        const access = hasAdminDashboardAccess(user.id);
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erreur vérification accès:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-white">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Suivi des Follow</h1>
        <p className="text-gray-400">
          Gestion et suivi des follows par membre du staff
        </p>
      </div>

      {/* Message fonctionnalité à venir */}
      <div className="bg-[#1a1a1d] border border-yellow-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🚧</span>
          <h2 className="text-xl font-semibold text-yellow-400">Fonctionnalité à venir</h2>
        </div>
        <p className="text-gray-400">
          Cette section est en cours de développement. L'architecture est en place et prête pour l'implémentation future du suivi automatique des follows.
        </p>
      </div>

      {/* Liste des membres du staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAFF_MEMBERS.map((member) => (
          <Link
            key={member.slug}
            href={`/admin/follow/${member.slug}`}
            className="group bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-all hover:shadow-lg hover:shadow-[#9146ff]/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#9146ff] to-[#5a32b4] text-white font-bold text-lg">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#9146ff] transition-colors">
                  Follow de {member.displayName}
                </h3>
                <p className="text-sm text-gray-400">
                  Suivi des follows
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-[#9146ff] transition-colors"
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
