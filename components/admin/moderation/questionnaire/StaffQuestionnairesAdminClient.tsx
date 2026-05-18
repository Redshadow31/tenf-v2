"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Download,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { StaffMemberPilotCard } from "@/components/admin/moderation/questionnaire/StaffMemberPilotCard";
import type { StaffPilotProfile } from "@/lib/staff-questionnaire/staffMemberPilotProfile";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import QuestionnaireStatusBadge from "@/components/admin/moderation/questionnaire/QuestionnaireStatusBadge";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import { MODERATION_BASE } from "@/lib/moderation/moderationTree";
import { ADMIN_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import type { StaffQuestionnaireSubmissionStatus } from "@/lib/staff-questionnaire/types";

type Row = {
  memberId: string;
  pseudo: string;
  roleStaff: string;
  submissionId: string | null;
  status: string;
  statusLabel: string;
  startedAt: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  summaryPublished: boolean;
  objectivesDefined: boolean;
  progressCompleted: number;
  progressTotal: number;
  progressPercent: number;
  inProgress: boolean;
  staffPilot: {
    alumniStatus: string;
    alumniStatusLabel: string;
    staffTenureDurationLabel: string | null;
    currentRoleDurationLabel: string | null;
    currentRoleLabel: string;
    isCurrentlyStaff: boolean;
  } | null;
};

const ASIDE_TIPS = [
  {
    n: "1",
    title: "Prioriser les dossiers",
    body: "Filtre par statut ou « non soumis » pour voir qui doit encore compléter le questionnaire.",
  },
  {
    n: "2",
    title: "Fiche détaillée",
    body: "Ouvre une ligne pour rédiger la synthèse, publier au modérateur et définir les objectifs.",
  },
  {
    n: "3",
    title: "Exports",
    body: "CSV complet ou réponses libres pour archivage et analyse hors plateforme.",
  },
] as const;

function YesNoPill({ value }: { value: boolean }) {
  return (
    <span className={value ? QUI.pillYes : QUI.pillNo}>{value ? "Oui" : "Non"}</span>
  );
}

function QuestionnairesAside({
  stats,
}: {
  stats: {
    total: number;
    submitted: number;
    inProgress: number;
    summaryPublished: number;
    filtered: number;
  };
}) {
  return (
    <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto">
      <div className={`p-[clamp(0.875rem,1.5vw,1.2rem)] ${Q_LAYOUT.heroVisual}`}>
        <div
          aria-hidden
          className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.16),transparent_42%,transparent_58%,rgba(212,175,55,0.12))]"
        />
        <div className="relative space-y-3">
          <span className={`${Q_LAYOUT.badgeViolet} w-fit`}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Pilotage staff
          </span>
          <p className={Q_LAYOUT.eyebrow}>Synthèse équipe</p>
          <dl className="grid grid-cols-2 gap-2 text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
            <div className={`${Q_LAYOUT.statCell} col-span-2`}>
              <dt className="font-medium uppercase tracking-wide text-zinc-500">Modérateurs suivis</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">{stats.total}</dd>
            </div>
            <div className={Q_LAYOUT.statCell}>
              <dt className="font-medium uppercase tracking-wide text-zinc-500">Soumis</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-emerald-200/95">
                {stats.submitted}
              </dd>
            </div>
            <div className={Q_LAYOUT.statCell}>
              <dt className="font-medium uppercase tracking-wide text-zinc-500">En cours</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-200/95">
                {stats.inProgress}
              </dd>
            </div>
            <div className={`${Q_LAYOUT.statCell} col-span-2`}>
              <dt className="font-medium uppercase tracking-wide text-zinc-500">Synthèses publiées</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-violet-200/95">
                {stats.summaryPublished}
              </dd>
            </div>
          </dl>
          <p className={`text-xs ${QUI.textMuted}`}>
            Résultat filtres :{" "}
            <span className="font-semibold tabular-nums text-zinc-200">{stats.filtered}</span>
            <span className="mx-1.5 text-zinc-600">/</span>
            <span className="tabular-nums text-zinc-400">{stats.total}</span>
          </p>
        </div>
      </div>

      <div className={`${Q_LAYOUT.panel} p-4`}>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <BookOpen className="h-4 w-4 text-violet-300/90" aria-hidden />
          Bon à savoir
        </h2>
        <ol className="mt-3 space-y-3">
          {ASIDE_TIPS.map((step) => (
            <li key={step.n} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-xs font-bold text-violet-200"
                aria-hidden
              >
                {step.n}
              </span>
              <span>
                <span className="font-medium text-zinc-200">{step.title}</span>
                <span className="mt-0.5 block">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

export default function StaffQuestionnairesAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [submittedFilter, setSubmittedFilter] = useState<"all" | "yes" | "no">("all");
  const [summaryFilter, setSummaryFilter] = useState<"all" | "yes" | "no">("all");
  const [includeAlumni, setIncludeAlumni] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<StaffPilotProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadRows() {
    setLoading(true);
    setError(null);
    try {
      const qs = includeAlumni ? "?includeAlumni=true" : "";
      const res = await fetch(`/api/admin/moderation/staff-questionnaires${qs}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [includeAlumni]);

  async function toggleExpanded(memberId: string) {
    if (expandedMemberId === memberId) {
      setExpandedMemberId(null);
      setExpandedProfile(null);
      return;
    }
    setExpandedMemberId(memberId);
    setExpandedProfile(null);
    setProfileLoading(true);
    try {
      const res = await fetch(
        `/api/admin/moderation/staff-questionnaires/member-profile?memberId=${encodeURIComponent(memberId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok && data.profile) setExpandedProfile(data.profile as StaffPilotProfile);
    } catch {
      setExpandedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (submittedFilter === "yes" && !r.submittedAt) return false;
      if (submittedFilter === "no" && r.submittedAt) return false;
      if (summaryFilter === "yes" && !r.summaryPublished) return false;
      if (summaryFilter === "no" && r.summaryPublished) return false;
      return true;
    });
  }, [rows, statusFilter, submittedFilter, summaryFilter]);

  const stats = useMemo(() => {
    const submitted = rows.filter((r) => r.submittedAt).length;
    const inProgress = rows.filter((r) => r.inProgress).length;
    const summaryPublished = rows.filter((r) => r.summaryPublished).length;
    return {
      total: rows.length,
      submitted,
      inProgress,
      summaryPublished,
      filtered: filtered.length,
    };
  }, [rows, filtered.length]);

  const hasActiveFilters =
    Boolean(statusFilter) || submittedFilter !== "all" || summaryFilter !== "all";

  function resetFilters() {
    setStatusFilter("");
    setSubmittedFilter("all");
    setSummaryFilter("all");
  }

  return (
    <ModerationPageShell
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Modération", href: MODERATION_BASE },
        { label: "Questionnaires posture staff" },
      ]}
      title="Questionnaires posture staff"
      description="Suivi des réponses, analyses et synthèses modérateurs"
      audienceLabel="Vue admin"
      hubAccent
      detachedContent
    >
      <div className={Q_LAYOUT.page}>
        <div aria-hidden className={Q_LAYOUT.blurBg}>
          <div className={Q_LAYOUT.blurGradient} />
        </div>
        <div
          aria-hidden
          className={Q_LAYOUT.gridLines}
          style={{
            backgroundImage:
              "linear-gradient(104deg,rgba(255,255,255,0.032) 0px,rgba(255,255,255,0.032) 1px,transparent 1px,transparent 74px)",
            backgroundSize: "clamp(54px,4.2vw,72px) 100%",
            maskImage: "linear-gradient(180deg,black 0%,transparent 78%)",
          }}
        />

        <div className={Q_LAYOUT.container}>
          <header
            className={`mb-6 grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.5rem)] lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.9fr)] ${Q_LAYOUT.panel}`}
          >
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={Q_LAYOUT.badgeAmber}>
                  <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Suivi admin
                </span>
                <span className={Q_LAYOUT.badgeViolet}>
                  <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Posture staff
                </span>
              </div>
              <p className={Q_LAYOUT.eyebrow}>Tableau de bord questionnaires</p>
              <p className={`max-w-2xl text-sm leading-relaxed ${QUI.textSecondary}`}>
                Consulte l&apos;avancement de chaque modérateur, ouvre les fiches pour la synthèse et
                les objectifs, exporte les données pour archivage.
              </p>
              <div className="flex min-w-0 flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void loadRows()}
                  disabled={loading}
                  className={`${Q_LAYOUT.subtleBtn} ${Q_LAYOUT.focusRing}`}
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                  Actualiser
                </button>
                <a
                  href="/api/admin/moderation/staff-questionnaires/export"
                  className={`${QUI.btnSave} ${Q_LAYOUT.focusRing}`}
                >
                  <Download className="h-4 w-4 shrink-0" aria-hidden />
                  Export CSV complet
                </a>
                <a
                  href="/api/admin/moderation/staff-questionnaires/export-free-text"
                  className={`${Q_LAYOUT.subtleBtn} ${Q_LAYOUT.focusRing}`}
                >
                  <Download className="h-4 w-4 shrink-0" aria-hidden />
                  Réponses libres
                </a>
              </div>
            </div>
            <div className={`relative min-h-[8rem] p-4 ${Q_LAYOUT.heroVisual}`}>
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_50%)]"
              />
              <div className="relative flex h-full flex-col justify-center gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-100">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Équipe modération
                </span>
                <p className={`text-sm ${QUI.textSecondary}`}>
                  <span className="font-semibold tabular-nums text-emerald-200">{stats.submitted}</span>{" "}
                  questionnaire{stats.submitted !== 1 ? "s" : ""} soumis ·{" "}
                  <span className="font-semibold tabular-nums text-amber-200">{stats.inProgress}</span> en
                  cours
                </p>
              </div>
            </div>
          </header>

          {loading ? (
            <div className={`flex items-center justify-center gap-2 py-16 ${QUI.textSecondary}`}>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Chargement des questionnaires…
            </div>
          ) : (
            <div className={Q_LAYOUT.mainGrid}>
              <div className="min-w-0 space-y-5 xl:space-y-[var(--q-gap)]">
                <section className={`${Q_LAYOUT.panel} p-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                      <Filter className="h-4 w-4 text-violet-300" aria-hidden />
                      Filtres
                    </h2>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className={`text-xs text-violet-300 hover:text-violet-200 hover:underline ${Q_LAYOUT.focusRing} rounded`}
                      >
                        Réinitialiser
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={QUI.filterSelect}
                      aria-label="Filtrer par statut"
                    >
                      <option value="">Tous les statuts</option>
                      {Object.entries(ADMIN_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <select
                      value={submittedFilter}
                      onChange={(e) => setSubmittedFilter(e.target.value as "all" | "yes" | "no")}
                      className={QUI.filterSelect}
                      aria-label="Filtrer par soumission"
                    >
                      <option value="all">Soumis : tous</option>
                      <option value="yes">Soumis</option>
                      <option value="no">Non soumis</option>
                    </select>
                    <select
                      value={summaryFilter}
                      onChange={(e) => setSummaryFilter(e.target.value as "all" | "yes" | "no")}
                      className={QUI.filterSelect}
                      aria-label="Filtrer par synthèse"
                    >
                      <option value="all">Synthèse : toutes</option>
                      <option value="yes">Synthèse publiée</option>
                      <option value="no">Synthèse non publiée</option>
                    </select>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={includeAlumni}
                        onChange={(e) => setIncludeAlumni(e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      Inclure anciens staff
                    </label>
                  </div>
                </section>

                {error ? (
                  <p className={QUI.alertError} role="alert">
                    {error}
                  </p>
                ) : filtered.length === 0 ? (
                  <section className={`${Q_LAYOUT.glassSection} p-8 text-center`}>
                    <p className={QUI.textSecondary}>Aucun modérateur ne correspond aux filtres actuels.</p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className={`mt-4 ${QUI.btnGhost}`}
                      >
                        Réinitialiser les filtres
                      </button>
                    ) : null}
                  </section>
                ) : (
                  <section className={`${Q_LAYOUT.glassSection} min-w-0`}>
                    <div className={QUI.wizardAccentBar} aria-hidden />
                    <p className="sr-only">
                      Tableau responsive : faites défiler horizontalement si toutes les colonnes ne sont pas visibles.
                    </p>
                    <div className={Q_LAYOUT.tableScroll}>
                      <table className={Q_LAYOUT.tableBase}>
                        <colgroup>
                          <col className="w-8" />
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "13%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "8%" }} />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-white/10 bg-zinc-950/50">
                            <th className={Q_LAYOUT.tableHead} scope="col" />
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Pseudo
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Rôle
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Parcours
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Statut
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Prog.
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Début
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Soum.
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Synth.
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Obj.
                            </th>
                            <th className={Q_LAYOUT.tableHead} scope="col">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r) => (
                            <Fragment key={r.memberId}>
                            <tr
                              className="border-b border-white/[0.04] transition hover:bg-violet-500/[0.04]"
                            >
                              <td className={Q_LAYOUT.tableCell}>
                                <button
                                  type="button"
                                  onClick={() => void toggleExpanded(r.memberId)}
                                  className="rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-violet-200"
                                  aria-expanded={expandedMemberId === r.memberId}
                                  aria-label="Historique staff"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition ${expandedMemberId === r.memberId ? "rotate-180" : ""}`}
                                  />
                                </button>
                              </td>
                              <td
                                className={`${Q_LAYOUT.tableCell} max-w-0 truncate font-medium text-zinc-100`}
                                title={r.pseudo}
                              >
                                {r.pseudo}
                              </td>
                              <td
                                className={`${Q_LAYOUT.tableCell} max-w-0 truncate text-zinc-400`}
                                title={r.roleStaff}
                              >
                                {r.roleStaff}
                              </td>
                              <td className={`${Q_LAYOUT.tableCell} text-xs text-zinc-400`}>
                                {r.staffPilot ? (
                                  <div className="line-clamp-3 space-y-0.5 break-words">
                                    <p className="font-medium text-violet-200/90">
                                      {r.staffPilot.alumniStatusLabel}
                                    </p>
                                    <p>
                                      {r.staffPilot.staffTenureDurationLabel
                                        ? `Cumul ${r.staffPilot.staffTenureDurationLabel}`
                                        : "—"}
                                    </p>
                                    {r.staffPilot.currentRoleDurationLabel ? (
                                      <p className="text-zinc-500">
                                        {r.staffPilot.currentRoleDurationLabel} dans le rôle
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className={Q_LAYOUT.tableCell}>
                                <QuestionnaireStatusBadge
                                  label={
                                    ADMIN_STATUS_LABELS[
                                      r.status as StaffQuestionnaireSubmissionStatus
                                    ] ?? r.status
                                  }
                                  tone="violet"
                                />
                              </td>
                              <td className={Q_LAYOUT.tableCell}>
                                {r.submissionId ? (
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-zinc-500">
                                      <span>
                                        {r.progressCompleted}/{r.progressTotal}
                                      </span>
                                      <span className="tabular-nums">{r.progressPercent}%</span>
                                    </div>
                                    <div className={QUI.progressTrack}>
                                      <div
                                        className={QUI.progressFill}
                                        style={{ width: `${r.progressPercent}%` }}
                                        role="progressbar"
                                        aria-valuenow={r.progressPercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                      />
                                    </div>
                                    {r.inProgress && r.updatedAt ? (
                                      <p className="hidden text-[10px] text-zinc-600 2xl:block">
                                        MAJ {new Date(r.updatedAt).toLocaleDateString("fr-FR")}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className={QUI.textMuted}>—</span>
                                )}
                              </td>
                              <td className={`${Q_LAYOUT.tableCell} whitespace-nowrap text-zinc-500`}>
                                {r.startedAt
                                  ? new Date(r.startedAt).toLocaleDateString("fr-FR")
                                  : "—"}
                              </td>
                              <td className={`${Q_LAYOUT.tableCell} whitespace-nowrap text-zinc-500`}>
                                {r.submittedAt
                                  ? new Date(r.submittedAt).toLocaleDateString("fr-FR")
                                  : "—"}
                              </td>
                              <td className={Q_LAYOUT.tableCell}>
                                <YesNoPill value={r.summaryPublished} />
                              </td>
                              <td className={Q_LAYOUT.tableCell}>
                                <YesNoPill value={r.objectivesDefined} />
                              </td>
                              <td className={Q_LAYOUT.tableCell}>
                                {r.submissionId ? (
                                  <Link
                                    href={`/admin/moderation/staff/questionnaires/${r.submissionId}`}
                                    className={`inline-flex items-center gap-0.5 text-[length:inherit] font-medium text-violet-300 hover:text-violet-200 ${Q_LAYOUT.focusRing} rounded`}
                                  >
                                    Ouvrir
                                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                                  </Link>
                                ) : (
                                  <span className={QUI.textMuted}>—</span>
                                )}
                              </td>
                            </tr>
                            {expandedMemberId === r.memberId ? (
                              <tr className="border-b border-white/[0.04] bg-violet-500/[0.03]">
                                <td colSpan={11} className="px-4 py-4">
                                  {profileLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Chargement du parcours…
                                    </div>
                                  ) : expandedProfile ? (
                                    <StaffMemberPilotCard
                                      profile={expandedProfile}
                                      gestionHref={`/admin/membres/gestion?search=${encodeURIComponent(expandedProfile.twitchLogin || expandedProfile.discordUsername || "")}`}
                                    />
                                  ) : (
                                    <p className="text-sm text-zinc-500">
                                      Profil staff indisponible pour ce membre.
                                    </p>
                                  )}
                                </td>
                              </tr>
                            ) : null}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>

              <QuestionnairesAside stats={stats} />
            </div>
          )}
        </div>
      </div>
    </ModerationPageShell>
  );
}
