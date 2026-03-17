import Link from "next/link";

const sections = [
  {
    id: "premiere-connexion",
    title: "Premiere connexion",
    content:
      "A la premiere connexion, verifie ton profil et complete les informations de base. Cela permet a l'equipe et aux autres membres de mieux te connaitre.",
  },
  {
    id: "tableau-de-bord",
    title: "Tableau de bord",
    content:
      "Le tableau de bord centralise tes informations utiles: activites recentes, acces rapides et rappels. C'est le point d'entree principal de ton espace membre.",
  },
  {
    id: "fonctionnalites-principales",
    title: "Fonctionnalites principales",
    content:
      "Chaque fonctionnalite importante doit disposer de sa section dediee. Tu pourras y expliquer le but, les etapes d'utilisation et le resultat attendu.",
  },
  {
    id: "parametres-compte",
    title: "Parametres du compte",
    content:
      "Dans les parametres, mets a jour tes informations personnelles, tes preferences et tes options de notification pour adapter la plateforme a ton usage.",
  },
  {
    id: "deconnexion-securite",
    title: "Deconnexion / securite",
    content:
      "Deconnecte-toi apres utilisation sur appareil partage et applique les bonnes pratiques de securite (mot de passe fort, renouvellement, verification des acces).",
  },
  {
    id: "faq-membre",
    title: "FAQ membre",
    content:
      "La FAQ membre regroupe les incidents courants (acces, profil, permissions) et les solutions rapides avant de contacter le support.",
  },
];

export default function GuideEspaceMembrePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Guide Espace Membre
        </h1>
        <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          Parcours de reference pour les membres connectes a TENF.
        </p>

        <div
          className="mt-6 rounded-xl border p-3 sm:p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Onglets du guide
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border px-3 py-1.5 text-xs sm:text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-xl border p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <Link href="/rejoindre" className="mt-8 inline-flex underline" style={{ color: "var(--color-primary)" }}>
          Retour a Rejoindre TENF
        </Link>
      </div>
    </main>
  );
}
