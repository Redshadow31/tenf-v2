"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MemberOption {
  twitchLogin: string;
  displayName: string;
}

interface TimelinePoint {
  month: string;
  sectionA: number;
  sectionB: number;
  sectionC: number;
  sectionD: number;
  totalCalculated: number;
  finalScore: number;
  delta: number | null;
}

interface ProgressionSummary {
  pointsCount: number;
  firstScore: number | null;
  lastScore: number | null;
  globalDelta: number | null;
  trend: "progression" | "regression" | "stable" | "insufficient_data";
  positiveMoves: number;
  negativeMoves: number;
  stableMoves: number;
}

interface ProgressionResponse {
  success: boolean;
  member: {
    twitchLogin: string;
    displayName: string;
    role: string;
    integrationDate: string | null;
    createdAt: string | null;
  };
  summary: ProgressionSummary;
  timeline: TimelinePoint[];
}

export default function EvaluationProgressionPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLogin, setSelectedLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProgressionResponse | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const roleResponse = await fetch("/api/user/role");
        if (!roleResponse.ok) {
          setHasAccess(false);
          return;
        }
        const roleData = await roleResponse.json();
        setHasAccess(roleData.hasAdminAccess === true);
        if (roleData.hasAdminAccess === true) {
          const membersResponse = await fetch("/api/admin/members", { cache: "no-store" });
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const options = (membersData.members || [])
              .filter((m: any) => m.twitchLogin)
              .map((m: any) => ({
                twitchLogin: m.twitchLogin,
                displayName: m.displayName || m.twitchLogin,
              }))
              .sort((a: MemberOption, b: MemberOption) => a.displayName.localeCompare(b.displayName));
            setMembers(options);
          }
        }
      } catch (error) {
        console.error("Erreur initialisation progression:", error);
        setHasAccess(false);
      } finally {
        setLoadingAccess(false);
      }
    }
    init();
  }, []);

  async function loadProgression(login: string) {
    setLoading(true);
    setData(null);
    try {
      const response = await fetch(`/api/evaluations/progression?twitchLogin=${encodeURIComponent(login)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setData(null);
        return;
      }
      const payload = await response.json();
      setData(payload);
    } catch (error) {
      console.error("Erreur chargement progression:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members.slice(0, 20);
    const query = search.toLowerCase();
    return members
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(query) ||
          m.twitchLogin.toLowerCase().includes(query)
      )
      .slice(0, 20);
  }, [members, search]);

  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link href="/admin/evaluation" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au Hub Évaluation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Progression</h1>
        <p className="text-gray-400">
          Analyse temporelle des évaluations validées par membre (règle d’ancienneté appliquée)
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Rechercher un membre</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pseudo Twitch ou nom d’affichage..."
          className="w-full max-w-md bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        {filteredMembers.length > 0 && (
          <div className="mt-3 max-w-md max-h-64 overflow-y-auto rounded-lg border border-gray-700">
            {filteredMembers.map((member) => (
              <button
                key={member.twitchLogin}
                onClick={() => {
                  setSelectedLogin(member.twitchLogin);
                  loadProgression(member.twitchLogin);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#252529] border-b border-gray-800 last:border-0"
              >
                <span className="text-white">{member.displayName}</span>
                <span className="text-gray-500 text-xs ml-2">({member.twitchLogin})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9146ff]"></div>
        </div>
      )}

      {!loading && selectedLogin && !data && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 text-gray-400">
          Aucune donnée de progression disponible pour ce membre.
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Metric title="Membre" value={data.member.displayName} />
            <Metric title="Points analysés" value={data.summary.pointsCount} />
            <Metric
              title="Évolution globale"
              value={
                data.summary.globalDelta === null
                  ? "N/A"
                  : `${data.summary.globalDelta > 0 ? "+" : ""}${data.summary.globalDelta}`
              }
            />
            <Metric title="Tendance" value={translateTrend(data.summary.trend)} />
          </div>

          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Courbe globale (note finale)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1d",
                      border: "1px solid #2a2a2d",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="finalScore" name="Final" stroke="#9146ff" strokeWidth={3} dot />
                  <Line type="monotone" dataKey="totalCalculated" name="Calculé" stroke="#10b981" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Courbes par catégorie</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1d",
                      border: "1px solid #2a2a2d",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sectionA" name="A" stroke="#a855f7" dot={false} />
                  <Line type="monotone" dataKey="sectionB" name="B" stroke="#3b82f6" dot={false} />
                  <Line type="monotone" dataKey="sectionC" name="C" stroke="#22c55e" dot={false} />
                  <Line type="monotone" dataKey="sectionD" name="Bonus" stroke="#f59e0b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-[#1a1a1d]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-[#0e0e10]">
                  <th className="px-4 py-3 text-left">Mois</th>
                  <th className="px-4 py-3 text-center">A</th>
                  <th className="px-4 py-3 text-center">B</th>
                  <th className="px-4 py-3 text-center">C</th>
                  <th className="px-4 py-3 text-center">Bonus</th>
                  <th className="px-4 py-3 text-center">Final</th>
                  <th className="px-4 py-3 text-center">Delta</th>
                </tr>
              </thead>
              <tbody>
                {data.timeline.map((row) => (
                  <tr key={row.month} className="border-b border-gray-800">
                    <td className="px-4 py-3">{row.month}</td>
                    <td className="px-4 py-3 text-center">{row.sectionA}</td>
                    <td className="px-4 py-3 text-center">{row.sectionB}</td>
                    <td className="px-4 py-3 text-center">{row.sectionC}</td>
                    <td className="px-4 py-3 text-center">{row.sectionD}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#9146ff]">{row.finalScore}</td>
                    <td className="px-4 py-3 text-center">
                      {row.delta === null ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <span className={row.delta > 0 ? "text-green-400" : row.delta < 0 ? "text-red-400" : "text-gray-400"}>
                          {row.delta > 0 ? "+" : ""}
                          {row.delta}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{title}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function translateTrend(trend: ProgressionSummary["trend"]): string {
  if (trend === "progression") return "Progression";
  if (trend === "regression") return "Régression";
  if (trend === "stable") return "Stable";
  return "Données insuffisantes";
}

