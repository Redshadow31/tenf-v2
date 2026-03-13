"use client";

import { useEffect, useMemo, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

type RaidEntry = {
  date: string;
  count?: number;
  targetDisplayName?: string;
  targetTwitchLogin?: string;
  raiderTwitchLogin?: string;
  source?: string;
};

export default function MemberRaidHistoryPage() {
  const { data: overview, loading: loadingOverview } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (!selectedMonth || !overview?.member?.twitchLogin) return;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: RaidEntry) => (raid.raiderTwitchLogin || "").toLowerCase() === overview.member.twitchLogin.toLowerCase()
        );
        setRaids(mine);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMonth, overview?.member?.twitchLogin]);

  const last12Months = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(base.getFullYear(), base.getMonth() - idx, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  if (loadingOverview) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (!overview) return <EmptyFeatureCard title="Historique de mes raids" description="Impossible de charger ton profil membre." />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Historique de mes raids" description="Consulte les raids declares sur le mois selectionne." />
      <section className="rounded-xl border p-5 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Mois
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
        >
          {last12Months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </section>
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des raids...</p>
        ) : raids.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucun raid trouve pour ce mois.</p>
        ) : (
          <div className="space-y-2">
            {raids.map((raid, idx) => (
              <div key={`${raid.date}-${idx}`} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>
                  {raid.targetDisplayName || raid.targetTwitchLogin || "Cible"} - x{raid.count || 1}
                </p>
                <p style={{ color: "var(--color-text-secondary)" }}>{new Date(raid.date).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}
