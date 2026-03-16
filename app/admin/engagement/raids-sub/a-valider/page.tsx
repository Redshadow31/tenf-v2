"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function AdminRaidsSubAValiderPage() {
  const [statusFilter, setStatusFilter] =
    useState<"all" | "received" | "matched" | "ignored" | "duplicate" | "error">("received");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<RaidSubEvent[]>([]);
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

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        status: statusFilter,
        search: search.trim(),
      });
      const response = await fetch(`/api/admin/engagement/raids-sub/review?${params.toString()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Impossible de charger les events raids-sub.");
        return;
      }
      setRows((body.events || []) as RaidSubEvent[]);
      setLastRefreshAt(new Date());
    } catch {
      setError("Erreur reseau pendant le chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 30_000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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
    } catch {
      setError("Erreur reseau pendant la mise a jour.");
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
    } catch {
      setError("Erreur reseau pendant le forçage matched.");
    } finally {
      setSavingId("");
    }
  }

  function normalizeLogin(value: string): string {
    return value.trim().toLowerCase();
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
        <h1 className="mb-2 text-4xl font-bold">Raids Sub à valider</h1>
        <p className="text-gray-400">Validation staff des events du système EventSub test uniquement.</p>
        <p className="mt-1 text-xs text-gray-500">
          Auto-refresh: 30s
          {lastRefreshAt ? ` • derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
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
              {status} ({status === "received" ? stats.received : status === "matched" ? stats.matched : status === "ignored" ? stats.ignored : status === "duplicate" ? stats.duplicate : status === "error" ? stats.error : rows.length})
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
            onClick={() => void loadData()}
            className="rounded-lg bg-[#9146ff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7c3aed]"
          >
            Rechercher
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des events...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun event à afficher.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => {
              const badge = badgeStyle(item.processing_status);
              const isSaving = savingId === item.id;
              return (
                <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      {item.from_broadcaster_user_login} → {item.to_broadcaster_user_login}
                    </p>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{ borderColor: badge.borderColor, color: badge.color, backgroundColor: badge.backgroundColor }}
                    >
                      {item.processing_status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-400">
                    {new Date(item.event_at).toLocaleString("fr-FR")} • viewers: {item.viewers}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    fromMember: {String(item.match_from_member)} • toMember: {String(item.match_to_member)}
                  </p>
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
                            value={overrideFromById[item.id] ?? item.from_broadcaster_user_login ?? ""}
                            onChange={(event) =>
                              setOverrideFromById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            list={`from-suggestions-${item.id}`}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            style={{ borderColor: "rgba(251,191,36,0.35)", backgroundColor: "#0e0e10", color: "#fff" }}
                          />
                          <datalist id={`from-suggestions-${item.id}`}>
                            {members.slice(0, 150).map((member) => (
                              <option key={`from-${item.id}-${member.twitchLogin}`} value={normalizeLogin(member.twitchLogin || "")}>
                                {member.displayName}
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Cible (login Twitch)</label>
                          <input
                            value={overrideToById[item.id] ?? item.to_broadcaster_user_login ?? ""}
                            onChange={(event) =>
                              setOverrideToById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            list={`to-suggestions-${item.id}`}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            style={{ borderColor: "rgba(251,191,36,0.35)", backgroundColor: "#0e0e10", color: "#fff" }}
                          />
                          <datalist id={`to-suggestions-${item.id}`}>
                            {members.slice(0, 150).map((member) => (
                              <option key={`to-${item.id}-${member.twitchLogin}`} value={normalizeLogin(member.twitchLogin || "")}>
                                {member.displayName}
                              </option>
                            ))}
                          </datalist>
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
                            disabled={isSaving}
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
                      value={commentById[item.id] ?? item.error_reason ?? ""}
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
                        Matched
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "ignored")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(251,191,36,0.5)", color: "#fbbf24" }}
                      >
                        Ignored
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "duplicate")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(147,197,253,0.5)", color: "#93c5fd" }}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "error")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(248,113,113,0.5)", color: "#f87171" }}
                      >
                        Error
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "received")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(229,231,235,0.5)", color: "#e5e7eb" }}
                      >
                        Repasser received
                      </button>
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

