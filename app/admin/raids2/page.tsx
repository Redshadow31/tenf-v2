"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RaidCharts from "@/components/RaidCharts";
import RaidDailyChart, { type DailyRaidPoint } from "@/components/RaidDailyChart";
import RaidAlertBadge from "@/components/RaidAlertBadge";
import RaidDetailsModal from "@/components/admin/RaidDetailsModal";
import RaidImportModal from "@/components/admin/RaidImportModal";

interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

interface RaidEntry {
  id?: string;
  raider: string;
  target: string;
  date: string;
  source?: string;
  manual?: boolean;
  count?: number;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
}

interface MemberLite {
  twitchLogin: string;
  displayName?: string;
}

function isManualRaid(raid: RaidEntry): boolean {
  const source = raid.source || (raid.manual ? "manual" : "twitch-live");
  if (source === "discord") return false;
  return source === "manual" || source === "admin" || !!raid.manual;
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function Raids2Page() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [manualRaidsDone, setManualRaidsDone] = useState<RaidEntry[]>([]);
  const [manualRaidsReceived, setManualRaidsReceived] = useState<RaidEntry[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [raidsByMember, setRaidsByMember] = useState<MonthlyRaids>({});
  const [sortColumn, setSortColumn] = useState<"membre" | "done" | "received">("done");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ twitchLogin: string; displayName: string } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const current = monthKey(now);
    setSelectedMonth(current);

    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(date));
    }
    setAvailableMonths(months);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    loadData(selectedMonth);
  }, [selectedMonth]);

  async function loadData(month: string) {
    try {
      setLoading(true);

      const [raidsRes, membersRes, unmatchedRes] = await Promise.all([
        fetch(`/api/discord/raids/data-v2?month=${month}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/members/public", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(`/api/discord/raids/unmatched?month=${month}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
      ]);

      const raidsData = raidsRes.ok ? await raidsRes.json() : { raidsFaits: [], raidsRecus: [] };
      const membersData = membersRes.ok ? await membersRes.json() : { members: [] };
      const unmatchedData = unmatchedRes.ok ? await unmatchedRes.json() : { unmatched: [] };

      const raidsFaits = (raidsData.raidsFaits || []) as RaidEntry[];
      const raidsRecus = (raidsData.raidsRecus || []) as RaidEntry[];
      const manualDone = raidsFaits.filter(isManualRaid);
      const manualReceived = raidsRecus.filter(isManualRaid);

      setManualRaidsDone(manualDone);
      setManualRaidsReceived(manualReceived);
      setMembers((membersData.members || []) as MemberLite[]);
      setUnmatchedCount((unmatchedData.unmatched || []).length);

      const byMember: MonthlyRaids = {};

      manualDone.forEach((raid) => {
        const raiderKey = raid.raiderTwitchLogin || raid.raider;
        const targetKey = raid.targetTwitchLogin || raid.target;
        if (!byMember[raiderKey]) {
          byMember[raiderKey] = { done: 0, received: 0, targets: {} };
        }
        byMember[raiderKey].done += raid.count || 1;
        byMember[raiderKey].targets[targetKey] = (byMember[raiderKey].targets[targetKey] || 0) + (raid.count || 1);
      });

      manualReceived.forEach((raid) => {
        const targetKey = raid.targetTwitchLogin || raid.target;
        if (!byMember[targetKey]) {
          byMember[targetKey] = { done: 0, received: 0, targets: {} };
        }
        byMember[targetKey].received += 1;
      });

      setRaidsByMember(byMember);
    } catch (error) {
      console.error("[Raids2] Erreur chargement:", error);
      setManualRaidsDone([]);
      setManualRaidsReceived([]);
      setRaidsByMember({});
      setUnmatchedCount(0);
    } finally {
      setLoading(false);
    }
  }

  const getMemberDisplayName = (twitchLogin: string): string => {
    const member = members.find((m) => m.twitchLogin?.toLowerCase() === twitchLogin.toLowerCase());
    return member?.displayName || twitchLogin;
  };

  const kpis = useMemo(() => {
    const totalDone = manualRaidsDone.reduce((sum, raid) => sum + (raid.count || 1), 0);
    const totalReceived = manualRaidsReceived.length;
    const activeRaiders = new Set(manualRaidsDone.map((r) => r.raiderTwitchLogin || r.raider)).size;
    const uniqueTargets = new Set(manualRaidsReceived.map((r) => r.targetTwitchLogin || r.target)).size;
    return { totalDone, totalReceived, activeRaiders, uniqueTargets };
  }, [manualRaidsDone, manualRaidsReceived]);

  const dailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [year, monthNum] = selectedMonth.split("-").map((n) => parseInt(n, 10));
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const byDay = new Map<number, { raidsFaits: number; raidsRecus: number }>();
    for (let d = 1; d <= daysInMonth; d++) byDay.set(d, { raidsFaits: 0, raidsRecus: 0 });

    manualRaidsDone.forEach((raid) => {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== monthNum) return;
      const day = date.getDate();
      byDay.get(day)!.raidsFaits += raid.count || 1;
    });

    manualRaidsReceived.forEach((raid) => {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== monthNum) return;
      const day = date.getDate();
      byDay.get(day)!.raidsRecus += 1;
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const cur = byDay.get(day)!;
      return { day, raidsFaits: cur.raidsFaits, raidsRecus: cur.raidsRecus };
    });
  }, [manualRaidsDone, manualRaidsReceived, selectedMonth]);

  const timeline = useMemo(() => {
    const done = manualRaidsDone.map((r) => ({ ...r, kind: "fait" as const }));
    const received = manualRaidsReceived.map((r) => ({ ...r, kind: "recu" as const }));
    return [...done, ...received]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  }, [manualRaidsDone, manualRaidsReceived]);

  const rows = useMemo(() => {
    const entries = Object.entries(raidsByMember);

    const filtered = entries.filter(([login]) => {
      if (!search.trim()) return true;
      const normalizedSearch = search.toLowerCase();
      const display = getMemberDisplayName(login).toLowerCase();
      return login.toLowerCase().includes(normalizedSearch) || display.includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      const [loginA, statsA] = a;
      const [loginB, statsB] = b;
      let comparison = 0;
      switch (sortColumn) {
        case "membre":
          comparison = getMemberDisplayName(loginA).localeCompare(getMemberDisplayName(loginB), "fr", { sensitivity: "base" });
          break;
        case "done":
          comparison = statsA.done - statsB.done;
          break;
        case "received":
          comparison = statsA.received - statsB.received;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [raidsByMember, search, sortColumn, sortDirection, members]);

  const handleSort = (column: "membre" | "done" | "received") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "membre" ? "asc" : "desc");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement raids2...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold mb-2">Suivi des raids v2</h1>
          <p className="text-gray-400 text-sm">
            Version experimentale (manuel uniquement) pour valider le nouveau visuel.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/raids"
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#1a1a1d] border border-gray-700 hover:border-[#9146ff]"
          >
            Ouvrir page actuelle
          </Link>
          <Link
            href={`/admin/raids/review?month=${selectedMonth}`}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-600/30"
          >
            Non reconnus ({unmatchedCount})
          </Link>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700"
          >
            Import manuel
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <label className="text-gray-400 text-sm">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
        >
          {availableMonths.map((month) => {
            const [year, monthNum] = month.split("-");
            const monthNames = [
              "Janvier",
              "Fevrier",
              "Mars",
              "Avril",
              "Mai",
              "Juin",
              "Juillet",
              "Aout",
              "Septembre",
              "Octobre",
              "Novembre",
              "Decembre",
            ];
            const monthName = monthNames[parseInt(monthNum, 10) - 1];
            return (
              <option key={month} value={month}>
                {monthName} {year}
              </option>
            );
          })}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white w-72 max-w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Raids faits</p>
          <p className="text-3xl font-bold">{kpis.totalDone}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Raids recus</p>
          <p className="text-3xl font-bold">{kpis.totalReceived}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Raiders actifs</p>
          <p className="text-3xl font-bold">{kpis.activeRaiders}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cibles uniques</p>
          <p className="text-3xl font-bold">{kpis.uniqueTargets}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">A verifier</p>
          <p className={`text-3xl font-bold ${unmatchedCount > 0 ? "text-yellow-300" : "text-green-300"}`}>{unmatchedCount}</p>
        </div>
      </div>

      <RaidDailyChart month={selectedMonth} data={dailyChartData} />

      {Object.keys(raidsByMember).length > 0 && (
        <div className="mt-6">
          <RaidCharts raids={raidsByMember} getMemberDisplayName={getMemberDisplayName} />
        </div>
      )}

      <div className="mt-6 bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Tableau membres (manuel)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button onClick={() => handleSort("membre")} className="flex items-center gap-2 hover:text-[#9146ff]">
                    Membre {sortColumn === "membre" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button onClick={() => handleSort("done")} className="flex items-center gap-2 hover:text-[#9146ff]">
                    Raids faits {sortColumn === "done" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  <button onClick={() => handleSort("received")} className="flex items-center gap-2 hover:text-[#9146ff]">
                    Raids recus {sortColumn === "received" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Alertes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Aucune donnee pour ce filtre.
                  </td>
                </tr>
              ) : (
                rows.map(([twitchLogin, stats]) => {
                  const alerts = Object.entries(stats.targets)
                    .filter(([, count]) => count > 3)
                    .map(([target, count]) => ({ raider: twitchLogin, target, count }));
                  return (
                    <tr key={twitchLogin} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            setSelectedMember({
                              twitchLogin,
                              displayName: getMemberDisplayName(twitchLogin),
                            });
                            setIsDetailsModalOpen(true);
                          }}
                          className="flex items-center gap-2 hover:text-[#9146ff]"
                        >
                          <span className="font-semibold">{getMemberDisplayName(twitchLogin)}</span>
                          <span className="text-gray-500 text-sm">({twitchLogin})</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 font-semibold">{stats.done}</td>
                      <td className="py-4 px-6 font-semibold">{stats.received}</td>
                      <td className="py-4 px-6">
                        {alerts.length > 0 ? (
                          <RaidAlertBadge alerts={alerts} getMemberDisplayName={getMemberDisplayName} />
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Activite recente raids (manuel)</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune activite recente.</p>
        ) : (
          <div className="space-y-2">
            {timeline.slice(0, 12).map((raid, idx) => {
              const raider = getMemberDisplayName(raid.raiderTwitchLogin || raid.raider);
              const target = getMemberDisplayName(raid.targetTwitchLogin || raid.target);
              const date = new Date(raid.date).toLocaleString("fr-FR");
              return (
                <div key={`${raid.id || idx}-${raid.date}`} className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
                  <p className="text-gray-200">
                    <span className="font-semibold">{raider}</span> {raid.kind === "fait" ? "a raid" : "a recu un raid de"}{" "}
                    <span className="font-semibold">{target}</span>
                  </p>
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMember && (
        <RaidDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedMember(null);
          }}
          memberTwitchLogin={selectedMember.twitchLogin}
          memberDisplayName={selectedMember.displayName}
          month={selectedMonth}
          getMemberDisplayName={getMemberDisplayName}
          onRefresh={() => loadData(selectedMonth)}
        />
      )}

      <RaidImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        month={selectedMonth}
        onImportComplete={() => loadData(selectedMonth)}
        getMemberDisplayName={getMemberDisplayName}
      />
    </div>
  );
}

