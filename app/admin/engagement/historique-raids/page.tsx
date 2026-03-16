"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RaidDailyChart, { type DailyRaidPoint } from "@/components/RaidDailyChart";
import { X } from "lucide-react";

type RaidDeclaration = {
  id: string;
  member_display_name: string;
  member_twitch_login: string;
  target_twitch_login: string;
  raid_at: string;
  is_approximate: boolean;
  note: string;
  status: "processing" | "to_study" | "validated" | "rejected";
  staff_comment?: string | null;
};

type RaidApiItem = {
  date: string;
  count?: number;
  source?: string;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  raiderDisplayName?: string;
  targetDisplayName?: string;
};

type MemberRow = {
  twitchLogin: string;
  displayName: string;
};

type RaidDuplicateGroup = {
  key: string;
  raider: string;
  target: string;
  date: string;
  count: number;
  raiderLabel: string;
  targetLabel: string;
};

export default function AdminEngagementHistoriqueRaidsPage() {
  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [statsSubTab, setStatsSubTab] = useState<"received" | "sent">("sent");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [statsPage, setStatsPage] = useState(1);
  const [declarations, setDeclarations] = useState<RaidDeclaration[]>([]);
  const [raidsFaits, setRaidsFaits] = useState<RaidApiItem[]>([]);
  const [raidsRecus, setRaidsRecus] = useState<RaidApiItem[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [growthSentPct, setGrowthSentPct] = useState<number | null>(null);
  const [growthReceivedPct, setGrowthReceivedPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [selectedStreamer, setSelectedStreamer] = useState<{ login: string; label: string } | null>(null);
  const [modalMonth, setModalMonth] = useState("");
  const [modalTab, setModalTab] = useState<"sent" | "received">("sent");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSentRaids, setModalSentRaids] = useState<RaidApiItem[]>([]);
  const [modalReceivedRaids, setModalReceivedRaids] = useState<RaidApiItem[]>([]);
  const [previousDailyChartData, setPreviousDailyChartData] = useState<DailyRaidPoint[]>([]);
  const [selectedChartDay, setSelectedChartDay] = useState<number | null>(null);
  const [canUseAdvancedTools, setCanUseAdvancedTools] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesList, setDuplicatesList] = useState<RaidDuplicateGroup[]>([]);
  const [deduplicating, setDeduplicating] = useState(false);
  const [deletingRaidKey, setDeletingRaidKey] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/advanced-access?check=1", { cache: "no-store" });
        if (!response.ok) return;
        const body = await response.json();
        setCanUseAdvancedTools(Boolean(body?.canAccessAdvanced));
      } catch {
        setCanUseAdvancedTools(false);
      }
    })();
  }, []);

  const availableMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [declarationsResponse, raidsResponse, membersResponse] = await Promise.all([
          fetch(`/api/admin/engagement/raids-declarations?status=all&month=${encodeURIComponent(selectedMonth)}`, { cache: "no-store" }),
          fetch(`/api/discord/raids/data-v2?month=${encodeURIComponent(selectedMonth)}`, { cache: "no-store" }),
          fetch("/api/admin/members", { cache: "no-store" }),
        ]);

        const [declarationsBody, raidsBody, membersBody] = await Promise.all([
          declarationsResponse.json(),
          raidsResponse.json(),
          membersResponse.json(),
        ]);

        if (!declarationsResponse.ok) {
          setError(declarationsBody.error || "Impossible de charger l historique des declarations.");
          return;
        }
        if (!raidsResponse.ok) {
          setError(raidsBody.error || "Impossible de charger les statistiques de raids.");
          return;
        }

        const filterManualOnly = (raid: RaidApiItem) => {
          const source = raid.source || "";
          if (source === "discord") return false;
          return source === "manual" || source === "admin" || !source;
        };

        setDeclarations((declarationsBody.declarations || []) as RaidDeclaration[]);
        setRaidsFaits(((raidsBody.raidsFaits || []) as RaidApiItem[]).filter(filterManualOnly));
        setRaidsRecus(((raidsBody.raidsRecus || []) as RaidApiItem[]).filter(filterManualOnly));
        setMembers((membersBody.members || []) as MemberRow[]);
      } catch {
        setError("Erreur reseau pendant le chargement.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      try {
        setTrendLoading(true);
        const [yearStr, monthStr] = selectedMonth.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);
        if (!year || !month) {
          setGrowthSentPct(null);
          setGrowthReceivedPct(null);
          return;
        }

        const monthKeys = Array.from({ length: 4 }, (_, idx) => {
          const d = new Date(year, month - 1 - idx, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        });

        const responses = await Promise.all(
          monthKeys.map((key) =>
            fetch(`/api/discord/raids/data-v2?month=${encodeURIComponent(key)}`, { cache: "no-store" }).then((res) =>
              res.ok ? res.json() : null
            )
          )
        );

        const totals = responses.map((body) => {
          const filterManualOnly = (raid: RaidApiItem) => {
            const source = raid.source || "";
            if (source === "discord") return false;
            return source === "manual" || source === "admin" || !source;
          };
          const faits = ((body?.raidsFaits || []) as RaidApiItem[]).filter(filterManualOnly);
          const recus = ((body?.raidsRecus || []) as RaidApiItem[]).filter(filterManualOnly);
          return {
            sent: faits.reduce((sum, raid) => sum + (raid.count || 1), 0),
            received: recus.length,
          };
        });

        const current = totals[0] || { sent: 0, received: 0 };
        const previous = totals.slice(1, 4);
        const previousSentAvg = previous.length > 0 ? previous.reduce((sum, item) => sum + item.sent, 0) / previous.length : 0;
        const previousReceivedAvg = previous.length > 0 ? previous.reduce((sum, item) => sum + item.received, 0) / previous.length : 0;

        const sentPct = previousSentAvg > 0 ? ((current.sent - previousSentAvg) / previousSentAvg) * 100 : null;
        const receivedPct = previousReceivedAvg > 0 ? ((current.received - previousReceivedAvg) / previousReceivedAvg) * 100 : null;

        setGrowthSentPct(Number.isFinite(sentPct as number) ? sentPct : null);
        setGrowthReceivedPct(Number.isFinite(receivedPct as number) ? receivedPct : null);
      } catch {
        setGrowthSentPct(null);
        setGrowthReceivedPct(null);
      } finally {
        setTrendLoading(false);
      }
    })();
  }, [selectedMonth]);

  useEffect(() => {
    setHistoryPage(1);
    setStatsPage(1);
  }, [selectedMonth, historySearch, statsSubTab, activeTab]);

  useEffect(() => {
    if (!selectedMonth) return;
    setSelectedChartDay(null);
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedStreamer || !modalMonth) return;
    (async () => {
      try {
        setModalLoading(true);
        setModalError("");
        const response = await fetch(`/api/discord/raids/data-v2?month=${encodeURIComponent(modalMonth)}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          setModalError(body.error || "Impossible de charger les details de raids.");
          setModalSentRaids([]);
          setModalReceivedRaids([]);
          return;
        }

        const filterManualOnly = (raid: RaidApiItem) => {
          const source = raid.source || "";
          if (source === "discord") return false;
          return source === "manual" || source === "admin" || !source;
        };

        const login = selectedStreamer.login.toLowerCase();
        const sent = ((body.raidsFaits || []) as RaidApiItem[])
          .filter(filterManualOnly)
          .filter((raid) => String(raid.raiderTwitchLogin || "").toLowerCase() === login)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const received = ((body.raidsRecus || []) as RaidApiItem[])
          .filter(filterManualOnly)
          .filter((raid) => String(raid.targetTwitchLogin || "").toLowerCase() === login)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setModalSentRaids(sent);
        setModalReceivedRaids(received);
      } catch {
        setModalError("Erreur reseau pendant le chargement des details.");
        setModalSentRaids([]);
        setModalReceivedRaids([]);
      } finally {
        setModalLoading(false);
      }
    })();
  }, [selectedStreamer, modalMonth]);

  const getMemberDisplayName = (login?: string): string => {
    const key = String(login || "").toLowerCase();
    const row = members.find((item) => String(item.twitchLogin || "").toLowerCase() === key);
    return row?.displayName || login || "Inconnu";
  };

  const sentRanking = useMemo(() => {
    const map = new Map<string, number>();
    for (const raid of raidsFaits) {
      const login = String(raid.raiderTwitchLogin || "").toLowerCase();
      if (!login) continue;
      map.set(login, (map.get(login) || 0) + (raid.count || 1));
    }
    return Array.from(map.entries())
      .map(([login, total]) => ({ login, label: getMemberDisplayName(login), total }))
      .sort((a, b) => b.total - a.total);
  }, [raidsFaits, members]);

  const receivedRanking = useMemo(() => {
    const map = new Map<string, number>();
    for (const raid of raidsRecus) {
      const login = String(raid.targetTwitchLogin || "").toLowerCase();
      if (!login) continue;
      map.set(login, (map.get(login) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([login, total]) => ({ login, label: getMemberDisplayName(login), total }))
      .sort((a, b) => b.total - a.total);
  }, [raidsRecus, members]);

  const totals = useMemo(
    () => ({
      declarations: declarations.length,
      pending: declarations.filter((item) => item.status === "processing").length,
      toStudy: declarations.filter((item) => item.status === "to_study").length,
      validated: declarations.filter((item) => item.status === "validated").length,
      rejected: declarations.filter((item) => item.status === "rejected").length,
      sent: raidsFaits.reduce((sum, raid) => sum + (raid.count || 1), 0),
      received: raidsRecus.length,
    }),
    [declarations, raidsFaits, raidsRecus]
  );

  const uniqueRaiders = useMemo(() => {
    const set = new Set<string>();
    for (const raid of raidsFaits) {
      const key = String(raid.raiderTwitchLogin || "").toLowerCase();
      if (key) set.add(key);
    }
    return set.size;
  }, [raidsFaits]);

  const uniqueTargets = useMemo(() => {
    const set = new Set<string>();
    for (const raid of raidsRecus) {
      const key = String(raid.targetTwitchLogin || "").toLowerCase();
      if (key) set.add(key);
    }
    return set.size;
  }, [raidsRecus]);

  const filteredDeclarations = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const base = declarations
      .slice()
      .sort((a, b) => new Date(b.raid_at).getTime() - new Date(a.raid_at).getTime());
    if (!q) return base;
    return base.filter((row) => {
      const haystack = [row.member_display_name, row.member_twitch_login, row.target_twitch_login, row.note, row.staff_comment || ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [declarations, historySearch]);

  const historyPerPage = 8;
  const historyTotalPages = Math.max(1, Math.ceil(filteredDeclarations.length / historyPerPage));
  const pagedDeclarations = filteredDeclarations.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  const activeStatsRows = statsSubTab === "received" ? receivedRanking : sentRanking;
  const statsPerPage = 12;
  const statsTotalPages = Math.max(1, Math.ceil(activeStatsRows.length / statsPerPage));
  const pagedStatsRows = activeStatsRows.slice((statsPage - 1) * statsPerPage, statsPage * statsPerPage);

  const dailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();

    const byDay = new Map<number, DailyRaidPoint>();
    for (let day = 1; day <= daysInMonth; day++) {
      byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
    }

    for (const raid of raidsFaits) {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;
      const point = byDay.get(date.getDate());
      if (!point) continue;
      point.raidsFaits += raid.count || 1;
    }

    for (const raid of raidsRecus) {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;
      const point = byDay.get(date.getDate());
      if (!point) continue;
      point.raidsRecus += 1;
    }

    return Array.from(byDay.values());
  }, [raidsFaits, raidsRecus, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
      setPreviousDailyChartData([]);
      return;
    }

    (async () => {
      try {
        const [yearStr, monthStr] = selectedMonth.split("-");
        const previousDate = new Date(Number(yearStr), Number(monthStr) - 2, 1);
        const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`;
        const response = await fetch(`/api/discord/raids/data-v2?month=${encodeURIComponent(previousMonth)}`, { cache: "no-store" });
        if (!response.ok) {
          setPreviousDailyChartData([]);
          return;
        }
        const body = await response.json();
        const filterManualOnly = (raid: RaidApiItem) => {
          const source = raid.source || "";
          if (source === "discord") return false;
          return source === "manual" || source === "admin" || !source;
        };
        const previousSent = ((body.raidsFaits || []) as RaidApiItem[]).filter(filterManualOnly);
        const previousReceived = ((body.raidsRecus || []) as RaidApiItem[]).filter(filterManualOnly);

        const [prevYearStr, prevMonthStr] = previousMonth.split("-");
        const prevYear = Number(prevYearStr);
        const prevMonthNum = Number(prevMonthStr);
        const daysInMonth = new Date(prevYear, prevMonthNum, 0).getDate();
        const byDay = new Map<number, DailyRaidPoint>();
        for (let day = 1; day <= daysInMonth; day++) {
          byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
        }
        for (const raid of previousSent) {
          const date = new Date(raid.date);
          if (date.getFullYear() !== prevYear || date.getMonth() + 1 !== prevMonthNum) continue;
          const point = byDay.get(date.getDate());
          if (point) point.raidsFaits += raid.count || 1;
        }
        for (const raid of previousReceived) {
          const date = new Date(raid.date);
          if (date.getFullYear() !== prevYear || date.getMonth() + 1 !== prevMonthNum) continue;
          const point = byDay.get(date.getDate());
          if (point) point.raidsRecus += 1;
        }
        setPreviousDailyChartData(Array.from(byDay.values()));
      } catch {
        setPreviousDailyChartData([]);
      }
    })();
  }, [selectedMonth]);

  const selectedDayDetails = useMemo(() => {
    if (!selectedChartDay || !selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return null;
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const sent = raidsFaits
      .filter((raid) => {
        const date = new Date(raid.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === selectedChartDay;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const received = raidsRecus
      .filter((raid) => {
        const date = new Date(raid.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === selectedChartDay;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { sent, received };
  }, [raidsFaits, raidsRecus, selectedChartDay, selectedMonth]);

  function statusBadge(status: RaidDeclaration["status"]): { label: string; border: string; color: string; bg: string } {
    if (status === "to_study") {
      return { label: "A etudier", border: "rgba(96,165,250,0.45)", color: "#93c5fd", bg: "rgba(96,165,250,0.12)" };
    }
    if (status === "validated") {
      return { label: "Valide", border: "rgba(52,211,153,0.45)", color: "#34d399", bg: "rgba(52,211,153,0.12)" };
    }
    if (status === "rejected") {
      return { label: "Refuse", border: "rgba(248,113,113,0.45)", color: "#f87171", bg: "rgba(248,113,113,0.12)" };
    }
    return { label: "En attente / en cours de resolution", border: "rgba(250,204,21,0.45)", color: "#facc15", bg: "rgba(250,204,21,0.12)" };
  }

  function openStreamerModal(login: string, label: string, preferredTab: "sent" | "received") {
    setSelectedStreamer({ login, label });
    setModalMonth(selectedMonth);
    setModalTab(preferredTab);
    setModalError("");
  }

  function checkDuplicates() {
    if (!raidsFaits.length) {
      setDuplicatesList([]);
      setShowDuplicatesModal(true);
      return;
    }
    const byKey = new Map<string, RaidApiItem[]>();
    for (const raid of raidsFaits) {
      const raider = String(raid.raiderTwitchLogin || "").toLowerCase();
      const target = String(raid.targetTwitchLogin || "").toLowerCase();
      const date = String(raid.date || "");
      if (!raider || !target || !date) continue;
      const key = `${raider}|${target}|${date}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(raid);
    }
    const duplicates = Array.from(byKey.entries())
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => {
        const first = rows[0];
        const raider = String(first.raiderTwitchLogin || "").toLowerCase();
        const target = String(first.targetTwitchLogin || "").toLowerCase();
        return {
          key,
          raider,
          target,
          date: String(first.date || ""),
          count: rows.length,
          raiderLabel: getMemberDisplayName(raider),
          targetLabel: getMemberDisplayName(target),
        };
      });
    setDuplicatesList(duplicates);
    setShowDuplicatesModal(true);
  }

  async function runDeduplicate() {
    if (!duplicatesList.length || deduplicating) return;
    if (!confirm(`Supprimer les doublons du mois ${selectedMonth} ?`)) return;
    setDeduplicating(true);
    try {
      const response = await fetch("/api/admin/engagement/raids-management/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const body = await response.json();
      if (!response.ok) {
        alert(body?.error || "Erreur pendant la suppression des doublons.");
        return;
      }
      alert(`${body?.message || "Doublons traites."}\nEntrees supprimees: ${body?.removed?.total ?? 0}`);
      setShowDuplicatesModal(false);
      setDuplicatesList([]);
      const removedKeys = new Set(duplicatesList.map((item) => item.key));
      setRaidsFaits((prev) =>
        prev.filter((raid) => {
          const raider = String(raid.raiderTwitchLogin || "").toLowerCase();
          const target = String(raid.targetTwitchLogin || "").toLowerCase();
          const date = String(raid.date || "");
          return !removedKeys.has(`${raider}|${target}|${date}`);
        })
      );
    } catch {
      alert("Erreur reseau pendant la suppression des doublons.");
    } finally {
      setDeduplicating(false);
    }
  }

  async function deleteRaidLine(input: { raider: string; target: string; date: string; modalTab: "sent" | "received" }) {
    if (deletingRaidKey) return;
    if (!confirm("Supprimer ce raid ?")) return;
    const raidKey = `${input.raider}|${input.target}|${input.date}`;
    setDeletingRaidKey(raidKey);
    try {
      const response = await fetch("/api/admin/engagement/raids-management/delete-raid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: modalMonth || selectedMonth,
          raider: input.raider,
          target: input.target,
          date: input.date,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        alert(body?.error || "Suppression impossible.");
        return;
      }
      setRaidsFaits((prev) =>
        prev.filter(
          (raid) =>
            !(
              String(raid.raiderTwitchLogin || "").toLowerCase() === input.raider &&
              String(raid.targetTwitchLogin || "").toLowerCase() === input.target &&
              String(raid.date || "") === input.date
            )
        )
      );
      setRaidsRecus((prev) =>
        prev.filter(
          (raid) =>
            !(
              String(raid.raiderTwitchLogin || "").toLowerCase() === input.raider &&
              String(raid.targetTwitchLogin || "").toLowerCase() === input.target &&
              String(raid.date || "") === input.date
            )
        )
      );
      if (input.modalTab === "sent") {
        setModalSentRaids((prev) =>
          prev.filter(
            (raid) =>
              !(
                String(raid.targetTwitchLogin || "").toLowerCase() === input.target &&
                String(raid.date || "") === input.date
              )
          )
        );
        setModalReceivedRaids((prev) =>
          prev.filter(
            (raid) =>
              !(
                String(raid.raiderTwitchLogin || "").toLowerCase() === input.raider &&
                String(raid.date || "") === input.date
              )
          )
        );
      } else {
        setModalReceivedRaids((prev) =>
          prev.filter(
            (raid) =>
              !(
                String(raid.raiderTwitchLogin || "").toLowerCase() === input.raider &&
                String(raid.date || "") === input.date
              )
          )
        );
        setModalSentRaids((prev) =>
          prev.filter(
            (raid) =>
              !(
                String(raid.targetTwitchLogin || "").toLowerCase() === input.target &&
                String(raid.date || "") === input.date
              )
          )
        );
      }
    } catch {
      alert("Erreur reseau pendant la suppression.");
    } finally {
      setDeletingRaidKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/raids" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour à Engagement
        </Link>
        <div>
          <Link
            href="/admin/engagement/raids-a-valider"
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#facc15]"
            style={{ borderColor: "rgba(250,204,21,0.4)" }}
          >
            Ouvrir raids a valider
          </Link>
        </div>
        <h1 className="mb-2 text-4xl font-bold">Historique des raids</h1>
        <p className="text-gray-400">Historique consolide relie au module de validation des raids membres.</p>
      </div>

      <div
        className="mb-6 rounded-xl border p-4"
        style={{
          borderColor: "rgba(139,92,246,0.26)",
          background: "radial-gradient(circle at 10% 8%, rgba(139,92,246,0.14), rgba(26,26,29,0.95) 42%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">Mois:</span>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#0e0e10", color: "white" }}
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "history" ? "rgba(145,70,255,0.6)" : "rgba(255,255,255,0.2)",
              color: activeTab === "history" ? "#d8b4fe" : "#cbd5e1",
            }}
          >
            Historique des raids
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "stats" ? "rgba(145,70,255,0.6)" : "rgba(255,255,255,0.2)",
              color: activeTab === "stats" ? "#d8b4fe" : "#cbd5e1",
            }}
          >
            Stats de raids
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Validation</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Declarations</p>
                <p className="font-semibold text-white">{totals.declarations}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">En attente</p>
                <p className="font-semibold text-yellow-300">{totals.pending}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">A etudier</p>
                <p className="font-semibold text-sky-300">{totals.toStudy}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Valides</p>
                <p className="font-semibold text-emerald-300">{totals.validated}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Refuses</p>
                <p className="font-semibold text-red-300">{totals.rejected}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Volumes</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Raids faits</p>
                <p className="font-semibold text-[#c4b5fd]">{totals.sent}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Raids recus</p>
                <p className="font-semibold text-[#93c5fd]">{totals.received}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Raideurs uniques</p>
                <p className="font-semibold text-[#c4b5fd]">{uniqueRaiders}</p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Cibles uniques</p>
                <p className="font-semibold text-[#93c5fd]">{uniqueTargets}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Leaders et tendances</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Top raid fait</p>
                <p className="font-semibold text-[#c4b5fd]">
                  {sentRanking[0] ? `${sentRanking[0].label} (${sentRanking[0].total})` : "Aucun"}
                </p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Top cible recue</p>
                <p className="font-semibold text-[#93c5fd]">
                  {receivedRanking[0] ? `${receivedRanking[0].label} (${receivedRanking[0].total})` : "Aucune"}
                </p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Croissance raids faits (vs moy. 3 mois)</p>
                <p className="font-semibold" style={{ color: growthSentPct === null ? "#cbd5e1" : growthSentPct >= 0 ? "#34d399" : "#f87171" }}>
                  {trendLoading ? "..." : growthSentPct === null ? "N/A" : `${growthSentPct >= 0 ? "+" : ""}${growthSentPct.toFixed(1)}%`}
                </p>
              </div>
              <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
                <p className="text-gray-400">Croissance raids recus (vs moy. 3 mois)</p>
                <p className="font-semibold" style={{ color: growthReceivedPct === null ? "#cbd5e1" : growthReceivedPct >= 0 ? "#34d399" : "#f87171" }}>
                  {trendLoading ? "..." : growthReceivedPct === null ? "N/A" : `${growthReceivedPct >= 0 ? "+" : ""}${growthReceivedPct.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des donnees...</p>
        ) : activeTab === "history" ? (
          filteredDeclarations.length === 0 ? (
            <p className="text-sm text-gray-300">Aucun raid declare sur ce mois.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Rechercher dans l'historique..."
                  className="w-full max-w-[420px] rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#101014", color: "#fff" }}
                />
                <span className="text-xs text-gray-400">
                  {filteredDeclarations.length} resultat(s)
                </span>
              </div>

              {pagedDeclarations.map((row) => {
                const badge = statusBadge(row.status);
                return (
                  <article key={row.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">
                        {row.member_display_name} ({row.member_twitch_login}) → {row.target_twitch_login}
                      </p>
                      <span
                        className="rounded-full border px-2 py-1 text-xs font-semibold"
                        style={{ borderColor: badge.border, color: badge.color, backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      {new Date(row.raid_at).toLocaleString("fr-FR")} {row.is_approximate ? "- heure approximative" : ""}
                    </p>
                    {row.note ? <p className="mt-1 text-sm text-gray-300">Note: {row.note}</p> : null}
                    {row.staff_comment ? <p className="mt-1 text-xs text-gray-400">Commentaire staff: {row.staff_comment}</p> : null}
                  </article>
                );
              })}

              {historyTotalPages > 1 ? (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    Precedent
                  </button>
                  <span className="text-xs text-gray-400">
                    Page {historyPage}/{historyTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    Suivant
                  </button>
                </div>
              ) : null}
            </div>
          )
        ) : (
          <div>
            <RaidDailyChart
              month={selectedMonth}
              data={dailyChartData}
              previousData={previousDailyChartData}
              onDaySelect={setSelectedChartDay}
            />

            {selectedDayDetails ? (
              <div className="mb-4 rounded-lg border border-gray-700 bg-[#101014] p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">Detail du jour {selectedChartDay}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedChartDay(null)}
                    className="rounded-md border px-2 py-1 text-xs text-gray-300"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    Fermer
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {selectedDayDetails.sent.reduce((sum, raid) => sum + (raid.count || 1), 0)} raid(s) fait(s) et {selectedDayDetails.received.length} raid(s) recu(s)
                </p>
              </div>
            ) : null}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatsSubTab("received")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: statsSubTab === "received" ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "received" ? "#93c5fd" : "#cbd5e1",
                  }}
                >
                  Raids recus
                </button>
                <button
                  type="button"
                  onClick={() => setStatsSubTab("sent")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: statsSubTab === "sent" ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "sent" ? "#c4b5fd" : "#cbd5e1",
                  }}
                >
                  Raids faits
                </button>
              </div>

              {canUseAdvancedTools ? (
                <button
                  type="button"
                  onClick={checkDuplicates}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{ borderColor: "rgba(251,191,36,0.45)", color: "#fcd34d", backgroundColor: "rgba(251,191,36,0.08)" }}
                  title="Detecter et nettoyer les doublons"
                >
                  Gestion doublons
                </button>
              ) : null}
            </div>

            {activeStatsRows.length === 0 ? (
              <p className="text-sm text-gray-300">Aucune donnee disponible sur ce mois.</p>
            ) : (
              <div className="space-y-2">
                {pagedStatsRows.map((item, index) => (
                  <div
                    key={`${statsSubTab}-${item.login}`}
                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#101014] px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => openStreamerModal(item.login, item.label, statsSubTab === "received" ? "received" : "sent")}
                      className="text-left text-sm text-white transition-colors hover:text-[#c4b5fd]"
                    >
                      {(statsPage - 1) * statsPerPage + index + 1}. {item.label} <span className="text-gray-400">({item.login})</span>
                    </button>
                    <span className="text-sm font-semibold" style={{ color: statsSubTab === "received" ? "#93c5fd" : "#c4b5fd" }}>
                      {item.total}
                    </span>
                  </div>
                ))}
                {statsTotalPages > 1 ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStatsPage((prev) => Math.max(1, prev - 1))}
                      disabled={statsPage === 1}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Precedent
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {statsPage}/{statsTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatsPage((prev) => Math.min(statsTotalPages, prev + 1))}
                      disabled={statsPage === statsTotalPages}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Suivant
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {showDuplicatesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowDuplicatesModal(false)}>
          <div
            className="w-full max-w-3xl rounded-xl border p-5 md:p-6"
            style={{
              borderColor: "rgba(251,191,36,0.35)",
              background: "radial-gradient(circle at 10% 8%, rgba(251,191,36,0.14), rgba(26,26,29,0.96) 40%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-white">Verification des doublons</h3>
                <p className="text-xs text-gray-400">Meme raideur, meme cible, meme date/heure</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicatesModal(false)}
                className="rounded-md border p-2 text-gray-300 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                <X size={16} />
              </button>
            </div>

            {duplicatesList.length === 0 ? (
              <p className="text-sm text-gray-300">Aucun doublon detecte pour ce mois.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-gray-300">
                  {duplicatesList.length} groupe(s) detecte(s). Une seule entree sera conservee par groupe.
                </p>
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {duplicatesList.map((dup) => (
                    <div key={dup.key} className="rounded-lg border border-gray-700 bg-[#101014] px-3 py-2">
                      <p className="text-sm text-white">
                        {dup.raiderLabel} <span className="text-gray-500">({dup.raider})</span> → {dup.targetLabel} <span className="text-gray-500">({dup.target})</span>
                      </p>
                      <p className="text-xs text-gray-400">{new Date(dup.date).toLocaleString("fr-FR")} - {dup.count} entrees</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDuplicatesModal(false)}
                    className="rounded-md border px-3 py-1.5 text-xs font-semibold text-gray-300"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={runDeduplicate}
                    disabled={deduplicating}
                    className="rounded-md border px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:opacity-50"
                    style={{ borderColor: "rgba(251,191,36,0.5)", backgroundColor: "rgba(251,191,36,0.14)" }}
                  >
                    {deduplicating ? "Suppression..." : "Supprimer les doublons"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {selectedStreamer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedStreamer(null)}>
          <div
            className="w-full max-w-4xl rounded-xl border p-5 md:p-6"
            style={{
              borderColor: "rgba(139,92,246,0.35)",
              background: "radial-gradient(circle at 10% 8%, rgba(139,92,246,0.16), rgba(26,26,29,0.96) 38%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-white">Les raids de {selectedStreamer.label}</h3>
                <p className="text-xs text-gray-400">({selectedStreamer.login})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStreamer(null)}
                className="rounded-md border p-2 text-gray-300 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-300">Mois:</span>
              <select
                value={modalMonth}
                onChange={(event) => setModalMonth(event.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#0e0e10", color: "white" }}
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(167,139,250,0.45)", backgroundColor: "rgba(167,139,250,0.1)" }}>
                <p className="text-xs text-gray-300">Raids envoyés</p>
                <p className="text-xl font-semibold text-[#c4b5fd]">{modalSentRaids.reduce((sum, raid) => sum + (raid.count || 1), 0)}</p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(96,165,250,0.45)", backgroundColor: "rgba(96,165,250,0.1)" }}>
                <p className="text-xs text-gray-300">Raids reçus</p>
                <p className="text-xl font-semibold text-[#93c5fd]">{modalReceivedRaids.length}</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalTab("sent")}
                className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: modalTab === "sent" ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.18)",
                  color: modalTab === "sent" ? "#c4b5fd" : "#cbd5e1",
                }}
              >
                Fait
              </button>
              <button
                type="button"
                onClick={() => setModalTab("received")}
                className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: modalTab === "received" ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
                  color: modalTab === "received" ? "#93c5fd" : "#cbd5e1",
                }}
              >
                Recu
              </button>
            </div>

            {modalError ? <p className="mb-2 text-sm text-red-300">{modalError}</p> : null}
            {modalLoading ? (
              <p className="text-sm text-gray-300">Chargement des details...</p>
            ) : modalTab === "sent" ? (
              modalSentRaids.length === 0 ? (
                <p className="text-sm text-gray-300">Aucun raid fait sur ce mois.</p>
              ) : (
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {modalSentRaids.map((raid, index) => (
                    <div key={`sent-${index}-${raid.date}`} className="rounded-lg border border-gray-700 bg-[#101014] px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-white">
                          Pseudo cible: <span className="text-[#c4b5fd]">{raid.targetDisplayName || raid.targetTwitchLogin || "Inconnu"}</span>
                        </p>
                        {canUseAdvancedTools ? (
                          <button
                            type="button"
                            onClick={() =>
                              deleteRaidLine({
                                raider: String(selectedStreamer?.login || "").toLowerCase(),
                                target: String(raid.targetTwitchLogin || "").toLowerCase(),
                                date: String(raid.date || ""),
                                modalTab: "sent",
                              })
                            }
                            disabled={
                              deletingRaidKey ===
                              `${String(selectedStreamer?.login || "").toLowerCase()}|${String(raid.targetTwitchLogin || "").toLowerCase()}|${String(raid.date || "")}`
                            }
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-red-300 disabled:opacity-50"
                            style={{ borderColor: "rgba(248,113,113,0.45)", backgroundColor: "rgba(248,113,113,0.1)" }}
                            title="Supprimer ce raid"
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400">{new Date(raid.date).toLocaleString("fr-FR")} {raid.count ? `- x${raid.count}` : ""}</p>
                    </div>
                  ))}
                </div>
              )
            ) : modalReceivedRaids.length === 0 ? (
              <p className="text-sm text-gray-300">Aucun raid recu sur ce mois.</p>
            ) : (
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {modalReceivedRaids.map((raid, index) => (
                  <div key={`received-${index}-${raid.date}`} className="rounded-lg border border-gray-700 bg-[#101014] px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white">
                        Pseudo raider: <span className="text-[#93c5fd]">{raid.raiderDisplayName || raid.raiderTwitchLogin || "Inconnu"}</span>
                      </p>
                      {canUseAdvancedTools ? (
                        <button
                          type="button"
                          onClick={() =>
                            deleteRaidLine({
                              raider: String(raid.raiderTwitchLogin || "").toLowerCase(),
                              target: String(selectedStreamer?.login || "").toLowerCase(),
                              date: String(raid.date || ""),
                              modalTab: "received",
                            })
                          }
                          disabled={
                            deletingRaidKey ===
                            `${String(raid.raiderTwitchLogin || "").toLowerCase()}|${String(selectedStreamer?.login || "").toLowerCase()}|${String(raid.date || "")}`
                          }
                          className="rounded-md border px-2 py-1 text-[11px] font-semibold text-red-300 disabled:opacity-50"
                          style={{ borderColor: "rgba(248,113,113,0.45)", backgroundColor: "rgba(248,113,113,0.1)" }}
                          title="Supprimer ce raid"
                        >
                          Supprimer
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(raid.date).toLocaleString("fr-FR")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
