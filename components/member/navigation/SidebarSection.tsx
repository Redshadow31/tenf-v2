import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <div
          className="rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{
            color: "var(--color-text)",
            borderColor: "rgba(145, 70, 255, 0.24)",
            backgroundColor: "rgba(145, 70, 255, 0.1)",
          }}
        >
          {title}
        </div>
        <div className="h-px flex-1" style={{ backgroundColor: "rgba(145, 70, 255, 0.2)" }} />
      </div>
      <div className="space-y-2.5 pl-1">{children}</div>
    </section>
  );
}
