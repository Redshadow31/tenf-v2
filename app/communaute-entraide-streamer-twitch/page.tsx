import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Communaute entraide streamer Twitch | TENF",
  description:
    "Decouvre TENF, communaute d'entraide Twitch pour streamers: soutien live, evenements, visibilite et progression collective.",
  keywords: [
    "communaute entraide streamer",
    "communaute entraide twitch",
    "entraide streamers twitch",
    "discord entraide streamer",
    "communaute twitch francophone",
  ],
  alternates: {
    canonical: "https://tenf-community.com/communaute-entraide-streamer-twitch",
  },
  openGraph: {
    title: "Communaute entraide streamer Twitch | TENF",
    description:
      "TENF aide les streamers Twitch a gagner en visibilite, regularite et progression grace a l'entraide communautaire.",
    url: "https://tenf-community.com/communaute-entraide-streamer-twitch",
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Qu'est-ce qu'une communaute d'entraide streamer Twitch ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "C'est une communaute qui aide les createurs Twitch a progresser ensemble grace au soutien mutuel, aux lives, aux evenements et aux retours concrets.",
      },
    },
    {
      "@type": "Question",
      name: "Comment TENF aide les streamers ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TENF propose de la visibilite, des actions communautaires pendant les lives, des evenements et un cadre de progression pour structurer la croissance des createurs.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il etre streamer confirme pour rejoindre TENF ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. La communaute accompagne les profils debutants comme confirmes, avec une logique d'entraide et de progression collective.",
      },
    },
  ],
};

export default function CommunauteEntraideStreamerPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.14),rgba(14,15,23,0.9)_45%,rgba(56,189,248,0.08))] p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)]">
        <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Guide communaute Twitch</p>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          Communaute d'entraide streamer Twitch
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          TENF est une communaute francophone orientee entraide pour streamers Twitch. L'objectif est simple: aider
          chaque createur a gagner en regularite, en visibilite et en progression, sans rester seul.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="https://discord.gg/WnpazgcZHk"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-indigo-500/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400/80"
          >
            Rejoindre la communaute
          </Link>
          <Link
            href="/fonctionnement-tenf"
            className="rounded-xl border border-slate-500/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-300/40 hover:text-white"
          >
            Voir le fonctionnement
          </Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
          <h2 className="text-base font-semibold text-indigo-100">Soutien live</h2>
          <p className="mt-2 text-sm text-slate-300">
            Presence sur les lives, mise en avant des createurs et dynamique communautaire pour renforcer la visibilite.
          </p>
        </article>
        <article className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
          <h2 className="text-base font-semibold text-cyan-100">Evenements</h2>
          <p className="mt-2 text-sm text-slate-300">
            Sessions communautaires, operations Spotlight et activites qui creent de l'engagement autour des chaines.
          </p>
        </article>
        <article className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
          <h2 className="text-base font-semibold text-emerald-100">Progression</h2>
          <p className="mt-2 text-sm text-slate-300">
            Cadre de progression pour structurer les actions, suivre les objectifs et evoluer en continu.
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-6">
        <h2 className="text-xl font-semibold text-slate-100">FAQ rapide</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <p>
            <span className="font-semibold text-slate-100">Qui peut rejoindre ?</span> Tout streamer Twitch cherchant une
            communaute active et bienveillante.
          </p>
          <p>
            <span className="font-semibold text-slate-100">Quel est l'objectif principal ?</span> Aider les createurs a
            progresser ensemble via l'entraide, la visibilite et les actions communautaires.
          </p>
          <p>
            <span className="font-semibold text-slate-100">Ou voir les streamers actifs ?</span> Sur la page{" "}
            <Link href="/lives" className="text-indigo-200 underline underline-offset-2">
              lives
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

