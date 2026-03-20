import Link from "next/link";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

const cards = [
  {
    href: "/admin/onboarding/presentation-anime",
    title: "Présentation TENF",
    description: "Support visuel principal utilisé pendant la session onboarding.",
    icon: "📽️",
    priority: "Critique",
    owner: "Modération session",
    color: "from-cyan-500 to-blue-600",
  },
  {
    href: "/admin/onboarding/discours2",
    title: "Discours & trame",
    description: "Script de conduite complet, section par section, pour garder un discours homogène.",
    icon: "🎤",
    priority: "Critique",
    owner: "Lead onboarding",
    color: "from-indigo-500 to-purple-600",
  },
  {
    href: "/admin/integration/discours",
    title: "Discours legacy",
    description: "Version historique consultable pour comparaison et migration.",
    icon: "🗃️",
    priority: "Secondaire",
    owner: "Référent contenu",
    color: "from-slate-500 to-slate-700",
  },
];

export default function OnboardingContenusPage() {
  const criticalCount = cards.filter((card) => card.priority === "Critique").length;

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding membres</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Contenus onboarding
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page centralise les supports utilisés pendant les sessions onboarding. Elle sert a standardiser le message,
              réduire les oublis en live et maintenir une expérience cohérente pour tous les nouveaux membres.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-300/25 bg-[#101522]/70 px-4 py-3 text-sm text-indigo-100">
            <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Objectif opérationnel</p>
            <p className="mt-1">Un seul point d'entrée pour tous les supports de session.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Supports disponibles</p>
          <p className="mt-2 text-3xl font-semibold">{cards.length}</p>
          <p className="mt-1 text-xs text-slate-400">Présentation, script, historique</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Contenus critiques</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{criticalCount}</p>
          <p className="mt-1 text-xs text-slate-400">A vérifier avant chaque session</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Risque contenu</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">Moyen</p>
          <p className="mt-1 text-xs text-slate-400">Monter à haut si script non relu</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Cible qualité</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">100%</p>
          <p className="mt-1 text-xs text-slate-400">Supports prêts 24h avant session</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Comment utiliser cette page</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <strong className="text-slate-100">1. Avant session:</strong> valider que la présentation et le discours sont a jour.
            </p>
            <p className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <strong className="text-slate-100">2. Pendant session:</strong> suivre la trame pour garder le même niveau d'information.
            </p>
            <p className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <strong className="text-slate-100">3. Après session:</strong> noter les écarts observés et mettre à jour les supports.
            </p>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Checklist qualité contenu</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-emerald-100">
              Discours aligné avec les règles staff et onboarding.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              Liens et pages cibles testés avant diffusion.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              Eléments legacy identifiés pour éviter confusion en live.
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.17),rgba(15,23,42,0.66))] p-5 transition hover:-translate-y-[2px] hover:border-indigo-200/45 hover:shadow-[0_16px_34px_rgba(67,56,202,0.35)]"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-2xl`}
              >
                {card.icon}
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-indigo-200">
                  {card.title}
                </h2>
                <p className="text-sm text-slate-300">{card.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full border px-2 py-1 ${
                      card.priority === "Critique"
                        ? "border-rose-300/35 bg-rose-300/10 text-rose-100"
                        : "border-slate-300/35 bg-slate-300/10 text-slate-200"
                    }`}
                  >
                    Priorité: {card.priority}
                  </span>
                  <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-1 text-cyan-100">
                    Owner: {card.owner}
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-indigo-200 transition group-hover:translate-x-0.5">Ouvrir le contenu -&gt;</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Plan d'action éditorial</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Avant chaque onboarding</p>
            <p className="mt-1 text-xs text-slate-400">Relire les deux contenus critiques et valider la cohérence du wording.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Après chaque onboarding</p>
            <p className="mt-1 text-xs text-slate-400">Noter les incompréhensions récurrentes et les intégrer dans la trame.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Hebdomadaire</p>
            <p className="mt-1 text-xs text-slate-400">Faire un point rapide staff pour harmoniser exemples et consignes.</p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-200">
            <p className="font-medium text-slate-100">Mensuel</p>
            <p className="mt-1 text-xs text-slate-400">Archiver les versions obsolètes et maintenir une seule source active.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

