"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ProfileSectionCardProps = {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

/** Carte de section homogène (titre + icône + description + slot droit + corps), scalable au zoom. */
export default function ProfileSectionCard({
  id,
  title,
  description,
  icon: Icon,
  iconClassName,
  accentClassName,
  rightSlot,
  children,
}: ProfileSectionCardProps) {
  return (
    <section
      id={id}
      className="flex h-full scroll-mt-[clamp(4rem,9vw,7.5rem)] flex-col rounded-[clamp(0.85rem,1.2vw,1.25rem)] border"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-[clamp(0.75rem,1vw,1.2rem)] py-[clamp(0.55rem,0.8vw,0.9rem)]">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span
              aria-hidden
              className={
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border " +
                (accentClassName ?? "border-violet-400/30 bg-violet-500/10 text-violet-200")
              }
            >
              <Icon className={"h-3.5 w-3.5 " + (iconClassName ?? "")} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2
              className="text-pretty font-bold tracking-tight text-white"
              style={{ fontSize: "clamp(0.9rem,1.02vw,1.05rem)", lineHeight: 1.2 }}
            >
              {title}
            </h2>
            {description ? (
              <p
                className="mt-0.5 max-w-[68ch] text-pretty leading-snug text-zinc-400"
                style={{ fontSize: "clamp(0.72rem,0.8vw,0.8rem)" }}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {rightSlot ? <div className="flex shrink-0 flex-wrap items-center gap-2">{rightSlot}</div> : null}
      </header>
      <div className="flex-1 px-[clamp(0.75rem,1vw,1.2rem)] py-[clamp(0.7rem,0.95vw,1.05rem)]">{children}</div>
    </section>
  );
}
