"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import MemberUnifiedJourneyTimeline from "@/components/admin/members-gestion/MemberUnifiedJourneyTimeline";
import { getRoleBadgeClassName } from "@/lib/roleBadgeSystem";
import {
  analyzeStaffPilot,
  buildRoleTenures,
  formatDurationFr,
} from "@/lib/admin/members-gestion/roleHistoryAnalytics";
import {
  getTimelineEntryTitle,
  normalizeTimeline,
  TIMELINE_KIND_LABELS,
  type MemberTimelineEntry,
} from "@/lib/admin/members-gestion/memberTimeline";
import MemberRoleHistoryManualEditor from "@/components/admin/members-gestion/MemberRoleHistoryManualEditor";
import MemberRoleTenureList from "@/components/admin/members-gestion/MemberRoleTenureList";
import MemberStaffPeriodsEditor from "@/components/admin/members-gestion/MemberStaffPeriodsEditor";
import MemberStaffJourneyLinks from "@/components/admin/members-gestion/MemberStaffJourneyLinks";
import type { StaffPeriod } from "@/lib/admin/members-gestion/staffPeriods";
import {
  formatPeriodRangeFr,
  normalizeStaffPeriods,
  STAFF_PERIOD_TYPE_LABELS,
} from "@/lib/admin/members-gestion/staffPeriods";

type Props = {
  roleHistory?: MemberTimelineEntry[];
  staffPeriods?: StaffPeriod[];
  currentRole: string;
  currentStatut: string;
  createdAt?: string | null;
  integrationDate?: string | null;
  updatedAt?: string | null;
  variant?: "compact" | "full";
  /** Permet d'ajouter / supprimer des événements manuels (Phase A). */
  editable?: boolean;
  memberIdentifier?: string;
  onHistoryChange?: (history: MemberTimelineEntry[]) => void;
  onStaffPeriodsChange?: (periods: StaffPeriod[]) => void;
  /** Liens questionnaire + évaluation (Phase B). */
  showJourneyLinks?: boolean;
  /** Frise unifiée + export (Phase C). */
  showUnifiedJourney?: boolean;
};

const sectionClass =
  "rounded-xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(26,28,40,0.92),rgba(14,15,22,0.98))]";

function EntryBadges({ entry }: { entry: MemberTimelineEntry }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          entry.source === "manual"
            ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
            : "border-zinc-500/40 bg-zinc-800/50 text-zinc-400"
        }`}
      >
        {entry.source === "manual" ? "Manuel" : "Système"}
      </span>
      {entry.isBackfill ? (
        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-200">
          Rétroactif
        </span>
      ) : null}
      <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200">
        {TIMELINE_KIND_LABELS[entry.kind]}
      </span>
    </div>
  );
}

export default function MemberRoleHistoryPanel({
  roleHistory,
  currentRole,
  currentStatut,
  createdAt,
  integrationDate,
  updatedAt,
  variant = "full",
  editable = false,
  memberIdentifier,
  onHistoryChange,
  staffPeriods: staffPeriodsProp,
  onStaffPeriodsChange,
  showJourneyLinks = true,
  showUnifiedJourney = true,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<MemberTimelineEntry | null>(null);
  const [staffPeriods, setStaffPeriods] = useState<StaffPeriod[]>(
    () => normalizeStaffPeriods(staffPeriodsProp as unknown[]),
  );

  useEffect(() => {
    setStaffPeriods(normalizeStaffPeriods(staffPeriodsProp as unknown[]));
  }, [staffPeriodsProp]);

  useEffect(() => {
    if (!memberIdentifier) return;
    let cancelled = false;
    async function loadJourney() {
      try {
        const res = await fetch(
          `/api/admin/members/${encodeURIComponent(memberIdentifier!)}/staff-journey`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.staffPeriods)) {
          setStaffPeriods(json.staffPeriods);
        }
      } catch {
        /* garde l'état local */
      }
    }
    void loadJourney();
    return () => {
      cancelled = true;
    };
  }, [memberIdentifier]);

  function handleStaffPeriodsChange(periods: StaffPeriod[]) {
    setStaffPeriods(periods);
    onStaffPeriodsChange?.(periods);
  }

  const timeline = useMemo(() => normalizeTimeline(roleHistory as unknown[]), [roleHistory]);

  const tenures = useMemo(
    () => buildRoleTenures(timeline, currentRole, createdAt),
    [timeline, currentRole, createdAt],
  );

  const staff = useMemo(
    () => analyzeStaffPilot(tenures, currentRole, currentStatut, timeline, staffPeriods),
    [tenures, currentRole, currentStatut, timeline, staffPeriods],
  );

  const sortedChanges = useMemo(
    () => [...timeline].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
    [timeline],
  );

  const showStaffBlock = staff.isCurrentlyStaff || staff.isFormerStaff;

  async function handleDelete(id: string) {
    if (!memberIdentifier || !onHistoryChange) return;
    if (!window.confirm("Supprimer cet événement manuel ?")) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(memberIdentifier)}/role-history?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Suppression impossible");
      onHistoryChange(json.roleHistory);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  const journeyExportHref = memberIdentifier
    ? `/api/admin/members/${encodeURIComponent(memberIdentifier)}/staff-journey/export`
    : null;

  return (
    <div className="space-y-4">
      {memberIdentifier && journeyExportHref ? (
        <div className="flex justify-end">
          <a
            href={journeyExportHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-indigo-400/30 hover:text-indigo-200"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Exporter le parcours (CSV)
          </a>
        </div>
      ) : null}

      {editable && memberIdentifier && onHistoryChange ? (
        <MemberRoleHistoryManualEditor
          memberIdentifier={memberIdentifier}
          onSaved={onHistoryChange}
          editingEntry={editingEntry}
          onEditCleared={() => setEditingEntry(null)}
        />
      ) : null}

      {editable && memberIdentifier ? (
        <MemberStaffPeriodsEditor
          memberIdentifier={memberIdentifier}
          staffPeriods={staffPeriods}
          onPeriodsChange={handleStaffPeriodsChange}
        />
      ) : staffPeriods.length > 0 ? (
        <section className={`${sectionClass} p-4`}>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Périodes staff confirmées
          </h4>
          <ul className="mt-3 space-y-2">
            {[...staffPeriods]
              .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime())
              .map((period) => (
                <li
                  key={period.id}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-100">{period.label}</p>
                  <p className="text-[10px] text-zinc-500">
                    {STAFF_PERIOD_TYPE_LABELS[period.type]} · {formatPeriodRangeFr(period)}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {showJourneyLinks && memberIdentifier ? (
        <section className={`${sectionClass} p-4`}>
          <h4 className="text-sm font-semibold text-zinc-200">Raccourcis staff</h4>
          <div className="mt-3">
            <MemberStaffJourneyLinks memberIdentifier={memberIdentifier} />
          </div>
        </section>
      ) : null}

      {deleteError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {deleteError}
        </p>
      ) : null}

      {showStaffBlock ? (
        <section className={`${sectionClass} p-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Pilotage staff
            </span>
            {staff.isCurrentlyStaff ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-100">
                <UserPlus className="h-3 w-3" aria-hidden />
                Staff actuel
              </span>
            ) : null}
            {staff.isFormerStaff ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-100">
                <UserMinus className="h-3 w-3" aria-hidden />
                Ancien staff
              </span>
            ) : null}
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                currentStatut === "Actif"
                  ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                  : "border-zinc-500/40 bg-zinc-800/60 text-zinc-400"
              }`}
            >
              Statut fiche : {currentStatut}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                staff.usesConfirmedPeriods
                  ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                  : "border-zinc-500/40 bg-zinc-800/50 text-zinc-400"
              }`}
            >
              {staff.tenureSourceLabel}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Rôle actuel
              </dt>
              <dd className="mt-1">
                <span className={getRoleBadgeClassName(currentRole)}>{staff.currentRoleLabel}</span>
              </dd>
            </div>
            {staff.isCurrentlyStaff && staff.currentStaffTenureMs != null ? (
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Dans ce rôle staff
                </dt>
                <dd className="mt-1 font-semibold tabular-nums text-amber-100">
                  {formatDurationFr(staff.currentStaffTenureMs)}
                </dd>
                {staff.currentStaffTenureFrom ? (
                  <dd className="text-[10px] text-zinc-500">
                    depuis le{" "}
                    {staff.currentStaffTenureFrom.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Cumul staff
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-violet-100">
                {staff.totalStaffTenureMs > 0 ? formatDurationFr(staff.totalStaffTenureMs) : "—"}
              </dd>
            </div>
            {staff.firstStaffAt ? (
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  1er rôle staff
                </dt>
                <dd className="mt-1 text-xs text-zinc-200">
                  {staff.firstStaffAt.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            ) : null}
            {staff.isFormerStaff && staff.lastStaffExitAt ? (
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Fin staff
                </dt>
                <dd className="mt-1 text-xs text-zinc-200">
                  {staff.lastStaffExitAt.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            ) : null}
            {integrationDate ? (
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Intégration TENF
                </dt>
                <dd className="mt-1 text-xs text-zinc-200">
                  {new Date(integrationDate).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            ) : null}
          </dl>

          {staff.staffRoleLabels.length > 0 ? (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Rôles staff occupés ({staff.staffTransitionCount} transition
                {staff.staffTransitionCount !== 1 ? "s" : ""})
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {staff.staffRoleLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-100"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showUnifiedJourney ? (
        <section className={`${sectionClass} p-4`}>
          <MemberUnifiedJourneyTimeline
            timeline={timeline}
            staffPeriods={staffPeriods}
            createdAt={createdAt}
            integrationDate={integrationDate}
            limit={variant === "compact" ? 6 : undefined}
            onEditManual={
              editable && onHistoryChange ? (entry) => setEditingEntry(entry) : undefined
            }
          />
        </section>
      ) : null}

      <MemberRoleTenureList
        roleHistory={timeline}
        currentRole={currentRole}
        createdAt={createdAt}
        memberIdentifier={memberIdentifier}
        editable={editable}
        onHistoryChange={onHistoryChange}
      />

      {(variant === "full" || editable) && sortedChanges.length > 0 ? (
        <section className={`${sectionClass} p-4`}>
          <h4 className="text-sm font-semibold text-zinc-200">Journal des événements</h4>
          <ul className="mt-3 space-y-2">
            {sortedChanges.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <EntryBadges entry={entry} />
                    <p className="font-medium text-zinc-100">{getTimelineEntryTitle(entry)}</p>
                    {entry.kind === "role_change" && entry.fromRole && entry.toRole ? (
                      <p className="text-zinc-400">
                        <span className="text-zinc-500">{entry.fromRole}</span>
                        <span className="mx-1.5 text-indigo-400">→</span>
                        <span>{entry.toRole}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <time className="text-xs tabular-nums text-zinc-500">
                      {new Date(entry.changedAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {editable && entry.source === "manual" && memberIdentifier && onHistoryChange ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingEntry(entry)}
                          className="rounded p-1 text-zinc-500 transition hover:bg-indigo-500/20 hover:text-indigo-300"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="rounded p-1 text-zinc-500 transition hover:bg-red-500/20 hover:text-red-300"
                          aria-label="Supprimer"
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Par {entry.changedBy}</p>
                {entry.reason && entry.kind !== "note" ? (
                  <p className="mt-1.5 rounded border border-white/5 bg-black/20 px-2 py-1 text-xs italic text-zinc-400">
                    {entry.reason}
                  </p>
                ) : null}
                {entry.summary && entry.kind === "note" ? (
                  <p className="mt-1.5 rounded border border-white/5 bg-black/20 px-2 py-1 text-xs text-zinc-300 whitespace-pre-wrap">
                    {entry.summary}
                  </p>
                ) : null}
                {entry.tags && entry.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {variant === "compact" && sortedChanges.length === 0 && tenures.length <= 1 ? (
        <p className="text-center text-sm text-zinc-500">
          Aucun événement enregistré — seul le rôle actuel est connu.
          {editable ? " Utilise « Ajouter un événement » pour compléter l'historique." : null}
        </p>
      ) : null}

      {updatedAt && variant === "full" ? (
        <p className="text-center text-[10px] text-zinc-600">
          Dernière mise à jour fiche : {new Date(updatedAt).toLocaleString("fr-FR")}
        </p>
      ) : null}
    </div>
  );
}
