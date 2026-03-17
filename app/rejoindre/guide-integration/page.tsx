import Link from "next/link";

export default function GuideIntegrationPage() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(145,70,255,0.25) 0%, rgba(145,70,255,0) 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 72%)" }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <section
          className="rounded-2xl border p-7 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-9"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-primary)" }}>
            Rejoindre TENF
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            Guide d integration TENF
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            La reunion d integration est l etape cle pour rejoindre pleinement la communaute TENF.
            C est un moment vocal d accueil, d echange et de clarte pour demarrer sereinement.
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Ce n est ni un examen, ni un jugement : juste une vraie mise en route.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span
              className="rounded-full border px-3 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Etape obligatoire
            </span>
            <span
              className="rounded-full border px-3 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Echange vocal en groupe
            </span>
            <span
              className="rounded-full border px-3 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Acces membre apres la reunion
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/integration"
              className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Choisir mon creneau maintenant
            </Link>
            <Link
              href="/rejoindre"
              className="inline-flex rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Voir les autres guides
            </Link>
          </div>
        </section>

        <section
          className="mt-5 rounded-xl border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            L etat d esprit TENF
          </h2>
          <p className="text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Chez TENF, pas de promesse vide. Tu rejoins une communaute qui s implique vraiment,
            avec des membres qui avancent ensemble.
          </p>
          <Link
            href="/integration"
            className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Voir les creneaux disponibles
          </Link>
        </section>

        <section
          className="mt-8 rounded-xl border p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Comment se passe la reunion
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div
              className="rounded-lg border p-4 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Etape 1
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Accueil du groupe, presentation rapide et rappel du cadre.
              </p>
            </div>
            <div
              className="rounded-lg border p-4 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Etape 2
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Explication du systeme d entraide, des regles et des bonnes pratiques.
              </p>
            </div>
            <div
              className="rounded-lg border p-4 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Etape 3
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Questions/reponses, puis activation de ton integration officielle.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article
            className="rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              1. Comprendre le serveur
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              TENF fonctionne avec une entraide active entre streamers. On t explique comment soutenir, progresser
              et mettre ta chaine en avant intelligemment.
            </p>
          </article>

          <article
            className="rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              2. Creer un vrai lien humain
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              La reunion met une voix sur les pseudos, cree un premier contact avec le staff et te permet de poser
              toutes tes questions dans un cadre simple.
            </p>
          </article>

          <article
            className="rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              3. Garder une communaute saine
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Cette etape confirme les regles, les valeurs d entraide et la bonne participation de chacun.
              On evite les malentendus, les abus et les ghost members.
            </p>
          </article>
        </section>

        <section
          className="mt-8 rounded-xl border p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Ce que tu debloques apres la reunion
          </h2>
          <ul className="mt-4 grid gap-2 text-sm sm:text-base">
            <li className="flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Integration officielle dans TENF
            </li>
            <li className="flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Acces aux salons de promotion
            </li>
            <li className="flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Participation aux points et recompenses
            </li>
            <li className="flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <span className="mt-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
              Statut de membre actif de l entraide
            </li>
          </ul>
        </section>

        <section
          className="mt-8 rounded-2xl border p-7 text-center shadow-[0_10px_35px_rgba(0,0,0,0.35)] sm:p-8"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Pret(e) a rejoindre l aventure ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Selectionne ton creneau de reunion pour finaliser ton entree dans la communaute TENF.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/integration"
              className="inline-flex rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Je reserve mon creneau
            </Link>
            <span className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Reservation rapide en quelques clics
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
