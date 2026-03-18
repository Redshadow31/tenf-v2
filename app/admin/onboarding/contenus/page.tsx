import Link from "next/link";

const cards = [
  {
    href: "/admin/onboarding/presentation-anime",
    title: "Présentation TENF",
    description: "Support animé de la réunion d'onboarding.",
    icon: "📽️",
    color: "from-cyan-500 to-blue-600",
  },
  {
    href: "/admin/onboarding/discours2",
    title: "Discours & trame",
    description: "Séquençage des parties de discours d'intégration.",
    icon: "🎤",
    color: "from-indigo-500 to-purple-600",
  },
  {
    href: "/admin/integration/discours",
    title: "Discours legacy",
    description: "Ancienne version conservée temporairement (migration).",
    icon: "🗃️",
    color: "from-slate-500 to-slate-700",
  },
];

export default function OnboardingContenusPage() {
  return (
    <div className="space-y-6 text-white">
      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Onboarding membres</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Contenus onboarding</h1>
        <p className="mt-2 text-sm text-gray-300">
          Espace unifié pour piloter la présentation et les scripts de discours.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-gray-700 bg-[#1a1a1d] p-5 transition-all hover:-translate-y-[1px] hover:border-[#9146ff] hover:shadow-lg hover:shadow-[#9146ff]/20"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-2xl`}
              >
                {card.icon}
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-base font-bold text-white transition-colors group-hover:text-[#9146ff]">
                  {card.title}
                </h2>
                <p className="text-sm text-gray-400">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

