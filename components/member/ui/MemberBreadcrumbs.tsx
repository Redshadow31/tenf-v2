"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  member: "Espace membre",
  dashboard: "Dashboard",
  planning: "Mon planning live",
  notifications: "Notifications",
  profil: "Mon profil",
  completer: "Compléter",
  modifier: "Modifier",
  raids: "Raids",
  declarer: "Déclarer",
  historique: "Historique",
  statistiques: "Statistiques",
  evenements: "Événements",
  inscriptions: "Inscriptions",
  presences: "Présences",
  objectifs: "Objectifs",
  progression: "Progression",
  activite: "Activité",
  academy: "Academy",
  postuler: "Postuler",
  parcours: "Parcours",
  formations: "Formations",
  validees: "Validées",
  evaluations: "Évaluations",
  parametres: "Paramètres",
  engagement: "Engagement",
  score: "Score",
  "a-decouvrir": "À découvrir",
  amis: "Amis",
};

function prettyLabel(segment: string): string {
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function MemberBreadcrumbs() {
  const pathname = usePathname() || "";
  if (!pathname.startsWith("/member")) return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, idx) => {
    const href = `/${parts.slice(0, idx + 1).join("/")}`;
    return { href, label: prettyLabel(part), isLast: idx === parts.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
      <Link href="/member/dashboard" className="rounded px-1 py-0.5 hover:opacity-80">
        Espace membre
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-1">
          <ChevronRight size={12} />
          {crumb.isLast ? (
            <span style={{ color: "var(--color-text)" }}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="rounded px-1 py-0.5 hover:opacity-80">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
