"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, Compass, ShieldAlert, UserCog } from "lucide-react";
import { MUI } from "@/components/admin/moderation/moderation-ui";
import {
  questionnaireCtaLabel,
  useMyQuestionnaireHub,
} from "@/components/admin/moderation/questionnaire/QuestionnaireHubContext";
import type { ModerationView } from "@/lib/moderation/moderationTree";

type ViewToggleProps = {
  current: ModerationView;
  onChange: (next: ModerationView) => void;
};

type Props = {
  view: ModerationView;
  charterSigned: boolean;
  canPilot: boolean;
  viewToggle: ViewToggleProps | null;
};

export default function StaffHubHeaderAside({
  view,
  charterSigned,
  canPilot,
  viewToggle,
}: Props) {
  const { loading, moderatorView, progress } = useMyQuestionnaireHub(view === "staff");

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-3"
      aria-label={view === "staff" ? "État staff et bascule de vue" : "Bascule de vue"}
    >
      {canPilot && viewToggle ? <ViewToggleBar {...viewToggle} /> : null}

      {view === "staff" ? (
        <div className={`${MUI.card} overflow-hidden`}>
          <div
            className="border-b border-[var(--color-border)] px-3.5 py-2.5"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-card)) 0%, color-mix(in srgb, #10b981 6%, var(--color-card)) 100%)",
            }}
          >
            <p className={MUI.sectionLabel}>Ton espace staff</p>
            <p className={`mt-0.5 text-sm font-semibold ${MUI.text}`}>
              État en un coup d&apos;œil
            </p>
          </div>

          <ul className="space-y-3 p-3.5" role="list">
            <li>
              <StatusTile
                icon={charterSigned ? CheckCircle2 : ShieldAlert}
                iconClass={charterSigned ? MUI.iconEmerald : MUI.iconRose}
                label="Charte de modération"
                value={charterSigned ? "Signée" : "À signer"}
                valueClass={
                  charterSigned
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }
                href={
                  charterSigned
                    ? undefined
                    : "/admin/moderation/staff/info/charte"
                }
              />
            </li>
            <li>
              <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-card))] p-3">
                <div className="flex items-start gap-2.5">
                  <span className={MUI.iconEmerald} aria-hidden>
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${MUI.text}`}>
                      Questionnaire posture
                    </p>
                    {loading ? (
                      <div className="mt-2 space-y-1.5" aria-hidden>
                        <div className={`h-3 w-24 animate-pulse rounded ${MUI.progressTrack}`} />
                        <div className={`h-2 w-full animate-pulse rounded-full ${MUI.progressTrack}`} />
                      </div>
                    ) : (
                      <>
                        <p className={`mt-0.5 text-sm font-medium ${MUI.textSecondary}`}>
                          {progress
                            ? `${progress.completed} / ${progress.total} questions`
                            : "À remplir · 85 questions"}
                        </p>
                        {progress ? (
                          <div className={`mt-2 ${MUI.progressTrack}`} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                            <div
                              className={MUI.progressFill}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        ) : null}
                        {moderatorView ? (
                          <p className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wide ${MUI.textMuted}`}>
                            {questionnaireCtaLabel(moderatorView)}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function StatusTile({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  href,
}: {
  icon: typeof CheckCircle2;
  iconClass: string;
  label: string;
  value: string;
  valueClass: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className={iconClass} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs ${MUI.textMuted}`}>{label}</p>
        <p className={`text-sm font-bold ${valueClass}`}>{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 rounded-xl border border-rose-400/30 bg-[color-mix(in_srgb,#f43f5e_6%,var(--color-card))] p-3 transition hover:border-rose-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/60"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-card))] p-3">
      {inner}
    </div>
  );
}

function ViewToggleBar({ current, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Bascule de vue"
      className={`w-full min-w-0 ${MUI.toggleTrack}`}
    >
      {(["admin", "staff"] as const).map((v) => {
        const isActive = current === v;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v)}
            className={
              "inline-flex min-h-[2.35rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:flex-none sm:px-3.5 " +
              (isActive ? MUI.toggleActive : MUI.toggleIdle)
            }
          >
            {v === "admin" ? (
              <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <UserCog className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            {v === "admin" ? "Vue admin" : "Vue modérateur"}
          </button>
        );
      })}
    </div>
  );
}

