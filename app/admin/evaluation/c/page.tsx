"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

const IGNORED_STORAGE_KEY_PREFIX = "evaluation-c-ignored-";

// Fonction de normalisation pour les logins
function normalizeLogin(x: string): string {
  return (x || "").trim().toLowerCase();
}

/**
 * Détermine si, dans UNE feuille de validation, le membre "login"
 * est marqué comme "me suit" (retour de follow) pour le modo en question.
 * Supporte plusieurs structures de stockage.
 */
function memberFollowsStaffInSheet(sheet: any, memberLogin: string): boolean {
  const login = normalizeLogin(memberLogin);
  if (!login) return false;

  // Format A: sheet.follows = ["login1", "login2", ...]  (liste de ceux qui suivent le modo)
  if (Array.isArray(sheet?.follows)) {
    return sheet.follows.map(normalizeLogin).includes(login);
  }

  // Format B: sheet.members = { "login": { followsMe: true } }
  if (sheet?.members && typeof sheet.members === "object" && !Array.isArray(sheet.members)) {
    const entry = sheet.members[login] || sheet.members[memberLogin] || sheet.members[normalizeLogin(memberLogin)];
    return Boolean(entry?.followsMe);
  }

  // Format C: sheet.rows = [{ login, followsMe }, ...] ou meSuit
  if (Array.isArray(sheet?.rows)) {
    const row = sheet.rows.find((r: any) => normalizeLogin(r.login || r.user) === login);
    return Boolean(row?.followsMe ?? row?.meSuit);
  }

  // Format D: sheet.membersArray (format actuel) avec meSuit
  if (Array.isArray(sheet?.membersArray)) {
    const member = sheet.membersArray.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  // Format D alternatif: sheet.members (array) avec meSuit
  if (Array.isArray(sheet?.members)) {
    const member = sheet.members.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  return false;
}

function computeScores(members: string[], sheets: any[], maxPoints = 5, excludedSlugs?: Set<string>) {
  const activeSheets = excludedSlugs
    ? sheets.filter((s: any) => !excludedSlugs.has((s.staffSlug || "").toLowerCase()))
    : sheets;
  const totalSheets = activeSheets.length;

  // aucune feuille → tout à 0
  if (totalSheets === 0) {
    return {
      totalSheets: 0,
      results: members.map(m => ({
        login: m,
        count: 0,
        taux: 0,
        score: 0,
      })),
      avgScore: 0,
      avgTaux: 0,
    };
  }

  const results = members.map(login => {
    let count = 0;
    for (const s of activeSheets) {
      if (memberFollowsStaffInSheet(s, login)) count++;
    }
    const taux = count / totalSheets;
    const score = Math.round(taux * maxPoints * 100) / 100;
    return { login, count, taux: Math.round(taux * 1000) / 1000, score };
  });

  const avgScore = results.length > 0
    ? Math.round((results.reduce((a, r) => a + r.score, 0) / results.length) * 100) / 100
    : 0;
  const avgTaux = results.length > 0
    ? Math.round((results.reduce((a, r) => a + r.taux, 0) / results.length) * 1000) / 1000
    : 0;

  return { totalSheets, results, avgScore, avgTaux };
}

/** Compte pour une feuille donnée combien de membres (de la liste) ont "me suit" */
function countFollowsInSheet(sheet: any, members: string[]): number {
  return members.filter(login => memberFollowsStaffInSheet(sheet, login)).length;
}

export default function EvaluationCPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-01");
  const [maxPoints, setMaxPoints] = useState(5);
  const [dataLoading, setDataLoading] = useState(false);
  const [sheets, setSheets] = useState<any[]>([]);
  const [ignoredSlugs, setIgnoredSlugs] = useState<Set<string>>(new Set());
  const [totalSheets, setTotalSheets] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [avgTaux, setAvgTaux] = useState(0);
  const [results, setResults] = useState<Array<{ login: string; count: number; taux: number; score: number }>>([]);
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    async function checkAccess() {
      try {
        // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs et les rôles dans données membres)
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  // Charger la liste des membres TENF
  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (response.ok) {
          const data = await response.json();
          const memberLogins = (data.members || [])
            .map((m: any) => m.twitchLogin)
            .filter(Boolean) as string[];
          setMembers(memberLogins);
        }
      } catch (error) {
        console.error("Erreur chargement membres:", error);
      }
    }
    if (hasAccess) {
      loadMembers();
    }
  }, [hasAccess]);

  // Charger les feuilles ignorées depuis le localStorage (par mois)
  useEffect(() => {
    try {
      const key = IGNORED_STORAGE_KEY_PREFIX + selectedMonth;
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setIgnoredSlugs(new Set((arr || []).map((s: string) => s.toLowerCase())));
      } else {
        setIgnoredSlugs(new Set());
      }
    } catch {
      setIgnoredSlugs(new Set());
    }
  }, [selectedMonth]);

  // Charger les validations (feuilles) et calculer les scores
  useEffect(() => {
    let cancelled = false;

    async function loadValidations() {
      if (!hasAccess || members.length === 0) return;

      setDataLoading(true);
      try {
        const res = await fetch(`/api/follow/validations/${selectedMonth}`, { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) {
          throw new Error('Erreur lors du chargement des validations');
        }

        const json = await res.json();
        const rawSheets = json?.validations ?? [];
        if (!cancelled) setSheets(rawSheets);
      } catch (error) {
        console.error("Erreur chargement validations:", error);
        if (!cancelled) setSheets([]);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadValidations();
    return () => { cancelled = true; };
  }, [selectedMonth, members.length, hasAccess]);

  // Recalcul des scores quand sheets, members, maxPoints ou ignoredSlugs changent
  useEffect(() => {
    if (members.length === 0 || sheets.length === 0) {
      setTotalSheets(0);
      setAvgScore(0);
      setAvgTaux(0);
      setResults([]);
      return;
    }
    const computed = computeScores(members, sheets, maxPoints, ignoredSlugs);
    setTotalSheets(computed.totalSheets);
    setAvgScore(computed.avgScore);
    setAvgTaux(computed.avgTaux);
    setResults(computed.results);
  }, [sheets, members, maxPoints, ignoredSlugs]);

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function getSheetLabel(sheet: any): string {
    return (sheet.staffName || sheet.staffSlug || "Feuille").trim() || "Sans nom";
  }

  function toggleIgnoreSheet(slug: string) {
    const lower = slug.toLowerCase();
    setIgnoredSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(lower)) next.delete(lower);
      else next.add(lower);
      try {
        const key = IGNORED_STORAGE_KEY_PREFIX + selectedMonth;
        localStorage.setItem(key, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("localStorage setItem failed", e);
      }
      return next;
    });
  }

  const sheetStats = useMemo(() => {
    return sheets.map((sheet) => {
      const slug = (sheet.staffSlug || "").toLowerCase();
      const label = getSheetLabel(sheet);
      const count = countFollowsInSheet(sheet, members);
      const total = members.length;
      const isIgnored = ignoredSlugs.has(slug);
      return { slug, label, count, total, isIgnored };
    });
  }, [sheets, members, ignoredSlugs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/evaluation"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au Hub Évaluation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">C. Follow</h1>
        <p className="text-gray-400">Retour de follow</p>
      </div>

      {/* Sélecteurs */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Mois :</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
          >
            {getMonthOptions().map(option => (
              <option key={option} value={option}>
                {formatMonthKey(option)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Barème :</label>
          <select
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
          >
            <option value={5}>/5</option>
            <option value={10}>/10</option>
          </select>
        </div>
        {dataLoading && (
          <div className="text-gray-400 text-sm">Chargement…</div>
        )}
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Score moyen</p>
          <p className="text-3xl font-bold text-[#9146ff]">
            {dataLoading ? "—" : `${avgScore}/${maxPoints}`}
          </p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Taux de retour moyen</p>
          <p className="text-3xl font-bold text-white">
            {dataLoading ? "—" : `${Math.round(avgTaux * 100)}%`}
          </p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Données sources</p>
          <p className="text-3xl font-bold text-gray-400">
            {dataLoading ? "—" : `${totalSheets} feuille${totalSheets > 1 ? 's' : ''} utilisée${totalSheets > 1 ? 's' : ''}${ignoredSlugs.size > 0 ? ` (${ignoredSlugs.size} ignorée${ignoredSlugs.size > 1 ? 's' : ''})` : ""}`}
          </p>
        </div>
      </div>

      {/* Résultats par feuille + ignorer manuellement */}
      {!dataLoading && sheetStats.length > 0 && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Résultats par feuille</h3>
            <p className="text-sm text-gray-400 mt-1">
              Retours &quot;me suit&quot; par membre du staff. Vous pouvez ignorer une feuille entière pour exclure ses données du calcul des notes.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0e0e10]">
                <tr className="text-left">
                  <th className="px-6 py-3 text-gray-300 font-semibold">Feuille (staff)</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Membres qui me suivent</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Statut</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sheetStats.map((row) => (
                  <tr
                    key={row.slug}
                    className={`border-t border-gray-700 transition-colors ${row.isIgnored ? "opacity-60 bg-gray-900/40" : "hover:bg-gray-800/50"}`}
                  >
                    <td className="px-6 py-3 text-white font-medium">{row.label}</td>
                    <td className="px-6 py-3 text-gray-300">
                      {row.count} / {row.total}
                    </td>
                    <td className="px-6 py-3">
                      {row.isIgnored ? (
                        <span className="text-amber-400">Ignorée</span>
                      ) : (
                        <span className="text-green-400">Incluse</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => toggleIgnoreSheet(row.slug)}
                        className={
                          row.isIgnored
                            ? "text-green-400 hover:text-green-300 underline text-left"
                            : "text-amber-400 hover:text-amber-300 underline text-left"
                        }
                      >
                        {row.isIgnored ? "Inclure cette feuille" : "Ignorer cette feuille"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau des résultats */}
      {!dataLoading && results.length > 0 && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notes retour follow (Me suit)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0e0e10]">
                <tr className="text-left">
                  <th className="px-6 py-3 text-gray-300 font-semibold">Membre</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Suivi par</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Taux</th>
                  <th className="px-6 py-3 text-gray-300 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((r) => (
                    <tr key={r.login} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-3 text-white">{r.login}</td>
                      <td className="px-6 py-3 text-gray-300">
                        {r.count}/{totalSheets}
                      </td>
                      <td className="px-6 py-3 text-gray-300">{Math.round(r.taux * 100)}%</td>
                      <td className="px-6 py-3 text-[#9146ff] font-semibold">
                        {r.score}/{maxPoints}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!dataLoading && results.length === 0 && totalSheets === 0 && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">Aucune validation enregistrée pour ce mois.</p>
        </div>
      )}
    </div>
  );
}
