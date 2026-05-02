import Link from "next/link";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";
import StatusBadge from "@/components/member/ui/StatusBadge";

type PlanningItem = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
};

type PlanningPreviewCardProps = {
  plannings: PlanningItem[];
  planningHref: string;
};

export default function PlanningPreviewCard({ plannings, planningHref }: PlanningPreviewCardProps) {
  const sorted = [...plannings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const preview = sorted.slice(0, 7);
  const hasPlanning = sorted.length > 0;

  return (
    <MemberInfoCard title="Mon planning de live">
      <div className="mb-3">
        <StatusBadge label={hasPlanning ? "Planning renseigné" : "Planning non défini"} tone={hasPlanning ? "success" : "warning"} />
      </div>
      {!hasPlanning ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center text-sm leading-relaxed text-zinc-500">
          Aucun créneau enregistré — ajoute au moins une intention de live pour que la communauté et le staff puissent s’organiser.
        </p>
      ) : (
        <div className="relative space-y-2 pl-3 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-violet-500/50 before:via-white/10 before:to-transparent">
          {preview.map((item) => (
            <div
              key={item.id}
              className="relative rounded-xl border border-white/[0.07] bg-black/20 py-2.5 pl-8 pr-3 text-sm transition hover:border-violet-400/25"
            >
              <span className="absolute left-0 top-1/2 flex h-3 w-3 -translate-x-[5px] -translate-y-1/2 rounded-full border-2 border-violet-400 bg-[var(--color-card)] shadow-[0_0_10px_rgba(167,139,250,0.45)]" />
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {new Date(item.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {item.time}
              </p>
              <p style={{ color: "var(--color-text-secondary)" }}>
                {item.liveType}
                {item.title ? ` · ${item.title}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link
        href={planningHref}
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
      >
        Modifier mon planning
      </Link>
    </MemberInfoCard>
  );
}
