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
        `group/card relative flex h-full flex-col overflow-hidden ${MUI.card} motion-safe:transition-shadow motion-safe:duration-300 ` +
        (allInactive ? "opacity-[0.88]" : "motion-safe:hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]")
      }
    >
      <div className={`h-0.5 w-full ${accentBar} opacity-70`} aria-hidden />

      <header
        className={MUI.panelHeader}
        style={{
          paddingInline: "clamp(0.85rem, 0.65rem + 0.75vw, 1.2rem)",
          paddingBlock: "clamp(0.75rem, 0.55rem + 0.65vw, 1rem)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              aria-hidden
              className={"mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border " + toneClass}
            />
            <div className="min-w-0">
              <h2
                className={`line-clamp-2 text-pretty font-semibold tracking-tight ${MUI.text}`}
                style={{ fontSize: "clamp(0.95rem,1.05vw,1.12rem)", lineHeight: 1.25 }}
              >
                {group.label}
              </h2>
              <p
                className={`mt-1 line-clamp-2 text-pretty leading-snug ${MUI.textSecondary}`}
                style={{ fontSize: "clamp(0.72rem,0.8vw,0.84rem)" }}
              >
                {group.description}
              </p>
            </div>
          </div>
          {!allInactive && activeCount > 0 ? (
            <span
              className={`shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${MUI.textMuted}`}
            >
              {activeCount} actif{activeCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        {allInactive && wipCount > 0 ? (
          <p className={`mt-2.5 text-[11px] font-medium ${MUI.textMuted}`}>
            {wipCount} module{wipCount > 1 ? "s" : ""} bientôt disponible{wipCount > 1 ? "s" : ""}
          </p>
        ) : null}
      </header>

      {allInactive && modules.length >= 2 ? (
        <CompactWipList group={group} view={view} modules={modules} />
      ) : (
        <ModuleList group={group} view={view} modules={modules} attenuated={attenuated} />
      )}
    </article>
  );
}

function ModuleList({
  group,
  view,
  modules,
  attenuated = [],
}: {
  group: ModerationGroup;
  view: ModerationView;
  modules: ModerationModule[];
  attenuated?: ModerationModule[];
}) {
  return (
    <ul
      className="flex flex-1 flex-col gap-1.5"
      style={{
        paddingInline: "clamp(0.6rem, 0.5rem + 0.5vw, 0.9rem)",
        paddingBlock: "clamp(0.65rem, 0.5rem + 0.55vw, 0.9rem)",
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
                MUI.moduleRow + " " + (isInactive ? MUI.moduleRowInactive : MUI.surfaceHover)
              }
              title={mod.longLabel || mod.label}
            >
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className={MUI.moduleTitle + (isInactive ? " " + MUI.textSecondary : "")}
                  style={{ fontSize: "clamp(0.8rem,0.9vw,0.92rem)" }}
                >
                  {mod.label}
                </p>
                <p className={MUI.moduleDesc} style={{ fontSize: "clamp(0.68rem,0.76vw,0.76rem)" }}>
                  {mod.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <ModerationStatusBadge status={mod.status} size="sm" subdued={isInactive} />
                <ArrowRight
                  className={`h-3.5 w-3.5 ${MUI.textMuted} transition group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]`}
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
              className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-sm opacity-75 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
              title={mod.longLabel || mod.label}
            >
              <span className={`min-w-0 line-clamp-2 text-pretty ${MUI.textMuted}`}>
                {mod.label}
                <span className="font-normal"> · Voir aussi</span>
              </span>
              <ArrowRight className={`h-3 w-3 shrink-0 ${MUI.textMuted}`} aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CompactWipList({
  group,
  view,
  modules,
}: {
  group: ModerationGroup;
  view: ModerationView;
  modules: ModerationModule[];
}) {
  return (
    <ul
      className="space-y-1"
      style={{
        paddingInline: "clamp(0.6rem, 0.5rem + 0.5vw, 0.9rem)",
        paddingBlock: "clamp(0.65rem, 0.5rem + 0.55vw, 0.9rem)",
      }}
    >
      {modules.map((mod) => {
        const href = resolveModerationModuleHref(view, group.slug, mod.slug);
        return (
          <li key={`${group.slug}-${mod.slug}-wip`}>
            <Link
              href={href}
              className={
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition " +
                MUI.moduleRowInactive +
                " focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
              }
              title={mod.longLabel || mod.label}
            >
              <span className={`min-w-0 line-clamp-2 text-pretty font-medium ${MUI.textSecondary}`}>
                {mod.label}
              </span>
              <ModerationStatusBadge status={mod.status} size="sm" subdued />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
