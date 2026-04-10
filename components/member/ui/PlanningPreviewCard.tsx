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
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Aucun planning enregistré pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {preview.map((item) => (
            <div key={item.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <p style={{ color: "var(--color-text)" }}>
                {new Date(item.date).toLocaleDateString("fr-FR")} - {item.time}
              </p>
              <p style={{ color: "var(--color-text-secondary)" }}>
                {item.liveType}
                {item.title ? ` - ${item.title}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link
        href={planningHref}
        className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Modifier mon planning
      </Link>
    </MemberInfoCard>
  );
}
