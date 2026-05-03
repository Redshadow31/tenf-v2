import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-0.5">
        <div
          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase leading-tight tracking-[0.14em] shadow-[0_0_20px_rgba(139,92,246,0.12)]"
          style={{
            color: "var(--color-text)",
            borderColor: "rgba(167, 139, 250, 0.45)",
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.06) 100%)",
          }}
        >
          <Sparkles className="h-3 w-3 shrink-0 text-violet-300/90" aria-hidden />
          <span className="break-words text-pretty">{title}</span>
        </div>
        <div className="h-px min-w-[1.5rem] flex-1 bg-gradient-to-r from-violet-500/50 to-transparent" aria-hidden />
      </div>
      <div className="space-y-2 pl-0.5">{children}</div>
    </section>
  );
}
