import Link from "next/link";
import { ArrowUpRight, BookOpen, HelpCircle, Link2, Sparkles, UserPlus } from "lucide-react";

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

const guidePages = [
  {
    title: "Presentation rapide",
    href: "/rejoindre/guide-public/presentation-rapide",
    description: "Vue d'ensemble des categories publiques et du menu principal.",
    icon: BookOpen,
    badge: "Base",
    accent: "#06b6d4",
  },
  {
    title: "Creer un compte",
    href: "/rejoindre/guide-public/creer-un-compte",
    description: "Tutoriel concret pour creer son espace TENF via Discord.",
    icon: UserPlus,
    badge: "Demarrage",
    accent: "#9146ff",
  },
  {
    title: "Liaison Twitch",
    href: "/rejoindre/guide-public/liaison-twitch",
    description: "Connecter Twitch pour debloquer les fonctionnalites membre.",
    icon: Link2,
    badge: "Activation",
    accent: "#f59e0b",
  },
  {
    title: "FAQ publique",
    href: "/rejoindre/guide-public/faq-publique",
    description: "Questions/reponses essentielles avant de rejoindre TENF.",
    icon: HelpCircle,
    badge: "Support",
    accent: "#ec4899",
  },
];

export default function GuidePublicPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10"
          style={{
            borderColor: "rgba(145, 70, 255, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-card)) 0%, var(--color-card) 45%, color-mix(in srgb, #06b6d4 12%, var(--color-card)) 100%)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(145, 70, 255, 0.25)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(6, 182, 212, 0.2)" }}
          />
          <div className="relative">
            <p
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
            >
              <Sparkles size={14} /> Rejoindre TENF
            </p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Guide Public
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              Le guide est maintenant decoupe en plusieurs pages. Choisis ton parcours pour comprendre TENF, creer ton
              espace et activer rapidement les fonctionnalites utiles.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Lecture", value: "4 pages" },
            { label: "Niveau", value: "Debutant" },
            { label: "Acces", value: "Public" },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guidePages.map((page) => (
            <article
              key={page.href}
              className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderColor: hexToRgba(page.accent, 0.26),
                background:
                  `linear-gradient(160deg, color-mix(in srgb, var(--color-card) 90%, ${hexToRgba(page.accent, 0.25)}), var(--color-card))`,
                boxShadow: "0 10px 22px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ borderColor: hexToRgba(page.accent, 0.45), color: hexToRgba(page.accent, 0.96) }}
                  >
                    {page.badge}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {page.title}
                  </h2>
                </div>
                <div
                  className="rounded-xl border p-2.5"
                  style={{
                    borderColor: hexToRgba(page.accent, 0.35),
                    backgroundColor: hexToRgba(page.accent, 0.15),
                  }}
                >
                  <page.icon size={18} style={{ color: hexToRgba(page.accent, 0.96) }} />
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {page.description}
              </p>
              <Link
                href={page.href}
                className="mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-[1px]"
                style={{ borderColor: hexToRgba(page.accent, 0.45), color: hexToRgba(page.accent, 0.96) }}
              >
                Ouvrir la page <ArrowUpRight size={14} />
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
