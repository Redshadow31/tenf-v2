"use client";

import Link from "next/link";

const DONATION_URL = "https://pots.lydia.me/collect/pots?id=16729-tenf";

const USAGE_CARDS = [
  {
    emoji: "🤖",
    title: "Bots & automatisations",
    text: "Abonnements premium et maintenance des outils qui simplifient la vie du serveur.",
  },
  {
    emoji: "🌐",
    title: "Site web TENF",
    text: "Hébergement, évolutions et nouvelles fonctionnalités pour l’espace communautaire en ligne.",
  },
  {
    emoji: "🎉",
    title: "Événements communautaires",
    text: "Moments partagés, organisation et projets qui rassemblent la New Family.",
  },
  {
    emoji: "🗺️",
    title: "Projets IRL",
    text: "Initiatives comme New Family Aventura et autres aventures portées par la communauté.",
  },
  {
    emoji: "📋",
    title: "Outils d’organisation",
    text: "Services utiles au staff et aux membres pour garder TENF clair, accueillant et durable.",
  },
];

export default function SoutenirTenfContent() {
  return (
    <main
      className="min-h-screen p-4 sm:p-6 pb-16"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, rgba(139,92,246,0.22) 0%, rgba(10,10,13,0.95) 40%, rgba(6,6,8,1) 100%)",
      }}
    >
      <div className="mx-auto max-w-4xl space-y-10">
        <section
          className="relative overflow-hidden rounded-2xl border p-6 md:p-10 reveal-card"
          style={{ borderColor: "rgba(139,92,246,0.55)", backgroundColor: "rgba(14,14,20,0.9)" }}
        >
          <div
            className="absolute -top-16 -right-10 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(139,92,246,0.24)" }}
          />
          <div
            className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(167,139,250,0.12)" }}
          />

          <div className="relative z-10 space-y-5 text-center">
            <p
              className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
              style={{ color: "#f2e8ff", borderColor: "rgba(139,92,246,0.6)" }}
            >
              SOUTIEN COMMUNAUTAIRE
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl" style={{ color: "#f7f5ff" }}>
              Soutenir TENF
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: "#d5c9ef" }}>
              Un geste libre pour faire grandir la New Family
            </p>
          </div>
        </section>

        <section
          className="space-y-4 rounded-2xl border p-6 md:p-8 reveal-card"
          style={{ backgroundColor: "rgba(18,18,25,0.95)", borderColor: "rgba(139,92,246,0.4)" }}
        >
          <h2 className="text-xl font-bold md:text-2xl" style={{ color: "#ffffff" }}>
            Un soutien qui reste un choix
          </h2>
          <p className="leading-relaxed" style={{ color: "#cdc6de" }}>
            Les dons sont entièrement facultatifs : ils ne remplacent jamais votre présence ni votre participation.
            Ils permettent, pour celles et ceux qui le souhaitent, d’accompagner la croissance de{" "}
            <strong style={{ color: "#e8ddff" }}>Twitch Entraide New Family</strong> dans la durée — sans pression,
            sans obligation, avec gratitude pour chaque geste, grand ou petit.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#a89fc4" }}>
            Ce n’est pas un achat : il n’y a pas de « produit » ni de contrepartie promise en échange d’un don.{" "}
            <Link href="/boutique" className="underline decoration-violet-400/60 underline-offset-2 hover:opacity-90">
              La boutique
            </Link>{" "}
            reste l’endroit pour les articles et goodies ; cette page est dédiée au soutien financier volontaire.
          </p>
        </section>

        <section
          className="space-y-5 rounded-2xl border p-6 md:p-8 reveal-card"
          style={{ backgroundColor: "rgba(16,16,24,0.95)", borderColor: "rgba(139,92,246,0.35)" }}
        >
          <h2 className="text-xl font-bold md:text-2xl" style={{ color: "#ffffff" }}>
            Pourquoi soutenir TENF ?
          </h2>
          <p className="leading-relaxed" style={{ color: "#cdc6de" }}>
            Les contributions volontaires peuvent aider à financer des besoins concrets qui font tourner la communauté
            au quotidien :
          </p>
          <ul className="list-inside list-disc space-y-2 pl-1 leading-relaxed marker:text-violet-400" style={{ color: "#d8cfea" }}>
            <li>les bots premium et leur maintenance ;</li>
            <li>le site web TENF, ses outils et ses améliorations ;</li>
            <li>les événements communautaires ;</li>
            <li>les projets TENF comme New Family Aventura ;</li>
            <li>les services et outils utiles à l’organisation du serveur.</li>
          </ul>
        </section>

        <section className="space-y-5 reveal-card" aria-labelledby="philosophie-heading">
          <h2 id="philosophie-heading" className="text-xl font-bold md:text-2xl" style={{ color: "#ffffff" }}>
            Notre philosophie
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Aucune obligation",
                text: "Votre place vaut déjà énormément. Un don ne définit ni votre valeur ni votre appartenance.",
              },
              {
                title: "Transparence totale",
                text: "Nous expliquons à quoi peuvent servir les dons, sans promesse individuelle ni avantage garanti.",
              },
              {
                title: "Pour la communauté, par la communauté",
                text: "TENF vit grâce aux membres ; les soutiens financiers ne font qu’aider à porter des projets collectifs.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border p-5 hover-scale-soft min-h-[140px]"
                style={{ borderColor: "rgba(139,92,246,0.4)", backgroundColor: "rgba(17,17,24,0.95)" }}
              >
                <h3 className="text-base font-bold" style={{ color: "#e8ddff" }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#bfb7cf" }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 reveal-card">
          <h2 className="text-xl font-bold md:text-2xl" style={{ color: "#ffffff" }}>
            À quoi servent les dons ?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {USAGE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border p-5 hover-scale-soft min-h-[120px]"
                style={{ borderColor: "rgba(139,92,246,0.38)", backgroundColor: "rgba(14,14,20,0.92)" }}
              >
                <p className="text-lg font-semibold" style={{ color: "#f7f5ff" }}>
                  <span className="mr-2" aria-hidden>
                    {card.emoji}
                  </span>
                  {card.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#c9c0dc" }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border p-8 text-center reveal-card md:p-10"
          style={{ backgroundColor: "rgba(20,16,28,0.95)", borderColor: "rgba(139,92,246,0.45)" }}
        >
          <h2 className="text-xl font-bold md:text-2xl" style={{ color: "#ffffff" }}>
            Envie de contribuer ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed md:text-base" style={{ color: "#cdc6de" }}>
            Le paiement est traité par Lydia dans un nouvel onglet. Vous choisissez le montant qui vous convient — ou
            vous fermez simplement l’onglet si ce n’est pas le bon moment.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white transition-transform hover:scale-[1.02] sm:w-auto"
              style={{ backgroundColor: "#8B5CF6", boxShadow: "0 8px 28px rgba(139,92,246,0.35)" }}
            >
              Faire un don sécurisé
            </a>
            <Link
              href="/boutique"
              className="text-sm transition-opacity hover:opacity-90"
              style={{ color: "#c8b3ff" }}
            >
              ← Retour à la boutique
            </Link>
          </div>
        </section>

        <section
          className="rounded-2xl border p-6 md:p-8 reveal-card"
          style={{ backgroundColor: "rgba(18,18,25,0.92)", borderColor: "rgba(167,139,250,0.25)" }}
        >
          <h2 className="text-lg font-bold md:text-xl" style={{ color: "#f4efff" }}>
            Merci, vraiment
          </h2>
          <p className="mt-3 leading-relaxed" style={{ color: "#d5cce8" }}>
            Le plus beau soutien, c’est déjà votre bienveillance au quotidien : être là, échanger, accueillir les
            nouveaux et faire vivre l’entraide. Si vous donnez en plus, nous en sommes touchés ; si vous ne pouvez pas,
            vous restez tout aussi précieux pour TENF.
          </p>
        </section>
      </div>

      <style jsx>{`
        .reveal-card {
          animation: revealUp 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .hover-scale-soft {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .hover-scale-soft:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
        }
        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .reveal-card {
            animation: none;
          }
          .hover-scale-soft {
            transition: none;
          }
          .hover-scale-soft:hover {
            transform: none;
            box-shadow: none;
          }
        }
      `}</style>
    </main>
  );
}
