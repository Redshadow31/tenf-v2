import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="space-y-2">
      <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
