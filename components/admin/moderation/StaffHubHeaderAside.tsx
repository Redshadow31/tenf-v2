"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  ShieldAlert,
  UserCog,
} from "lucide-react";
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
      className="flex w-full min-w-0 flex-col gap-4"
      aria-label={view === "staff" ? "État staff et bascule de vue" : "Bascule de vue"}
    >
      {canPilot && viewToggle ? <ViewToggleBar {...viewToggle} /> : null}

      {view === "staff" ? (
        <div className={`${MUI.asideStaffPanel} overflow-hidden`}>
          <div className={`border-b border-white/[0.08] px-4 py-4 ${MUI.glassHeader}`}>
            <p className={MUI.asideSectionLabel}>Ton espace staff</p>
            <p className={`mt-2 ${MUI.asidePanelTitle}`}>État en un coup d&apos;œil</p>
          </div>

          <ul className="space-y-3 p-4" role="list">
            <li>
              <StatusTile
                icon={charterSigned ? CheckCircle2 : ShieldAlert}
                iconClass={charterSigned ? MUI.iconEmerald : MUI.iconRose}
                label="Charte de modération"
                value={charterSigned ? "Signée" : "À signer"}
                valueClass={
                  charterSigned
                    ? "text-emerald-600 dark:text-emerald-200"
                    : "text-white dark:text-rose-50"
                }
                urgent={!charterSigned}
                href={
                  charterSigned
                    ? undefined
                    : "/admin/moderation/staff/info/charte"
                }
              />
            </li>
            <li>
              <Link
                href="/admin/moderation/staff/questionnaire"
                className={`group block rounded-xl p-4 ${MUI.asideTileInset} ${MUI.todoCardMotion} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50`}
              >
                <div className="flex items-start gap-3.5">
                  <span className={MUI.iconEmeraldLg} aria-hidden>
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${MUI.text}`}>
                      Questionnaire posture
                    </p>
                    {loading ? (
                      <div className="mt-3 space-y-2" aria-busy="true" aria-label="Chargement">
                        <div className={`h-3.5 w-32 rounded-md ${MUI.skeletonShimmer}`} />
                        <div className={`h-2.5 w-full rounded-full ${MUI.skeletonShimmer}`} />
                      </div>
                    ) : (
                      <>
                        <p className={`mt-2 text-sm font-medium tabular-nums ${MUI.text}`}>
                          {progress
                            ? `${progress.completed} / ${progress.total} questions`
                            : "À remplir · 85 questions"}
                        </p>
                        {progress ? (
                          <div
                            className={MUI.asideProgressTrack}
                            role="progressbar"
                            aria-valuenow={progressPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progression : ${progressPercent} %`}
                          >
                            <div
                              className={MUI.progressFill}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        ) : null}
                        <p
                          className={`${MUI.asideLinkCta} motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5`}
                        >
                          {moderatorView ? questionnaireCtaLabel(moderatorView) : "Commencer"}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Link>
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
  urgent,
  href,
}: {
  icon: typeof CheckCircle2;
  iconClass: string;
  label: string;
  value: string;
  valueClass: string;
  urgent?: boolean;
  href?: string;
}) {
  const tileClass =
    `flex items-center gap-3.5 rounded-xl p-4 ${MUI.todoCardMotion} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ` +
    (urgent
      ? `${MUI.charterUrgent} focus-visible:outline-rose-400/50`
      : `${MUI.asideTileInset} focus-visible:outline-violet-400/50`);

  const inner = (
    <>
      <span className={`${iconClass} !h-10 !w-10 [&_svg]:h-5 [&_svg]:w-5`} aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className={urgent ? `${MUI.asideTileLabel} text-rose-100/90` : MUI.asideTileLabel}>
          {label}
        </p>
        <p className={`${MUI.asideTileValue} mt-1 ${valueClass}`}>{value}</p>
        {urgent ? <span className={MUI.asideUrgentBadge}>Action requise</span> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClass}>
        {inner}
      </Link>
    );
  }

  return <div className={tileClass}>{inner}</div>;
}

function ViewToggleBar({ current, onChange }: ViewToggleProps) {
  return (
    <div className={MUI.asideViewToggleWrap}>
      <p className={MUI.asideViewToggleLabel}>Basculer la vue</p>
      <div
        role="tablist"
        aria-label="Bascule de vue"
        className={`mt-3 w-full min-w-0 ${MUI.asideToggleTrack}`}
      >
        {(["admin", "staff"] as const).map((v) => {
          const isActive = current === v;
          const Icon = v === "admin" ? Compass : UserCog;
          const label = v === "admin" ? "Vue admin" : "Vue modérateur";
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(v)}
              className={
                "inline-flex min-h-[2.85rem] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50 sm:min-w-[9.25rem] " +
                (isActive ? MUI.asideToggleActive : MUI.asideToggleIdle)
              }
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? MUI.asideToggleIconActive : MUI.asideToggleIconIdle}`}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
