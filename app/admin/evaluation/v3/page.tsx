"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { V3_STATUS_LABELS, type V3RecommendedStatus } from "@/lib/evaluationV3Scoring";

type SnapshotRow = {
  twitchLogin: string;
  displayName: string;
  role: string;
  isActive: boolean;
  auto: {
    raidsDone: number;
    eventsPresent: number;
    spotlightPresent: number;
    discordMessages: number;
    discordVocalMinutes: number;
    discordReactions: number;
    regularityActiveMonths: number;
  };
  resolved: {
    raidsDone: number;
    raidsOtherSupport: boolean;
    eventsPresent: number;
    spotlightPresent: number;
    nbMessages: number;
    nbVocalMinutes: number;
    nbReactions: number;
    regularityActiveMonths: number;
    bonusStaff: number;
    malusStaff: number;
  };
  scores: {
    raids: number;
    discord: number;
    events: number;
    spotlight: number;
    regularite: number;
    bonus: number;
    malus: number;
    total: number;
  };
  recommendedStatus: V3RecommendedStatus;
};

type SnapshotPayload = {
  success: boolean;
  month: string;
  rows: SnapshotRow[];
  meta?: { regularityThreshold: number; note: string };
  error?: string;
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return options;
}

function formatMonthKey(key: string): string {
  const [y, m] = key.split("-");
  const names = [
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
  return `${names[Math.max(0, Number(m) - 1)]} ${y}`;
}

export default function EvaluationV3Page() {
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams?.get("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl)) return monthFromUrl;
    return getCurrentMonthKey();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SnapshotPayload | null>(null);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    if (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl)) {
      setSelectedMonth(monthFromUrl);
    }
  }, [monthFromUrl]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/evaluations/v3/snapshot?month=${selectedMonth}`, { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as SnapshotPayload;
        if (!res.ok) throw new Error(json.error || "Chargement impossible");
        if (mounted) setData(json);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [selectedMonth]);

  const filtered = useMemo(() => {
    let rows = data?.rows || [];
    if (!includeInactive) rows = rows.filter((r) => r.isActive);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.displayName.toLowerCase().includes(q) ||
          r.twitchLogin.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, search, includeInactive]);

  const stats = useMemo(() => {
    const n = filtered.length;
    if (n === 0) return { n: 0, avg: 0, vip: 0, low: 0 };
    const avg = filtered.reduce((s, r) => s + r.scores.total, 0) / n;
    const vip = filtered.filter((r) => r.scores.total >= 85).length;
    const low = filtered.filter((r) => r.scores.total < 35).length;
    return { n, avg, vip, low };
  }, [filtered]);

  return (
    <div className="min-h-screen text-white p-8 space-y-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/evaluation" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ← Retour au pilotage évaluation
          </Link>
          <h1 className="text-3xl font-bold mt-2">Évaluation v3 — vue globale /100</h1>
          <p className="text-sm mt-1 max-w-3xl" style={{ color: "var(--color-text-secondary)" }}>
            Barème cible : raids 25, Discord 20, events TENF 20, spotlight 20, régularité (3 mois) 10, bonus staff 5,
            malus incidents jusqu&apos;à −30. Les volumes events / spotlight / raids viennent des données TENF existantes ;
            Discord /20 reprend le barème v1 (B) : max(note écrit, note vocal) sur 5, ramené sur 20. Import + saisie
            manuelle. La régularité utilise pour l&apos;instant un proxy sur la
            note synthèse legacy (voir encadré ci-dessous).
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/admin/evaluation/v3/pilotage?month=${selectedMonth}`}
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "#9146ff", color: "white" }}
          >
            Pilotage manuel v3
          </Link>
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Mois
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {getMonthOptions().map((m) => (
              <option key={m} value={m}>
                {formatMonthKey(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data?.meta?.note && (
        <div
          className="rounded-lg border p-3 text-xs space-y-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
        >
          <p className="font-semibold text-[var(--color-text)]">Régularité (automatique)</p>
          <p>{data.meta.note}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
          className="w-full max-w-sm rounded-lg px-3 py-2 border text-sm"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
        <label className="text-sm flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          Inclure inactifs
        </label>
      </div>

      {loading && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          Chargement du snapshot v3…
        </div>
      )}

      {error && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "#dc2626", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Membres affichés
              </p>
              <p className="text-xl font-bold">{stats.n}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Moyenne totale /100
              </p>
              <p className="text-xl font-bold">{stats.n ? stats.avg.toFixed(1) : "—"}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Candidats VIP (≥85)
              </p>
              <p className="text-xl font-bold">{stats.vip}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Score &lt; 35
              </p>
              <p className="text-xl font-bold">{stats.low}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <table className="w-full text-xs min-w-[1100px]">
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface)" }}>
                  <th className="px-2 py-2 text-left">Membre</th>
                  <th className="px-2 py-2 text-center">Raids /25</th>
                  <th className="px-2 py-2 text-center">Discord /20</th>
                  <th className="px-2 py-2 text-center">Events /20</th>
                  <th className="px-2 py-2 text-center">Spotlight /20</th>
                  <th className="px-2 py-2 text-center">Régul. /10</th>
                  <th className="px-2 py-2 text-center">Bonus</th>
                  <th className="px-2 py-2 text-center">Malus</th>
                  <th className="px-2 py-2 text-center">Total</th>
                  <th className="px-2 py-2 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.twitchLogin} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                    <td className="px-2 py-2">
                      <div className="font-medium text-sm">{row.displayName}</div>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        {row.twitchLogin} · {row.role}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">{row.scores.raids}</td>
                    <td className="px-2 py-2 text-center">{row.scores.discord}</td>
                    <td className="px-2 py-2 text-center">{row.scores.events}</td>
                    <td className="px-2 py-2 text-center">{row.scores.spotlight}</td>
                    <td className="px-2 py-2 text-center">{row.scores.regularite}</td>
                    <td className="px-2 py-2 text-center">{row.scores.bonus}</td>
                    <td className="px-2 py-2 text-center">{row.scores.malus || "—"}</td>
                    <td className="px-2 py-2 text-center font-semibold text-sm">{row.scores.total}</td>
                    <td className="px-2 py-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                      {V3_STATUS_LABELS[row.recommendedStatus]}
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
