import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  ListChecks,
  MessagesSquare,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCircle2,
  Users,
} from "lucide-react";
import { getAventuraSummary } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

// ============================================================
// Sous-composants
// ============================================================
type IconType = React.ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

function StatCard({
  label,
  value,
  Icon,
  tone,
  hint,
}: {
  label: string;
  value: number;
  Icon: IconType;
  tone: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 30%, var(--color-border))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${tone} 10%, transparent), var(--color-card))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </p>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${tone} 22%, transparent)`,
          }}
          aria-hidden
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p
        className="mt-2 text-3xl font-extrabold tabular-nums"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </p>
      {hint ? (
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function QuickLinkCard({
  href,
  Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  Icon: IconType;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 30%, var(--color-border))`,
        backgroundColor: "var(--color-card)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{
          backgroundColor: `color-mix(in srgb, ${tone} 22%, transparent)`,
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-bold sm:text-base"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-xs leading-snug sm:text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {desc}
        </p>
        <span
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition group-hover:gap-2"
          style={{ color: tone }}
        >
          Ouvrir
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

const QUICK_LABEL: Record<string, { label: string; tone: string; emoji: string }> = {
  interested: { label: "Intéressé·e", tone: "#22c55e", emoji: "🙌" },
  more_info: { label: "Veut plus d'infos", tone: "#38bdf8", emoji: "📝" },
  maybe: { label: "Hésite", tone: "#a78bfa", emoji: "🤔" },
  not_for_me: { label: "Pas pour moi", tone: "#94a3b8", emoji: "🙏" },
};

// ============================================================
// Page admin
// ============================================================
export default async function AdminNewFamilyAventuraOverviewPage() {
  const summary = await getAventuraSummary();
  const total = Math.max(1, summary.total);
  const interestedPct = Math.round((summary.interested / total) * 100);
  const reviewedPct = summary.total > 0
    ? Math.round((summary.reviewed / summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: "rgba(145,70,255,0.35)",
          background:
            "linear-gradient(135deg, rgba(145,70,255,0.18), rgba(145,70,255,0.04))",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
              style={{
                backgroundColor: "rgba(145,70,255,0.22)",
                color: "#d8b4fe",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Admin · New Family Aventura
            </span>
            <h1
              className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Vue d&apos;ensemble du projet IRL
            </h1>
            <p
              className="max-w-2xl text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Suivi global de l&apos;intérêt communautaire et des signaux principaux. Utilise les raccourcis ci-dessous pour traiter les réponses, alimenter la galerie, et ajuster la page publique.
            </p>
          </div>
          <Link
            href="/new-family-aventura"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Voir la page publique
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total réponses"
          value={summary.total}
          Icon={Inbox}
          tone="#a78bfa"
          hint="Toutes intentions confondues"
        />
        <StatCard
          label="Intéressé·es"
          value={summary.interested}
          Icon={ThumbsUp}
          tone="#22c55e"
          hint={`${interestedPct}% du total`}
        />
        <StatCard
          label="Veulent + d'infos"
          value={summary.moreInfo}
          Icon={MessagesSquare}
          tone="#38bdf8"
        />
        <StatCard
          label="Hésitant·es"
          value={summary.maybe}
          Icon={HelpCircle}
          tone="#a78bfa"
        />
        <StatCard
          label="Pas pour moi"
          value={summary.notForMe}
          Icon={ThumbsDown}
          tone="#94a3b8"
        />
        <StatCard
          label="Traitées"
          value={summary.reviewed}
          Icon={CheckCircle2}
          tone="#f59e0b"
          hint={`${reviewedPct}% revues`}
        />
      </div>

      {/* Répartition par profil */}
      <section
        aria-labelledby="nfa-admin-profil-title"
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <h2
          id="nfa-admin-profil-title"
          className="mb-4 inline-flex items-center gap-2 text-lg font-bold sm:text-xl"
          style={{ color: "var(--color-text)" }}
        >
          <UserCircle2 className="h-5 w-5" aria-hidden />
          Répartition par profil
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <StatCard
            label="Créateurs"
            value={summary.byProfile.createur}
            Icon={Sparkles}
            tone="#f59e0b"
          />
          <StatCard
            label="Membres"
            value={summary.byProfile.membre}
            Icon={Users}
            tone="#a78bfa"
          />
          <StatCard
            label="Autres"
            value={summary.byProfile.autre}
            Icon={UserCircle2}
            tone="#94a3b8"
          />
        </div>
      </section>

      {/* Dernières réponses */}
      <section
        aria-labelledby="nfa-admin-latest-title"
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="nfa-admin-latest-title"
            className="inline-flex items-center gap-2 text-lg font-bold sm:text-xl"
            style={{ color: "var(--color-text)" }}
          >
            <ListChecks className="h-5 w-5" aria-hidden />
            Dernières réponses reçues
          </h2>
          <Link
            href="/admin/new-family-aventura/reponses-interet"
            className="inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2"
            style={{ color: "var(--color-primary)" }}
          >
            Tout voir
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {summary.latest.length === 0 ? (
          <div
            className="flex flex-col items-start gap-2 rounded-xl border p-4 text-sm"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Inbox className="h-5 w-5 opacity-70" aria-hidden />
            <p>Aucune réponse pour le moment. La page publique attend ses premiers signaux !</p>
          </div>
        ) : (
          <ul role="list" className="space-y-2">
            {summary.latest.map((item) => {
              const meta =
                QUICK_LABEL[item.quick_response] || {
                  label: item.quick_response,
                  tone: "#94a3b8",
                  emoji: "•",
                };
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className="text-lg">
                      {meta.emoji}
                    </span>
                    <span
                      className="truncate font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item.pseudo}
                    </span>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        borderColor: `color-mix(in srgb, ${meta.tone} 35%, var(--color-border))`,
                        backgroundColor: `color-mix(in srgb, ${meta.tone} 14%, transparent)`,
                        color: meta.tone,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Raccourcis admin */}
      <section
        aria-labelledby="nfa-admin-shortcuts-title"
        className="space-y-3"
      >
        <h2
          id="nfa-admin-shortcuts-title"
          className="text-sm font-bold uppercase tracking-[0.14em]"
          style={{ color: "rgba(216,180,254,0.9)" }}
        >
          Gestion du projet
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QuickLinkCard
            href="/admin/new-family-aventura/reponses-interet"
            Icon={Inbox}
            title="Réponses & intérêt"
            desc="Visualise, filtre et marque les réponses des membres comme traitées."
            tone="#22c55e"
          />
          <QuickLinkCard
            href="/admin/new-family-aventura/questions-preferences"
            Icon={MessagesSquare}
            title="Questions & préférences"
            desc="Réponds aux questions des membres et analyse leurs préférences."
            tone="#38bdf8"
          />
          <QuickLinkCard
            href="/admin/new-family-aventura/galerie-souvenirs"
            Icon={ImageIcon}
            title="Galerie souvenirs"
            desc="Ajoute, modifie ou retire les photos affichées sur la page publique."
            tone="#f59e0b"
          />
          <QuickLinkCard
            href="/admin/new-family-aventura/galerie-inspiration"
            Icon={Sparkles}
            title="Galerie inspiration"
            desc="Pilote le carrousel et la grille d'inspiration vus dans le hero."
            tone="#a78bfa"
          />
          <QuickLinkCard
            href="/admin/new-family-aventura/parametres-page"
            Icon={Settings}
            title="Paramètres de la page"
            desc="Active/désactive les sections, met à jour les textes et les CTAs."
            tone="#94a3b8"
          />
        </div>
      </section>
    </div>
  );
}
