import MembersCockpitShell from "./MembersCockpitShell";
import { cockpitPanelClass } from "./membersHubStyles";

export default function MembersHubSkeleton() {
  return (
    <MembersCockpitShell aside={<div className={`${cockpitPanelClass} hidden h-full min-h-[12rem] animate-pulse xl:block`} />}>
      <div className="space-y-5 text-white" aria-busy="true" aria-label="Chargement du hub membres">
        <div className={`${cockpitPanelClass} animate-pulse p-5`} style={{ padding: "clamp(1.1rem, 0.9rem + 0.6vw, 1.8rem)" }}>
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="mt-4 h-7 w-72 max-w-full rounded-lg bg-white/10" />
          <div className="mt-3 h-4 w-[28rem] max-w-full rounded-lg bg-white/5" />
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
            <div className="h-8 w-36 rounded-lg bg-white/[0.06]" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${cockpitPanelClass} h-32 animate-pulse`} />
          ))}
        </div>

        <div className={`${cockpitPanelClass} animate-pulse p-5`} style={{ minHeight: "12rem" }}>
          <div className="h-4 w-48 rounded-lg bg-white/10" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        </div>

        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-200" />
        </div>
      </div>
    </MembersCockpitShell>
  );
}
