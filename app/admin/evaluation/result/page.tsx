"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface ResultRow {
  twitchLogin: string;
  displayName: string;
  role: string;
  isActive: boolean;
  isVip: boolean;
  sectionAPoints: number;
  sectionBPoints: number;
  sectionCPoints: number;
  sectionDBonuses: number;
  totalPoints: number;
  finalNote: number | null;
  finalScore: number;
  calculatedAt: string | null;
  calculatedBy: string | null;
  finalNoteSavedAt: string | null;
  finalNoteSavedBy: string | null;
}

interface ResultStats {
  membersCount: number;
  avgFinalScore: number;
  vipCount: number;
  surveillerCount: number;
  validatedCount: number;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    options.push(`${year}-${month}`);
  }
  return options;
}

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

export default function EvaluationResultPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/user/role");
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
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
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadResultData(selectedMonth);
    }
  }, [hasAccess, selectedMonth]);

  async function loadResultData(month: string) {
    setLoadingData(true);
    try {
      const response = await fetch(`/api/evaluations/result?month=${month}`, { cache: "no-store" });
      if (!response.ok) {
        setRows([]);
        setStats(null);
        return;
      }
      const data = await response.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Erreur chargement résultats:", error);
      setRows([]);
      setStats(null);
    } finally {
      setLoadingData(false);
    }
  }

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.displayName.toLowerCase().includes(query) ||
        row.twitchLogin.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query)
    );
  }, [rows, search]);

  if (loading) {
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
          ← Retour au Dashboard Évaluation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Résultats validés</h1>
        <p className="text-gray-400">Snapshots enregistrés depuis la Synthèse mensuelle</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map((option) => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="px-4 py-2 rounded-lg bg-[#1a1a1d] border border-gray-700 text-white"
        />
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard title="Membres" value={stats.membersCount} />
          <StatCard title="Moyenne finale" value={stats.avgFinalScore.toFixed(2)} />
          <StatCard title="VIP potentiels" value={stats.vipCount} />
          <StatCard title="À surveiller" value={stats.surveillerCount} />
          <StatCard title="Snapshots validés" value={stats.validatedCount} />
        </div>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9146ff]"></div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
          Aucun snapshot validé pour {formatMonthKey(selectedMonth)}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-[#1a1a1d]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-[#0e0e10]">
                <th className="px-4 py-3 text-left">Membre</th>
                <th className="px-4 py-3 text-center">A</th>
                <th className="px-4 py-3 text-center">B</th>
                <th className="px-4 py-3 text-center">C</th>
                <th className="px-4 py-3 text-center">Bonus</th>
                <th className="px-4 py-3 text-center">Calculé</th>
                <th className="px-4 py-3 text-center">Final</th>
                <th className="px-4 py-3 text-center">Validation</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.twitchLogin} className="border-b border-gray-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{row.displayName}</div>
                    <div className="text-xs text-gray-500">
                      {row.twitchLogin} · {row.role}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{row.sectionAPoints}</td>
                  <td className="px-4 py-3 text-center">{row.sectionBPoints}</td>
                  <td className="px-4 py-3 text-center">{row.sectionCPoints}</td>
                  <td className="px-4 py-3 text-center">{row.sectionDBonuses}</td>
                  <td className="px-4 py-3 text-center">{row.totalPoints}</td>
                  <td className="px-4 py-3 text-center font-bold text-[#9146ff]">{row.finalScore}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {row.calculatedAt ? new Date(row.calculatedAt).toLocaleString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

