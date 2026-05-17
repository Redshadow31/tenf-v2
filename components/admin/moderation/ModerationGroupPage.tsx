import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import ModerationStatusBadge from "@/components/admin/moderation/ModerationStatusBadge";
import {
  MODERATION_BASE,
  findGroup,
  getGroupsForView,
  resolveModerationModuleHref,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

type Props = {
  view: ModerationView;
  groupSlug: string;
};

/**
 * Page liste de modules d'un groupe (admin ou staff).
 * Dérive du `moderationTree` filtré selon la persona, et ignore les modules `legacy`.
 */
export default function ModerationGroupPage({ view, groupSlug }: Props) {
  const group = findGroup(groupSlug);
  if (!group) notFound();

  // Filtrer selon la persona de la vue
  const visibleGroup = getGroupsForView(view).find((g) => g.slug === group.slug);
  if (!visibleGroup) notFound();

  const breadcrumb = [
    { label: "Admin", href: "/admin" },
    { label: "Modération", href: MODERATION_BASE },
    {
      label: view === "admin" ? "Vue admin" : "Vue modérateur",
      href: view === "admin" ? MODERATION_BASE : `${MODERATION_BASE}/staff`,
    },
    { label: visibleGroup.label },
  ];

  return (
    <ModerationPageShell
      breadcrumb={breadcrumb}
      title={visibleGroup.label}
      description={visibleGroup.description}
      icon={Layers}
    >
      <ul className="grid gap-[clamp(0.5rem,0.7vw,0.75rem)] grid-cols-[repeat(auto-fit,minmax(min(17rem,100%),1fr))]">
        {visibleGroup.modules.map((mod) => {
          const href = resolveModerationModuleHref(view, visibleGroup.slug, mod.slug);
          return (
            <li key={mod.slug}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-2 rounded-[clamp(0.75rem,1vw,1rem)] border p-[clamp(0.75rem,1vw,1.1rem)] transition hover:border-violet-400/35 hover:bg-violet-500/8"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2
                    className="min-w-0 text-pretty font-bold tracking-tight text-white"
                    style={{ fontSize: "clamp(0.9rem,1.02vw,1.05rem)", lineHeight: 1.2 }}
                  >
                    {mod.label}
                  </h2>
                  <ModerationStatusBadge status={mod.status} size="sm" />
                </div>
                <p
                  className="flex-1 text-pretty leading-snug text-zinc-400"
                  style={{ fontSize: "clamp(0.74rem,0.82vw,0.84rem)" }}
                >
                  {mod.description}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-zinc-500 transition group-hover:text-violet-300"
                  style={{ fontSize: "clamp(0.7rem,0.78vw,0.78rem)" }}
                >
                  Ouvrir
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </ModerationPageShell>
  );
}
