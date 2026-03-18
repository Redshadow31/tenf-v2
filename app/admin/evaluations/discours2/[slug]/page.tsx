import Link from "next/link";
import { notFound } from "next/navigation";
import { discours2Parts } from "../content";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, keywords: string[]) {
  if (!keywords.length) return text;
  const regex = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");
  const chunks = text.split(regex);

  return chunks.map((chunk, index) => {
    const isKeyword = keywords.some((keyword) => keyword.toLowerCase() === chunk.toLowerCase());
    if (!isKeyword) return <span key={`${chunk}-${index}`}>{chunk}</span>;

    return (
      <mark key={`${chunk}-${index}`} className="bg-amber-400/20 text-amber-200 px-1 rounded font-semibold">
        {chunk}
      </mark>
    );
  });
}

type PartPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Discours2PartPage({ params }: PartPageProps) {
  const { slug } = await params;
  const partIndex = discours2Parts.findIndex((part) => part.slug === slug);
  if (partIndex === -1) notFound();

  const part = discours2Parts[partIndex];
  const previous = partIndex > 0 ? discours2Parts[partIndex - 1] : null;
  const next = partIndex < discours2Parts.length - 1 ? discours2Parts[partIndex + 1] : null;

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/onboarding/discours2"
            className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Retour à l'accueil Discours 2
          </Link>
          <div className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-[#1a1a1d] to-[#2f1946] p-6">
            <p className="text-gray-300 mb-2">Partie {partIndex + 1} / {discours2Parts.length}</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {part.emoji} {part.title}
            </h1>
            <p className="text-gray-200">{part.objectif}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <section className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">📌 Points Clés à Aborder</h2>
            <ul className="space-y-3">
              {part.points.map((point) => (
                <li key={point} className="pl-6 relative text-gray-200 before:content-['✓'] before:absolute before:left-0 before:text-cyan-300">
                  {highlightText(point, part.keywords)}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-emerald-300 mb-4">💡 Conseils pour les Modérateurs</h2>
            <ul className="space-y-3">
              {part.conseils.map((conseil) => (
                <li key={conseil} className="pl-6 relative text-gray-200 before:content-['➜'] before:absolute before:left-0 before:text-emerald-300">
                  {highlightText(conseil, part.keywords)}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-amber-300 mb-4">🎤 Discours Suggéré</h2>
          <div className="space-y-4 text-gray-100 leading-relaxed">
            {part.discours.map((paragraph, index) => (
              <p key={`${part.slug}-speech-${index}`}>{highlightText(paragraph, part.keywords)}</p>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          {previous ? (
            <Link
              href={`/admin/onboarding/discours2/${previous.slug}`}
              className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              ← Partie précédente
            </Link>
          ) : (
            <Link
              href="/admin/onboarding/discours2"
              className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              ← Retour accueil
            </Link>
          )}

          {next ? (
            <Link
              href={`/admin/onboarding/discours2/${next.slug}`}
              className="px-5 py-3 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] transition-colors font-semibold"
            >
              Suivant →
            </Link>
          ) : (
            <Link
              href="/admin/onboarding/discours2"
              className="px-5 py-3 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] transition-colors font-semibold"
            >
              Terminer et revenir à l'accueil
            </Link>
          )}

          {part.slug === "final" ? (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold"
            >
              🌐 Ouvrir le site New Family
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
