import Link from "next/link";

const pages = [
  {
    title: "Guide Public",
    description:
      "Parcours pour les visiteurs : presentation rapide, creation de compte, connexion et FAQ publique.",
    href: "/rejoindre/guide-public",
  },
  {
    title: "Guide Espace Membre",
    description:
      "Parcours pour les membres connectes : premiere connexion, tableau de bord, fonctionnalites, parametres et securite.",
    href: "/rejoindre/guide-espace-membre",
  },
  {
    title: "Reunion d'integration",
    description: "Informations pratiques sur la reunion d'integration TENF.",
    href: "/rejoindre/reunion-integration",
  },
  {
    title: "FAQ / Comment rejoindre",
    description: "Questions frequentes sur l'integration et les etapes pour rejoindre TENF.",
    href: "/rejoindre/faq",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Rejoindre TENF
        </h1>
        <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          Selectionne le guide adapte a ton besoin pour suivre les bonnes etapes.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <article
              key={page.href}
              className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {page.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {page.description}
              </p>
              <Link
                href={page.href}
                className="mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ouvrir la page
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
