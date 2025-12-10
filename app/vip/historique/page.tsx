"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoricalMonth {
  month: string;
  year: number;
  monthKey: string; // Format "YYYY-MM"
  vipMembers: {
    login: string;
    displayName?: string;
    avatar?: string;
  }[];
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function HistoriquePage() {
  const [historyByMonth, setHistoryByMonth] = useState<Record<string, string[]>>({});
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [vipMembersWithData, setVipMembersWithData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/vip-history?action=by-month");
        if (response.ok) {
          const data = await response.json();
          setHistoryByMonth(data.byMonth || {});
          
          // Sélectionner le mois le plus récent par défaut
          const monthKeys = Object.keys(data.byMonth || {}).sort().reverse();
          if (monthKeys.length > 0) {
            setSelectedMonthKey(monthKeys[0]);
          }
        }
      } catch (error) {
        console.error("Error loading VIP history:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    async function enrichMembers() {
      if (!selectedMonthKey || !historyByMonth[selectedMonthKey]) return;

      const logins = historyByMonth[selectedMonthKey];
      if (logins.length === 0) return;

      try {
        // Enrichir avec les données des membres depuis l'API publique
        const membersResponse = await fetch("/api/members/public");
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          const membersMap = new Map(
            (membersData.members || []).map((m: any) => [m.twitchLogin.toLowerCase(), m])
          );

          const enriched = logins.map(login => {
            const member = membersMap.get(login.toLowerCase());
            
            return {
              login: login,
              displayName: member?.displayName || login,
              avatar: member?.avatar || `https://placehold.co/64x64?text=${login.charAt(0).toUpperCase()}`,
            };
          });

          setVipMembersWithData(prev => ({
            ...prev,
            [selectedMonthKey]: enriched,
          }));
        }
      } catch (error) {
        console.error("Error enriching members:", error);
      }
    }

    enrichMembers();
  }, [selectedMonthKey, historyByMonth]);

  const getMonthDisplay = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    return {
      month: monthNames[month - 1],
      year: year,
      monthKey,
    };
  };

  const sortedMonths = Object.keys(historyByMonth)
    .sort()
    .reverse()
    .map(key => getMonthDisplay(key));

  if (loading) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement de l'historique...</div>
        </div>
      </main>
    );
  }

  const selectedMonthData = selectedMonthKey ? getMonthDisplay(selectedMonthKey) : null;
  const membersForSelectedMonth = selectedMonthKey ? (vipMembersWithData[selectedMonthKey] || []) : [];

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Historique VIP</h1>
          <Link
            href="/vip"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Retour aux VIP
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Liste des mois */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Mois</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sortedMonths.map((monthData) => (
                <button
                  key={monthData.monthKey}
                  onClick={() => setSelectedMonthKey(monthData.monthKey)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedMonthKey === monthData.monthKey
                      ? "bg-purple-600 text-white"
                      : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] border border-gray-700"
                  }`}
                >
                  <div className="font-semibold">{monthData.month}</div>
                  <div className="text-sm opacity-75">{monthData.year}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {historyByMonth[monthData.monthKey]?.length || 0} VIP
                  </div>
                </button>
              ))}
              {sortedMonths.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Aucun historique disponible
                </div>
              )}
            </div>
          </div>

          {/* VIP du mois sélectionné */}
          <div className="lg:col-span-3">
            {selectedMonthData ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  VIP de {selectedMonthData.month} {selectedMonthData.year}
                </h2>
                {membersForSelectedMonth.length > 0 ? (
                  <div className="grid grid-cols-5 gap-4">
                    {membersForSelectedMonth.map((member) => (
                      <div
                        key={member.login}
                        className="flex flex-col items-center space-y-2 bg-[#1a1a1d] border border-gray-700 p-4 rounded-lg"
                      >
                        <div className="relative">
                          <img
                            src={member.avatar}
                            alt={member.displayName}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`;
                            }}
                          />
                        </div>
                        <h3 className="text-sm font-semibold text-white text-center">
                          {member.displayName}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">
                      Chargement des membres...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  Sélectionnez un mois pour voir les VIP.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


