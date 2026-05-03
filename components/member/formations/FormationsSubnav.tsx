"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ListChecks } from "lucide-react";

const items = [
  {
    href: "/member/formations",
    label: "Catalogue & sessions",
    shortLabel: "Catalogue",
    description: "Prochaines dates, archives et demandes d’intérêt",
    icon: GraduationCap,
    isActive: (p: string) => p === "/member/formations" || p === "/member/formations/",
  },
  {
    href: "/member/formations/validees",
    label: "Mes formations validées",
    shortLabel: "Validées",
    description: "Progression, objectifs et historique",
    icon: ListChecks,
    isActive: (p: string) => p.startsWith("/member/formations/validees"),
  },
] as const;

export default function FormationsSubnav() {
  const pathname = usePathname() || "";

  return (
    <nav
      className="rounded-2xl border p-2 sm:p-3"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      aria-label="Sections formations TENF"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(({ href, label, shortLabel, description, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-start gap-3 overflow-hidden rounded-xl border px-3 py-3 transition duration-200 sm:px-4 sm:py-3.5 ${
                active
                  ? "border-violet-500/50 bg-violet-500/15 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                  : "border-transparent hover:border-violet-500/25 hover:bg-violet-500/5"
              }`}
              style={{ color: "var(--color-text)" }}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition group-hover:scale-105 ${
                  active ? "border-violet-400/40 bg-violet-500/20 text-violet-100" : "border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-violet-200/90"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold leading-snug break-words text-pretty sm:hidden">{shortLabel}</span>
                  <span className="hidden font-semibold leading-snug break-words text-pretty sm:inline">{label}</span>
                  {active ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                      Actif
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed break-words text-pretty sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
