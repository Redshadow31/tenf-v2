import type { ReactNode } from "react";
import Image from "next/image";
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
  /** Logo affiché à la place du titre texte (hub modération). */
  titleLogo?: string;
  description?: ReactNode;
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
  titleLogo,
  description,
  icon: Icon,
  status,
  audienceLabel,
  rightSlot,
  hubAccent = false,
  detachedContent = false,
  children,
}: Props) {
  const headerClass = hubAccent
    ? `relative overflow-hidden ${MUI.glassHero}`
    : "relative overflow-hidden rounded-[clamp(0.85rem,1.2vw,1.25rem)] border";

  const headerStyle = hubAccent
    ? undefined
    : {
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      };

  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "min(100%, 120rem)",
        paddingInline: "clamp(0.5rem, 0.4rem + 1vw, 1.5rem)",
        paddingBlock: "clamp(0.6rem, 0.5rem + 1vw, 1.5rem)",
      }}
    >
      <header className={headerClass} style={headerStyle}>
        {hubAccent ? (
          <>
            <div className={MUI.glassHeroShine} aria-hidden />
            <div className={MUI.hubMesh} aria-hidden>
              <div className="absolute -left-[20%] -top-[60%] h-[130%] w-[65%] rounded-full bg-violet-500/[0.14] blur-[80px]" />
              <div className="absolute -right-[15%] top-[10%] h-[90%] w-[50%] rounded-full bg-emerald-500/[0.08] blur-[70px]" />
              <div className="absolute bottom-0 left-[30%] h-40 w-40 rounded-full bg-indigo-400/[0.06] blur-[60px]" />
              <div
                className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:20px_20px]"
                aria-hidden
              />
            </div>
          </>
        ) : null}

        <div
          className={
            hubAccent
              ? "relative grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,34%)] lg:items-stretch lg:gap-0"
              : "relative grid grid-cols-1 gap-4 border-b border-[var(--color-border)] lg:grid-cols-[minmax(0,1fr)_minmax(260px,32%)] lg:items-start lg:gap-8"
          }
          style={{
            paddingInline: hubAccent
              ? "clamp(1rem, 0.85rem + 1vw, 1.65rem)"
              : "clamp(0.85rem, 0.7rem + 0.9vw, 1.5rem)",
            paddingBlock: hubAccent
              ? "clamp(1rem, 0.85rem + 1vw, 1.5rem)"
              : "clamp(0.85rem, 0.65rem + 0.8vw, 1.25rem)",
          }}
        >
          <div className="min-w-0 lg:pr-6">
            <ModerationBreadcrumb items={breadcrumb} hubAccent={hubAccent} />
            {titleLogo ? (
              <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-6 xl:gap-8">
                <h1 className={MUI.hubTitleLogoWrap}>
                  <Image
                    src={titleLogo}
                    alt={title}
                    width={1024}
                    height={1024}
                    priority
                    className={MUI.hubTitleLogo}
                  />
                </h1>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {audienceLabel ? (
                      <span
                        className={
                          hubAccent
                            ? MUI.audiencePill
                            : "text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
                        }
                        aria-label={`Audience: ${audienceLabel}`}
                      >
                        {audienceLabel}
                      </span>
                    ) : null}
                    {status ? <ModerationStatusBadge status={status} /> : null}
                  </div>
                  {description ? <div className="mt-3 max-w-none lg:max-w-[52ch]">{description}</div> : null}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {Icon ? (
                    <span className={hubAccent ? MUI.iconHero : MUI.iconAccent} aria-hidden>
                      <Icon className={hubAccent ? "h-5 w-5" : "h-4 w-4"} />
                    </span>
                  ) : null}
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <h1
                      className={`min-w-0 text-pretty font-semibold tracking-tight ${MUI.text}`}
                      style={{
                        fontSize: hubAccent ? "clamp(1.25rem,1.65vw,1.75rem)" : "clamp(1.15rem,1.5vw,1.65rem)",
                        lineHeight: 1.1,
                      }}
                    >
                      {title}
                    </h1>
                    {status ? <ModerationStatusBadge status={status} /> : null}
                    {audienceLabel ? (
                      <span
                        className={
                          hubAccent
                            ? MUI.audiencePill
                            : "text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]"
                        }
                        aria-label={`Audience: ${audienceLabel}`}
                      >
                        {audienceLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
                {description ? (
                  <p
                    className={`mt-3 max-w-none text-pretty leading-relaxed ${MUI.textSecondary} lg:max-w-[62ch]`}
                    style={{ fontSize: "clamp(0.82rem,0.92vw,0.98rem)" }}
                  >
                    {description}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {rightSlot ? (
            <div
              className={
                hubAccent
                  ? `relative min-w-0 w-full lg:max-w-none lg:border-l lg:border-white/[0.06] lg:pl-6 ${MUI.glassHeroColumn}`
                  : "relative min-w-0 w-full lg:max-w-md lg:justify-self-end"
              }
            >
              {rightSlot}
            </div>
          ) : null}
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
