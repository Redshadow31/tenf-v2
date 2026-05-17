import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import ModerationBreadcrumb, {
  type ModerationBreadcrumbItem,
} from "@/components/admin/moderation/ModerationBreadcrumb";
import ModerationStatusBadge from "@/components/admin/moderation/ModerationStatusBadge";
import { MUI } from "@/components/admin/moderation/moderation-ui";
import type { ModerationStatus } from "@/lib/moderation/moderationTree";

type Props = {
  breadcrumb: ModerationBreadcrumbItem[];
  title: string;
  description?: string;
  icon?: LucideIcon;
  status?: ModerationStatus;
  audienceLabel?: string;
  rightSlot?: ReactNode;
  /** Fond dégradé discret (hub staff). */
  hubAccent?: boolean;
  detachedContent?: boolean;
  children: ReactNode;
};

export default function ModerationPageShell({
  breadcrumb,
  title,
  description,
  icon: Icon,
  status,
  audienceLabel,
  rightSlot,
  hubAccent = false,
  detachedContent = false,
  children,
}: Props) {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "min(100%, 120rem)",
        paddingInline: "clamp(0.5rem, 0.4rem + 1vw, 1.5rem)",
        paddingBlock: "clamp(0.6rem, 0.5rem + 1vw, 1.5rem)",
      }}
    >
      <header
        className={`relative overflow-hidden rounded-[clamp(0.85rem,1.2vw,1.25rem)] border ${hubAccent ? "shadow-[0_12px_40px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]" : ""}`}
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        {hubAccent ? (
          <div className={MUI.hubMesh} aria-hidden>
            <div className="absolute -left-1/4 -top-1/2 h-[140%] w-[70%] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] blur-3xl" />
            <div className="absolute -bottom-1/2 -right-1/4 h-[120%] w-[55%] rounded-full bg-[color-mix(in_srgb,#10b981_10%,transparent)] blur-3xl" />
          </div>
        ) : null}

        <div
          className="relative grid grid-cols-1 gap-4 border-b border-[var(--color-border)] lg:grid-cols-[minmax(0,1fr)_minmax(260px,32%)] lg:items-start lg:gap-8"
          style={{
            paddingInline: "clamp(0.85rem, 0.7rem + 0.9vw, 1.5rem)",
            paddingBlock: "clamp(0.85rem, 0.65rem + 0.8vw, 1.25rem)",
          }}
        >
          <div className="min-w-0">
            <ModerationBreadcrumb items={breadcrumb} />
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {Icon ? (
                <span className={MUI.iconAccent} aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <h1
                className="min-w-0 text-pretty font-bold tracking-tight text-[var(--color-text)]"
                style={{ fontSize: "clamp(1.15rem,1.5vw,1.65rem)", lineHeight: 1.12 }}
              >
                {title}
              </h1>
              {status ? <ModerationStatusBadge status={status} /> : null}
              {audienceLabel ? (
                <span
                  className="inline-flex items-center rounded-full border border-violet-400/30 bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-card))] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-200"
                  aria-label={`Audience: ${audienceLabel}`}
                >
                  {audienceLabel}
                </span>
              ) : null}
            </div>
            {description ? (
              <p
                className="mt-2 max-w-none text-pretty leading-relaxed text-[var(--color-text-secondary)] lg:max-w-[68ch]"
                style={{ fontSize: "clamp(0.8rem,0.9vw,0.95rem)" }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {rightSlot ? <div className="relative min-w-0 w-full lg:max-w-md lg:justify-self-end">{rightSlot}</div> : null}
        </div>

        {!detachedContent ? (
          <div
            className="relative"
            style={{
              paddingInline: "clamp(0.85rem, 0.7rem + 0.9vw, 1.5rem)",
              paddingBlock: "clamp(0.85rem, 0.7rem + 0.9vw, 1.4rem)",
            }}
          >
            {children}
          </div>
        ) : null}
      </header>

      {detachedContent ? (
        <div className="relative mt-[clamp(0.75rem,1vw,1.15rem)] w-full min-w-0">{children}</div>
      ) : null}
    </div>
  );
}

