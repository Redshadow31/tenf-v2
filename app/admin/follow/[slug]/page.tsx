"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

const STAFF_MEMBERS: Record<string, string> = {
  red: "Red",
  clara: "Clara",
  nexou: "Nexou",
  tabs: "Tabs",
  nangel: "Nangel",
  jenny: "Jenny",
  selena: "Selena",
  dark: "Dark",
  yaya: "Yaya",
  rubby: "Rubby",
  livio: "Livio",
  rebelle: "Rebelle",
  sigurdson: "Sigurdson",
  nico: "Nico",
  willy: "Willy",
  b1nx: "B1nx",
  spydy: "Spydy",
  simon: "Simon",
  zylkao: "Zylkao",
};

export default function FollowMemberPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const memberName = STAFF_MEMBERS[slug] || slug;

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
        <Link
          href="/admin/follow"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Suivi Follow
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Suivi Follow — {memberName}
        </h1>
        <p className="text-gray-400">
          Suivi des follows liés à {memberName}
        </p>
      </div>

      {/* Message fonctionnalité à venir */}
      <div className="bg-[#1a1a1d] border border-yellow-500/30 rounded-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚧</span>
          <h2 className="text-2xl font-semibold text-yellow-400">Fonctionnalité à venir</h2>
        </div>
        <p className="text-gray-400 mb-4">
          Cette page servira au suivi des follows liés à <strong className="text-white">{memberName}</strong>.
          L'implémentation de la logique de suivi automatique est prévue prochainement.
        </p>
      </div>

      {/* Placeholder UI - Tableau vide */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Liste des follows
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Membre
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl text-gray-600">📋</span>
                    <p className="text-gray-400">
                      Aucun follow enregistré pour le moment
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Les données apparaîtront ici une fois la fonctionnalité implémentée
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder UI - Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Total follows</p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Ce mois</p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Taux de suivi</p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
      </div>
    </div>
  );
}

