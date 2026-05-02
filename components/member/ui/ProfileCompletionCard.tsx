import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDot } from "lucide-react";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";

type ChecklistItem = {
  label: string;
  status: "ok" | "warning" | "missing";
};

type ProfileCompletionCardProps = {
  items: ChecklistItem[];
  percent: number;
  ctaHref?: string;
};

export default function ProfileCompletionCard({ items, percent, ctaHref }: ProfileCompletionCardProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <MemberInfoCard title="Ta checklist profil">
      <p className="mb-4 text-sm leading-relaxed text-zinc-500">
        Un coup d’œil sur ce qui brille déjà et ce qui mérite un petit coup de polish — rien de dramatique, juste pour t’aider à prioriser.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2.5 text-sm transition hover:border-violet-400/20"
          >
            <span className="shrink-0">
              {item.status === "ok" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
              ) : item.status === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
              ) : (
                <CircleDot className="h-5 w-5 text-rose-400" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1 font-medium text-zinc-200">{item.label}</span>
            <span
              className={`shrink-0 text-xs font-bold uppercase tracking-wide ${
                item.status === "ok" ? "text-emerald-400/90" : item.status === "warning" ? "text-amber-400/90" : "text-rose-400/90"
              }`}
            >
              {item.status === "ok" ? "OK" : item.status === "warning" ? "À peaufiner" : "Manquant"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-500">
          <span>Complétion globale</span>
          <span className="tabular-nums text-violet-300">{clamped}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
      {ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
        >
          Compléter mon profil
        </Link>
      ) : null}
    </MemberInfoCard>
  );
}
