"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";

type NextActionCardProps = {
  model: MemberDashboardModel;
};

export default function NextActionCard({ model }: NextActionCardProps) {
  const { accent, primaryAction, secondaryActions } = model;

  return (
    <section
      aria-labelledby="dashboard-next-step-title"
      className="rounded-3xl border p-5 md:p-7"
      style={{
        borderColor: hexToRgba(accent, 0.3),
        background: `linear-gradient(160deg, ${hexToRgba(accent, 0.1)}, rgba(16,16,20,0.94))`,
        boxShadow: `0 16px 32px rgba(0,0,0,0.28)`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: hexToRgba(accent, 0.95) }}
          >
            Ta prochaine étape
          </p>
          <h2
            id="dashboard-next-step-title"
            className="mt-1 text-xl font-bold md:text-2xl"
            style={{ color: "var(--color-text)" }}
          >
            Une seule chose à viser maintenant
          </h2>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: hexToRgba(accent, 0.12),
            color: hexToRgba(accent, 0.92),
          }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Avant le {model.monthDeadlineLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* Action principale */}
        <Link
          href={primaryAction.href}
          className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:p-5"
          style={{
            borderColor: hexToRgba(accent, 0.45),
            background: `linear-gradient(160deg, ${hexToRgba(accent, 0.18)}, rgba(12,12,16,0.95))`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: hexToRgba(accent, 0.4), opacity: 0.6 }}
            aria-hidden
          />
          <div className="relative min-w-0 flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: hexToRgba(accent, 0.96) }}
            >
              Action principale
            </p>
            <p
              className="mt-1 text-lg font-bold leading-tight md:text-xl"
              style={{ color: "var(--color-text)" }}
            >
              {primaryAction.label}
            </p>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "rgba(236,236,239,0.78)" }}
            >
              {primaryAction.detail}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2"
              style={{ color: hexToRgba(accent, 0.96) }}
            >
              Y aller
              <ArrowUpRight size={14} aria-hidden />
            </span>
          </div>
        </Link>

        {/* Actions secondaires */}
        <div className="grid gap-2">
          {secondaryActions.length === 0 ? (
            <div
              className="rounded-2xl border p-4 text-sm"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.03)",
                color: "rgba(236,236,239,0.7)",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                Pour continuer tranquillement
              </p>
              <p className="mt-1 leading-relaxed">
                Profite de l&apos;aperçu du mois plus bas ou jette un œil au planning.
              </p>
            </div>
          ) : (
            secondaryActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group flex items-start gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                <span
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: hexToRgba(accent, 0.16),
                    color: hexToRgba(accent, 0.96),
                  }}
                  aria-hidden
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ color: "var(--color-text)" }}
                  >
                    {action.label}
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "rgba(236,236,239,0.7)" }}
                  >
                    {action.detail}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
