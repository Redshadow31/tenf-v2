export default function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement des notifications">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.06] p-5 sm:p-6"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="mb-4 flex gap-3">
            <div className="h-7 w-24 rounded-full bg-white/10" />
            <div className="h-4 flex-1 rounded bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-4/5 max-w-md rounded bg-white/[0.08]" />
            <div className="h-4 w-full rounded bg-white/[0.05]" />
            <div className="h-4 w-[92%] rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}
