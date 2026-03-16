import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

export default function MemberEngagementFriendsPage() {
  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes Amis"
        description="Cette section evoluera vers une experience sociale personnalisee."
        badge="Engagement"
      />

      <section
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(145,70,255,0.4)",
          background:
            "linear-gradient(132deg, rgba(18,17,30,0.98) 0%, rgba(40,23,58,0.9) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -left-16 top-2 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: "rgba(168,85,247,0.25)" }} />
        <div className="pointer-events-none absolute -right-16 bottom-2 h-44 w-44 rounded-full blur-3xl" style={{ backgroundColor: "rgba(236,72,153,0.18)" }} />

        <div className="relative space-y-4">
          <p className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "rgba(221,191,255,0.4)", color: "rgba(221,191,255,0.95)" }}>
            Future fonctionnalite
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Mes Amis arrive bientot
          </h2>
          <p className="max-w-2xl text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Cette page accueillera prochainement tes connexions privilegiees TENF: membres favoris, suivi relationnel, et parcours d'entraide personnalise.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniPill label="Favoris" value="Bientot" />
            <MiniPill label="Suggestions" value="Bientot" />
            <MiniPill label="Interactions" value="Bientot" />
          </div>
        </div>
      </section>
    </MemberSurface>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border p-3" style={{ borderColor: "rgba(221,191,255,0.25)", backgroundColor: "rgba(255,255,255,0.03)" }}>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </article>
  );
}
