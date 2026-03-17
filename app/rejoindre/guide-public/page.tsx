import Link from "next/link";

const guidePages = [
  {
    title: "Presentation rapide",
    href: "/rejoindre/guide-public/presentation-rapide",
    description: "Vue d'ensemble des categories publiques et du menu principal.",
  },
  {
    title: "Creer un compte",
    href: "/rejoindre/guide-public/creer-un-compte",
    description: "Tutoriel concret pour creer son espace TENF via Discord.",
  },
  {
    title: "Liaison Twitch",
    href: "/rejoindre/guide-public/liaison-twitch",
    description: "Connecter Twitch pour debloquer les fonctionnalites membre.",
  },
  {
    title: "FAQ publique",
    href: "/rejoindre/guide-public/faq-publique",
    description: "Questions/reponses essentielles avant de rejoindre TENF.",
  },
];

export default function GuidePublicPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Guide Public
        </h1>
        <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          Le guide est maintenant decoupe en plusieurs pages. Choisis un onglet pour commencer.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guidePages.map((page) => (
            <article
              key={page.href}
              className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {page.title}
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {page.description}
              </p>
              <Link
                href={page.href}
                className="mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ouvrir la page
              </Link>
            </article>
          ))}
        </div>

        <Link href="/rejoindre" className="mt-8 inline-flex underline" style={{ color: "var(--color-primary)" }}>
          Retour a Rejoindre TENF
        </Link>
      </div>
    </main>
  );
}
