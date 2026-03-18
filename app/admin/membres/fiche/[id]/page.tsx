"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import { getRoleBadgeClasses } from "@/lib/roleColors";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

type TabKey = "overview" | "journey" | "performance" | "community" | "admin";

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Apercu",
  journey: "Parcours",
  performance: "Performance",
  community: "Communaute",
  admin: "Administratif",
};

const TAB_SECTIONS: Record<TabKey, string[]> = {
  overview: [],
  journey: ["integration"],
  performance: ["evaluations", "engagement"],
  community: ["events", "engagement"],
  admin: ["notes", "sanctions", "logs"],
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("fr-FR");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("fr-FR");
}

function toMonthLabel(monthKey?: string): string {
  if (!monthKey) return "—";
  const parsed = new Date(`${monthKey}-01`);
  if (Number.isNaN(parsed.getTime())) return monthKey;
  return parsed.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function MemberFichePage() {
  const params = useParams();
  const memberId = decodeURIComponent((params?.id as string) || "");

  const [ready, setReady] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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
    if (memberId) void checkAccess();
  }, [memberId]);

  useEffect(() => {
    if (ready && memberId) {
      void loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, memberId]);

  useEffect(() => {
    if (!ready) return;
    setSectionData((prev) => {
      const next = { ...prev };
      delete next.evaluations;
      delete next.engagement;
      delete next.events;
      return next;
    });
    void loadTab(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  async function loadSummary() {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/360?section=summary&months=${months}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors du chargement du membre");
      }
      const data = await response.json();
      setMember(data.member || null);
      if (!data.member) setError("Membre non trouve");
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
    const sections = TAB_SECTIONS[tab] || [];
    if (sections.length === 0) return;
    await Promise.all(sections.map((section) => loadSection(section, force)));
  }

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    void loadTab(tab);
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
    const avgScore = known.length > 0 ? known.reduce((sum: number, row: any) => sum + row.total, 0) / known.length : 0;

    let trend = 0;
    let trendPercent: number | null = null;
    if (known.length >= 2) {
      const last = known[known.length - 1].total;
      const prev = known[known.length - 2].total;
      trend = last - prev;
      if (prev !== 0) trendPercent = (trend / Math.abs(prev)) * 100;
    }

    const trendLabel = trend > 0 ? "Progression" : trend < 0 ? "Regression" : "Stable";
    const withDelta = rows.map((row: any, idx: number) => {
      if (idx === 0) return { ...row, delta: null };
      return { ...row, delta: row.total - rows[idx - 1].total };
    });

    return { rows: withDelta, avgScore, trend, trendPercent, trendLabel };
  }, [evaluations]);

  const engagement = sectionData.engagement?.engagement || { follows: [], raids: { sent: 0, received: 0, details: [], byMonth: [] } };
  const raids = engagement.raids || { sent: 0, received: 0, details: [], byMonth: [] };
  const follows = engagement.follows || [];
  const events = sectionData.events?.events || { participations: [], statsByCategory: {}, favoriteCategory: null, total: 0 };
  const integrationRows = sectionData.integration?.integration || [];
  const notes = sectionData.notes?.internalNotes || { current: "", history: [] };
  const sanctions = sectionData.sanctions?.sanctions || [];
  const logs = sectionData.logs?.logs || [];

  const sectionError = (section: string): string | null => {
    const value = sectionData[section];
    if (value && typeof value.error === "string") return value.error;
    return null;
  };

  if (!ready || loadingSummary) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
          <div className="h-10 w-72 bg-gray-800 rounded" />
          <div className="h-28 bg-gray-800 rounded-2xl" />
          <div className="h-96 bg-gray-800 rounded-2xl" />
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
  const statusLabel = member.isActive !== false ? "Actif" : "Inactif";
  const statusClass =
    member.isActive !== false
      ? "bg-green-500/20 text-green-300 border border-green-500/30"
      : "bg-red-500/20 text-red-300 border border-red-500/30";
  const lastEvaluation = evalMetrics.rows.length > 0 ? evalMetrics.rows[evalMetrics.rows.length - 1] : null;
  const validationLabel = member.profileValidationStatus === "valide" ? "Valide" : "A revoir";

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-4 md:p-6 xl:p-8">
      <div className="max-w-[1600px] mx-auto space-y-5">
        <section className="rounded-2xl border border-gray-700 bg-gradient-to-br from-[#151720] to-[#111319] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={member.avatar || "/default-avatar.png"}
                alt={headerName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-gray-700 object-cover"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{headerName}</h1>
                  {member.role && (
                    <span className={getRoleBadgeClasses(member.role)}>
                      {getRoleBadgeLabel(member.role)}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                  {member.isVip && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                  {member.twitchLogin && (
                    <a
                      href={`https://www.twitch.tv/${member.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 underline"
                    >
                      Twitch: {member.twitchLogin}
                    </a>
                  )}
                  <span>Discord: {member.discordUsername || "—"}</span>
                  <span>ID Discord: {member.discordId || "—"}</span>
                  <span>ID Twitch: {member.twitchId || "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Historique:</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="bg-[#0f1116] border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value={3}>3 mois</option>
                <option value={6}>6 mois</option>
                <option value={12}>12 mois</option>
                <option value={24}>24 mois</option>
              </select>
              <Link
                href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName || "")}`}
                className="px-3 py-2 rounded-lg border border-gray-700 bg-[#1a1d26] hover:bg-[#212635] text-sm font-semibold"
              >
                Retour gestion
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Membre depuis</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(member.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Integration</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(member.integrationDate)}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Parrain</p>
              <p className="mt-1 text-sm font-semibold text-white">{member.parrain || "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Validation profil</p>
              <p className="mt-1 text-sm font-semibold text-white">{validationLabel}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Note eval. recente</p>
              <p className="mt-1 text-sm font-semibold text-white">{lastEvaluation ? String(lastEvaluation.total) : "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0f1116] p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Raids (faits/recus)</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {Number(raids.sent || 0)} / {Number(raids.received || 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-700 bg-[#12141b] p-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-violet-500/25 border border-violet-400/40 text-violet-100"
                    : "bg-[#1a1d26] border border-gray-700 text-gray-300 hover:text-white"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "overview" && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Profil et reperes</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                  <p className="text-gray-400">Role</p>
                  <p className="font-semibold">{member.role || "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                  <p className="text-gray-400">Onboarding</p>
                  <p className="font-semibold">{member.onboardingStatus || "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                  <p className="text-gray-400">Mentor</p>
                  <p className="font-semibold">{member.mentorTwitchLogin ? `@${member.mentorTwitchLogin}` : "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                  <p className="text-gray-400">Fuseau / Langue</p>
                  <p className="font-semibold">{member.timezone || "—"} / {member.primaryLanguage || "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 md:col-span-2">
                  <p className="text-gray-400">Description publique</p>
                  <p className="font-medium text-gray-200 whitespace-pre-wrap">{member.description || "Aucune description renseignee."}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Synthese rapide</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">Pays: <strong>{member.countryCode || "—"}</strong></li>
                <li className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">Derniere revue: <strong>{formatDate(member.lastReviewAt)}</strong></li>
                <li className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">Prochaine revue: <strong>{formatDate(member.nextReviewAt)}</strong></li>
                <li className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">Badges: <strong>{Array.isArray(member.badges) ? member.badges.length : 0}</strong></li>
              </ul>
            </div>
          </section>
        )}

        {activeTab === "journey" && (
          <section className="rounded-2xl border border-gray-700 bg-[#151922] p-5 space-y-4">
            <h3 className="text-lg font-semibold">Parcours et integrations</h3>
            {loadingSections.has("integration") ? (
              <p className="text-gray-400">Chargement des integrations...</p>
            ) : sectionError("integration") ? (
              <p className="text-red-300">{sectionError("integration")}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Total integrations suivies</p>
                    <p className="text-xl font-bold">{integrationRows.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Date entree TENF</p>
                    <p className="text-xl font-bold">{formatDate(member.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Date integration validee</p>
                    <p className="text-xl font-bold">{formatDate(member.integrationDate)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2">Session</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Categorie</th>
                        <th className="py-2">Presence</th>
                        <th className="py-2">Parrain</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrationRows.length === 0 ? (
                        <tr><td className="py-3 text-gray-500" colSpan={6}>Aucune integration trouvee pour ce membre.</td></tr>
                      ) : (
                        integrationRows.map((row: any) => (
                          <tr key={String(row.integration?.id || Math.random())} className="border-b border-gray-800">
                            <td className="py-2 font-medium">{row.integration?.title || "—"}</td>
                            <td className="py-2">{formatDate(row.integration?.date)}</td>
                            <td className="py-2">{row.integration?.category || "—"}</td>
                            <td className="py-2">{row.registration?.present === true ? "Oui" : "Non / non confirme"}</td>
                            <td className="py-2">{row.registration?.parrain || "—"}</td>
                            <td className="py-2 text-gray-300">{row.registration?.notes || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "performance" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Evaluations mensuelles</h3>
              {loadingSections.has("evaluations") ? (
                <p className="text-gray-400 mt-3">Chargement des evaluations...</p>
              ) : sectionError("evaluations") ? (
                <p className="text-red-300 mt-3">{sectionError("evaluations")}</p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Moyenne</p>
                      <p className="text-2xl font-bold">{evalMetrics.avgScore.toFixed(1)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Tendance</p>
                      <p className="text-2xl font-bold">{evalMetrics.trendLabel}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Delta dernier mois</p>
                      <p className="text-2xl font-bold">
                        {evalMetrics.trend > 0 ? "+" : ""}
                        {evalMetrics.trend.toFixed(1)}
                        {evalMetrics.trendPercent !== null
                          ? ` (${evalMetrics.trendPercent > 0 ? "+" : ""}${evalMetrics.trendPercent.toFixed(1)}%)`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm min-w-[780px]">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-700">
                          <th className="py-2">Mois</th>
                          <th className="py-2">Total</th>
                          <th className="py-2">Section A/B/C/D</th>
                          <th className="py-2">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evalMetrics.rows.length === 0 ? (
                          <tr><td className="py-3 text-gray-500" colSpan={4}>Aucune evaluation disponible.</td></tr>
                        ) : (
                          evalMetrics.rows.map((row: any) => (
                            <tr key={row.month} className="border-b border-gray-800">
                              <td className="py-2">{toMonthLabel(row.month)}</td>
                              <td className="py-2 font-semibold">{row.total}</td>
                              <td className="py-2 text-gray-300">A:{row.sectionA} / B:{row.sectionB} / C:{row.sectionC} / D:{row.sectionD}</td>
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

            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Raids (periode selectionnee)</h3>
              {loadingSections.has("engagement") ? (
                <p className="text-gray-400 mt-3">Chargement des raids...</p>
              ) : sectionError("engagement") ? (
                <p className="text-red-300 mt-3">{sectionError("engagement")}</p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Raids faits</p>
                      <p className="text-2xl font-bold">{Number(raids.sent || 0)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Raids recus</p>
                      <p className="text-2xl font-bold">{Number(raids.received || 0)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm min-w-[580px]">
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
                          (raids.byMonth || []).map((row: any) => (
                            <tr key={String(row.month)} className="border-b border-gray-800">
                              <td className="py-2">{toMonthLabel(row.month)}</td>
                              <td className="py-2">{row.sent}</td>
                              <td className="py-2">{row.received}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeTab === "community" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Evenements communautaires</h3>
              {loadingSections.has("events") ? (
                <p className="text-gray-400 mt-3">Chargement des evenements...</p>
              ) : sectionError("events") ? (
                <p className="text-red-300 mt-3">{sectionError("events")}</p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Participations</p>
                      <p className="text-2xl font-bold">{events.total || 0}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Categorie favorite</p>
                      <p className="text-2xl font-bold">{events.favoriteCategory || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3">
                      <p className="text-gray-400 text-sm">Categories distinctes</p>
                      <p className="text-2xl font-bold">{Object.keys(events.statsByCategory || {}).length}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(events.participations || []).length === 0 ? (
                      <p className="text-gray-500 text-sm">Aucune participation evenement.</p>
                    ) : (
                      (events.participations || []).map((row: any) => (
                        <div key={`${row.eventId}-${row.date}`} className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 text-sm">
                          <div className="font-semibold">{row.title}</div>
                          <div className="text-gray-400">
                            {formatDate(row.date)} • {row.category} • {row.mode === "presence" ? "Presence" : "Inscription"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Suivi follows (evaluation)</h3>
              {loadingSections.has("engagement") ? (
                <p className="text-gray-400 mt-3">Chargement du suivi follows...</p>
              ) : sectionError("engagement") ? (
                <p className="text-red-300 mt-3">{sectionError("engagement")}</p>
              ) : (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2">Mois</th>
                        <th className="py-2">Staff</th>
                        <th className="py-2">Statut</th>
                        <th className="py-2">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {follows.length === 0 ? (
                        <tr><td className="py-3 text-gray-500" colSpan={4}>Aucun suivi follow trouve.</td></tr>
                      ) : (
                        follows.map((row: any, idx: number) => (
                          <tr key={`${row.month}-${row.staffSlug}-${idx}`} className="border-b border-gray-800">
                            <td className="py-2">{toMonthLabel(row.month)}</td>
                            <td className="py-2">{row.staffName || row.staffSlug || "—"}</td>
                            <td className="py-2">{row.status?.status || "—"}</td>
                            <td className="py-2 text-gray-300">{row.status?.comment || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "admin" && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5 space-y-4">
              <h3 className="text-lg font-semibold">Notes internes</h3>
              {loadingSections.has("notes") ? (
                <p className="text-gray-400">Chargement des notes...</p>
              ) : sectionError("notes") ? (
                <p className="text-red-300">{sectionError("notes")}</p>
              ) : (
                <>
                  <div className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 text-sm whitespace-pre-wrap text-gray-200">
                    {notes.current || "Aucune note actuelle."}
                  </div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(notes.history || []).map((row: any, idx: number) => (
                      <div key={`${row.date}-${idx}`} className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 text-sm">
                        <div className="text-gray-400">{formatDateTime(row.date)} • {row.author}</div>
                        <div className="text-gray-200">{row.action}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          Avant: {row.before || "—"} | Apres: {row.after || "—"}
                        </div>
                      </div>
                    ))}
                    {(notes.history || []).length === 0 && <p className="text-gray-500 text-sm">Aucun historique de notes.</p>}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gray-700 bg-[#151922] p-5 space-y-4">
              <h3 className="text-lg font-semibold">Sanctions internes</h3>
              {loadingSections.has("sanctions") ? (
                <p className="text-gray-400">Chargement des sanctions...</p>
              ) : sectionError("sanctions") ? (
                <p className="text-red-300">{sectionError("sanctions")}</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {sanctions.map((row: any, idx: number) => (
                    <div key={`${row.date}-${idx}`} className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 text-sm">
                      <div className="font-semibold text-gray-100">{row.type || "Sanction"}</div>
                      <div className="text-gray-400">{formatDateTime(row.date)} • {row.staff}</div>
                      {row.motif && <div className="text-gray-200 mt-1">Motif: {row.motif}</div>}
                      {row.duree && <div className="text-gray-300">Duree: {row.duree}</div>}
                      {row.commentaire && <div className="text-gray-400">Commentaire: {row.commentaire}</div>}
                    </div>
                  ))}
                  {sanctions.length === 0 && <p className="text-gray-500 text-sm">Aucune sanction trouvee.</p>}
                </div>
              )}
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-gray-700 bg-[#151922] p-5">
              <h3 className="text-lg font-semibold">Logs recents</h3>
              {loadingSections.has("logs") ? (
                <p className="text-gray-400 mt-3">Chargement des logs...</p>
              ) : sectionError("logs") ? (
                <p className="text-red-300 mt-3">{sectionError("logs")}</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {logs.map((row: any) => (
                    <div key={String(row.id)} className="rounded-lg border border-gray-700 bg-[#0f1116] p-3 text-sm">
                      <div className="font-semibold">{row.action}</div>
                      <div className="text-gray-400">
                        {formatDateTime(row.timestamp)} • {row.actorUsername || row.actorDiscordId}
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-gray-500 text-sm">Aucun log recent.</p>}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
