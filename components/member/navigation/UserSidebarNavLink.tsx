"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink, Lock, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

type UserSidebarNavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
  showUnreadDot?: boolean;
  external?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  /** Style plus discret (lien de pied de menu). */
  compact?: boolean;
  onNavigate?: () => void;
};

export default function UserSidebarNavLink({
  href,
  label,
  active: rawActive,
  icon: Icon,
  showUnreadDot = false,
  external,
  disabled = false,
  disabledHint,
  compact = false,
  onNavigate,
}: UserSidebarNavLinkProps) {
  const active = disabled ? false : rawActive;
  if (disabled) {
    return (
      <div
        role="link"
        aria-disabled="true"
        tabIndex={-1}
        title={disabledHint ? `${label} — ${disabledHint}` : `${label} — bientôt disponible`}
        className="group/sidelink relative flex min-h-[36px] cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-sm font-medium text-zinc-500 opacity-70 select-none"
      >
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-zinc-500">
            <Icon size={16} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 break-words text-pretty leading-snug">{label}</span>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-700/70 bg-zinc-800/50 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-zinc-400"
              aria-label="Bientôt disponible"
            >
              <Lock className="h-2.5 w-2.5" aria-hidden />
              {disabledHint ?? "Bientôt"}
            </span>
          </span>
        </span>
      </div>
    );
  }
  const className =
    "group/sidelink relative flex min-h-[36px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/55 focus-visible:ring-offset-2" +
    (compact ? " border-white/10 bg-transparent text-zinc-400 hover:border-violet-400/25 hover:bg-violet-500/5 hover:text-zinc-200" : "");

  const style: CSSProperties = compact
    ? {
        borderColor: active ? "rgba(196, 181, 253, 0.35)" : "rgba(255,255,255,0.08)",
        backgroundColor: active ? "rgba(139, 92, 246, 0.12)" : "transparent",
        color: active ? "#ede9fe" : "var(--color-text-secondary)",
        ["--tw-ring-offset-color" as string]: "var(--color-sidebar-bg)",
      }
    : {
        borderColor: active ? "rgba(196, 181, 253, 0.45)" : "rgba(139, 92, 246, 0.22)",
        background: active
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(139, 92, 246, 0.08) 55%, rgba(15, 16, 22, 0.4) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)",
        color: active ? "#ede9fe" : "var(--color-text)",
        boxShadow: active ? "0 0 24px rgba(139, 92, 246, 0.12)" : undefined,
        ["--tw-ring-offset-color" as string]: "var(--color-sidebar-bg)",
      };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (active || compact) return;
    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.38)";
    e.currentTarget.style.background = "rgba(139, 92, 246, 0.10)";
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (active || compact) return;
    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.22)";
    e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)";
  };

  const inner = (
    <>
      {Icon ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg border transition-colors ${compact ? "h-7 w-7" : "h-8 w-8"}`}
          style={{
            borderColor: active ? "rgba(196, 181, 253, 0.35)" : "rgba(139, 92, 246, 0.25)",
            backgroundColor: active ? "rgba(139, 92, 246, 0.28)" : "rgba(0, 0, 0, 0.2)",
            color: active ? "#ddd6fe" : "var(--color-text-secondary)",
          }}
        >
          <Icon size={compact ? 15 : 16} strokeWidth={2} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="min-w-0 break-words text-pretty leading-snug">{label}</span>
          {showUnreadDot ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]" title="Notifications non lues" />
              Non lu
            </span>
          ) : null}
        </span>
      </span>
      {external ? (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-violet-300/60 transition group-hover/sidelink:text-violet-200/90" aria-hidden />
      ) : compact ? null : (
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-violet-300/50 transition group-hover/sidelink:translate-x-0.5 group-hover/sidelink:text-violet-200/90"
          aria-hidden
        />
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={className}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={className}
      style={style}
      aria-current={active ? "page" : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {inner}
    </Link>
  );
}
