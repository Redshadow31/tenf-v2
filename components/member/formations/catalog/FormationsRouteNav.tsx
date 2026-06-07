"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ListChecks } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import { MEMBER_PANEL_RADIUS } from "@/components/member/dashboard/dashboardUi";
import { FORMATIONS_CATALOG_ACCENT } from "@/components/member/formations/catalog/formationsCatalogUtils";

const items = [
  {
    href: "/member/formations",
    label: "Catalogue & sessions",
    shortLabel: "Catalogue",
    icon: GraduationCap,
    isActive: (p: string) => p === "/member/formations" || p === "/member/formations/",
  },
  {
    href: "/member/formations/validees",
    label: "Mes formations validées",
    shortLabel: "Validées",
    icon: ListChecks,
    isActive: (p: string) => p.startsWith("/member/formations/validees"),
  },
] as const;

export default function FormationsRouteNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Sections formations TENF"
      className={`${MEMBER_PANEL_RADIUS} border border-white/[0.1] bg-black/35 p-1.5 backdrop-blur-sm`}
    >
      <div className="grid gap-1.5 sm:grid-cols-2">
        {items.map(({ href, label, shortLabel, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                active
                  ? "border-violet-400/45 bg-violet-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                style={
                  active
                    ? {
                        borderColor: hexToRgba(FORMATIONS_CATALOG_ACCENT, 0.4),
                        backgroundColor: hexToRgba(FORMATIONS_CATALOG_ACCENT, 0.18),
                        color: "#ddd6fe",
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.1)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.55)",
                      }
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white/90 sm:hidden">{shortLabel}</span>
                <span className="hidden text-sm font-semibold text-white/90 sm:block">{label}</span>
                {active ? (
                  <span className="mt-0.5 inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                    Actif
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
