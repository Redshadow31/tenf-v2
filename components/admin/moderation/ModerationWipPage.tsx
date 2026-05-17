import Link from "next/link";
import { ArrowLeft, Clock, Compass, Sparkles } from "lucide-react";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import type { ModerationBreadcrumbItem } from "@/components/admin/moderation/ModerationBreadcrumb";
import type { ModerationModule, ModerationStatus } from "@/lib/moderation/moderationTree";

type Props = {
  breadcrumb: ModerationBreadcrumbItem[];
  module: ModerationModule;
  /** Lien de retour vers le hub modération (vue admin ou staff). */
  backHref: string;
  backLabel?: string;
  /** Lien vers le module frère équivalent dans l'autre vue, optionnel. */
  altViewHref?: string;
  altViewLabel?: string;
};

const STATUS_HINT: Record<ModerationStatus, string> = {
  active: "Cette page est active. Si tu vois cet écran, contacte l'équipe technique.",
  wip: "Ce module est en construction. Les fonctionnalités décrites arriveront dans une prochaine itération.",
  placeholder:
    "Ce module est prévu mais pas encore branché. Il est listé ici pour préparer l'arborescence finale.",
};

/**
 * Écran standardisé pour les modules non encore branchés.
 * - Pas de texte technique du type "Module prêt pour l'intégration métier".
 * - Explique à qui le module sert, ce qui est prévu, et propose un retour clair.
 */
export default function ModerationWipPage({
  breadcrumb,
  module,
  backHref,
  backLabel = "Retour au centre",
  altViewHref,
  altViewLabel,
}: Props) {
  return (
    <ModerationPageShell
      breadcrumb={breadcrumb}
      title={module.longLabel || module.label}
      description={module.description}
      icon={Clock}
      status={module.status}
      audienceLabel={describeAudience(module.persona)}
    >
      <div className="grid gap-[clamp(0.65rem,1vw,1rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <section
          className="rounded-xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        >
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Ce qui est prévu
          </p>
          <p
            className="mt-2 max-w-[70ch] text-pretty leading-relaxed text-zinc-200"
            style={{ fontSize: "clamp(0.82rem,0.92vw,0.95rem)" }}
          >
            {STATUS_HINT[module.status]}
          </p>
          {module.keywords?.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {module.keywords.map((kw) => (
                <li
                  key={kw}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {kw}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside
          className="rounded-xl border p-[clamp(0.85rem,1.1vw,1.2rem)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
            Repères
          </p>
          <ul className="mt-2 space-y-1.5 text-[clamp(0.78rem,0.88vw,0.88rem)] text-zinc-300">
            <li>
              <strong className="text-white">Audience cible :</strong>{" "}
              {describeAudience(module.persona)}
            </li>
            <li>
              <strong className="text-white">Statut :</strong>{" "}
              {module.status === "wip" ? "En préparation" : "Bientôt"}
            </li>
            {module.hint ? (
              <li>
                <strong className="text-white">Note :</strong> {module.hint}
              </li>
            ) : null}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={backHref}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[clamp(0.74rem,0.82vw,0.82rem)] font-semibold text-zinc-100 transition hover:border-violet-400/35 hover:bg-violet-500/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {backLabel}
            </Link>
            {altViewHref && altViewLabel ? (
              <Link
                href={altViewHref}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[clamp(0.74rem,0.82vw,0.82rem)] font-semibold text-violet-100 transition hover:border-violet-300/55 hover:bg-violet-500/20"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden />
                {altViewLabel}
              </Link>
            ) : null}
          </div>
        </aside>
      </div>
    </ModerationPageShell>
  );
}

function describeAudience(persona: ModerationModule["persona"]): string {
  switch (persona) {
    case "admin":
      return "Admin coordination";
    case "staff":
      return "Modérateurs";
    case "both":
    default:
      return "Admin & modérateurs";
  }
}
