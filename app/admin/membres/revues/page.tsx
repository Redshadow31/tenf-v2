"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberReviewRow = {
  twitchLogin: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
  lastReviewAt?: string;
  nextReviewAt?: string;
};

type RowWithDerived = MemberReviewRow & {
  key: string;
  status: "overdue" | "due_soon" | "scheduled" | "missing";
  daysDelta: number | null;
  owner: string;
};

const ownerStorageKey = "tenf-admin-members-review-owners";

function formatDate(value?: string): string {
  if (!value) return "Non renseigné";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseigné";
  return date.toLocaleDateString("fr-FR");
}

function computeDeltaDays(nextReviewAt?: string): number | null {
  if (!nextReviewAt) return null;
  const date = new Date(nextReviewAt);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function MembersReviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RowWithDerived[]>([]);
  const [owners, setOwners] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ownerStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      setOwners(parsed);
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/members", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        if (!mounted) return;

        const members = Array.isArray(payload?.members) ? (payload.members as MemberReviewRow[]) : [];
        const derived: RowWithDerived[] = members
          .filter((member) => Boolean(member?.isActive))
          .map((member) => {
            const key = String(member.twitchLogin || "");
            const daysDelta = computeDeltaDays(member.nextReviewAt);
            let status: RowWithDerived["status"] = "scheduled";
            if (daysDelta === null) {
              status = "missing";
            } else if (daysDelta < 0) {
              status = "overdue";
            } else if (daysDelta <= 7) {
              status = "due_soon";
            }
            return {
              ...member,
              key,
              daysDelta,
              status,
              owner: "",
            };
          })
          .sort((a, b) => {
            const score = (status: RowWithDerived["status"]) =>
              status === "overdue" ? 4 : status === "due_soon" ? 3 : status === "missing" ? 2 : 1;
            const scoreDiff = score(b.status) - score(a.status);
            if (scoreDiff !== 0) return scoreDiff;
            const aDelta = a.daysDelta ?? 99999;
            const bDelta = b.daysDelta ?? 99999;
            return aDelta - bDelta;
          });

        setRows(derived);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadReviews();
    return () => {
      mounted = false;
    };
  }, []);

  const rowsWithOwner = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        owner: owners[row.key] || "",
      })),
    [rows, owners]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rowsWithOwner;
    return rowsWithOwner.filter((row) => {
      const label = `${row.displayName || ""} ${row.twitchLogin || ""} ${row.role || ""} ${row.owner || ""}`.toLowerCase();
      return label.includes(term);
    });
  }, [rowsWithOwner, search]);

  const stats = useMemo(() => {
    const overdue = rowsWithOwner.filter((row) => row.status === "overdue").length;
    const dueSoon = rowsWithOwner.filter((row) => row.status === "due_soon").length;
    const missing = rowsWithOwner.filter((row) => row.status === "missing").length;
    const covered = rowsWithOwner.filter((row) => String(row.owner || "").trim().length > 0).length;
    const coverage = rowsWithOwner.length ? Math.round((covered / rowsWithOwner.length) * 100) : 0;
    return { overdue, dueSoon, missing, coverage };
  }, [rowsWithOwner]);

  function setOwner(key: string, value: string) {
    setOwners((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem(ownerStorageKey, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/membres" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au Dashboard membres
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Gestion des membres - Revues membres</h1>
        <p className="text-gray-300">Pilotage des retards, respect SLA et attribution des responsables.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Revues en retard</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{stats.overdue}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Échéance ≤ 7 jours</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{stats.dueSoon}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Sans date de revue</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{stats.missing}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Couverture responsables</p>
          <p className="mt-2 text-3xl font-bold">{stats.coverage}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <label className="text-xs uppercase tracking-wide text-gray-400">Recherche</label>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pseudo, login, rôle ou responsable..."
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-amber-300/40 focus:outline-none"
        />
      </div>

      {loading ? <div className="text-sm text-gray-300">Chargement des revues...</div> : null}

      {!loading ? (
        <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] overflow-x-auto">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-[1.4fr_110px_140px_140px_120px_180px] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
              <span>Membre</span>
              <span>Rôle</span>
              <span>Dernière revue</span>
              <span>Prochaine revue</span>
              <span>SLA</span>
              <span>Responsable</span>
            </div>
            {filtered.map((row) => {
              const badgeClass =
                row.status === "overdue"
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                  : row.status === "due_soon"
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    : row.status === "missing"
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
                      : "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";

              const label =
                row.status === "overdue"
                  ? `${Math.abs(row.daysDelta || 0)}j de retard`
                  : row.status === "due_soon"
                    ? `Échéance ${row.daysDelta}j`
                    : row.status === "missing"
                      ? "Date manquante"
                      : "OK";

              return (
                <div key={row.key} className="grid grid-cols-[1.4fr_110px_140px_140px_120px_180px] gap-2 px-4 py-3 border-b border-white/5 items-center">
                  <div>
                    <p className="text-sm font-medium text-white">{row.displayName || row.twitchLogin}</p>
                    <p className="text-xs text-gray-400">@{row.twitchLogin}</p>
                  </div>
                  <p className="text-sm text-gray-200">{row.role || "N/A"}</p>
                  <p className="text-sm text-gray-300">{formatDate(row.lastReviewAt)}</p>
                  <p className="text-sm text-gray-300">{formatDate(row.nextReviewAt)}</p>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs w-fit ${badgeClass}`}>{label}</span>
                  <input
                    value={row.owner}
                    onChange={(event) => setOwner(row.key, event.target.value)}
                    placeholder="Ex: @Nexou"
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-amber-300/40 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

