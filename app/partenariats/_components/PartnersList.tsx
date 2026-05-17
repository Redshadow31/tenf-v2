import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarHeart,
  ExternalLink,
  HeartHandshake,
  Server,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  PARTNERS,
  PARTNER_STATUS_LABELS,
  type PartnerCategory,
  type PartnerHighlight,
  type PartnerStatus,
} from "../partners";
import SectionHeader from "./SectionHeader";

const CATEGORY_ICONS: Record<PartnerCategory, typeof HeartHandshake> = {
  association: Building2,
  serveur: Server,
  evenement: CalendarHeart,
  createur: Sparkles,
  outil: Wrench,
};

const STATUS_ACCENT: Record<PartnerStatus, string> = {
  actif: "#22c55e",
  termine: "var(--color-primary)",
  ponctuel: "#f59e0b",
  historique: "#8b5cf6",
};

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  association: "Association",
  serveur: "Serveur",
  evenement: "Événement",
  createur: "Créateur",
  outil: "Outil",
};

export default function PartnersList() {
  const partners = PARTNERS;
  const hasPartners = partners.length > 0;

  return (
    <section id="partenaires" className="about-fade-up home-section scroll-mt-28 space-y-5">
      <SectionHeader
        kicker="7. Partenaires actuels et passés"
        title="Avec qui on a collaboré"
        lead="Cette liste est volontairement courte et n'affiche que des partenariats réellement engagés. Elle évolue à chaque nouvelle collaboration confirmée."
      />

      {!hasPartners && (
        <p className="home-muted text-sm leading-relaxed sm:text-base">
          D&apos;autres collaborations sont en cours de discussion — elles seront affichées ici une fois confirmées.
        </p>
      )}

      {hasPartners && (
        <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {partners.map((partner) => (
            <li key={partner.slug} className="contents">
              <PartnerCard partner={partner} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PartnerCard({ partner }: { partner: PartnerHighlight }) {
  const Icon = CATEGORY_ICONS[partner.category] ?? HeartHandshake;
  const accent = STATUS_ACCENT[partner.status];

  return (
    <article
      className="about-reveal home-member-card flex h-full flex-col gap-3 rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: partner.featured
          ? "color-mix(in srgb, var(--color-primary) 32%, var(--color-border))"
          : "var(--color-border)",
        backgroundColor: partner.featured
          ? "color-mix(in srgb, var(--color-primary) 5%, var(--color-card))"
          : "var(--color-card)",
      }}
    >
      <div className="flex items-start gap-3">
        {partner.logoUrl ? (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Image src={partner.logoUrl} alt={`Logo ${partner.name}`} width={48} height={48} />
          </span>
        ) : (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
            aria-hidden
          >
            <Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={2.25} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight sm:text-lg">{partner.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-text-secondary) 14%, transparent)",
                color: "var(--color-text-secondary)",
              }}
            >
              {CATEGORY_LABELS[partner.category]}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                color: accent,
              }}
            >
              {PARTNER_STATUS_LABELS[partner.status]}
            </span>
          </div>
        </div>
      </div>

      <p className="home-muted text-sm leading-relaxed">{partner.tagline}</p>

      {partner.summary ? (
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
          {partner.summary}
        </p>
      ) : null}

      {partner.result ? (
        <p
          className="rounded-xl border p-3 text-sm font-semibold leading-relaxed"
          style={{
            borderColor: `color-mix(in srgb, ${accent} 30%, var(--color-border))`,
            backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)`,
            color: "var(--color-text)",
          }}
        >
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
            Résultat
          </span>
          {partner.result}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        {partner.internalPath ? (
          <Link
            href={partner.internalPath}
            className="home-link-accent inline-flex items-center gap-1 text-sm font-semibold"
          >
            Voir la page dédiée <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
        {partner.url ? (
          <a
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Site externe <ExternalLink size={12} aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
