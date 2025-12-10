"use client";

import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data
const twitchActivityData = [
  { month: "Janv", value: 45 },
  { month: "Fév", value: 52 },
  { month: "Mar", value: 68 },
  { month: "Avr", value: 75 },
  { month: "Mai", value: 95 },
  { month: "Juin", value: 88 },
  { month: "Juil", value: 72 },
  { month: "Août", value: 80 },
  { month: "Sept", value: 85 },
  { month: "Oct", value: 90 },
  { month: "Nov", value: 100 },
  { month: "Déc", value: 115 },
];

const discordGrowthData = [
  { month: "Janv", value: 160 },
  { month: "Fév", value: 180 },
  { month: "Mar", value: 200 },
  { month: "Avr", value: 220 },
  { month: "Mai", value: 250 },
  { month: "Juin", value: 280 },
  { month: "Juil", value: 300 },
  { month: "Août", value: 320 },
  { month: "Sept", value: 350 },
  { month: "Oct", value: 380 },
  { month: "Nov", value: 400 },
  { month: "Déc", value: 420 },
];

const spotlightProgressionData = [
  { month: "Mai", value: 45 },
  { month: "Juin", value: 52 },
  { month: "Juil", value: 60 },
  { month: "Août", value: 68 },
  { month: "Sept", value: 75 },
  { month: "Oct", value: 82 },
  { month: "Nov", value: 88 },
  { month: "Déc", value: 95 },
];

const vocalRanking = [
  {
    id: 1,
    name: "Jenny",
    avatar: "https://placehold.co/40x40?text=J",
    vocalHours: 58,
    messages: 98,
  },
  {
    id: 2,
    name: "Clara",
    avatar: "https://placehold.co/40x40?text=C",
    vocalHours: 71,
    messages: 1872,
  },
  {
    id: 3,
    name: "NeXou",
    avatar: "https://placehold.co/40x40?text=N",
    vocalHours: 1271,
    messages: 1872,
  },
  {
    id: 4,
    name: "Red",
    avatar: "https://placehold.co/40x40?text=R",
    vocalHours: 834,
    messages: 133,
  },
];

const textRanking = [
  {
    id: 1,
    name: "Jenny",
    avatar: "https://placehold.co/40x40?text=J",
    messages: 151000,
    progression: "+3",
  },
  {
    id: 2,
    name: "Clara",
    avatar: "https://placehold.co/40x40?text=C",
    messages: 1872,
    progression: "-2",
  },
  {
    id: 3,
    name: "NeXou",
    avatar: "https://placehold.co/40x40?text=N",
    messages: 1763,
    progression: "-4",
  },
  {
    id: 4,
    name: "Red",
    avatar: "https://placehold.co/40x40?text=R",
    messages: 1238,
    progression: "+1",
  },
];

const topClips = [
  {
    id: 1,
    name: "Jenny",
    avatar: "https://placehold.co/64x64?text=J",
    duration: "316 h",
    thumbnail: "https://placehold.co/120x68?text=Clip",
  },
  {
    id: 2,
    name: "Clara",
    avatar: "https://placehold.co/64x64?text=C",
    duration: "281 h",
    thumbnail: "https://placehold.co/120x68?text=Clip",
  },
  {
    id: 3,
    name: "NeXou",
    avatar: "https://placehold.co/64x64?text=N",
    duration: "245 h",
    thumbnail: "https://placehold.co/120x68?text=Clip",
  },
  {
    id: 4,
    name: "Red",
    avatar: "https://placehold.co/64x64?text=R",
    duration: "198 h",
    thumbnail: "https://placehold.co/120x68?text=Clip",
  },
];

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général", active: true },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/planification", label: "Événements" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Dashboard Général" navLinks={navLinks} />

        {/* Section 1 — Statistiques globales (3 cartes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Activité Twitch */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Activité Twitch
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={twitchActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1d",
                    border: "1px solid #2a2a2d",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#9146ff"
                  strokeWidth={2}
                  dot={{ fill: "#9146ff", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Croissance Discord */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Croissance Discord
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={discordGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1d",
                    border: "1px solid #2a2a2d",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement TENF */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Engagement TENF
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Raids</span>
                  <span className="text-sm font-semibold text-white">178</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: "89%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Soutien</span>
                  <span className="text-sm font-semibold text-white">988</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: "99%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Interactions</span>
                  <span className="text-sm font-semibold text-white">2.3k</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#9146ff] h-2 rounded-full"
                    style={{ width: "77%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Analyses Spotlight & Raids (3 cartes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Progression Spotlight */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Progression Spotlight
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={spotlightProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1d",
                    border: "1px solid #2a2a2d",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#9146ff"
                  strokeWidth={2}
                  dot={{ fill: "#9146ff", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Raids reçus */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-[#9146ff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white mb-2">156</div>
              <div className="text-sm text-gray-400">Raids reçus</div>
            </div>
          </div>

          {/* Raids envoyés */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-[#10b981]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white mb-2">89</div>
              <div className="text-sm text-gray-400">Raids envoyés</div>
            </div>
          </div>
        </div>

        {/* Section 3 — Classements Discord (2 cartes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Classement vocal Discord */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Classement vocal Discord
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2d]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Pseudo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Vocal
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Messages
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vocalRanking.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.vocalHours >= 1000
                          ? `${(member.vocalHours / 1000).toFixed(1)}k`
                          : member.vocalHours}{" "}
                        h
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.messages}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classement texte Discord */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Classement texte Discord
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2d]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Pseudo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Messages
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Progression
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {textRanking.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.messages >= 1000
                          ? `${(member.messages / 1000).toFixed(1)}k`
                          : member.messages}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-sm font-semibold ${
                            member.progression.startsWith("+")
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {member.progression}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 4 — Clips top */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Clips top</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topClips.map((clip) => (
              <div
                key={clip.id}
                className="bg-[#0e0e10] border border-[#2a2a2d] rounded-lg overflow-hidden hover:border-[#9146ff] transition-colors"
              >
                <div className="aspect-video w-full bg-gray-800 relative">
                  <img
                    src={clip.thumbnail}
                    alt={clip.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={clip.avatar}
                      alt={clip.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-white">
                      {clip.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{clip.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
