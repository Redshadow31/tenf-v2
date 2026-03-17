import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const menuCategories = [
  "UPA Events: association et Discord partenaire, organisant des événements caritatifs entre streamers et promouvant l'entraide.",
  "Boutique TENF : découvrez le merch officiel de la communauté. Aucun achat n'est obligatoire, mais chaque soutien contribue à financer les bots, les outils et les événements TENF.",
  "La communauté : découvrez TENF à travers ses pages de présentation - fonctionnement, équipe, partenaires et témoignages des membres pour mieux comprendre l'esprit et l'organisation du serveur.",
  "Découvrir les créateurs : explore les membres actifs et engagés de TENF à travers leur fiche de présentation, les lives en cours et le calendrier des streams à venir.",
  "Événements : découvrez le calendrier des événements TENF, les mises en avant de lives et les projets spéciaux comme la New Family Aventura.",
  "Rejoindre TENF : toutes les informations pour intégrer la communauté, participer à la réunion d'intégration et consulter les guides et la FAQ.",
];

const publicCategories = [
  {
    title: "Decouvrir TENF",
    description: "Comprendre la mission, le fonctionnement et l'univers de la communaute.",
  },
  {
    title: "Explorer la communaute",
    description: "Voir les membres, les lives et les evenements accessibles sans connexion.",
  },
  {
    title: "S'informer avant de rejoindre",
    description: "Retrouver les pages d'aide, les etapes d'integration et les reponses frequentes.",
  },
];

const publicPages = [
  { href: "/", label: "Accueil", category: "Découvrir TENF" },
  { href: "/a-propos", label: "A propos de TENF", category: "Découvrir TENF" },
  { href: "/fonctionnement-tenf", label: "Fonctionnement TENF", category: "Découvrir TENF" },
  { href: "/membres", label: "Membres", category: "Explorer la communaute" },
  { href: "/lives", label: "Lives", category: "Explorer la communaute" },
  { href: "/events2", label: "Calendrier / evenements", category: "Explorer la communaute" },
  { href: "/integration", label: "Integration", category: "S'informer avant de rejoindre" },
  { href: "/rejoindre/reunion-integration", label: "Reunion d'integration", category: "S'informer avant de rejoindre" },
  { href: "/rejoindre/faq", label: "FAQ / comment rejoindre", category: "S'informer avant de rejoindre" },
];

export default function GuidePublicPresentationRapidePage() {
  const accent = "#06b6d4";

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 55%, var(--color-card)) 0%, var(--color-card) 60%, color-mix(in srgb, var(--color-primary) 12%, var(--color-card)) 100%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.22) }} />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: hexToRgba(accent, 0.4), color: "var(--color-text)" }}>
              <Sparkles size={14} /> Guide Public
            </p>
            <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              <BookOpen size={26} style={{ color: hexToRgba(accent, 0.95) }} />
              Presentation rapide
            </h1>
          </div>
          <div className="mt-4 space-y-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            <p>TENF (Twitch Entraide New Family) est une communauté Discord d'entraide entre streamers Twitch.</p>
            <p>
              Son objectif principal est d'aider les créateurs à se développer grâce à un système structuré basé sur
              le soutien mutuel, les échanges, les formations et l'implication de chacun.
            </p>
            <p>
              Les membres participent à la vie du serveur (présence en live, interactions, entraide), ce qui leur
              permet de gagner des points et d'évoluer dans la communauté. Un staff formé encadre le tout, avec des
              rôles clairs et un suivi régulier.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Comprendre le menu du haut
          </h2>
          <div className="mt-3 grid gap-2">
            {menuCategories.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg)" }}>
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Categories des pages publiques (hors connexion)
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {publicCategories.map((category) => (
              <article key={category.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {category.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {category.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Pages publiques a consulter
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Ces pages sont accessibles sans connexion et permettent de comprendre TENF, d'explorer la communaute et de preparer ton integration.
          </p>
          <div className="mt-3 space-y-2">
            {publicPages.map((page) => (
              <div
                key={page.href}
                className="flex flex-col gap-1 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wide sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {page.category}
                </span>
                <Link href={page.href} className="text-sm font-semibold underline" style={{ color: "var(--color-primary)" }}>
                  {page.label}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
