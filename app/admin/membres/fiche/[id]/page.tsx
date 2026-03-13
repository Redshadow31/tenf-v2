"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import { getRoleBadgeClasses } from "@/lib/roleColors";

type TabKey = "summary" | "evaluations" | "raids" | "events" | "notesSanctions" | "logs";

const TAB_LABELS: Record<TabKey, string> = {
  summary: "Resume",
  evaluations: "Evaluations",
  raids: "Raids",
  events: "Evenements",
  notesSanctions: "Notes & sanctions",
  logs: "Logs",
};

export default function MemberFichePage() {
  const params = useParams();
  const memberId = decodeURIComponent((params?.id as string) || "");

  const [ready, setReady] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [member, setMember] = useState<any>(null);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function checkAccess() {
      const user = await getDiscordUser();
      if (!user) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(`/admin/membres/fiche/${memberId}`)}`;
        return;
      }
      try {
        const roleResponse = await fetch("/api/user/role");
        const roleData = await roleResponse.json();
        if (!roleData.hasAdminAccess) {
          window.location.href = "/unauthorized";
          return;
        }
      } catch {
        if (!isFounder(user.id)) {
          window.location.href = "/unauthorized";
          return;
        }
      }
      setReady(true);
    }
    if (memberId) checkAccess();
  }, [memberId]);

  useEffect(() => {
    if (ready && memberId) {
      loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, memberId]);

  useEffect(() => {
    if (!ready) return;
    // Invalider uniquement les sections dépendantes de la fenêtre temporelle
    setSectionData((prev) => {
      const next = { ...prev };
      delete next.evaluations;
      delete next.engagement;
      delete next.events;
      return next;
    });
    if (activeTab !== "summary") {
      loadTab(activeTab, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  async function loadSummary() {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/360?section=summary&months=${months}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors du chargement du membre");
      }
      const data = await response.json();
      setMember(data.member || null);
      if (!data.member) {
        setError("Membre non trouve");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadSection(section: string, force = false) {
    if (!memberId) return;
    if (!force && sectionData[section]) return;
    setLoadingSections((prev) => new Set(prev).add(section));
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/360?section=${encodeURIComponent(section)}&months=${months}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Erreur section ${section}`);
      }
      const data = await response.json();
      setSectionData((prev) => ({ ...prev, [section]: data }));
    } catch (e) {
      setSectionData((prev) => ({
        ...prev,
        [section]: { error: e instanceof Error ? e.message : `Erreur section ${section}` },
      }));
    } finally {
      setLoadingSections((prev) => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
    }
  }

  async function loadTab(tab: TabKey, force = false) {
    if (tab === "summary") return;
    if (tab === "evaluations") return loadSection("evaluations", force);
    if (tab === "raids") return loadSection("engagement", force);
    if (tab === "events") return loadSection("events", force);
    if (tab === "logs") return loadSection("logs", force);
    if (tab === "notesSanctions") {
      await Promise.all([loadSection("notes", force), loadSection("sanctions", force)]);
    }
  }

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    loadTab(tab);
  }

  const evaluations = sectionData.evaluations?.evaluations || [];
  const evalMetrics = useMemo(() => {
    const rows = [...evaluations]
      .map((e: any) => ({
        month: e.month,
        total: Number(e?.score?.total ?? 0),
        sectionA: Number(e?.score?.sectionA ?? 0),
        sectionB: Number(e?.score?.sectionB ?? 0),
        sectionC: Number(e?.score?.sectionC ?? 0),
        sectionD: Number(e?.score?.sectionDBonuses ?? 0),
      }))
      .sort((a: any, b: any) => a.month.localeCompare(b.month));

    const known = rows.filter((r: any) => Number.isFinite(r.total));
    const avgScore = known.length > 0 ? known.reduce((s: number, r: any) => s + r.total, 0) / known.length : 0;

    let trend = 0;
    let trendPercent: number | null = null;
    if (known.length >= 2) {
      const last = known[known.length - 1].total;
      const prev = known[known.length - 2].total;
      trend = last - prev;
      if (prev !== 0) {
        trendPercent = (trend / Math.abs(prev)) * 100;
      }
    }

    const trendLabel = trend > 0 ? "📈 progression" : trend < 0 ? "📉 regression" : "➡️ stable";
    const withDelta = rows.map((row: any, idx: number) => {
      if (idx === 0) return { ...row, delta: null };
      return { ...row, delta: row.total - rows[idx - 1].total };
    });

    return {
      rows: withDelta,
      avgScore,
      trend,
      trendPercent,
      trendLabel,
    };
  }, [evaluations]);

  const raids = sectionData.engagement?.engagement?.raids || { sent: 0, received: 0, details: [], byMonth: [] };
  const events = sectionData.events?.events || { participations: [], statsByCategory: {}, favoriteCategory: null, total: 0 };
  const notes = sectionData.notes?.internalNotes || { current: "", history: [] };
  const sanctions = sectionData.sanctions?.sanctions || [];
  const logs = sectionData.logs?.logs || [];

  if (!ready || loadingSummary) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="animate-pulse space-y-4 max-w-6xl mx-auto">
          <div className="h-10 w-72 bg-gray-800 rounded" />
          <div className="h-24 bg-gray-800 rounded" />
          <div className="h-80 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400 text-lg">{error || "Membre non trouve"}</p>
          <Link href="/admin/membres/gestion" className="text-purple-400 hover:text-purple-300 underline mt-4 inline-block">
            Retour gestion membres
          </Link>
        </div>
      </div>
    );
  }

  const headerName = member.siteUsername || member.displayName || member.twitchLogin || "Membre";

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fiche membre</h1>
          <Link
            href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName || "")}`}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold"
          >
            Retour gestion
          </Link>
        </div>

        <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-700/30 flex items-center justify-center text-2xl font-semibold">
              {String(headerName).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{headerName}</h2>
                {member.role && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClasses(member.role)}`}>
                    {member.role}
                  </span>
                )}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    member.isActive !== false ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {member.isActive !== false ? "Actif" : "Inactif"}
                </span>
                {member.isVip && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">VIP</span>}
                {Array.isArray(member.badges) &&
                  member.badges
                    .filter((b: string) => /mentor|junior/i.test(b))
                    .map((b: string) => (
                      <span key={b} className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {b}
                      </span>
                    ))}
              </div>
              <div className="mt-2 text-sm text-gray-300 flex flex-wrap gap-4">
                {member.twitchLogin && (
                  <a href={`https://www.twitch.tv/${member.twitchLogin}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                    Twitch: {member.twitchLogin}
                  </a>
                )}
                {member.discordUsername && <span>Discord: {member.discordUsername}</span>}
                {member.discordId && <span>ID Discord: {member.discordId}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-300">Fenetre historique:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="bg-[#1a1a1d] border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
            <option value={12}>12 mois</option>
            <option value={24}>24 mois</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab ? "bg-purple-600 text-white" : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {activeTab === "summary" && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Resume</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">Membre depuis:</span> <span>{member.createdAt ? new Date(member.createdAt).toLocaleDateString("fr-FR") : "—"}</span></div>
              <div><span className="text-gray-400">Integration:</span> <span>{member.integrationDate ? new Date(member.integrationDate).toLocaleDateString("fr-FR") : "—"}</span></div>
              <div><span className="text-gray-400">Parrain:</span> <span>{member.parrain || "—"}</span></div>
              <div><span className="text-gray-400">Timezone:</span> <span>{member.timezone || "—"}</span></div>
              <div><span className="text-gray-400">Langue:</span> <span>{member.primaryLanguage || "—"}</span></div>
              <div><span className="text-gray-400">Pays:</span> <span>{member.countryCode || "—"}</span></div>
            </div>
          </div>
        )}

        {activeTab === "evaluations" && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5 space-y-4">
            {loadingSections.has("evaluations") ? (
              <p className="text-gray-400">Chargement des evaluations...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Moyenne connue</p>
                    <p className="text-2xl font-bold">{evalMetrics.avgScore.toFixed(1)}</p>
                  </div>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Tendance</p>
                    <p className="text-xl font-bold">{evalMetrics.trendLabel}</p>
                  </div>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Delta dernier mois</p>
                    <p className="text-2xl font-bold">
                      {evalMetrics.trend > 0 ? "+" : ""}
                      {evalMetrics.trend.toFixed(1)}
                      {evalMetrics.trendPercent !== null ? ` (${evalMetrics.trendPercent > 0 ? "+" : ""}${evalMetrics.trendPercent.toFixed(1)}%)` : ""}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2">Mois</th>
                        <th className="py-2">Note totale</th>
                        <th className="py-2">Sections</th>
                        <th className="py-2">Delta vs mois precedent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evalMetrics.rows.length === 0 ? (
                        <tr><td className="py-3 text-gray-500" colSpan={4}>Aucune evaluation disponible.</td></tr>
                      ) : (
                        evalMetrics.rows.map((row: any) => (
                          <tr key={row.month} className="border-b border-gray-800">
                            <td className="py-2">{new Date(`${row.month}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                            <td className="py-2 font-semibold">{row.total}</td>
                            <td className="py-2 text-gray-300">A:{row.sectionA} B:{row.sectionB} C:{row.sectionC} D:{row.sectionD}</td>
                            <td className="py-2">
                              {row.delta === null ? "—" : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(1)}`}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "raids" && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5 space-y-4">
            {loadingSections.has("engagement") ? (
              <p className="text-gray-400">Chargement des raids...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Raids faits</p>
                    <p className="text-2xl font-bold">{raids.sent || 0}</p>
                  </div>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Raids recus</p>
                    <p className="text-2xl font-bold">{raids.received || 0}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2">Mois</th>
                        <th className="py-2">Faits</th>
                        <th className="py-2">Recus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(raids.byMonth || []).length === 0 ? (
                        <tr><td className="py-3 text-gray-500" colSpan={3}>Aucune donnee mensuelle.</td></tr>
                      ) : (
                        raids.byMonth.map((m: any) => (
                          <tr key={m.month} className="border-b border-gray-800">
                            <td className="py-2">{m.month}</td>
                            <td className="py-2">{m.sent}</td>
                            <td className="py-2">{m.received}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Details</h4>
                  {(raids.details || [])
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 100)
                    .map((d: any, idx: number) => (
                      <div key={`${d.type}-${d.date}-${idx}`} className="bg-[#0e0e10] border border-gray-700 rounded p-2 text-sm text-gray-300">
                        {d.type === "sent" ? "→" : "←"} {new Date(d.date).toLocaleDateString("fr-FR")} ({d.month}) {d.type === "sent" ? `vers ${d.target}` : `depuis ${d.raider}`}
                      </div>
                    ))}
                  {(raids.details || []).length === 0 && <p className="text-gray-500 text-sm">Aucun detail de raid.</p>}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5 space-y-4">
            {loadingSections.has("events") ? (
              <p className="text-gray-400">Chargement des evenements...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total participations</p>
                    <p className="text-2xl font-bold">{events.total || 0}</p>
                  </div>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Categorie favorite</p>
                    <p className="text-xl font-bold">{events.favoriteCategory || "—"}</p>
                  </div>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Categories touchees</p>
                    <p className="text-xl font-bold">{Object.keys(events.statsByCategory || {}).length}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  {Object.entries(events.statsByCategory || {}).map(([category, count]) => (
                    <span key={category} className="inline-block mr-2 mb-2 px-2 py-1 rounded bg-gray-800 border border-gray-700">
                      {category}: {String(count)}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {(events.participations || []).map((p: any) => (
                    <div key={`${p.eventId}-${p.date}`} className="bg-[#0e0e10] border border-gray-700 rounded p-3 text-sm">
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-gray-400">
                        {new Date(p.date).toLocaleDateString("fr-FR")} • {p.category} • {p.mode === "presence" ? "presence" : "inscription"}
                      </div>
                    </div>
                  ))}
                  {(events.participations || []).length === 0 && <p className="text-gray-500">Aucune participation evenement.</p>}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "notesSanctions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-lg">Notes internes</h3>
              {(loadingSections.has("notes")) ? (
                <p className="text-gray-400">Chargement des notes...</p>
              ) : (
                <>
                  <div className="bg-[#0e0e10] border border-gray-700 rounded p-3 text-sm whitespace-pre-wrap">
                    {notes.current || "Aucune note actuelle."}
                  </div>
                  <div className="space-y-2">
                    {(notes.history || []).map((h: any, idx: number) => (
                      <div key={`${h.date}-${idx}`} className="bg-[#0e0e10] border border-gray-700 rounded p-2 text-sm">
                        <div className="text-gray-400">{new Date(h.date).toLocaleString("fr-FR")} • {h.author}</div>
                        <div className="text-gray-300">{h.action}</div>
                        <div className="text-gray-400 text-xs">Avant: {h.before || "—"} | Apres: {h.after || "—"}</div>
                      </div>
                    ))}
                    {(notes.history || []).length === 0 && <p className="text-gray-500 text-sm">Aucun historique de notes.</p>}
                  </div>
                </>
              )}
            </div>
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-lg">Sanctions internes</h3>
              {loadingSections.has("sanctions") ? (
                <p className="text-gray-400">Chargement des sanctions...</p>
              ) : (
                <div className="space-y-2">
                  {sanctions.map((s: any, idx: number) => (
                    <div key={`${s.date}-${idx}`} className="bg-[#0e0e10] border border-gray-700 rounded p-3 text-sm">
                      <div className="font-semibold">{s.type || "Sanction"}</div>
                      <div className="text-gray-400">{new Date(s.date).toLocaleString("fr-FR")} • {s.staff}</div>
                      {s.motif && <div className="text-gray-300 mt-1">Motif: {s.motif}</div>}
                      {s.duree && <div className="text-gray-300">Duree: {s.duree}</div>}
                      {s.commentaire && <div className="text-gray-400">Commentaire: {s.commentaire}</div>}
                    </div>
                  ))}
                  {sanctions.length === 0 && <p className="text-gray-500 text-sm">Aucune sanction trouvee.</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl p-5">
            {loadingSections.has("logs") ? (
              <p className="text-gray-400">Chargement des logs...</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log: any) => (
                  <div key={log.id} className="bg-[#0e0e10] border border-gray-700 rounded p-3 text-sm">
                    <div className="font-semibold">{log.action}</div>
                    <div className="text-gray-400">
                      {new Date(log.timestamp).toLocaleString("fr-FR")} • {log.actorUsername || log.actorDiscordId}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-gray-500 text-sm">Aucun log recent.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

