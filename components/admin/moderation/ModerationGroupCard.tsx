import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MUI, toneAccentBar } from "@/components/admin/moderation/moderation-ui";
import ModerationStatusBadge, {
  moderationToneClasses,
} from "@/components/admin/moderation/ModerationStatusBadge";
import {
  resolveModerationModuleHref,
  type ModerationGroup,
  type ModerationModule,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

type Props = {
  group: ModerationGroup;
  view: ModerationView;
  attenuateModuleSlugs?: string[];
};

export default function ModerationGroupCard({
  group,
  view,
  attenuateModuleSlugs = [],
}: Props) {
  const toneClass = moderationToneClasses[group.tone];
  const accentBar = toneAccentBar[group.tone] ?? toneAccentBar.slate;
  const attenuated = group.modules.filter((m) => attenuateModuleSlugs.includes(m.slug));
  const modules = group.modules.filter((m) => !attenuateModuleSlugs.includes(m.slug));
  const allInactive =
    modules.length > 0 && modules.every((m) => m.status !== "active");
  const wipCount = modules.filter((m) => m.status !== "active").length;
  const activeCount = modules.filter((m) => m.status === "active").length;

  return (
    <article
      className={
        `group/card relative flex h-full flex-col overflow-hidden ${MUI.groupCard} motion-safe:transition-[box-shadow,transform] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 ` +
        (allInactive
          ? ""
          : "motion-safe:hover:shadow-[0_16px_48px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]")
      }
    >
      <div className={`h-1 w-full ${accentBar}`} aria-hidden />

      <header
        className={`${MUI.panelHeader} ${MUI.glassHeader}`}
        style={{
          paddingInline: "clamp(0.9rem, 0.7rem + 0.8vw, 1.25rem)",
          paddingBlock: "clamp(0.85rem, 0.65rem + 0.7vw, 1.1rem)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className={
                "mt-1 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 shadow-[0_0_12px_currentColor] " +
                toneClass
              }
            />
            <div className="min-w-0">
              <h2 className={`text-pretty ${MUI.hubSectionTitle}`} style={{ fontSize: "clamp(1rem,1.1vw,1.15rem)" }}>
                {group.label}
              </h2>
              <p className={`mt-1.5 line-clamp-3 text-pretty text-sm leading-relaxed ${MUI.textSecondary}`}>
                {group.description}
              </p>
            </div>
          </div>
          {!allInactive && activeCount > 0 ? (
            <span className={MUI.groupActiveCount}>
              {activeCount} actif{activeCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        {allInactive && wipCount > 0 ? (
          <p className={MUI.groupWipHint}>
            {wipCount} module{wipCount > 1 ? "s" : ""} bientôt disponible{wipCount > 1 ? "s" : ""}
          </p>
        ) : null}
      </header>

      <ModuleList
        group={group}
        view={view}
        modules={modules}
        attenuated={attenuated}
        compact={allInactive && modules.length >= 2}
      />
    </article>
  );
}

function ModuleList({
  group,
  view,
  modules,
  attenuated = [],
  compact = false,
}: {
  group: ModerationGroup;
  view: ModerationView;
  modules: ModerationModule[];
  attenuated?: ModerationModule[];
  compact?: boolean;
}) {
  return (
    <ul
      className="flex flex-1 flex-col gap-2"
      style={{
        paddingInline: "clamp(0.75rem, 0.6rem + 0.55vw, 1rem)",
        paddingBlock: "clamp(0.75rem, 0.6rem + 0.55vw, 1rem)",
      }}
    >
      {modules.map((mod) => {
        const href = resolveModerationModuleHref(view, group.slug, mod.slug);
        const isInactive = mod.status !== "active";

        return (
          <li key={`${group.slug}-${mod.slug}`}>
            <Link
              href={href}
              className={
                MUI.moduleRow +
                " " +
                (isInactive ? MUI.moduleRowInactive : MUI.surfaceHover)
              }
              title={mod.longLabel || mod.label}
            >
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className={
                    MUI.moduleTitle + (isInactive ? " text-[var(--color-text-secondary)]" : "")
                  }
                >
                  {mod.label}
                </p>
                {!compact && mod.description ? (
                  <p className={MUI.moduleDesc}>{mod.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                <ModerationStatusBadge status={mod.status} size="sm" subdued={isInactive} />
                <ArrowRight
                  className={`h-4 w-4 text-[var(--color-text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]`}
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        );
      })}
      {attenuated.map((mod) => {
        const href = resolveModerationModuleHref(view, group.slug, mod.slug);
        return (
          <li key={`${group.slug}-${mod.slug}-attenuated`}>
            <Link
              href={href}
              className={`${MUI.moduleRow} border-dashed border-violet-400/25 bg-violet-500/[0.05] hover:border-violet-400/40 hover:bg-violet-500/[0.08]`}
              title={mod.longLabel || mod.label}
            >
              <span className={`min-w-0 flex-1 text-sm font-medium text-[var(--color-text-secondary)]`}>
                {mod.label}
                <span className="font-normal text-violet-300/90 dark:text-violet-200/80"> · Voir aussi</span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-violet-400/80 transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
