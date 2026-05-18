import Link from "next/link";
import { ArrowRight, HeartPulse, Info, ScrollText } from "lucide-react";
import { PARTENARIATS_ACCENT } from "../_data";

const LINKS = [
  {
    href: "/charte",
    title: "Charte communautaire",
    description: "Les valeurs et règles qui guident chaque partenariat TENF.",
    icon: ScrollText,
    accent: "#6366f1",
  },
  {
    href: "/a-propos",
    title: "À propos de TENF",
    description: "Mieux nous connaître avant d'envoyer une proposition.",
    icon: Info,
    accent: "#22c55e",
  },
  {
    href: "/partenaire-tenf",
    title: "Bilan TENF × UPA",
    description: "Le bilan complet de la première édition commune au profit de la Ligue contre le cancer.",
    icon: HeartPulse,
    accent: "#ef4444",
  },
] as const;

export default function MoreLinks() {
  return (
    <section className="about-fade-up home-section scroll-mt-28">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/[0.06] p-5 sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${PARTENARIATS_ACCENT}10 0%, color-mix(in srgb, var(--color-card) 94%, transparent) 100%)`,
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${PARTENARIATS_ACCENT}66, transparent)` }}
          aria-hidden
        />
        <p
          className="text-xs font-bold uppercase tracking-[0.16em]"
          style={{ color: PARTENARIATS_ACCENT }}
        >
          Pour aller plus loin
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group about-reveal flex h-full flex-col gap-3 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 sm:p-5"
                style={{
                  borderColor: "rgba(148,163,184,0.2)",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)",
                }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06]"
                  style={{ backgroundColor: `${link.accent}18`, color: link.accent }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center justify-between gap-2 text-sm font-bold sm:text-base">
                    {link.title}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70"
                      style={{ color: link.accent }}
                      aria-hidden
                    />
                  </h3>
                  <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
