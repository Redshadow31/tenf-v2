"use client";

import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import LineChart from "@/components/admin/LineChart";
import BarChart from "@/components/admin/BarChart";
import TableCard from "@/components/admin/TableCard";

// Données mock
const mockData = {
  twitchActivity: [
    { label: "Janv", value: 45 },
    { label: "Fév", value: 52 },
    { label: "Mar", value: 68 },
    { label: "Avr", value: 75 },
    { label: "Mai", value: 95 },
    { label: "Juin", value: 88 },
    { label: "Juil", value: 72 },
    { label: "Août", value: 80 },
    { label: "Sept", value: 85 },
    { label: "Oct", value: 90 },
    { label: "Nov", value: 100 },
    { label: "Déc", value: 115 },
  ],
  discordGrowth: [
    { label: "Janv", value: 160 },
    { label: "Fév", value: 180 },
    { label: "Mar", value: 200 },
    { label: "Avr", value: 220 },
    { label: "Mai", value: 250 },
    { label: "Juin", value: 280 },
    { label: "Juil", value: 300 },
    { label: "Août", value: 320 },
    { label: "Sept", value: 350 },
    { label: "Oct", value: 380 },
    { label: "Nov", value: 400 },
    { label: "Déc", value: 420 },
  ],
  engagement: {
    raids: 178,
    soutien: 988,
    interactions: 2300,
  },
  spotlightProgression: [
    { label: "Mai", value: 45 },
    { label: "Juin", value: 52 },
    { label: "Juil", value: 60 },
    { label: "Août", value: 68 },
    { label: "Sept", value: 75 },
    { label: "Oct", value: 82 },
    { label: "Nov", value: 88 },
    { label: "Déc", value: 95 },
  ],
  raidRecu: [
    { label: "Janv", value: 12 },
    { label: "Fév", value: 15 },
    { label: "Mar", value: 18 },
    { label: "Avr", value: 22 },
    { label: "Mai", value: 25 },
    { label: "Juin", value: 28 },
  ],
  raidEnvoye: [
    { label: "Janv", value: 8 },
    { label: "Fév", value: 10 },
    { label: "Mar", value: 12 },
    { label: "Avr", value: 15 },
    { label: "Mai", value: 18 },
    { label: "Juin", value: 20 },
  ],
  topClips: [
    { name: "Jenny", views: 316, change: 1, avatar: "https://placehold.co/40x40?text=J" },
    { name: "Clara", views: 281, change: -1, avatar: "https://placehold.co/40x40?text=C" },
    { name: "NeXou", views: 245, change: 2, avatar: "https://placehold.co/40x40?text=N" },
    { name: "Red_Shadow", views: 198, change: -2, avatar: "https://placehold.co/40x40?text=R" },
  ],
  vocalRanking: [
    { name: "Jenny", vocal: 58, messages: 98, change: 7, avatar: "https://placehold.co/32x32?text=J" },
    { name: "Clara", vocal: 71, messages: 1872, change: 2, avatar: "https://placehold.co/32x32?text=C" },
    { name: "NeXou", vocal: 1271, messages: 1872, change: 1, avatar: "https://placehold.co/32x32?text=N" },
    { name: "Red", vocal: 834, messages: 133, change: -3, avatar: "https://placehold.co/32x32?text=R" },
  ],
  textRanking: [
    { name: "Jenny", messages: 151000, change: 3, avatar: "https://placehold.co/32x32?text=J" },
    { name: "Clara", messages: 1872, change: -2, avatar: "https://placehold.co/32x32?text=C" },
    { name: "NeXou", messages: 1763, change: -4, avatar: "https://placehold.co/32x32?text=N" },
    { name: "Red", messages: 1238, change: 1, avatar: "https://placehold.co/32x32?text=R" },
  ],
};

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/statistiques", label: "Statistiques Globales", active: true },
];

export default function StatistiquesPage() {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Statistiques Globales</h1>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-[#9146ff] text-white"
                    : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Première ligne - 3 blocs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Activité Twitch */}
          <StatCard title="Activité Twitch">
            <LineChart data={mockData.twitchActivity} color="#9146ff" height={200} />
          </StatCard>

          {/* Croissance Discord */}
          <StatCard title="Croissance Discord">
            <LineChart data={mockData.discordGrowth} color="#10b981" height={200} />
          </StatCard>

          {/* Engagement TENF */}
          <StatCard title="Engagement TENF">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Raids</span>
                  <span className="text-sm font-semibold text-white">{mockData.engagement.raids}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: `${(mockData.engagement.raids / 200) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Soutien</span>
                  <span className="text-sm font-semibold text-white">{mockData.engagement.soutien}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: `${(mockData.engagement.soutien / 1000) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Interactions</span>
                  <span className="text-sm font-semibold text-white">
                    {(mockData.engagement.interactions / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: `${(mockData.engagement.interactions / 3000) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Seconde ligne - 3 blocs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Graphiques de progression des Spotlight */}
          <StatCard title="Graphiques de progression des Spotlight" className="md:col-span-1">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Implication des membres</h4>
              <LineChart data={mockData.spotlightProgression} color="#9146ff" height={180} />
            </div>
          </StatCard>

          {/* Raid reçu */}
          <StatCard title="Raid reçu">
            <BarChart data={mockData.raidRecu} color="#9146ff" height={180} />
          </StatCard>

          {/* Raid envoyé */}
          <StatCard title="Raid envoyé">
            <BarChart data={mockData.raidEnvoye} color="#10b981" height={180} />
          </StatCard>
        </div>

        {/* Dernière ligne - 3 blocs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clips top */}
          <StatCard title="Clips top">
            <div className="space-y-3">
              {mockData.topClips.map((clip, index) => (
                <div key={index} className="flex items-center gap-3">
                  <img
                    src={clip.avatar}
                    alt={clip.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{clip.name}</div>
                    <div className="text-xs text-gray-400">{clip.views} h</div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    clip.change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {clip.change > 0 ? "▲" : "▼"} {Math.abs(clip.change)}
                  </div>
                </div>
              ))}
            </div>
          </StatCard>

          {/* Classement vocal Discord */}
          <TableCard
            title="Classement vocal Discord"
            headers={["Nom", "Vocal", "Messages", ""]}
          >
            {mockData.vocalRanking.map((member, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-white">{member.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-300">
                  {member.vocal >= 1000 
                    ? `${(member.vocal / 1000).toFixed(1)}k` 
                    : member.vocal} h
                </td>
                <td className="py-3 px-4 text-sm text-gray-300">{member.messages}</td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-semibold ${
                    member.change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {member.change > 0 ? "▲" : "▼"} {Math.abs(member.change)}
                  </span>
                </td>
              </tr>
            ))}
          </TableCard>

          {/* Classement texte Discord */}
          <TableCard
            title="Classement texte Discord"
            headers={["Nom", "Messages", ""]}
          >
            {mockData.textRanking.map((member, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-white">{member.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-300">
                  {member.messages >= 1000
                    ? `${(member.messages / 1000).toFixed(1)}k`
                    : member.messages}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-semibold ${
                    member.change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {member.change > 0 ? "▲" : "▼"} {Math.abs(member.change)}
                  </span>
                </td>
              </tr>
            ))}
          </TableCard>
        </div>
      </div>
    </div>
  );
}
