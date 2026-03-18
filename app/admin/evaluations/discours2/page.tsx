import Link from "next/link";
import { discours2General, discours2Parts } from "./content";

export default function Discours2HomePage() {
  const firstPart = discours2Parts[0];

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/onboarding/contenus"
            className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Retour aux contenus onboarding
          </Link>
          <h1 className="text-4xl font-bold mb-2">🎤 Discours 2 - Parcours visuel</h1>
          <p className="text-gray-400">{discours2General.subtitle}</p>
        </div>

        <section className="rounded-2xl border border-fuchsia-600/40 bg-gradient-to-br from-[#1a1a1d] to-[#2b153f] p-6 md:p-8 shadow-xl shadow-fuchsia-900/20 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">🚀 Accueil général</h2>
          <p className="text-gray-200 mb-5">
            Cette page pose le cadre de toute la réunion, puis chaque bouton <strong className="text-fuchsia-300">Suivant</strong> vous amène
            vers une partie dédiée.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-sm bg-fuchsia-500/20 border border-fuchsia-400/30">Ludique</span>
            <span className="px-3 py-1 rounded-full text-sm bg-cyan-500/20 border border-cyan-400/30">Visuel</span>
            <span className="px-3 py-1 rounded-full text-sm bg-emerald-500/20 border border-emerald-400/30">Compréhensible</span>
            <span className="px-3 py-1 rounded-full text-sm bg-amber-500/20 border border-amber-400/30">Mots-clés mis en avant</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-6">
            <h3 className="text-xl font-bold text-cyan-300 mb-4">📌 Points Clés à Aborder</h3>
            <ul className="space-y-3">
              {discours2General.points.map((point) => (
                <li key={point} className="pl-6 relative text-gray-200 before:content-['✓'] before:absolute before:left-0 before:text-cyan-300">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6">
            <h3 className="text-xl font-bold text-emerald-300 mb-4">💡 Conseils pour les Modérateurs</h3>
            <ul className="space-y-3">
              {discours2General.conseils.map((conseil) => (
                <li key={conseil} className="pl-6 relative text-gray-200 before:content-['➜'] before:absolute before:left-0 before:text-emerald-300">
                  {conseil}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-amber-300 mb-3">⭐ Si je devais résumer la réunion</h3>
          <p className="text-lg text-amber-100 font-medium mb-3">👉 {discours2General.phraseCentrale}</p>
          <p className="text-gray-200">{discours2General.note}</p>
        </section>

        <section className="bg-[#17171b] border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">🧭 Aperçu des parties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {discours2Parts.map((part, index) => (
              <Link
                key={part.slug}
                href={`/admin/onboarding/discours2/${part.slug}`}
                className="group rounded-lg border border-gray-700 bg-[#222228] p-4 hover:border-fuchsia-400 transition-colors"
              >
                <p className="text-sm text-gray-400 mb-1">Partie {index + 1}</p>
                <p className="font-semibold group-hover:text-fuchsia-300 transition-colors">
                  {part.emoji} {part.title}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <Link
          href={`/admin/onboarding/discours2/${firstPart.slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold transition-all hover:-translate-y-0.5"
        >
          Suivant: démarrer la présentation →
        </Link>
      </div>
    </div>
  );
}
