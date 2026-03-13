import MemberInfoCard from "@/components/member/ui/MemberInfoCard";

type ChecklistItem = {
  label: string;
  status: "ok" | "warning" | "missing";
};

type ProfileCompletionCardProps = {
  items: ChecklistItem[];
  percent: number;
};

export default function ProfileCompletionCard({ items, percent }: ProfileCompletionCardProps) {
  return (
    <MemberInfoCard title="Etat du profil">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
            <span style={{ color: "var(--color-text)" }}>{item.label}</span>
            <span
              style={{
                color: item.status === "ok" ? "#4ade80" : item.status === "warning" ? "#fbbf24" : "#f87171",
              }}
            >
              {item.status === "ok" ? "OK" : item.status === "warning" ? "Incomplet" : "Absent"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span>Profil complete</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: "var(--color-primary)" }} />
        </div>
      </div>
    </MemberInfoCard>
  );
}
