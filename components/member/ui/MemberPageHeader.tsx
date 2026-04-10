import type { ReactNode } from "react";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";

type MemberPageHeaderProps = {
  title: string;
  description?: string;
  badge?: string;
  /** Badges ou libellés supplémentaires à côté du titre (ex: suivi points Discord) */
  extras?: ReactNode;
  showBreadcrumbs?: boolean;
};

export default function MemberPageHeader({
  title,
  description,
  badge,
  extras,
  showBreadcrumbs = true,
}: MemberPageHeaderProps) {
  return (
    <header className="rounded-xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      {showBreadcrumbs ? <MemberBreadcrumbs /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          {title}
        </h1>
        {badge ? (
          <span
            className="rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{ borderColor: "rgba(145, 70, 255, 0.45)", color: "#c4a1ff", backgroundColor: "rgba(145, 70, 255, 0.12)" }}
          >
            {badge}
          </span>
        ) : null}
        {extras}
      </div>
      {description ? (
        <p className="mt-2 text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
          {description}
        </p>
      ) : null}
    </header>
  );
}
