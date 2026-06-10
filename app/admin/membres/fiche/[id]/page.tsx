"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import { getRoleBadgeClasses } from "@/lib/roleColors";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import MemberRoleHistoryPanel from "@/components/admin/members-gestion/MemberRoleHistoryPanel";
import MemberEvaluationRecapPanel from "@/components/admin/members-gestion/MemberEvaluationRecapPanel";
import MemberFicheLogsPanel from "@/components/admin/members-gestion/MemberFicheLogsPanel";
import MemberVipParcoursPanel, {
  type MemberVipParcoursData,
} from "@/components/admin/members-gestion/MemberVipParcoursPanel";
import {
  MemberFicheContentGrid,
  MemberFicheField,
  MemberFicheFieldGrid,
  MemberFicheHero,
  MemberFicheHeroStat,
  MemberFichePageBackdrop,
  MemberFichePanel,
  MemberFicheSkeleton,
  MemberFicheStatCard,
  MemberFicheTableHead,
  MemberFicheTableShell,
} from "@/components/admin/members-gestion/MemberFicheLayout";
import MemberFicheTabNav, {
  MemberFichePeriodChips,
  MemberFicheTabContent,
  type FicheTabKey,
} from "@/components/admin/members-gestion/MemberFicheTabNav";
import { buildEvalRecapMetrics } from "@/lib/admin/members-fiche/memberEvaluationRecap";
import {
  ficheContainerClass,
  ficheFieldAccentClass,
  ficheFocusRing,
  fichePageClass,
  ficheStatLabelClass,
  ficheTabClass,
} from "@/lib/admin/members-fiche/memberFicheStyles";

type TabKey = FicheTabKey;

const RECAP_HISTORY_MONTHS = 24;

const TAB_SECTIONS: Record<TabKey, string[]> = {
  overview: [],
  journey: ["integration"],
  vipParcours: [],
  recap: [],
  performance: ["evaluations"],
  participation: ["events"],
  raids: ["engagement"],
  community: ["engagement"],
  logs: [],
  admin: ["notes", "sanctions", "logs"],
};

function raidSourceLabel(kind?: string): string {
  if (kind === "manual") return "Manuel";
  if (kind === "eventsub") return "EventSub";
  return "Historique";
}

function raidSourceBadgeClass(kind?: string): string {
  if (kind === "manual") return "bg-amber-500/15 text-amber-200 border border-amber-400/30";
  if (kind === "eventsub") return "bg-violet-500/15 text-violet-200 border border-violet-400/30";
  return "bg-slate-500/15 text-slate-300 border border-slate-400/25";
}

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
  const searchParams = useSearchParams();
  const memberId = decodeURIComponent((params?.id as string) || "");
  const initialTab = (searchParams?.get("tab") || "").trim() as TabKey;

  const [ready, setReady] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [raidSourceFilter, setRaidSourceFilter] = useState<"all" | "manual" | "eventsub" | "legacy">("all");
  const [member, setMember] = useState<any>(null);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [recapEvaluations, setRecapEvaluations] = useState<any[]>([]);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [vipParcours, setVipParcours] = useState<MemberVipParcoursData | null>(null);
  const [loadingVipParcours, setLoadingVipParcours] = useState(false);
  const [vipParcoursError, setVipParcoursError] = useState<string | null>(null);

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
      if (
        initialTab === "vipParcours" ||
        initialTab === "recap" ||
        initialTab === "journey" ||
        initialTab === "overview" ||
        initialTab === "performance" ||
        initialTab === "participation" ||
        initialTab === "raids" ||
        initialTab === "community" ||
        initialTab === "logs" ||
        initialTab === "admin"
      ) {
        setActiveTab(initialTab);
      }
    }
    if (memberId) void checkAccess();
  }, [memberId, initialTab]);

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
    setRecapEvaluations([]);
    setVipParcours(null);
    void loadTab(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  useEffect(() => {
    if (!ready) return;
    void loadTab(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, activeTab]);

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
      void loadSection("engagement", true);
      void loadSection("events", true);
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

  async function loadRecapEvaluations(force = false) {
    if (!memberId) return;
    if (!force && recapEvaluations.length > 0) return;
    setLoadingRecap(true);
    setRecapError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/evaluation-recap?months=${RECAP_HISTORY_MONTHS}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur chargement recap evaluations");
      }
      const data = await response.json();
      setRecapEvaluations(data.evaluations || []);
    } catch (e) {
      setRecapError(e instanceof Error ? e.message : "Erreur chargement recap");
      setRecapEvaluations([]);
    } finally {
      setLoadingRecap(false);
    }
  }

  async function loadVipParcours(force = false) {
    if (!memberId) return;
    if (!force && vipParcours) return;
    setLoadingVipParcours(true);
    setVipParcoursError(null);
    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/vip-parcours`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur chargement parcours VIP");
      }
      const data = await response.json();
      setVipParcours(data);
    } catch (e) {
      setVipParcoursError(e instanceof Error ? e.message : "Erreur chargement parcours VIP");
      setVipParcours(null);
    } finally {
      setLoadingVipParcours(false);
    }
  }

  async function loadTab(tab: TabKey, force = false) {
    if (tab === "recap") {
      await loadRecapEvaluations(force);
      return;
    }
    if (tab === "vipParcours") {
      await loadVipParcours(force);
      return;
    }
    const sections = TAB_SECTIONS[tab] || [];
    if (sections.length === 0) return;
    await Promise.all(sections.map((section) => loadSection(section, force)));
  }

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    void loadTab(tab);
  }

  const evaluations = sectionData.evaluations?.evaluations || [];
  const evalMetrics = useMemo(() => buildEvalRecapMetrics(evaluations), [evaluations]);
  const recapMetrics = useMemo(() => buildEvalRecapMetrics(recapEvaluations), [recapEvaluations]);

  const loadingTab = useMemo((): TabKey | null => {
    if (loadingRecap && activeTab === "recap") return "recap";
    if (loadingVipParcours && activeTab === "vipParcours") return "vipParcours";
    const sections = TAB_SECTIONS[activeTab] || [];
    if (sections.some((section) => loadingSections.has(section))) return activeTab;
    return null;
  }, [activeTab, loadingRecap, loadingVipParcours, loadingSections]);

  const engagement = sectionData.engagement?.engagement || { follows: [], raids: { sent: 0, received: 0, details: [], byMonth: [], stats: {} } };
  const raids = engagement.raids || { sent: 0, received: 0, details: [], byMonth: [], stats: {} };
  const raidStats = raids.stats || {};
  const follows = engagement.follows || [];
  const events = sectionData.events?.events || {
    participations: [],
    statsByCategory: {},
    favoriteCategory: null,
    total: 0,
    presenceConfirmed: 0,
    registrationOnly: 0,
  };
  const filteredRaidDetails = useMemo(() => {
    const rows = [...(raids.details || [])].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (raidSourceFilter === "all") return rows;
    return rows.filter((row: any) => row.sourceKind === raidSourceFilter);
  }, [raids.details, raidSourceFilter]);
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
      <div className={fichePageClass}>
        <MemberFichePageBackdrop />
        <div className={`animate-pulse space-y-5 ${ficheContainerClass}`}>
          <div className="h-5 w-48 rounded-lg bg-white/[0.04]" />
          <div className="h-44 rounded-2xl border border-white/[0.04] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90" />
          <div className="h-16 rounded-2xl border border-white/[0.04] bg-zinc-900/50" />
          <div className="h-96 rounded-2xl border border-white/[0.04] bg-zinc-900/40" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={fichePageClass}>
        <MemberFichePageBackdrop />
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400 text-lg">{error || "Membre non trouve"}</p>
          <Link href="/admin/membres/gestion" className="text-violet-400 hover:text-violet-300 underline mt-4 inline-block">
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
    <div className={fichePageClass}>
      <MemberFichePageBackdrop />
      <div className={ficheContainerClass}>
        <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500" aria-label="Fil d'Ariane">
          <Link href="/admin/membres" className="font-medium transition hover:text-violet-300">
            Hub membres
          </Link>
          <span className="text-zinc-700" aria-hidden>
            /
          </span>
          <Link href="/admin/membres/gestion" className="font-medium transition hover:text-violet-300">
            Gestion
          </Link>
          <span className="text-zinc-700" aria-hidden>
            /
          </span>
          <span className="font-semibold text-zinc-300">Fiche 360°</span>
        </nav>

        <MemberFicheHero>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-[1.15rem] bg-gradient-to-br from-violet-500/35 via-cyan-500/15 to-emerald-500/20 opacity-80 blur-sm"
                  aria-hidden
                />
                <img
                  src={member.avatar || "/default-avatar.png"}
                  alt={headerName}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-white/15 object-cover shadow-lg shadow-black/40 ring-1 ring-white/10 transition duration-300 hover:scale-[1.02] hover:ring-violet-400/40"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                    member.isActive !== false ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                  title={statusLabel}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/70">Fiche membre 360°</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">
                    {headerName}
                  </h1>
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
                <div className="text-sm text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                  {member.twitchLogin && (
                    <a
                      href={`https://www.twitch.tv/${member.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-300 hover:text-violet-200 underline"
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

            <div className="flex flex-wrap items-center gap-3">
              <MemberFichePeriodChips value={months} onChange={setMonths} />
              <Link
                href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName || "")}`}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3 py-2 text-sm font-semibold text-zinc-200 shadow-sm transition hover:border-violet-400/35 hover:text-white ${ficheFocusRing}`}
              >
                Retour gestion
              </Link>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <MemberFicheHeroStat label="Membre depuis" value={formatDate(member.createdAt)} tone="slate" />
            <MemberFicheHeroStat label="Integration" value={formatDate(member.integrationDate)} tone="indigo" />
            <MemberFicheHeroStat label="Parrain" value={member.parrain || "—"} tone="cyan" />
            <MemberFicheHeroStat
              label="Validation profil"
              value={validationLabel}
              tone={member.profileValidationStatus === "valide" ? "emerald" : "amber"}
            />
            <MemberFicheHeroStat
              label="Note eval. recente"
              value={lastEvaluation ? `${lastEvaluation.total} /30` : "—"}
              onClick={() => switchTab("recap")}
              active={activeTab === "recap"}
              tone="violet"
            />
            <MemberFicheHeroStat
              label={`Participations (${months}m)`}
              value={events.total || 0}
              onClick={() => switchTab("participation")}
              active={activeTab === "participation"}
              tone="amber"
            />
            <MemberFicheHeroStat
              label="Raids faits / recus"
              value={`${Number(raids.sent || 0)} / ${Number(raids.received || 0)}`}
              onClick={() => switchTab("raids")}
              active={activeTab === "raids"}
              tone="rose"
            />
          </div>
        </MemberFicheHero>

        <MemberFicheTabNav activeTab={activeTab} onTabChange={switchTab} loadingTab={loadingTab} />

        <MemberFicheTabContent tabKey={activeTab}>
        {activeTab === "overview" && (
          <MemberFicheContentGrid columns={3}>
            <MemberFichePanel
              kicker="Identite"
              title="Profil et reperes"
              tone="violet"
              className="xl:col-span-2"
            >
              <MemberFicheFieldGrid cols={2}>
                <MemberFicheField label="Role" value={member.role || "—"} tone="violet" />
                <MemberFicheField label="Onboarding" value={member.onboardingStatus || "—"} tone="indigo" />
                <MemberFicheField label="Mentor" value={member.mentorTwitchLogin ? `@${member.mentorTwitchLogin}` : "—"} tone="cyan" />
                <MemberFicheField label="Fuseau / Langue" value={`${member.timezone || "—"} / ${member.primaryLanguage || "—"}`} tone="sky" />
                <MemberFicheField
                  label="Description publique"
                  value={member.description || "Aucune description renseignee."}
                  span={2}
                  tone="neutral"
                />
              </MemberFicheFieldGrid>
            </MemberFichePanel>

            <MemberFichePanel kicker="Synthese" title="Indicateurs rapides" tone="emerald">
              <div className="space-y-2 text-sm">
                {[
                  { label: "Pays", value: member.countryCode || "—", tone: "sky" as const },
                  { label: "Derniere revue", value: formatDate(member.lastReviewAt), tone: "amber" as const },
                  { label: "Prochaine revue", value: formatDate(member.nextReviewAt), tone: "rose" as const },
                  { label: "Badges", value: Array.isArray(member.badges) ? member.badges.length : 0, tone: "violet" as const },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 pl-3.5 ${ficheFieldAccentClass(item.tone)}`}
                  >
                    <span className="text-zinc-500">{item.label}: </span>
                    <strong className="text-zinc-100">{item.value}</strong>
                  </div>
                ))}
              </div>
            </MemberFichePanel>

            <MemberFichePanel
              kicker="Communaute"
              title="Infos communaute"
              intro="Reperes pour le suivi communaute (gestion membres / suivi pause)."
              tone="sky"
              className="xl:col-span-3"
            >
              <MemberFicheFieldGrid cols={4}>
                <MemberFicheField label="Parrain" value={member.parrain || "—"} />
                <MemberFicheField label="Date integration TENF" value={formatDate(member.integrationDate)} />
                <MemberFicheField label="Statut site" value={member.isActive === false ? "Inactif" : "Actif"} />
                <MemberFicheField label="Validation profil" value={member.profileValidationStatus || "—"} />
                <MemberFicheField label="Derniere revue staff" value={formatDate(member.lastReviewAt)} />
                <MemberFicheField label="Prochaine revue" value={formatDate(member.nextReviewAt)} />
                <MemberFicheField label="Bio personnalisee" value={member.customBio || "—"} span={2} />
              </MemberFicheFieldGrid>
            </MemberFichePanel>
          </MemberFicheContentGrid>
        )}

        {activeTab === "journey" && (
          <div className="space-y-4">
            <MemberFichePanel
              kicker="Staff"
              title="Historique des roles & pilotage staff"
              intro="Periodes actives, durees en staff et journal des changements."
              tone="indigo"
            >
              <MemberRoleHistoryPanel
                variant="full"
                roleHistory={member.roleHistory}
                staffPeriods={member.staffPeriods}
                currentRole={member.role || "Communaute"}
                currentStatut={member.isActive !== false ? "Actif" : "Inactif"}
                createdAt={member.createdAt}
                integrationDate={member.integrationDate}
                updatedAt={member.updatedAt}
                memberIdentifier={member.twitchLogin || member.discordId || memberId}
                showJourneyLinks
              />
            </MemberFichePanel>

            <MemberFichePanel kicker="Integration" title="Parcours et integrations" tone="neutral">
              {loadingSections.has("integration") ? (
                <MemberFicheSkeleton rows={5} />
              ) : sectionError("integration") ? (
                <p className="text-red-300">{sectionError("integration")}</p>
              ) : (
                <>
                  <MemberFicheFieldGrid cols={3}>
                    <MemberFicheStatCard label="Integrations suivies" value={integrationRows.length} />
                    <MemberFicheStatCard label="Date entree TENF" value={formatDate(member.createdAt)} />
                    <MemberFicheStatCard label="Integration validee" value={formatDate(member.integrationDate)} />
                  </MemberFicheFieldGrid>

                  <div className="mt-4">
                    <MemberFicheTableShell minWidth="760px">
                      <MemberFicheTableHead>
                        <tr>
                          <th className="px-3 py-2 text-left">Session</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Categorie</th>
                          <th className="px-3 py-2 text-left">Presence</th>
                          <th className="px-3 py-2 text-left">Parrain</th>
                          <th className="px-3 py-2 text-left">Notes</th>
                        </tr>
                      </MemberFicheTableHead>
                      <tbody>
                        {integrationRows.length === 0 ? (
                          <tr>
                            <td className="px-3 py-3 text-zinc-500" colSpan={6}>
                              Aucune integration trouvee pour ce membre.
                            </td>
                          </tr>
                        ) : (
                          integrationRows.map((row: any, idx: number) => (
                            <tr key={String(row.integration?.id || idx)} className="border-b border-white/[0.05]">
                              <td className="px-3 py-2 font-medium">{row.integration?.title || "—"}</td>
                              <td className="px-3 py-2">{formatDate(row.integration?.date)}</td>
                              <td className="px-3 py-2">{row.integration?.category || "—"}</td>
                              <td className="px-3 py-2">
                                {row.registration?.present === true ? "Oui" : "Non / non confirme"}
                              </td>
                              <td className="px-3 py-2">{row.registration?.parrain || "—"}</td>
                              <td className="px-3 py-2 text-zinc-400">{row.registration?.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </MemberFicheTableShell>
                  </div>
                </>
              )}
            </MemberFichePanel>
          </div>
        )}

        {activeTab === "recap" && (
          <MemberEvaluationRecapPanel
            metrics={recapMetrics}
            loading={loadingRecap}
            error={recapError}
            twitchLogin={member.twitchLogin}
            toMonthLabel={toMonthLabel}
          />
        )}

        {activeTab === "vipParcours" && (
          <MemberVipParcoursPanel
            memberId={memberId}
            data={vipParcours}
            loading={loadingVipParcours}
            error={vipParcoursError}
            onRefresh={async () => {
              setVipParcours(null);
              await loadVipParcours(true);
            }}
            toMonthLabel={toMonthLabel}
          />
        )}

        {activeTab === "performance" && (
          <MemberFichePanel
            kicker="Evaluation D"
            title="Evaluations mensuelles"
            intro={`Periode selectionnee : ${months} mois. Voir l'onglet Recap pour l'historique complet et les moyennes glissantes.`}
            tone="violet"
          >
            {loadingSections.has("evaluations") ? (
              <MemberFicheSkeleton rows={5} />
            ) : sectionError("evaluations") ? (
              <p className="text-red-300">{sectionError("evaluations")}</p>
            ) : (
              <>
                <MemberFicheFieldGrid cols={4}>
                  <MemberFicheStatCard
                    label="Moyenne periode"
                    value={evalMetrics.avgTotal !== null ? evalMetrics.avgTotal.toFixed(1) : "—"}
                    numericValue={evalMetrics.avgTotal ?? undefined}
                    scoreMax={30}
                    onClick={() => switchTab("recap")}
                  />
                  <MemberFicheStatCard label="Tendance" value={evalMetrics.trendLabel} />
                  <MemberFicheStatCard
                    label="Delta dernier mois"
                    value={
                      evalMetrics.deltaLastMonth !== null
                        ? `${evalMetrics.deltaLastMonth > 0 ? "+" : ""}${evalMetrics.deltaLastMonth.toFixed(1)}`
                        : "—"
                    }
                    hint={
                      evalMetrics.trendPercent !== null
                        ? `${evalMetrics.trendPercent > 0 ? "+" : ""}${evalMetrics.trendPercent.toFixed(1)}%`
                        : undefined
                    }
                  />
                  <MemberFicheStatCard label="Mois avec donnees" value={evalMetrics.monthsWithData} />
                </MemberFicheFieldGrid>

                <div className="mt-4">
                  <MemberFicheTableShell minWidth="780px">
                    <MemberFicheTableHead>
                      <tr>
                        <th className="px-3 py-2 text-left">Mois</th>
                        <th className="px-3 py-2 text-center">Total</th>
                        <th className="px-3 py-2 text-left">Sections A / B / C / D</th>
                        <th className="px-3 py-2 text-center">Delta</th>
                      </tr>
                    </MemberFicheTableHead>
                    <tbody>
                      {evalMetrics.rows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-zinc-500" colSpan={4}>
                            Aucune evaluation disponible.
                          </td>
                        </tr>
                      ) : (
                        [...evalMetrics.rows].reverse().map((row) => (
                          <tr key={row.month} className="border-b border-white/[0.05]">
                            <td className="px-3 py-2">{toMonthLabel(row.month)}</td>
                            <td className="px-3 py-2 text-center font-semibold text-violet-200">{row.total}</td>
                            <td className="px-3 py-2 text-zinc-400">
                              A:{row.sectionA} / B:{row.sectionB} / C:{row.sectionC} / D:{row.sectionD}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums">
                              {row.delta === null ? "—" : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(1)}`}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </MemberFicheTableShell>
                </div>
              </>
            )}
          </MemberFichePanel>
        )}

        {activeTab === "participation" && (
          <MemberFichePanel
            kicker="Evenements"
            title="Presence aux evenements & animations"
            intro={`Historique sur les ${months} derniers mois — presences confirmees et inscriptions.`}
            tone="emerald"
          >
            {loadingSections.has("events") ? (
              <MemberFicheSkeleton rows={6} />
            ) : sectionError("events") ? (
              <p className="text-red-300">{sectionError("events")}</p>
            ) : (
              <>
                <MemberFicheFieldGrid cols={4}>
                  <MemberFicheStatCard label="Total" value={events.total || 0} />
                  <MemberFicheStatCard label="Presences confirmees" value={events.presenceConfirmed || 0} />
                  <MemberFicheStatCard label="Inscriptions seules" value={events.registrationOnly || 0} />
                  <MemberFicheStatCard label="Categorie favorite" value={events.favoriteCategory || "—"} />
                </MemberFicheFieldGrid>

                <div className="mt-4">
                  <MemberFicheTableShell minWidth="820px">
                    <MemberFicheTableHead>
                      <tr>
                        <th className="px-3 py-2 text-left">Evenement</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Categorie</th>
                        <th className="px-3 py-2 text-left">Mode</th>
                        <th className="px-3 py-2 text-left">Note</th>
                      </tr>
                    </MemberFicheTableHead>
                    <tbody>
                      {(events.participations || []).length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                            Aucune participation sur la periode selectionnee.
                          </td>
                        </tr>
                      ) : (
                        (events.participations || []).map((row: any) => (
                          <tr key={`${row.eventId}-${row.date}`} className="border-b border-white/[0.05]">
                            <td className="px-3 py-2 font-medium">{row.title}</td>
                            <td className="px-3 py-2">{formatDate(row.date)}</td>
                            <td className="px-3 py-2">{row.category}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  row.mode === "presence"
                                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                                    : "bg-sky-500/15 text-sky-200 border border-sky-400/30"
                                }`}
                              >
                                {row.mode === "presence" ? "Presence" : "Inscription"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-zinc-400">{row.note || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </MemberFicheTableShell>
                </div>
              </>
            )}
          </MemberFichePanel>
        )}

        {activeTab === "raids" && (
          <MemberFichePanel
            kicker="Engagement"
            title="Raids faits & recus"
            intro={`Historique manuel + EventSub sur les ${months} derniers mois.`}
            tone="violet"
            headerRight={
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: "Toutes sources" },
                    { key: "manual", label: "Manuel" },
                    { key: "eventsub", label: "EventSub" },
                    { key: "legacy", label: "Historique" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRaidSourceFilter(opt.key)}
                    className={ficheTabClass(raidSourceFilter === opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            }
          >
            {loadingSections.has("engagement") && activeTab === "raids" ? (
              <MemberFicheSkeleton rows={6} />
            ) : sectionError("engagement") ? (
              <p className="text-red-300">{sectionError("engagement")}</p>
            ) : (
              <>
                <MemberFicheFieldGrid cols={4}>
                  <MemberFicheStatCard
                    label="Raids faits"
                    value={Number(raids.sent || 0)}
                    hint={`M:${Number(raidStats.sentManual || 0)} · ES:${Number(raidStats.sentEventsub || 0)} · H:${Number(raidStats.sentLegacy || 0)}`}
                  />
                  <MemberFicheStatCard
                    label="Raids recus"
                    value={Number(raids.received || 0)}
                    hint={`M:${Number(raidStats.receivedManual || 0)} · ES:${Number(raidStats.receivedEventsub || 0)} · H:${Number(raidStats.receivedLegacy || 0)}`}
                  />
                  <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3 ring-1 ring-inset ring-white/[0.03] md:col-span-2">
                    <p className={ficheStatLabelClass}>Repartition mensuelle</p>
                    <div className="mt-2 flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {(raids.byMonth || []).length === 0 ? (
                        <span className="text-xs text-zinc-500">Aucune donnee.</span>
                      ) : (
                        (raids.byMonth || []).slice(0, 6).map((row: any) => (
                          <span
                            key={String(row.month)}
                            className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-300"
                          >
                            {toMonthLabel(row.month)} · {row.sent}/{row.received}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </MemberFicheFieldGrid>

                <div className="mt-4">
                  <MemberFicheTableShell minWidth="900px">
                    <MemberFicheTableHead>
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Sens</th>
                        <th className="px-3 py-2 text-left">Contrepartie</th>
                        <th className="px-3 py-2 text-center">Qte</th>
                        <th className="px-3 py-2 text-left">Source</th>
                        <th className="px-3 py-2 text-center">Viewers</th>
                      </tr>
                    </MemberFicheTableHead>
                    <tbody>
                      {filteredRaidDetails.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-zinc-500" colSpan={6}>
                            Aucun raid sur la periode ou pour ce filtre.
                          </td>
                        </tr>
                      ) : (
                        filteredRaidDetails.map((row: any, idx: number) => (
                          <tr key={`${row.type}-${row.date}-${idx}`} className="border-b border-white/[0.05]">
                            <td className="px-3 py-2">{formatDateTime(row.date)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  row.type === "sent"
                                    ? "bg-sky-500/15 text-sky-200 border border-sky-400/30"
                                    : "bg-amber-500/15 text-amber-200 border border-amber-400/30"
                                }`}
                              >
                                {row.type === "sent" ? "Fait" : "Recu"}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium">{row.type === "sent" ? row.target : row.raider}</td>
                            <td className="px-3 py-2 text-center">{row.count || 1}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${raidSourceBadgeClass(row.sourceKind)}`}
                              >
                                {raidSourceLabel(row.sourceKind)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-zinc-400">{row.viewers ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </MemberFicheTableShell>
                </div>
              </>
            )}
          </MemberFichePanel>
        )}

        {activeTab === "community" && (
          <MemberFicheContentGrid columns={1}>
            <MemberFichePanel kicker="Communaute" title="Fiche communaute" tone="sky">
              <MemberFicheFieldGrid cols={3}>
                <MemberFicheField label="Role" value={getRoleBadgeLabel(member.role || "—")} />
                <MemberFicheField label="Parrain" value={member.parrain || "—"} />
                <MemberFicheField
                  label="Mentor integration"
                  value={member.mentorTwitchLogin ? `@${member.mentorTwitchLogin}` : "—"}
                />
              </MemberFicheFieldGrid>
            </MemberFichePanel>

            <MemberFichePanel kicker="Follow" title="Suivi follows (evaluation D)" tone="neutral">
              {loadingSections.has("engagement") && activeTab === "community" ? (
                <MemberFicheSkeleton rows={5} />
              ) : sectionError("engagement") ? (
                <p className="text-red-300">{sectionError("engagement")}</p>
              ) : (
                <MemberFicheTableShell minWidth="760px">
                  <MemberFicheTableHead>
                    <tr>
                      <th className="px-3 py-2 text-left">Mois</th>
                      <th className="px-3 py-2 text-left">Staff</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                      <th className="px-3 py-2 text-left">Commentaire</th>
                    </tr>
                  </MemberFicheTableHead>
                  <tbody>
                    {follows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-zinc-500" colSpan={4}>
                          Aucun suivi follow trouve.
                        </td>
                      </tr>
                    ) : (
                      follows.map((row: any, idx: number) => (
                        <tr key={`${row.month}-${row.staffSlug}-${idx}`} className="border-b border-white/[0.05]">
                          <td className="px-3 py-2">{toMonthLabel(row.month)}</td>
                          <td className="px-3 py-2">{row.staffName || row.staffSlug || "—"}</td>
                          <td className="px-3 py-2">{row.status?.status || "—"}</td>
                          <td className="px-3 py-2 text-zinc-400">{row.status?.comment || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </MemberFicheTableShell>
              )}
            </MemberFichePanel>
          </MemberFicheContentGrid>
        )}

        {activeTab === "logs" && <MemberFicheLogsPanel memberId={memberId} />}

        {activeTab === "admin" && (
          <MemberFicheContentGrid columns={2}>
            <MemberFichePanel kicker="Interne" title="Notes internes" tone="neutral">
              {loadingSections.has("notes") ? (
                <p className="text-zinc-400">Chargement des notes...</p>
              ) : sectionError("notes") ? (
                <p className="text-red-300">{sectionError("notes")}</p>
              ) : (
                <>
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-sm whitespace-pre-wrap text-zinc-200">
                    {notes.current || "Aucune note actuelle."}
                  </div>
                  <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(notes.history || []).map((row: any, idx: number) => (
                      <div
                        key={`${row.date}-${idx}`}
                        className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-sm"
                      >
                        <div className="text-zinc-500">
                          {formatDateTime(row.date)} • {row.author}
                        </div>
                        <div className="text-zinc-200">{row.action}</div>
                        <div className="text-zinc-500 text-xs mt-1">
                          Avant: {row.before || "—"} | Apres: {row.after || "—"}
                        </div>
                      </div>
                    ))}
                    {(notes.history || []).length === 0 && (
                      <p className="text-zinc-500 text-sm">Aucun historique de notes.</p>
                    )}
                  </div>
                </>
              )}
            </MemberFichePanel>

            <MemberFichePanel kicker="Moderation" title="Sanctions internes" tone="amber">
              {loadingSections.has("sanctions") ? (
                <p className="text-zinc-400">Chargement des sanctions...</p>
              ) : sectionError("sanctions") ? (
                <p className="text-red-300">{sectionError("sanctions")}</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {sanctions.map((row: any, idx: number) => (
                    <div
                      key={`${row.date}-${idx}`}
                      className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-sm"
                    >
                      <div className="font-semibold text-zinc-100">{row.type || "Sanction"}</div>
                      <div className="text-zinc-500">
                        {formatDateTime(row.date)} • {row.staff}
                      </div>
                      {row.motif && <div className="text-zinc-200 mt-1">Motif: {row.motif}</div>}
                      {row.duree && <div className="text-zinc-300">Duree: {row.duree}</div>}
                      {row.commentaire && <div className="text-zinc-500">Commentaire: {row.commentaire}</div>}
                    </div>
                  ))}
                  {sanctions.length === 0 && <p className="text-zinc-500 text-sm">Aucune sanction trouvee.</p>}
                </div>
              )}
            </MemberFichePanel>

            <MemberFichePanel kicker="Audit" title="Logs recents" tone="neutral" className="xl:col-span-2">
              {loadingSections.has("logs") ? (
                <p className="text-zinc-400">Chargement des logs...</p>
              ) : sectionError("logs") ? (
                <p className="text-red-300">{sectionError("logs")}</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {logs.map((row: any) => (
                    <div
                      key={String(row.id)}
                      className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-sm"
                    >
                      <div className="font-semibold text-zinc-100">{row.action}</div>
                      <div className="text-zinc-500">
                        {formatDateTime(row.timestamp)} • {row.actorUsername || row.actorDiscordId}
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-zinc-500 text-sm">Aucun log recent.</p>}
                </div>
              )}
            </MemberFichePanel>
          </MemberFicheContentGrid>
        )}
        </MemberFicheTabContent>
      </div>
    </div>
  );
}
