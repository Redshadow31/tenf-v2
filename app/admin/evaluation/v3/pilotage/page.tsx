"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DiscordEngagementImportModal from "@/components/admin/DiscordEngagementImportModal";
import {
  calculateNoteEcrit,
  calculateNoteFinale,
  calculateNoteVocal,
  getAppreciation,
  type EngagementRow,
} from "@/lib/discordEngagement";
import type { MemberEngagement } from "@/lib/discordEngagementStorage";
import { scoreV3DiscordBlock } from "@/lib/evaluationV3Scoring";
import type { EvaluationV3PilotageEntry } from "@/lib/evaluationV3PilotageStorage";

type ActiveMember = {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  role?: string;
  createdAt?: string;
  isActive?: boolean;
};

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
  pilotage: EvaluationV3PilotageEntry | null;
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
};

type TabId = "discord" | "pillars";

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

function parseInt0(v: string): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseFloat0(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Chaîne vide → null (utiliser l’auto), sinon entier ≥ 0. */
function parseOverrideInt(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function EvaluationV3PilotagePage() {
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams?.get("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl)) return monthFromUrl;
    return getCurrentMonthKey();
  });
  const [tab, setTab] = useState<TabId>("discord");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [savingLogin, setSavingLogin] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [membersMap, setMembersMap] = useState<
    Map<string, { discordId: string; displayName: string; twitchLogin: string }>
  >(() => new Map());
  const [engagementData, setEngagementData] = useState<Record<string, MemberEngagement>>({});
  const [hasMessagesImport, setHasMessagesImport] = useState(false);
  const [hasVocalsImport, setHasVocalsImport] = useState(false);
  const [messagesImportedAt, setMessagesImportedAt] = useState<string | undefined>();
  const [vocalsImportedAt, setVocalsImportedAt] = useState<string | undefined>();
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showVocalsModal, setShowVocalsModal] = useState(false);
  const [savingEngagement, setSavingEngagement] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(false);

  const [discordEdits, setDiscordEdits] = useState<
    Record<
      string,
      {
        nbMessages: string;
        nbVocalMinutes: string;
        nbReactions: string;
        reason: string;
        staffNote: string;
      }
    >
  >({});

  const [pillarEdits, setPillarEdits] = useState<
    Record<
      string,
      {
        raidsOverride: string;
        raidsOther: boolean;
        eventsOverride: string;
        spotlightOverride: string;
        regularityOverride: string;
        bonus: string;
        malus: string;
        reason: string;
        staffNote: string;
      }
    >
  >({});

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/v3/snapshot?month=${selectedMonth}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      const list = (json.rows || []) as SnapshotRow[];
      setRows(list);

      const dEdits: typeof discordEdits = {};
      const pEdits: typeof pillarEdits = {};
      for (const r of list) {
        dEdits[r.twitchLogin] = {
          nbMessages: String(r.resolved.nbMessages),
          nbVocalMinutes: String(r.resolved.nbVocalMinutes),
          nbReactions: String(r.resolved.nbReactions),
          reason: r.pilotage?.discord?.reason || "",
          staffNote: r.pilotage?.discord?.staffNote || "",
        };
        pEdits[r.twitchLogin] = {
          raidsOverride:
            r.pilotage?.raidsDoneOverride !== undefined && r.pilotage?.raidsDoneOverride !== null
              ? String(r.pilotage.raidsDoneOverride)
              : "",
          raidsOther: Boolean(r.pilotage?.raidsOtherSupport),
          eventsOverride:
            r.pilotage?.eventsPresentOverride !== undefined && r.pilotage?.eventsPresentOverride !== null
              ? String(r.pilotage.eventsPresentOverride)
              : "",
          spotlightOverride:
            r.pilotage?.spotlightPresentOverride !== undefined && r.pilotage?.spotlightPresentOverride !== null
              ? String(r.pilotage.spotlightPresentOverride)
              : "",
          regularityOverride:
            r.pilotage?.regularityMonthsOverride !== undefined && r.pilotage?.regularityMonthsOverride !== null
              ? String(r.pilotage.regularityMonthsOverride)
              : "",
          bonus: String(r.resolved.bonusStaff ?? 0),
          malus: String(r.resolved.malusStaff ?? 0),
          reason: r.pilotage?.pillarsReason || "",
          staffNote: r.pilotage?.pillarsStaffNote || "",
        };
      }
      setDiscordEdits(dEdits);
      setPillarEdits(pEdits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl)) setSelectedMonth(monthFromUrl);
  }, [monthFromUrl]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      try {
        const res = await fetch("/api/admin/members", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const all = (data.members || []).filter((m: { discordId?: string; twitchLogin?: string }) => m.discordId && m.twitchLogin);
        const members: ActiveMember[] = all
          .map((m: { discordId: string; displayName?: string; twitchLogin: string; role?: string; createdAt?: string; isActive?: boolean }) => ({
            discordId: m.discordId,
            displayName: m.displayName || m.twitchLogin,
            twitchLogin: m.twitchLogin,
            role: m.role,
            createdAt: m.createdAt,
            isActive: m.isActive !== false,
          }))
          .sort((a: ActiveMember, b: ActiveMember) => a.displayName.localeCompare(b.displayName));
        if (cancelled) return;
        setActiveMembers(members);
        const map = new Map<string, { discordId: string; displayName: string; twitchLogin: string }>();
        for (const m of all) {
          map.set(m.discordId, {
            discordId: m.discordId,
            displayName: m.displayName || m.twitchLogin,
            twitchLogin: m.twitchLogin,
          });
        }
        setMembersMap(map);
      } catch {
        // ignore
      }
    }
    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadEngagement() {
      setLoadingEngagement(true);
      try {
        const res = await fetch(`/api/discord-engagement/${selectedMonth}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.data) {
          setEngagementData(data.data.dataByMember || {});
          setHasMessagesImport(!!data.data.hasMessagesImport);
          setHasVocalsImport(!!data.data.hasVocalsImport);
          setMessagesImportedAt(data.data.messagesImportedAt);
          setVocalsImportedAt(data.data.vocalsImportedAt);
        } else {
          setEngagementData({});
          setHasMessagesImport(false);
          setHasVocalsImport(false);
          setMessagesImportedAt(undefined);
          setVocalsImportedAt(undefined);
        }
      } catch {
        if (!cancelled) {
          setEngagementData({});
        }
      } finally {
        if (!cancelled) setLoadingEngagement(false);
      }
    }
    void loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.twitchLogin.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function setDiscordEdit(login: string, patch: Partial<(typeof discordEdits)[string]>) {
    setDiscordEdits((prev) => ({
      ...prev,
      [login]: { ...prev[login], ...patch },
    }));
  }

  function setPillarEdit(login: string, patch: Partial<(typeof pillarEdits)[string]>) {
    setPillarEdits((prev) => ({
      ...prev,
      [login]: { ...prev[login], ...patch },
    }));
  }

  async function saveDiscord(login: string) {
    const e = discordEdits[login];
    if (!e) return;
    const reason = e.reason.trim();
    if (!reason) throw new Error("La raison Discord est obligatoire.");
    const res = await fetch("/api/evaluations/v3/manual-discord", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: selectedMonth,
        twitchLogin: login,
        nbMessages: parseInt0(e.nbMessages),
        nbVocalMinutes: parseFloat0(e.nbVocalMinutes),
        nbReactions: parseInt0(e.nbReactions),
        reason,
        staffNote: e.staffNote.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Erreur sauvegarde Discord");
    }
  }

  async function savePillars(login: string) {
    const e = pillarEdits[login];
    if (!e) return;
    const reason = e.reason.trim();
    if (!reason) throw new Error("La raison (piliers / bonus) est obligatoire.");
    const res = await fetch("/api/evaluations/v3/pilotage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: selectedMonth,
        twitchLogin: login,
        raidsDoneOverride: parseOverrideInt(e.raidsOverride),
        raidsOtherSupport: e.raidsOther,
        eventsPresentOverride: parseOverrideInt(e.eventsOverride),
        spotlightPresentOverride: parseOverrideInt(e.spotlightOverride),
        regularityMonthsOverride: parseOverrideInt(e.regularityOverride),
        bonusStaff: parseFloat0(e.bonus),
        malusStaff: parseFloat0(e.malus),
        pillarsReason: reason,
        pillarsStaffNote: e.staffNote.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.error || "Erreur sauvegarde piliers");
    }
  }

  function syncDiscordEditsFromEngagement(nextByMember: Record<string, MemberEngagement>) {
    setDiscordEdits((prev) => {
      const next = { ...prev };
      for (const eng of Object.values(nextByMember)) {
        const login = String(eng.twitchLogin || "").trim().toLowerCase();
        if (!login) continue;
        const row = prev[login];
        next[login] = {
          nbMessages: String(eng.nbMessages ?? 0),
          nbVocalMinutes: String(eng.nbVocalMinutes ?? 0),
          nbReactions: row?.nbReactions ?? "0",
          reason: row?.reason ?? "",
          staffNote: row?.staffNote ?? "",
        };
      }
      return next;
    });
  }

  const handleImportMessages = (importRows: EngagementRow[]) => {
    const newData: Record<string, MemberEngagement> = { ...engagementData };
    for (const member of activeMembers) {
      if (!newData[member.discordId]) {
        newData[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
        };
      }
      newData[member.discordId].nbMessages = 0;
    }
    for (const row of importRows) {
      if (row.matchedMemberId && newData[row.matchedMemberId]) {
        newData[row.matchedMemberId].nbMessages = row.value;
      }
    }
    setEngagementData(newData);
    syncDiscordEditsFromEngagement(newData);
    setHasMessagesImport(true);
    setMessagesImportedAt(new Date().toISOString());
    setShowMessagesModal(false);
  };

  const handleImportVocals = (importRows: EngagementRow[]) => {
    const newData: Record<string, MemberEngagement> = { ...engagementData };
    for (const member of activeMembers) {
      if (!newData[member.discordId]) {
        newData[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
        };
      }
      newData[member.discordId].nbVocalMinutes = 0;
    }
    for (const row of importRows) {
      if (row.matchedMemberId && newData[row.matchedMemberId]) {
        newData[row.matchedMemberId].nbVocalMinutes = row.value * 60;
      }
    }
    setEngagementData(newData);
    syncDiscordEditsFromEngagement(newData);
    setHasVocalsImport(true);
    setVocalsImportedAt(new Date().toISOString());
    setShowVocalsModal(false);
  };

  function engagementHasMessages(data: Record<string, MemberEngagement>): boolean {
    return Object.values(data).some((e) => (e.nbMessages || 0) > 0);
  }
  function engagementHasVocals(data: Record<string, MemberEngagement>): boolean {
    return Object.values(data).some((e) => (e.nbVocalMinutes || 0) > 0);
  }

  async function handleSaveEngagementToBlobs() {
    if (activeMembers.length === 0) {
      setError("Aucun membre avec Discord ID — impossible d’enregistrer l’engagement.");
      return;
    }
    setSavingEngagement(true);
    setError(null);
    try {
      const dataByMember: Record<string, MemberEngagement> = {};
      for (const member of activeMembers) {
        const login = member.twitchLogin.toLowerCase();
        const edit = discordEdits[login];
        const nbMessages = edit ? parseInt0(edit.nbMessages) : 0;
        const nbVocalMinutes = edit ? parseFloat0(edit.nbVocalMinutes) : 0;
        const noteEcrit = calculateNoteEcrit(nbMessages);
        const noteVocal = calculateNoteVocal(nbVocalMinutes);
        const noteFinale = calculateNoteFinale(noteEcrit, noteVocal);
        dataByMember[member.discordId] = {
          discordId: member.discordId,
          displayName: member.displayName,
          twitchLogin: member.twitchLogin,
          role: member.role,
          memberSince: member.createdAt,
          nbMessages,
          nbVocalMinutes,
          noteEcrit,
          noteVocal,
          noteFinale,
          appreciation: getAppreciation(noteFinale),
        };
      }

      const msgFlag = hasMessagesImport || engagementHasMessages(dataByMember);
      const vocFlag = hasVocalsImport || engagementHasVocals(dataByMember);

      const res = await fetch(`/api/discord-engagement/${selectedMonth}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataByMember,
          hasMessagesImport: msgFlag,
          hasVocalsImport: vocFlag,
          messagesImportedAt: messagesImportedAt,
          vocalsImportedAt: vocalsImportedAt,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Échec enregistrement engagement Discord");
      if (msgFlag) setHasMessagesImport(true);
      if (vocFlag) setHasVocalsImport(true);
      await loadSnapshot();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingEngagement(false);
    }
  }

  return (
    <div className="min-h-screen p-8 text-white space-y-5" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/evaluation/v3" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ← Retour à l&apos;évaluation v3
          </Link>
          <h1 className="text-3xl font-bold mt-2">Pilotage manuel v3</h1>
          <p className="text-sm mt-1 max-w-3xl" style={{ color: "var(--color-text-secondary)" }}>
            Onglet <strong>Discord</strong> : barème v1 (notes écrit / vocal sur 5, max des deux →{" "}
            <strong>20 pts</strong> comme en B). Les réactions restent saisissables pour référence mais ne comptent pas
            dans ce barème. Onglet <strong>Autres piliers</strong> : compteurs raids, events, spotlight, régularité (3
            mois), soutien hors raid, bonus et malus. Champ vide = reprise auto (sauf bonus/malus à 0 par défaut).
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Mois
          </label>
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
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "discord" as const, label: "Discord (barème v1 → /20)" },
            { id: "pillars" as const, label: "Raids, events, spotlight, régularité, bonus & malus" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{
              borderColor: tab === t.id ? "#9146ff" : "var(--color-border)",
              backgroundColor: tab === t.id ? "#9146ff" : "var(--color-surface)",
              color: tab === t.id ? "white" : "var(--color-text)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "discord" && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Import des statistiques Discord (collage TSV / CSV) — même outil et même stockage que la page{" "}
            <Link href="/admin/evaluation/b/discord" className="underline" style={{ color: "#c4b5fd" }}>
              Évaluation B — Discord
            </Link>
            . Après import, enregistrez dans les blobs pour alimenter le snapshot v3 et le critère B.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowMessagesModal(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#9146ff", color: "white" }}
            >
              Importer messages
            </button>
            <button
              type="button"
              onClick={() => setShowVocalsModal(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#9146ff", color: "white" }}
            >
              Importer vocaux
            </button>
            <button
              type="button"
              onClick={() => void handleSaveEngagementToBlobs()}
              disabled={savingEngagement || activeMembers.length === 0}
              className="rounded-lg px-4 py-2 text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              {savingEngagement ? "Enregistrement…" : "Enregistrer dans le stockage engagement (mois)"}
            </button>
            {loadingEngagement ? (
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Chargement engagement…
              </span>
            ) : null}
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Messages importés : {hasMessagesImport ? "oui" : "non"}
            {messagesImportedAt ? ` (${new Date(messagesImportedAt).toLocaleString("fr-FR")})` : ""} · Vocaux importés
            : {hasVocalsImport ? "oui" : "non"}
            {vocalsImportedAt ? ` (${new Date(vocalsImportedAt).toLocaleString("fr-FR")})` : ""}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
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
          Chargement…
        </div>
      ) : tab === "discord" ? (
        <div className="rounded-lg border overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="px-2 py-2 text-left">Membre</th>
                <th className="px-2 py-2 text-center">Auto import (msg / voc)</th>
                <th className="px-2 py-2 text-center">Messages</th>
                <th className="px-2 py-2 text-center">Vocal (min)</th>
                <th className="px-2 py-2 text-center" title="Non utilisé dans le barème Discord v1">
                  Réactions
                </th>
                <th className="px-2 py-2 text-center">Discord /20</th>
                <th className="px-2 py-2 text-left min-w-[180px]">Raison</th>
                <th className="px-2 py-2 text-left">Note</th>
                <th className="px-2 py-2 text-center">Sauver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const login = r.twitchLogin;
                const e = discordEdits[login] || {
                  nbMessages: String(r.resolved.nbMessages),
                  nbVocalMinutes: String(r.resolved.nbVocalMinutes),
                  nbReactions: String(r.resolved.nbReactions),
                  reason: "",
                  staffNote: "",
                };
                const preview = scoreV3DiscordBlock({
                  nbMessages: parseInt0(e.nbMessages),
                  nbVocalMinutes: parseFloat0(e.nbVocalMinutes),
                  nbReactions: parseInt0(e.nbReactions),
                });
                return (
                  <tr key={login} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                    <td className="px-2 py-2">
                      <div className="font-medium">{r.displayName}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {login} · {r.role}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {r.auto.discordMessages} / {r.auto.discordVocalMinutes}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-20 rounded border px-1 py-1 text-center text-xs"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.nbMessages}
                        onChange={(ev) => setDiscordEdit(login, { nbMessages: ev.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-22 rounded border px-1 py-1 text-center text-xs"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.nbVocalMinutes}
                        onChange={(ev) => setDiscordEdit(login, { nbVocalMinutes: ev.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 rounded border px-1 py-1 text-center text-xs"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.nbReactions}
                        onChange={(ev) => setDiscordEdit(login, { nbReactions: ev.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-semibold">
                      {preview.total}
                      <span className="block text-[10px] font-normal opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                        v1 : {preview.noteFinale}/5 (écrit {preview.noteEcrit} · vocal {preview.noteVocal})
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-1 py-1 text-xs"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.reason}
                        onChange={(ev) => setDiscordEdit(login, { reason: ev.target.value })}
                        placeholder="Obligatoire"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-1 py-1 text-xs"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.staffNote}
                        onChange={(ev) => setDiscordEdit(login, { staffNote: ev.target.value })}
                        placeholder="Optionnel"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        disabled={savingLogin === login}
                        className="rounded px-2 py-1 text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: savingLogin === login ? "#374151" : "#3b82f6", color: "white" }}
                        onClick={async () => {
                          try {
                            setSavingLogin(login);
                            setError(null);
                            await saveDiscord(login);
                            await loadSnapshot();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Erreur");
                          } finally {
                            setSavingLogin(null);
                          }
                        }}
                      >
                        {savingLogin === login ? "…" : "Sauver"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="px-2 py-2 text-left">Membre</th>
                <th className="px-2 py-2 text-center">Raids auto</th>
                <th className="px-2 py-2 text-center">Raids manuel</th>
                <th className="px-2 py-2 text-center">Soutien hors raid</th>
                <th className="px-2 py-2 text-center">Events auto</th>
                <th className="px-2 py-2 text-center">Events manuel</th>
                <th className="px-2 py-2 text-center">Spotlight auto</th>
                <th className="px-2 py-2 text-center">Spotlight manuel</th>
                <th className="px-2 py-2 text-center">Régul. auto (0–3)</th>
                <th className="px-2 py-2 text-center">Régul. manuel</th>
                <th className="px-2 py-2 text-center">Bonus /5</th>
                <th className="px-2 py-2 text-center">Malus</th>
                <th className="px-2 py-2 text-left min-w-[160px]">Raison</th>
                <th className="px-2 py-2 text-center">Sauver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const login = r.twitchLogin;
                const e =
                  pillarEdits[login] ||
                  ({
                    raidsOverride: "",
                    raidsOther: false,
                    eventsOverride: "",
                    spotlightOverride: "",
                    regularityOverride: "",
                    bonus: "0",
                    malus: "0",
                    reason: "",
                    staffNote: "",
                  } as (typeof pillarEdits)[string]);
                return (
                  <tr key={login} className="border-t" style={{ borderTopColor: "var(--color-border)" }}>
                    <td className="px-2 py-2">
                      <div className="font-medium text-sm">{r.displayName}</div>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        {login} · total {r.scores.total}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">{r.auto.raidsDone}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-14 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.raidsOverride}
                        onChange={(ev) => setPillarEdit(login, { raidsOverride: ev.target.value })}
                        placeholder="auto"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input type="checkbox" checked={e.raidsOther} onChange={(ev) => setPillarEdit(login, { raidsOther: ev.target.checked })} />
                    </td>
                    <td className="px-2 py-2 text-center">{r.auto.eventsPresent}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-14 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.eventsOverride}
                        onChange={(ev) => setPillarEdit(login, { eventsOverride: ev.target.value })}
                        placeholder="auto"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">{r.auto.spotlightPresent}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-14 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.spotlightOverride}
                        onChange={(ev) => setPillarEdit(login, { spotlightOverride: ev.target.value })}
                        placeholder="auto"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">{r.auto.regularityActiveMonths}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-14 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.regularityOverride}
                        onChange={(ev) => setPillarEdit(login, { regularityOverride: ev.target.value })}
                        placeholder="auto"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-12 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.bonus}
                        onChange={(ev) => setPillarEdit(login, { bonus: ev.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-12 rounded border px-1 py-0.5 text-center"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.malus}
                        onChange={(ev) => setPillarEdit(login, { malus: ev.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-full rounded border px-1 py-0.5"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.reason}
                        onChange={(ev) => setPillarEdit(login, { reason: ev.target.value })}
                        placeholder="Obligatoire"
                      />
                      <input
                        className="w-full rounded border px-1 py-0.5 mt-1"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={e.staffNote}
                        onChange={(ev) => setPillarEdit(login, { staffNote: ev.target.value })}
                        placeholder="Note staff optionnelle"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        disabled={savingLogin === login}
                        className="rounded px-2 py-1 text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: savingLogin === login ? "#374151" : "#10b981", color: "white" }}
                        onClick={async () => {
                          try {
                            setSavingLogin(login);
                            setError(null);
                            await savePillars(login);
                            await loadSnapshot();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Erreur");
                          } finally {
                            setSavingLogin(null);
                          }
                        }}
                      >
                        {savingLogin === login ? "…" : "Sauver"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DiscordEngagementImportModal
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
        onImport={handleImportMessages}
        title="Importer messages Discord (pilotage v3)"
        membersMap={membersMap}
      />
      <DiscordEngagementImportModal
        isOpen={showVocalsModal}
        onClose={() => setShowVocalsModal(false)}
        onImport={handleImportVocals}
        title="Importer vocaux Discord (pilotage v3)"
        membersMap={membersMap}
      />
    </div>
  );
}
