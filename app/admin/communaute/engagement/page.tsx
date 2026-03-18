import Link from "next/link";

const links = [
  { href: "/admin/communaute/engagement/raids-eventsub", label: "Raids EventSub", description: "Pipeline principal des raids." },
  { href: "/admin/communaute/engagement/signalements-raids", label: "Signalements raid", description: "Fallback manuel en cas de bug EventSub." },
  { href: "/admin/communaute/engagement/historique-raids", label: "Historique raids", description: "Suivi historique et audit des raids." },
  { href: "/admin/communaute/engagement/points-discord", label: "Points Discord raids", description: "Pilotage des points liés aux raids." },
  { href: "/admin/communaute/engagement/follow", label: "Follow", description: "Suivi global des follows." },
  { href: "/admin/communaute/engagement/feuilles-follow", label: "Feuilles de follow", description: "Suivi détaillé par feuille." },
  { href: "/admin/communaute/engagement/config-follow", label: "Configuration follow", description: "Paramétrage staff follow." },
];

export default function CommunauteEngagementPage() {
  return (
    <div className="space-y-6 text-white">
      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Vie communautaire</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Engagement</h1>
        <p className="mt-2 text-sm text-gray-300">
          Hub unifié pour raids (EventSub + fallback) et suivi follow.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-5 transition-all hover:-translate-y-[1px] hover:border-[#9146ff] hover:shadow-lg hover:shadow-[#9146ff]/20"
          >
            <h2 className="text-base font-bold text-white">{item.label}</h2>
            <p className="mt-2 text-sm text-gray-400">{item.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

