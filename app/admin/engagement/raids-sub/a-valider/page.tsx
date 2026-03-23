"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type RaidSubEvent = {
  id: string;
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  to_broadcaster_user_login: string;
  to_broadcaster_user_name: string;
  viewers: number;
  event_at: string;
  processing_status: "received" | "matched" | "ignored" | "duplicate" | "error";
  error_reason?: string | null;
  match_from_member: boolean;
  match_to_member: boolean;
};

type MemberLite = {
  twitchLogin: string;
  displayName: string;
  role?: string | null;
  isActive?: boolean;
};

type CreateMemberDraft = {
  twitchLogin: string;
  displayName: string;
  twitchUrl: string;
};

const POINTS_DONE_TOKEN = "[points_discord_ok]";
const CLIENT_CACHE_TTL_MS = 60_000;
const reviewClientCache = new Map<string, { at: number; events: RaidSubEvent[] }>();

const STATUS_LABELS: Record<"all" | "received" | "matched" | "ignored" | "duplicate" | "error", string> = {
  all: "Tous",
  received: "Recus",
  matched: "Valides",
  ignored: "Ignores",
  duplicate: "Doublons",
  error: "Erreurs",
};

export default function AdminRaidsSubAValiderPage() {
  const searchParams = useSearchParams();
  const statusFromQuery = (searchParams.get("status") || "").toLowerCase();
  const initialStatus =
    statusFromQuery === "received" ||
    statusFromQuery === "matched" ||
    statusFromQuery === "ignored" ||
    statusFromQuery === "duplicate" ||
    statusFromQuery === "error"
      ? statusFromQuery
      : "received";

  const [statusFilter, setStatusFilter] =
    useState<"all" | "received" | "matched" | "ignored" | "duplicate" | "error">(initialStatus);
  const [search, setSearch] = useState("");
  const [pointsFilter, setPointsFilter] = useState<"all" | "todo">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [rows, setRows] = useState<RaidSubEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [commentById, setCommentById] = useState<Record<string, string>>({});
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [overrideFromById, setOverrideFromById] = useState<Record<string, string>>({});
  const [overrideToById, setOverrideToById] = useState<Record<string, string>>({});
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [createFieldForEvent, setCreateFieldForEvent] = useState<{ eventId: string; field: "from" | "to" } | null>(null);
  const [newMemberDraft, setNewMemberDraft] = useState<CreateMemberDraft>({
    twitchLogin: "",
    displayName: "",
    twitchUrl: "",
  });

  function buildCacheKey() {
    return `${statusFilter}|${search.trim().toLowerCase()}`;
  }

  async function loadData(options?: { force?: boolean; silent?: boolean }) {
    const force = options?.force === true;
    const silent = options?.silent === true;
    const cacheKey = buildCacheKey();

    if (!force) {
      const cached = reviewClientCache.get(cacheKey);
      if (cached && Date.now() - cached.at < CLIENT_CACHE_TTL_MS) {
        setRows(cached.events);
        if (!silent) {
          setLoading(false);
        }
      }
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const params = new URLSearchParams({
        status: statusFilter,
        search: search.trim(),
      });
      if (force) {
        params.set("force", "1");
      }
      const response = await fetch(`/api/admin/engagement/raids-sub/review?${params.toString()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Impossible de charger les events raids-sub.");
        return;
      }
      const events = (body.events || []) as RaidSubEvent[];
      setRows(events);
      reviewClientCache.set(cacheKey, { at: Date.now(), events });
      setLastRefreshAt(new Date());
    } catch {
      setError("Erreur reseau pendant le chargement.");
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData({ silent: true });
    }, 30_000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    setSelectedIds({});
  }, [rows]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/members", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) return;
        setMembers((body.members || []) as MemberLite[]);
      } catch {
        // Non bloquant pour la page.
      }
    })();
  }, []);

  const stats = useMemo(() => {
    return {
      received: rows.filter((item) => item.processing_status === "received").length,
      matched: rows.filter((item) => item.processing_status === "matched").length,
      ignored: rows.filter((item) => item.processing_status === "ignored").length,
      duplicate: rows.filter((item) => item.processing_status === "duplicate").length,
      error: rows.filter((item) => item.processing_status === "error").length,
    };
  }, [rows]);

  function getCommentValue(item: RaidSubEvent): string {
    return commentById[item.id] ?? item.error_reason ?? "";
  }

  function isPointsDoneFromComment(comment: string): boolean {
    return comment.toLowerCase().includes(POINTS_DONE_TOKEN);
  }

  function cleanPointsToken(comment: string): string {
    return comment.replace(new RegExp(`\\s*${POINTS_DONE_TOKEN}\\s*`, "gi"), " ").replace(/\s+/g, " ").trim();
  }

  function withPointsToken(comment: string): string {
    const base = cleanPointsToken(comment);
    return base ? `${base} ${POINTS_DONE_TOKEN}` : POINTS_DONE_TOKEN;
  }

  const pointsTodoCount = useMemo(() => {
    return rows.filter((item) => item.processing_status === "matched" && !isPointsDoneFromComment(getCommentValue(item))).length;
  }, [rows, commentById]);

  const displayedRows = useMemo(() => {
    const base =
      pointsFilter === "todo"
        ? rows.filter((item) => item.processing_status === "matched" && !isPointsDoneFromComment(getCommentValue(item)))
        : rows;

    if (statusFilter !== "ignored") return base;

    return [...base].sort((a, b) => {
      const scoreA = Number(a.match_from_member && a.match_to_member);
      const scoreB = Number(b.match_from_member && b.match_to_member);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.event_at).getTime() - new Date(a.event_at).getTime();
    });
  }, [rows, pointsFilter, commentById, statusFilter]);

  const selectedCount = useMemo(() => {
    const selectedSet = new Set(displayedRows.map((row) => row.id));
    return Object.entries(selectedIds).filter(([id, selected]) => selected && selectedSet.has(id)).length;
  }, [displayedRows, selectedIds]);

  function toggleSelectAllDisplayed(checked: boolean) {
    setSelectedIds((previous) => {
      const next = { ...previous };
      for (const row of displayedRows) {
        if (checked) {
          next[row.id] = true;
        } else {
          delete next[row.id];
        }
      }
      return next;
    });
  }

  async function deleteSelectedEvents() {
    const ids = displayedRows.filter((row) => selectedIds[row.id]).map((row) => row.id);
    if (ids.length === 0) return;

    const confirmed = window.confirm(`Supprimer définitivement ${ids.length} event(s) sélectionné(s) ?`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/review/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Suppression multiple impossible.");
        return;
      }
      setRows((previous) => previous.filter((row) => !ids.includes(row.id)));
      setCommentById((previous) => {
        const next = { ...previous };
        for (const id of ids) {
          delete next[id];
        }
        return next;
      });
      setSelectedIds({});
      reviewClientCache.clear();
    } catch {
      setError("Erreur reseau pendant la suppression multiple.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function updateStatus(id: string, processingStatus: RaidSubEvent["processing_status"]) {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus,
          staffComment: commentById[id] || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Mise a jour impossible.");
        return;
      }
      setRows((previous) => previous.map((item) => (item.id === id ? body.event : item)));
      reviewClientCache.clear();
    } catch {
      setError("Erreur reseau pendant la mise a jour.");
    } finally {
      setSavingId("");
    }
  }

  async function markPointsAttributed(item: RaidSubEvent, done: boolean) {
    setSavingId(item.id);
    try {
      const currentComment = getCommentValue(item);
      const staffComment = done ? withPointsToken(currentComment) : cleanPointsToken(currentComment);
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus: item.processing_status,
          staffComment,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Mise a jour points Discord impossible.");
        return;
      }
      setRows((previous) => previous.map((row) => (row.id === item.id ? body.event : row)));
      setCommentById((previous) => ({ ...previous, [item.id]: staffComment }));
      reviewClientCache.clear();
    } catch {
      setError("Erreur reseau pendant la mise a jour points Discord.");
    } finally {
      setSavingId("");
    }
  }

  async function forceMatched(id: string) {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus: "matched",
          forceMemberMatch: true,
          overrideFromLogin: (overrideFromById[id] || "").trim().toLowerCase(),
          overrideToLogin: (overrideToById[id] || "").trim().toLowerCase(),
          staffComment: commentById[id] || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Impossible de forcer en matched.");
        return;
      }
      setRows((previous) => previous.map((item) => (item.id === id ? body.event : item)));
      reviewClientCache.clear();
    } catch {
      setError("Erreur reseau pendant le forçage matched.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteEvent(item: RaidSubEvent) {
    const confirmed = window.confirm(
      `Supprimer définitivement cet event ?\n\n${item.from_broadcaster_user_login} -> ${item.to_broadcaster_user_login}\n${new Date(item.event_at).toLocaleString("fr-FR")}`
    );
    if (!confirmed) return;

    setSavingId(item.id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${item.id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Suppression impossible.");
        return;
      }
      setRows((previous) => previous.filter((row) => row.id !== item.id));
      setCommentById((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      setSelectedIds((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      reviewClientCache.clear();
    } catch {
      setError("Erreur reseau pendant la suppression.");
    } finally {
      setSavingId("");
    }
  }

  function normalizeLogin(value: string): string {
    return value.trim().toLowerCase();
  }

  function findExactMemberByLogin(login: string): MemberLite | null {
    const normalized = normalizeLogin(login);
    if (!normalized) return null;
    return members.find((member) => normalizeLogin(member.twitchLogin || "") === normalized) || null;
  }

  function openCreateMemberModal(eventId: string, field: "from" | "to", currentValue: string) {
    const login = normalizeLogin(currentValue || "");
    setCreateFieldForEvent({ eventId, field });
    setNewMemberDraft({
      twitchLogin: login,
      displayName: login || "Nouveau membre",
      twitchUrl: login ? `https://www.twitch.tv/${login}` : "",
    });
    setShowCreateMemberModal(true);
  }

  async function createMemberFromModal() {
    if (!createFieldForEvent || creatingMember) return;
    const twitchLogin = normalizeLogin(newMemberDraft.twitchLogin);
    const displayName = newMemberDraft.displayName.trim() || twitchLogin;
    const twitchUrl = (newMemberDraft.twitchUrl.trim() || `https://www.twitch.tv/${twitchLogin}`).toLowerCase();
    if (!twitchLogin || !displayName || !twitchUrl) {
      setError("Creation membre impossible: champs obligatoires manquants.");
      return;
    }

    setCreatingMember(true);
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitchLogin,
          displayName,
          twitchUrl,
          role: "Nouveau",
          isActive: false,
          badges: [],
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Creation membre impossible.");
        return;
      }

      setMembers((prev) => {
        const exists = prev.some((member) => normalizeLogin(member.twitchLogin || "") === twitchLogin);
        if (exists) return prev;
        return [
          ...prev,
          {
            twitchLogin,
            displayName,
            role: "Nouveau",
            isActive: false,
          },
        ];
      });

      if (createFieldForEvent.field === "from") {
        setOverrideFromById((prev) => ({ ...prev, [createFieldForEvent.eventId]: twitchLogin }));
      } else {
        setOverrideToById((prev) => ({ ...prev, [createFieldForEvent.eventId]: twitchLogin }));
      }

      setShowCreateMemberModal(false);
      setCreateFieldForEvent(null);
    } catch {
      setError("Erreur reseau pendant la creation du membre.");
    } finally {
      setCreatingMember(false);
    }
  }

  function badgeStyle(status: RaidSubEvent["processing_status"]): { borderColor: string; color: string; backgroundColor: string } {
    if (status === "matched") {
      return { borderColor: "rgba(52,211,153,0.45)", color: "#34d399", backgroundColor: "rgba(52,211,153,0.12)" };
    }
    if (status === "ignored") {
      return { borderColor: "rgba(251,191,36,0.45)", color: "#fbbf24", backgroundColor: "rgba(251,191,36,0.12)" };
    }
    if (status === "duplicate") {
      return { borderColor: "rgba(147,197,253,0.45)", color: "#93c5fd", backgroundColor: "rgba(147,197,253,0.12)" };
    }
    if (status === "error") {
      return { borderColor: "rgba(248,113,113,0.45)", color: "#f87171", backgroundColor: "rgba(248,113,113,0.12)" };
    }
    return { borderColor: "rgba(229,231,235,0.45)", color: "#e5e7eb", backgroundColor: "rgba(229,231,235,0.12)" };
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/engagement/raids-sub" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour à Raids Sub
        </Link>
        <div className="mb-3">
          <Link
            href="/admin/engagement/points-discord"
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-emerald-300"
            style={{ borderColor: "rgba(52,211,153,0.45)" }}
          >
            Ouvrir la page points de raid
          </Link>
        </div>
        <h1 className="mb-2 text-4xl font-bold">Raids Sub à valider</h1>
        <p className="text-gray-400">Validation staff des events du système EventSub test uniquement.</p>
        <p className="mt-1 text-xs text-gray-500">
          Auto-refresh: 30s
          {refreshing ? " • rafraichissement..." : ""}
          {lastRefreshAt ? ` • derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-sky-500/35 bg-sky-900/15 p-4">
        <p className="text-sm font-semibold text-sky-200">Workflow modo recommande</p>
        <p className="mt-1 text-xs text-sky-100/90">
          1) Verifier le raid et cliquer <strong>Valider (matched)</strong>. 2) Attribuer les points sur Discord manuellement.
          3) Cliquer <strong>Points Discord attribues</strong> pour tracer que c est fait.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "received", "matched", "ignored", "duplicate", "error"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className="rounded-md border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: statusFilter === status ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.18)",
                color: statusFilter === status ? "#c4b5fd" : "#cbd5e1",
              }}
            >
              {STATUS_LABELS[status]} (
              {status === "received"
                ? stats.received
                : status === "matched"
                  ? stats.matched
                  : status === "ignored"
                    ? stats.ignored
                    : status === "duplicate"
                      ? stats.duplicate
                      : status === "error"
                        ? stats.error
                        : rows.length}
              )
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher login/source/commentaire..."
            className="w-full max-w-[460px] rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "#0e0e10", color: "#fff" }}
          />
          <button
            type="button"
            onClick={() => void loadData({ force: true })}
            className="rounded-lg bg-[#9146ff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7c3aed]"
          >
            Rechercher / refresh force
          </button>
          <button
            type="button"
            onClick={() => setPointsFilter((prev) => (prev === "todo" ? "all" : "todo"))}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: pointsFilter === "todo" ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.2)",
              color: pointsFilter === "todo" ? "#fbbf24" : "#cbd5e1",
              backgroundColor: pointsFilter === "todo" ? "rgba(245,158,11,0.12)" : "transparent",
            }}
          >
            {pointsFilter === "todo" ? "Filtre points: A finir" : "Filtrer: A finir points Discord"} ({pointsTodoCount})
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-gray-700 bg-[#0e0e10] px-3 py-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={displayedRows.length > 0 && selectedCount === displayedRows.length}
              onChange={(event) => toggleSelectAllDisplayed(event.target.checked)}
            />
            Tout sélectionner (liste affichée)
          </label>
          <span className="text-xs text-gray-400">{selectedCount} sélectionné(s)</span>
          <button
            type="button"
            onClick={() => void deleteSelectedEvents()}
            disabled={bulkDeleting || selectedCount === 0}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            style={{ borderColor: "rgba(248,113,113,0.55)", color: "#f87171" }}
          >
            {bulkDeleting ? "Suppression..." : "Supprimer la sélection"}
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des events...</p>
        ) : displayedRows.length === 0 ? (
          <p className="text-sm text-gray-300">
            {pointsFilter === "todo" ? "Aucun raid matched en attente de points Discord." : "Aucun event à afficher."}
          </p>
        ) : (
          <div className="space-y-3">
            {displayedRows.map((item) => {
              const badge = badgeStyle(item.processing_status);
              const isSaving = savingId === item.id;
              const itemComment = getCommentValue(item);
              const pointsDone = isPointsDoneFromComment(itemComment);
              const fromDraft = overrideFromById[item.id] ?? item.from_broadcaster_user_login ?? "";
              const toDraft = overrideToById[item.id] ?? item.to_broadcaster_user_login ?? "";
              const fromQuery = normalizeLogin(fromDraft);
              const toQuery = normalizeLogin(toDraft);
              const fromSuggestions = members
                .filter((member) => {
                  if (!fromQuery) return true;
                  const login = normalizeLogin(member.twitchLogin || "");
                  const label = String(member.displayName || "").toLowerCase();
                  return login.includes(fromQuery) || label.includes(fromQuery);
                })
                .slice(0, 30);
              const toSuggestions = members
                .filter((member) => {
                  if (!toQuery) return true;
                  const login = normalizeLogin(member.twitchLogin || "");
                  const label = String(member.displayName || "").toLowerCase();
                  return login.includes(toQuery) || label.includes(toQuery);
                })
                .slice(0, 30);
              const selectedFromMember = findExactMemberByLogin(fromDraft);
              const selectedToMember = findExactMemberByLogin(toDraft);
              const canForceMatched =
                (!!selectedFromMember && !!selectedToMember) ||
                (item.match_from_member && item.match_to_member);
              return (
                <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds[item.id])}
                        onChange={(event) =>
                          setSelectedIds((prev) => {
                            const next = { ...prev };
                            if (event.target.checked) {
                              next[item.id] = true;
                            } else {
                              delete next[item.id];
                            }
                            return next;
                          })
                        }
                      />
                      <p className="text-base font-semibold text-white">
                        {item.from_broadcaster_user_login} → {item.to_broadcaster_user_login}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{ borderColor: badge.borderColor, color: badge.color, backgroundColor: badge.backgroundColor }}
                    >
                      {item.processing_status}
                    </span>
                  </div>
                  {statusFilter === "ignored" && item.match_from_member && item.match_to_member ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-300">Priorite: les 2 profils sont rattaches</p>
                  ) : null}

                  <p className="mt-1 text-sm text-gray-400">
                    {new Date(item.event_at).toLocaleString("fr-FR")} • viewers: {item.viewers}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    fromMember: {String(item.match_from_member)} • toMember: {String(item.match_to_member)}
                  </p>
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{
                        borderColor: pointsDone ? "rgba(52,211,153,0.45)" : "rgba(251,191,36,0.45)",
                        color: pointsDone ? "#34d399" : "#fbbf24",
                        backgroundColor: pointsDone ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                      }}
                    >
                      {pointsDone ? "Points Discord attribues" : "Points Discord NON attribues"}
                    </span>
                  </div>
                  {item.error_reason ? <p className="mt-1 text-sm text-amber-200">Commentaire: {item.error_reason}</p> : null}

                  {(!item.match_from_member || !item.match_to_member) ? (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="mb-2 text-xs font-semibold text-amber-200">
                        Event ignore/non match: tu peux sélectionner des membres puis forcer en matched.
                      </p>
                      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Raider (login Twitch)</label>
                          <input
                            value={fromDraft}
                            onChange={(event) =>
                              setOverrideFromById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            list={`from-suggestions-${item.id}`}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            style={{ borderColor: "rgba(251,191,36,0.35)", backgroundColor: "#0e0e10", color: "#fff" }}
                          />
                          <datalist id={`from-suggestions-${item.id}`}>
                            {fromSuggestions.map((member) => (
                              <option key={`from-${item.id}-${member.twitchLogin}`} value={normalizeLogin(member.twitchLogin || "")}>
                                {member.displayName}
                              </option>
                            ))}
                          </datalist>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {selectedFromMember
                              ? `Rattache: ${selectedFromMember.displayName} (${selectedFromMember.twitchLogin})`
                              : "Non rattache: choisis un login existant."}
                          </p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Cible (login Twitch)</label>
                          <input
                            value={toDraft}
                            onChange={(event) =>
                              setOverrideToById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            list={`to-suggestions-${item.id}`}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            style={{ borderColor: "rgba(251,191,36,0.35)", backgroundColor: "#0e0e10", color: "#fff" }}
                          />
                          <datalist id={`to-suggestions-${item.id}`}>
                            {toSuggestions.map((member) => (
                              <option key={`to-${item.id}-${member.twitchLogin}`} value={normalizeLogin(member.twitchLogin || "")}>
                                {member.displayName}
                              </option>
                            ))}
                          </datalist>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {selectedToMember
                              ? `Rattache: ${selectedToMember.displayName} (${selectedToMember.twitchLogin})`
                              : "Non rattache: choisis un login existant."}
                          </p>
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openCreateMemberModal(item.id, "from", overrideFromById[item.id] ?? item.from_broadcaster_user_login)}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(167,139,250,0.55)", color: "#c4b5fd" }}
                          >
                            Creer membre raider
                          </button>
                          <button
                            type="button"
                            onClick={() => openCreateMemberModal(item.id, "to", overrideToById[item.id] ?? item.to_broadcaster_user_login)}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(167,139,250,0.55)", color: "#c4b5fd" }}
                          >
                            Creer membre cible
                          </button>
                          <button
                            type="button"
                            onClick={() => void forceMatched(item.id)}
                            disabled={isSaving || !canForceMatched}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(52,211,153,0.55)", color: "#34d399" }}
                          >
                            Forcer matched
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={itemComment}
                      onChange={(event) => setCommentById((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Commentaire staff (optionnel)"
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "matched")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(52,211,153,0.5)", color: "#34d399" }}
                      >
                        Valider (matched)
                      </button>
                      <button
                        type="button"
                        onClick={() => void markPointsAttributed(item, true)}
                        disabled={isSaving || item.processing_status !== "matched"}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(16,185,129,0.5)", color: "#10b981" }}
                        title={item.processing_status !== "matched" ? "Valide d abord le raid en matched" : "Marquer points Discord attribues"}
                      >
                        Points Discord attribues
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "ignored")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(251,191,36,0.5)", color: "#fbbf24" }}
                      >
                        Ignorer
                      </button>
                      <details className="group">
                        <summary className="cursor-pointer rounded-md border px-3 py-2 text-xs font-semibold text-gray-300" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                          Plus d actions
                        </summary>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void markPointsAttributed(item, false)}
                            disabled={isSaving || !pointsDone}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(251,191,36,0.45)", color: "#fbbf24" }}
                          >
                            Retirer "points attribues"
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateStatus(item.id, "duplicate")}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(147,197,253,0.5)", color: "#93c5fd" }}
                          >
                            Marquer doublon
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateStatus(item.id, "error")}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(248,113,113,0.5)", color: "#f87171" }}
                          >
                            Marquer erreur
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateStatus(item.id, "received")}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(229,231,235,0.5)", color: "#e5e7eb" }}
                          >
                            Repasser en received
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteEvent(item)}
                            disabled={isSaving}
                            className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{ borderColor: "rgba(248,113,113,0.55)", color: "#f87171" }}
                          >
                            Supprimer event
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showCreateMemberModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreateMemberModal(false)}>
          <div
            className="w-full max-w-xl rounded-xl border border-gray-700 bg-[#1a1a1d] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-1 text-xl font-semibold text-white">Creer un membre pour forcer le match</h3>
            <p className="mb-4 text-xs text-gray-400">Le membre sera cree en role Nouveau et statut Inactif.</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Login Twitch</label>
                <input
                  value={newMemberDraft.twitchLogin}
                  onChange={(event) =>
                    setNewMemberDraft((prev) => ({
                      ...prev,
                      twitchLogin: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Nom affichage</label>
                <input
                  value={newMemberDraft.displayName}
                  onChange={(event) => setNewMemberDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">URL Twitch</label>
                <input
                  value={newMemberDraft.twitchUrl}
                  onChange={(event) => setNewMemberDraft((prev) => ({ ...prev, twitchUrl: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateMemberModal(false)}
                className="rounded-md border px-3 py-2 text-xs font-semibold text-gray-300"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void createMemberFromModal()}
                disabled={creatingMember}
                className="rounded-md bg-[#9146ff] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {creatingMember ? "Creation..." : "Creer membre"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

