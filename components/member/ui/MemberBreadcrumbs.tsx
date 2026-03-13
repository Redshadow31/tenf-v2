"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  member: "Espace membre",
  dashboard: "Dashboard",
  planning: "Planning TENF",
  notifications: "Notifications",
  profil: "Mon profil",
  completer: "Completer",
  modifier: "Modifier",
  raids: "Raids",
  declarer: "Declarer",
  historique: "Historique",
  statistiques: "Statistiques",
  evenements: "Evenements",
  inscriptions: "Inscriptions",
  presences: "Presences",
  objectifs: "Objectifs",
  progression: "Progression",
  activite: "Activite",
  academy: "Academy",
  postuler: "Postuler",
  parcours: "Parcours",
  formations: "Formations",
  validees: "Validees",
  evaluations: "Evaluations",
  parametres: "Parametres",
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
