import Link from "next/link";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";

type QuickAction = {
  label: string;
  href?: string;
  soon?: boolean;
};

type QuickActionsCardProps = {
  actions: QuickAction[];
};

export default function QuickActionsCard({ actions }: QuickActionsCardProps) {
  return (
    <MemberInfoCard title="Actions rapides">
      <div className="grid gap-2 md:grid-cols-2">
        {actions.map((action) =>
          action.href ? (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-lg border px-3 py-2 text-sm font-medium"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              key={action.label}
              type="button"
              disabled
              className="rounded-lg border px-3 py-2 text-left text-sm font-medium opacity-65"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              {action.label}
              {action.soon ? " (A venir)" : ""}
            </button>
          )
        )}
      </div>
    </MemberInfoCard>
  );
}
