import Link from "next/link";
import { ArrowRight, CircleDot, HeartHandshake, ShieldCheck, Workflow } from "lucide-react";

export default function OrganisationStaffPage() {
  const governanceCards = [
    {
      title: "Fondateurs",
      text: "Les fondateurs definissent la vision globale de TENF, les orientations de la communaute et les projets a long terme. Ils assurent aussi la coherence entre les poles et veillent au developpement de la communaute.",
    },
    {
      title: "Administration & coordination",
      text: "L'equipe d'administration coordonne les activites du serveur, assure le lien entre les poles et suit le bon deroulement des projets communautaires.",
    },
  ];

  const moderationCards = [
    {
      title: "Moderateurs actifs",
      text: "Les moderateurs actifs assurent le respect des regles, l'accompagnement des membres et le bon fonctionnement quotidien de la communaute.",
    },
    {
      title: "Moderateurs en formation",
      text: "Les moderateurs en formation sont accompagnes progressivement pour apprendre les bases de la moderation et monter en competence.",
    },
    {
      title: "Moderateurs en pause",
      text: "Les moderateurs en pause restent lies a la communaute, mais ne participent pas a la moderation active pendant cette periode. Ce statut reconnait leur engagement tout en respectant leur disponibilite.",
    },
  ];

  const supportBullets = [
    "a l'entraide entre streamers",
    "au soutien des differents poles",
    "a l'organisation de projets et d'evenements",
    "a l'accompagnement des membres et des nouveaux arrivants",
  ];

  const poles = [
    {
      title: "Pole Animation & Evenements",
      icon: "🩷",
      accent: "#ec4899",
      text: "Ce pole tient les plannings, coordonne les animations et organise les temps forts communautaires pour renforcer les liens entre les membres.",
    },
    {
      title: "Pole Communication & Visuels",
      icon: "🟦",
      accent: "#3b82f6",
      text: "Ce pole gere l'image de TENF sur Discord, le site, les reseaux sociaux et les contenus video. Le design du site reste gere a part.",
    },
    {
      title: "Pole Formation & Coordination Membres",
      icon: "🟨",
      accent: "#eab308",
      text: "Ce pole organise les formations membres, coordonne les sessions d'apprentissage et suit les tickets lies a l'accompagnement communautaire.",
    },
    {
      title: "Pole Formation & Coordination Staff",
      icon: "🟨",
      accent: "#f59e0b",
      text: "Ce pole accompagne l'equipe de moderation via les formations staff, le suivi des pratiques et le maintien du cadre de moderation.",
    },
    {
      title: "Pole Technique & Bots",
      icon: "🟪",
      accent: "#a855f7",
      text: "Ce pole gere les permissions Discord, les bots, les automatisations et la maintenance du site web afin d'assurer la stabilite des outils.",
    },
    {
      title: "Pole Accueil & Integration",
      icon: "🟧",
      accent: "#f97316",
      text: "Ce pole organise l'accueil, les reunions d'integration et l'accompagnement des nouveaux membres pour faciliter leur inclusion dans TENF.",
    },
  ];

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14"
          style={{
            borderColor: "var(--color-border)",
            background:
              "radial-gradient(120% 130% at 10% 0%, rgba(59,130,246,0.2), rgba(15,23,42,0.15) 40%, rgba(2,6,23,0.75) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)" }}
          />
          <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-primary)" }}>
            Structure communautaire TENF
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
            Organisation de la communaute TENF
          </h1>
          <p className="mt-4 max-w-4xl leading-7" style={{ color: "var(--color-text-secondary)" }}>
            TENF fonctionne grace a une organisation structuree composee d'une equipe de benevoles engages. Chaque pole
            contribue au bon fonctionnement de la communaute, a l'entraide entre streamers et a l'organisation des projets
            collectifs.
          </p>
          <p className="mt-3 max-w-4xl leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Cette organisation permet a la communaute de grandir tout en conservant un cadre bienveillant et collaboratif.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Gouvernance
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Direction de la communaute
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 gap-4">
            {governanceCards.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <CircleDot size={16} style={{ color: "var(--color-primary)" }} />
                  {item.title}
                </h3>
                <p className="mt-2 leading-7" style={{ color: "var(--color-text-secondary)" }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Encadrement
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Equipe de moderation
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 gap-4">
            {moderationCards.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <ShieldCheck size={16} style={{ color: "var(--color-primary)" }} />
                  {item.title}
                </h3>
                <p className="mt-2 leading-7" style={{ color: "var(--color-text-secondary)" }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(34,197,94,0.35)",
            background:
              "linear-gradient(135deg, rgba(22,163,74,0.14), rgba(15,23,42,0.85) 35%, rgba(2,6,23,0.95) 100%)",
          }}
        >
          <p
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border"
            style={{ borderColor: "rgba(34,197,94,0.45)", color: "#86efac", backgroundColor: "rgba(34,197,94,0.1)" }}
          >
            <HeartHandshake size={14} />
            Soutien communautaire
          </p>
          <h2 className="text-2xl font-semibold mt-3" style={{ color: "var(--color-text)" }}>
            Soutien TENF
          </h2>
          <p className="mt-3 leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Le role Soutien TENF regroupe des membres particulierement impliques dans la communaute. Il peut s'agir
            d'anciens moderateurs ou de membres actifs qui souhaitent continuer a soutenir TENF sans exercer un role de
            moderation active.
          </p>
          <ul className="mt-4 space-y-2" style={{ color: "var(--color-text-secondary)" }}>
            {supportBullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "#86efac" }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Ce role est clairement distinct de la moderation active et represente un pilier important de la dynamique
            communautaire.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Organisation interne
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Les poles de fonctionnement TENF
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 gap-4">
            {poles.map((pole) => (
              <article
                key={pole.title}
                className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                style={{
                  borderColor: `${pole.accent}66`,
                  background: `linear-gradient(135deg, ${pole.accent}22, rgba(15,23,42,0.92) 45%, rgba(2,6,23,0.95) 100%)`,
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <span>{pole.icon}</span>
                  <span>{pole.title}</span>
                </h3>
                <p className="mt-2 leading-7" style={{ color: "var(--color-text-secondary)" }}>
                  {pole.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <Workflow size={18} style={{ color: "var(--color-primary)" }} />
            Fonctionnement collaboratif
          </h2>
          <p className="mt-3 leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Chaque pole travaille en lien avec les autres afin de maintenir une communaute dynamique, structuree et
            bienveillante. Cette organisation permet a TENF de developper des projets communautaires tout en offrant un
            cadre stable aux createurs et aux membres.
          </p>
        </section>

        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(120deg, rgba(59,130,246,0.2), rgba(2,6,23,0.92) 45%, rgba(124,58,237,0.22) 100%)",
          }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Rejoindre une communaute structuree
          </h2>
          <p className="mt-3 leading-7 max-w-4xl" style={{ color: "var(--color-text-secondary)" }}>
            TENF repose avant tout sur l'engagement de ses membres. Les personnes actives et impliquees peuvent etre amenees
            a participer aux projets communautaires et a soutenir les differents poles au fil du temps.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/organisation-staff/organigramme"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              Voir l'organigramme staff
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/a-propos"
              className="rounded-xl px-5 py-2 text-sm font-semibold border transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Decouvrir la communaute
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
