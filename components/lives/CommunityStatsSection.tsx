type CommunityStatsSectionProps = {
  liveCount: number;
  totalMembers: number | null;
  activeMembers: number | null;
};

export default function CommunityStatsSection({
  liveCount,
  totalMembers,
  activeMembers,
}: CommunityStatsSectionProps) {
  const stats = [
    { label: "Streamers en direct", value: String(liveCount) },
    { label: "Membres (createurs engages)", value: totalMembers !== null ? String(totalMembers) : "..." },
    { label: "Membres actifs (statut admin)", value: activeMembers !== null ? String(activeMembers) : "..." },
    { label: "Esprit TENF", value: "Entraide quotidienne" },
  ];

  return (
    <section className="space-y-3 rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
      <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
        💜 La communaute TENF en ce moment
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
