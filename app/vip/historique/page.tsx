"use client";

import { useState } from "react";
import Link from "next/link";

interface HistoricalMonth {
  month: string;
  year: number;
  vipMembers: {
    discordId: string;
    username: string;
    avatar: string;
    displayName: string;
  }[];
}

// TODO: Remplacer par une vraie source de données (base de données, API, etc.)
const mockHistory: HistoricalMonth[] = [
  {
    month: "Janvier",
    year: 2024,
    vipMembers: [
      {
        discordId: "1",
        username: "Clara",
        avatar: "https://placehold.co/128x128?text=C",
        displayName: "Clara",
      },
      {
        discordId: "2",
        username: "NeXou31",
        avatar: "https://placehold.co/128x128?text=N",
        displayName: "NeXou31",
      },
    ],
  },
  {
    month: "Février",
    year: 2024,
    vipMembers: [
      {
        discordId: "3",
        username: "Red_Shadow",
        avatar: "https://placehold.co/128x128?text=R",
        displayName: "Red_Shadow",
      },
    ],
  },
  // Ajoutez plus de mois ici
];

export default function HistoriquePage() {
  const [selectedMonth, setSelectedMonth] = useState<HistoricalMonth | null>(
    mockHistory[0] || null
  );

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
            <div className="space-y-2">
              {mockHistory.map((monthData, index) => (
                <button
                  key={`${monthData.year}-${monthData.month}`}
                  onClick={() => setSelectedMonth(monthData)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedMonth?.month === monthData.month &&
                    selectedMonth?.year === monthData.year
                      ? "bg-purple-600 text-white"
                      : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] border border-gray-700"
                  }`}
                >
                  <div className="font-semibold">{monthData.month}</div>
                  <div className="text-sm opacity-75">{monthData.year}</div>
                </button>
              ))}
            </div>
          </div>

          {/* VIP du mois sélectionné */}
          <div className="lg:col-span-3">
            {selectedMonth ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  VIP de {selectedMonth.month} {selectedMonth.year}
                </h2>
                <div className="grid grid-cols-5 gap-4">
                  {selectedMonth.vipMembers.map((member) => (
                    <div
                      key={member.discordId}
                      className="flex flex-col items-center space-y-2 bg-[#1a1a1d] border border-gray-700 p-4 rounded-lg"
                    >
                      <img
                        src={member.avatar}
                        alt={member.displayName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <h3 className="text-sm font-semibold text-white text-center">
                        {member.displayName}
                      </h3>
                    </div>
                  ))}
                </div>
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


