"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type MemberRow = {
  twitchLogin: string;
  displayName: string;
  role: string;
};

type V2ScoreRow = {
  twitchLogin: string;
  totals: {
    totalWithBonus: number;
  };
  blocs: {
    bloc1VisibleSupport: number;
    bloc2Discord: number;
    bloc3Regularite: number;
    bloc4ImplicationGlobale: number;
  };
  details: {
    bonus: { capped: number };
    autoScores?: {
      bloc1: number;
      bloc2: number;
      bloc3: number;
      bloc4: number;
      bonus: number;
      totalWithoutBonus: number;
      totalWithBonus: number;
    };
    manualOverride?: {
      bloc1?: number;
      bloc2?: number;
      bloc3?: number;
      bloc4?: number;
      bonus?: number;
      reason?: string;
    };
  };
};

type OverrideEdit = {
  bloc1?: number;
  bloc2?: number;
  bloc3?: number;
  bloc4?: number;
  bonus?: number;
  reason?: string;
};

type ScoreField = "bloc1" | "bloc2" | "bloc3" | "bloc4" | "bonus";
const SCORE_FIELDS: ScoreField[] = ["bloc1", "bloc2", "bloc3", "bloc4", "bonus"];

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

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export default function EvaluationV2PilotagePage() {
  const searchParams = useSearchParams();
  const initialSystem = searchParams.get("system") === "new" ? "new" : "legacy";
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedSystem, setSelectedSystem] = useState<"legacy" | "new">(initialSystem);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [scores, setScores] = useState<Record<string, V2ScoreRow>>({});
  const [edits, setEdits] = useState<Record<string, OverrideEdit>>({});

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, resultRes] = await Promise.all([
        fetch("/api/admin/members", { cache: "no-store" }),
        fetch(`/api/evaluations/v2/result?month=${selectedMonth}&system=${selectedSystem}`, { cache: "no-store" }),
      ]);

      if (!membersRes.ok) throw new Error("Impossible de charger les membres");
      if (!resultRes.ok) {
        const payload = await resultRes.json().catch(() => ({}));
        throw new Error(payload.error || "Impossible de charger les résultats v2");
      }

      const membersPayload = await membersRes.json();
      const resultPayload = await resultRes.json();

      const list: MemberRow[] = (membersPayload.members || [])
        .filter((m: any) => m?.twitchLogin)
        .map((m: any) => ({
          twitchLogin: String(m.twitchLogin).toLowerCase(),
          displayName: m.displayName || m.twitchLogin,
          role: m.role || "Affilié",
        }))
        .sort((a: MemberRow, b: MemberRow) => a.displayName.localeCompare(b.displayName));

      const scoreMap: Record<string, V2ScoreRow> = {};
      for (const row of resultPayload.rows || []) {
        scoreMap[String(row.twitchLogin).toLowerCase()] = row as V2ScoreRow;
      }

      setMembers(list);
      setScores(scoreMap);
      setEdits({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedMonth, selectedSystem]);

  const labels = selectedSystem === "new"
    ? {
        b1: "Soutien visible",
        b2: "Engagement Discord",
        b3: "Soutien réseau",
        b4: "Fiabilité",
      }
    : {
        b1: "Mise en avant & soutien visible",
        b2: "Engagement Discord",
        b3: "Régularité communautaire",
        b4: "Implication globale",
      };

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (m) => m.displayName.toLowerCase().includes(query) || m.twitchLogin.toLowerCase().includes(query) || m.role.toLowerCase().includes(query)
    );
  }, [members, search]);

  const hasAnyChanges = useMemo(() => {
    return members.some((member) => hasScoreChanges(member.twitchLogin, scores[member.twitchLogin]));
  }, [members, scores, edits]);

  function getAutoScore(row: V2ScoreRow | undefined, field: ScoreField): number | undefined {
    if (!row) return undefined;
    if (field === "bloc1") return row.details?.autoScores?.bloc1 ?? row.blocs.bloc1VisibleSupport;
    if (field === "bloc2") return row.details?.autoScores?.bloc2 ?? row.blocs.bloc2Discord;
    if (field === "bloc3") return row.details?.autoScores?.bloc3 ?? row.blocs.bloc3Regularite;
    if (field === "bloc4") return row.details?.autoScores?.bloc4 ?? row.blocs.bloc4ImplicationGlobale;
    return row.details?.autoScores?.bonus ?? row.details?.bonus?.capped;
  }

  function getBaseScore(row: V2ScoreRow | undefined, field: ScoreField): number | undefined {
    if (!row) return undefined;
    const manual = row.details?.manualOverride;
    if (field === "bloc1" && typeof manual?.bloc1 === "number") return manual.bloc1;
    if (field === "bloc2" && typeof manual?.bloc2 === "number") return manual.bloc2;
    if (field === "bloc3" && typeof manual?.bloc3 === "number") return manual.bloc3;
    if (field === "bloc4" && typeof manual?.bloc4 === "number") return manual.bloc4;
    if (field === "bonus" && typeof manual?.bonus === "number") return manual.bonus;
    return getAutoScore(row, field);
  }

  function getDisplayedScore(login: string, row: V2ScoreRow | undefined, field: ScoreField): number | undefined {
    const edited = edits[login]?.[field];
    if (typeof edited === "number") return edited;
    return getBaseScore(row, field);
  }

  function getDisplayedReason(login: string, row: V2ScoreRow | undefined): string {
    const edited = edits[login]?.reason;
    if (typeof edited === "string") return edited;
    return row?.details?.manualOverride?.reason || "";
  }

  function hasScoreChanges(login: string, row: V2ScoreRow | undefined): boolean {
    return SCORE_FIELDS.some((field) => {
      const base = getBaseScore(row, field);
      const displayed = getDisplayedScore(login, row, field);
      if (base === undefined && displayed === undefined) return false;
      if (base === undefined || displayed === undefined) return true;
      return Math.abs(base - displayed) > 0.0001;
    });
  }

  function setEdit(login: string, patch: Partial<OverrideEdit>) {
    setEdits((prev) => ({
      ...prev,
      [login]: {
        ...prev[login],
        ...patch,
      },
    }));
  }

  async function saveOne(login: string) {
    const row = scores[login];
    if (!row) throw new Error(`Aucun score v2 trouvé pour ${login}`);

    if (!hasScoreChanges(login, row)) {
      return;
    }

    const reason = getDisplayedReason(login, row).trim();
    if (!reason) {
      throw new Error(`La raison est obligatoire pour ${login} car une note a été modifiée manuellement`);
    }

    const bloc1 = getDisplayedScore(login, row, "bloc1");
    const bloc2 = getDisplayedScore(login, row, "bloc2");
    const bloc3 = getDisplayedScore(login, row, "bloc3");
    const bloc4 = getDisplayedScore(login, row, "bloc4");
    const bonus = getDisplayedScore(login, row, "bonus");

    const response = await fetch("/api/evaluations/v2/manual-overrides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: selectedMonth,
        system: selectedSystem,
        twitchLogin: login,
        bloc1,
        bloc2,
        bloc3,
        bloc4,
        bonus,
        reason,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Erreur de sauvegarde pour ${login}`);
    }
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    try {
      const logins = members
        .map((member) => member.twitchLogin)
        .filter((login) => hasScoreChanges(login, scores[login]));

      if (logins.length === 0) {
        return;
      }

      for (const login of logins) {
        await saveOne(login);
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-8 text-white space-y-5" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href={`/admin/evaluation/v2?system=${selectedSystem}`} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ← Retour à l'évaluation v2
          </Link>
          <div className="mt-1">
            <Link href={`/admin/evaluation/v2/guide?system=${selectedSystem}`} className="text-sm underline" style={{ color: "var(--color-text-secondary)" }}>
              Ouvrir le guide évaluation v2
            </Link>
          </div>
          <div className="mt-1">
            <Link href="/admin/evaluation/v2/sources" className="text-sm underline" style={{ color: "var(--color-text-secondary)" }}>
              Ouvrir le pilotage des données manquantes
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">Pilotage manuel v2</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Override manuel des notes (valeurs sur 5) - système {selectedSystem}. La raison est obligatoire si une note est modifiée manuellement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value as "legacy" | "new")}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <option value="legacy">Système legacy</option>
            <option value="new">Nouveau système</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg px-3 py-2 border text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {getMonthOptions().map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={saveAll}
            disabled={saving || !hasAnyChanges}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: saving || !hasAnyChanges ? "#374151" : "#10b981", color: "white" }}
          >
            {saving ? "Enregistrement..." : "Enregistrer tous les overrides"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full max-w-sm rounded-lg px-3 py-2 border text-sm"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
      </div>

      {error && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "#dc2626", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          Chargement...
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="px-3 py-2 text-left">Membre</th>
                <th className="px-3 py-2 text-center">Score actuel</th>
                <th className="px-3 py-2 text-center">{labels.b1}</th>
                <th className="px-3 py-2 text-center">{labels.b2}</th>
                <th className="px-3 py-2 text-center">{labels.b3}</th>
                <th className="px-3 py-2 text-center">{labels.b4}</th>
                <th className="px-3 py-2 text-center">Bonus</th>
                <th className="px-3 py-2 text-left">Raison</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const login = member.twitchLogin;
                const row = scores[login];
                const bloc1Value = getDisplayedScore(login, row, "bloc1");
                const bloc2Value = getDisplayedScore(login, row, "bloc2");
                const bloc3Value = getDisplayedScore(login, row, "bloc3");
                const bloc4Value = getDisplayedScore(login, row, "bloc4");
                const bonusValue = getDisplayedScore(login, row, "bonus");
                const reasonValue = getDisplayedReason(login, row);
                const hasChanges = hasScoreChanges(login, row);
                return (
                  <tr key={login} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{member.displayName}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {member.twitchLogin} · {member.role}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">{row?.totals.totalWithBonus?.toFixed(2) ?? "-"}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.01}
                        value={bloc1Value ?? ""}
                        onChange={(e) => setEdit(login, { bloc1: toNumberOrUndefined(e.target.value) })}
                        className="w-16 rounded border px-2 py-1 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Auto: {getAutoScore(row, "bloc1")?.toFixed(2) ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.01}
                        value={bloc2Value ?? ""}
                        onChange={(e) => setEdit(login, { bloc2: toNumberOrUndefined(e.target.value) })}
                        className="w-16 rounded border px-2 py-1 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Auto: {getAutoScore(row, "bloc2")?.toFixed(2) ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.01}
                        value={bloc3Value ?? ""}
                        onChange={(e) => setEdit(login, { bloc3: toNumberOrUndefined(e.target.value) })}
                        className="w-16 rounded border px-2 py-1 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Auto: {getAutoScore(row, "bloc3")?.toFixed(2) ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.01}
                        value={bloc4Value ?? ""}
                        onChange={(e) => setEdit(login, { bloc4: toNumberOrUndefined(e.target.value) })}
                        className="w-16 rounded border px-2 py-1 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Auto: {getAutoScore(row, "bloc4")?.toFixed(2) ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.01}
                        value={bonusValue ?? ""}
                        onChange={(e) => setEdit(login, { bonus: toNumberOrUndefined(e.target.value) })}
                        className="w-16 rounded border px-2 py-1 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Auto: {getAutoScore(row, "bonus")?.toFixed(2) ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={reasonValue}
                        onChange={(e) => setEdit(login, { reason: e.target.value })}
                        placeholder="Raison (obligatoire si modification)"
                        className="w-full min-w-44 rounded border px-2 py-1"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={async () => {
                          try {
                            setSaving(true);
                            await saveOne(login);
                            await loadData();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Erreur inconnue");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="rounded px-3 py-1 text-xs"
                        disabled={saving || !hasChanges}
                        style={{ backgroundColor: saving || !hasChanges ? "#374151" : "#3b82f6", color: "white" }}
                      >
                        Sauver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

