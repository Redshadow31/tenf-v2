"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

type RaidEntry = {
  id: string;
  source: "manual" | "raids_sub";
  eventAt: string;
  targetLogin: string;
  targetLabel: string;
  viewers: number | null;
  raidStatus: "validated" | "pending" | "rejected";
  raidStatusLabel: string;
  pointsStatus: "awarded" | "pending";
  pointsStatusLabel: string;
  note: string | null;
};

type RaidHistoryResponse = {
  month: string;
  months: string[];
  entries: RaidEntry[];
  summary: {
    total: number;
    validated: number;
    pending: number;
    rejected: number;
    pointsAwarded: number;
    pointsPending: number;
  };
};

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function statusRaidBadge(status: RaidEntry["raidStatus"]) {
  if (status === "validated") {
    return { border: "rgba(52,211,153,0.45)", bg: "rgba(52,211,153,0.12)", color: "#34d399" };
  }
  if (status === "rejected") {
    return { border: "rgba(248,113,113,0.45)", bg: "rgba(248,113,113,0.12)", color: "#f87171" };
  }
  return { border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.12)", color: "#facc15" };
}

function statusPointsBadge(status: RaidEntry["pointsStatus"]) {
  if (status === "awarded") {
    return { border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.12)", color: "#93c5fd" };
  }
  return { border: "rgba(167,139,250,0.45)", bg: "rgba(167,139,250,0.12)", color: "#c4b5fd" };
}

export default function MemberRaidHistoryPage() {
  const { data: overview, loading: loadingOverview } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [months, setMonths] = useState<string[]>([]);
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [summary, setSummary] = useState<RaidHistoryResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (!selectedMonth || !overview?.member?.twitchLogin) return;
    (async () => {
      setLoading(true);
      try {
        setError("");
        const response = await fetch(`/api/members/me/raids-history?month=${encodeURIComponent(selectedMonth)}`, {
          cache: "no-store",
        });
        const body = (await response.json()) as RaidHistoryResponse & { error?: string };
        if (!response.ok) {
          throw new Error(body.error || "Impossible de charger l'historique.");
        }
        setRaids(body.entries || []);
        setSummary(body.summary || null);
        setMonths(body.months || []);
      } finally {
        setLoading(false);
      }
    })().catch((e) => {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
      setRaids([]);
      setSummary(null);
      setMonths([]);
    });
  }, [selectedMonth, overview?.member?.twitchLogin]);

  if (loadingOverview) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (!overview) return <EmptyFeatureCard title="Mes raids" description="Impossible de charger ton profil membre." />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes raids" description="Historique consolidé de tes raids." badge="Historique" />

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(25,25,31,0.96) 42%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
              Header Mes raid
            </p>
            <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Tri par mois - mois en cours par défaut
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Affichage chronologique avec statuts de validation et de points.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <label className="mb-1 block text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Mois
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(10,10,14,0.55)", color: "var(--color-text)" }}
            >
              {(months.length > 0 ? months : [selectedMonth]).map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card label="Raids du mois" value={summary?.total ?? 0} icon={<Sparkles size={15} />} />
        <Card label="Raids valides" value={summary?.validated ?? 0} icon={<ShieldCheck size={15} />} />
        <Card label="Points attribues" value={summary?.pointsAwarded ?? 0} icon={<Clock3 size={15} />} />
      </section>

      {error ? (
        <section className="rounded-xl border p-4" style={{ borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(127,29,29,0.25)" }}>
          <p className="text-sm text-red-200">{error}</p>
        </section>
      ) : null}

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={16} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Timeline des raids
          </h3>
        </div>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des raids...</p>
        ) : raids.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucun raid trouve pour ce mois.</p>
        ) : (
          <div className="space-y-2">
            {raids.map((raid) => (
              <article
                key={raid.id}
                className="rounded-lg border px-3 py-3 text-sm"
                style={{
                  borderColor: "rgba(239,68,68,0.35)",
                  backgroundColor: "rgba(239,68,68,0.07)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p style={{ color: "var(--color-text)" }}>
                    {raid.targetLabel}{" "}
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      ({raid.targetLogin || "inconnu"})
                    </span>
                  </p>
                </div>

                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(raid.eventAt).toLocaleString("fr-FR")}
                  {typeof raid.viewers === "number" ? ` - viewers: ${raid.viewers}` : ""}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: statusRaidBadge(raid.raidStatus).border,
                      color: statusRaidBadge(raid.raidStatus).color,
                      backgroundColor: statusRaidBadge(raid.raidStatus).bg,
                    }}
                  >
                    Statut raid: {raid.raidStatusLabel}
                  </span>
                  <span
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: statusPointsBadge(raid.pointsStatus).border,
                      color: statusPointsBadge(raid.pointsStatus).color,
                      backgroundColor: statusPointsBadge(raid.pointsStatus).bg,
                    }}
                  >
                    Statut points: {raid.pointsStatusLabel}
                  </span>
                </div>

                {raid.note ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Note: {raid.note}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

function Card({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="mb-1 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </article>
  );
}
