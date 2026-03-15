"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RaidDeclaration = {
  id: string;
  member_discord_id: string;
  member_twitch_login: string;
  member_display_name: string;
  target_twitch_login: string;
  raid_at: string;
  is_approximate: boolean;
  note: string;
  status: "processing" | "validated" | "rejected";
  staff_comment?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
};

export default function AdminEngagementRaidsAValiderPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "validated" | "rejected">("processing");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<RaidDeclaration[]>([]);
  const [commentById, setCommentById] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        status: statusFilter,
        search: search.trim(),
      });
      const response = await fetch(`/api/admin/engagement/raids-declarations?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Impossible de charger les declarations.");
        return;
      }
      setRows((body.declarations || []) as RaidDeclaration[]);
      setBackendReady(body.backendReady !== false);
    } catch {
      setError("Erreur reseau pendant le chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      processing: rows.filter((item) => item.status === "processing").length,
      validated: rows.filter((item) => item.status === "validated").length,
      rejected: rows.filter((item) => item.status === "rejected").length,
    };
  }, [rows]);

  async function updateStatus(id: string, status: "processing" | "validated" | "rejected") {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-declarations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          staffComment: commentById[id] || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Mise a jour impossible.");
        return;
      }
      setRows((previous) => previous.map((item) => (item.id === id ? body.declaration : item)));
    } catch {
      setError("Erreur reseau pendant la mise a jour.");
    } finally {
      setSavingId("");
    }
  }

  function badgeStyle(status: RaidDeclaration["status"]): { borderColor: string; color: string; backgroundColor: string; label: string } {
    if (status === "validated") {
      return {
        borderColor: "rgba(52,211,153,0.45)",
        color: "#34d399",
        backgroundColor: "rgba(52,211,153,0.12)",
        label: "Valide",
      };
    }
    if (status === "rejected") {
      return {
        borderColor: "rgba(248,113,113,0.45)",
        color: "#f87171",
        backgroundColor: "rgba(248,113,113,0.12)",
        label: "Refuse",
      };
    }
    return {
      borderColor: "rgba(250,204,21,0.45)",
      color: "#facc15",
      backgroundColor: "rgba(250,204,21,0.12)",
      label: "En cours de traitement",
    };
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/raids" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour à Engagement
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Raids à valider</h1>
        <p className="text-gray-400">Validation des declarations raids membres avec statuts synchronises.</p>
      </div>

      {!backendReady ? (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-4">
          <p className="font-semibold text-yellow-300">Module non actif</p>
          <p className="text-sm text-yellow-200">La migration `0034_raid_declarations.sql` doit etre appliquee.</p>
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: statusFilter === "all" ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "all" ? "#c4b5fd" : "#cbd5e1",
            }}
          >
            Tous ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("processing")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: statusFilter === "processing" ? "rgba(250,204,21,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "processing" ? "#facc15" : "#cbd5e1",
            }}
          >
            En cours ({stats.processing})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("validated")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: statusFilter === "validated" ? "rgba(52,211,153,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "validated" ? "#34d399" : "#cbd5e1",
            }}
          >
            Valides ({stats.validated})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: statusFilter === "rejected" ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "rejected" ? "#f87171" : "#cbd5e1",
            }}
          >
            Refuses ({stats.rejected})
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher membre, cible ou note..."
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
          <p className="text-sm text-gray-300">Chargement des declarations...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">Aucune declaration a afficher.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => {
              const badge = badgeStyle(item.status);
              const isSaving = savingId === item.id;
              return (
                <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      {item.member_display_name} ({item.member_twitch_login}) → {item.target_twitch_login}
                    </p>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{ borderColor: badge.borderColor, color: badge.color, backgroundColor: badge.backgroundColor }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-400">
                    {new Date(item.raid_at).toLocaleString("fr-FR")} {item.is_approximate ? "- heure approximative" : ""}
                  </p>
                  {item.note ? <p className="mt-1 text-sm text-gray-300">Note: {item.note}</p> : null}

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={commentById[item.id] ?? item.staff_comment ?? ""}
                      onChange={(event) => setCommentById((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Commentaire staff (optionnel)"
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "validated")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(52,211,153,0.5)", color: "#34d399" }}
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "processing")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(250,204,21,0.5)", color: "#facc15" }}
                      >
                        Repasser en cours
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "rejected")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(248,113,113,0.5)", color: "#f87171" }}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
