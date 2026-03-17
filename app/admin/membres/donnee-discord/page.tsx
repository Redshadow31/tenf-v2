"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberDiscordRow = {
  twitchLogin: string;
  displayName?: string;
  discordId?: string;
  discordUsername?: string;
};

type VerifyResult = {
  twitchLogin: string;
  displayName: string;
  discordId: string;
  storedDiscordUsername: string | null;
  fetchedDiscordUsername: string | null;
  status: "same" | "updated" | "different" | "not_found" | "error";
  error?: string;
};

type VerifyResponse = {
  message?: string;
  processed: number;
  same: number;
  different: number;
  updated: number;
  notFound: number;
  errors: number;
  truncated?: boolean;
  totalSelected?: number;
  offset?: number;
  limit?: number;
  nextOffset?: number;
  hasMore?: boolean;
  results: VerifyResult[];
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/json")) {
    return (await response.json()) as T;
  }

  const raw = await response.text().catch(() => "");
  const trimmed = raw.trim();
  const preview = trimmed.slice(0, 180).replace(/\s+/g, " ");
  throw new Error(preview ? `Reponse API non-JSON: ${preview}` : "Reponse API non-JSON.");
}

export default function AdminMembresDonneeDiscordPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<MemberDiscordRow[]>([]);
  const [resultsByLogin, setResultsByLogin] = useState<Record<string, VerifyResult>>({});

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/members/discord-data", { cache: "no-store" });
      const body = await parseApiResponse<{ members?: MemberDiscordRow[]; error?: string }>(response);
      if (!response.ok) throw new Error(body.error || "Impossible de charger les donnees Discord.");
      setMembers((body.members || []) as MemberDiscordRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  async function verifyAndSyncAll() {
    setSyncing(true);
    setError("");
    setInfo("");
    try {
      const batchSize = 20;
      let nextOffset = 0;
      let hasMore = true;
      let totalSelected = 0;
      let totalProcessed = 0;
      let totalSame = 0;
      let totalDifferent = 0;
      let totalUpdated = 0;
      let totalNotFound = 0;
      let totalErrors = 0;
      const nextResults: Record<string, VerifyResult> = {};

      while (hasMore) {
        const response = await fetch("/api/admin/members/discord-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true, updateMismatches: true, offset: nextOffset, limit: batchSize }),
        });
        const body = await parseApiResponse<VerifyResponse & { error?: string }>(response);
        if (!response.ok) throw new Error(body.error || "Verification impossible.");

        for (const row of body.results || []) {
          nextResults[row.twitchLogin.toLowerCase()] = row;
        }

        totalProcessed += Number(body.processed || 0);
        totalSame += Number(body.same || 0);
        totalDifferent += Number(body.different || 0);
        totalUpdated += Number(body.updated || 0);
        totalNotFound += Number(body.notFound || 0);
        totalErrors += Number(body.errors || 0);
        totalSelected = Number(body.totalSelected || totalSelected || 0);

        setInfo(
          `Verification en cours... ${Math.min(totalProcessed, totalSelected || totalProcessed)}/${totalSelected || "?"} • ` +
            `identiques: ${totalSame}, differents: ${totalDifferent}, synchronises: ${totalUpdated}, introuvables: ${totalNotFound}, erreurs: ${totalErrors}.`
        );

        hasMore = Boolean(body.hasMore);
        nextOffset = Number(body.nextOffset || totalProcessed);
      }

      setResultsByLogin(nextResults);
      setInfo(
        `Verification terminee. Traites: ${totalProcessed}/${totalSelected || totalProcessed}, identiques: ${totalSame}, differents: ${totalDifferent}, synchronises: ${totalUpdated}, introuvables: ${totalNotFound}, erreurs: ${totalErrors}.`
      );
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setSyncing(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = members.slice().sort((a, b) => (a.displayName || a.twitchLogin).localeCompare(b.displayName || b.twitchLogin, "fr"));
    if (!q) return rows;
    return rows.filter((row) => {
      const display = String(row.displayName || "").toLowerCase();
      const twitch = String(row.twitchLogin || "").toLowerCase();
      const discordId = String(row.discordId || "").toLowerCase();
      const discordUsername = String(row.discordUsername || "").toLowerCase();
      return display.includes(q) || twitch.includes(q) || discordId.includes(q) || discordUsername.includes(q);
    });
  }, [members, search]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/membres/validation-profil" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour a Profils & donnees
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Donnee Discord</h1>
        <p className="text-gray-400">
          Verification des pseudos Discord depuis l ID Discord, puis synchronisation automatique dans la fiche membre.
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-sky-500/35 bg-sky-900/15 px-4 py-3 text-sm text-sky-100">
        Cette page utilise uniquement le systeme actuel (Supabase + NextAuth). Aucun appel a l ancien stockage legacy.
      </div>

      <div className="mb-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher membre / twitch / discord..."
            className="w-full max-w-[460px] rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#101014", color: "#fff" }}
          />
          <button
            type="button"
            onClick={() => void loadMembers()}
            disabled={loading || syncing}
            className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-60"
          >
            Rafraichir
          </button>
          <button
            type="button"
            onClick={() => void verifyAndSyncAll()}
            disabled={loading || syncing || members.length === 0}
            className="rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-60"
          >
            {syncing ? "Verification..." : "Verifier et synchroniser"}
          </button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {info ? <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">{info}</div> : null}

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun membre avec ID Discord.</p>
        ) : (
          <div className="space-y-2">
            {filteredRows.map((row) => {
              const result = resultsByLogin[row.twitchLogin.toLowerCase()];
              const status = result?.status || "same";
              return (
                <article key={`${row.twitchLogin}-${row.discordId}`} className="rounded-lg border border-gray-700 bg-[#101014] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {row.displayName || row.twitchLogin} <span className="text-gray-400">({row.twitchLogin})</span>
                    </p>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold"
                      style={{
                        borderColor:
                          status === "updated"
                            ? "rgba(52,211,153,0.45)"
                            : status === "different"
                              ? "rgba(251,191,36,0.45)"
                              : status === "not_found" || status === "error"
                                ? "rgba(248,113,113,0.45)"
                                : "rgba(148,163,184,0.45)",
                        color:
                          status === "updated"
                            ? "#34d399"
                            : status === "different"
                              ? "#fbbf24"
                              : status === "not_found" || status === "error"
                                ? "#f87171"
                                : "#cbd5e1",
                        backgroundColor:
                          status === "updated"
                            ? "rgba(52,211,153,0.12)"
                            : status === "different"
                              ? "rgba(251,191,36,0.12)"
                              : status === "not_found" || status === "error"
                                ? "rgba(248,113,113,0.12)"
                                : "rgba(148,163,184,0.12)",
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Discord ID: {row.discordId}</p>
                  <p className="mt-1 text-xs text-gray-400">Pseudo en base: {row.discordUsername || "vide"}</p>
                  {result ? (
                    <p className="mt-1 text-xs text-gray-300">
                      Pseudo Discord actuel: {result.fetchedDiscordUsername || "introuvable"}
                      {result.error ? ` • ${result.error}` : ""}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
