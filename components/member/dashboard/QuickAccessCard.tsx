"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";

type QuickAccessCardProps = {
  model: MemberDashboardModel;
};

export default function QuickAccessCard({ model }: QuickAccessCardProps) {
  const { accent, quickAccess } = model;

  return (
    <section
      aria-labelledby="dashboard-quickaccess-title"
      className="rounded-3xl border p-5 md:p-6"
      style={{
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(20,20,26,0.85)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="dashboard-quickaccess-title"
          className="text-lg font-bold md:text-xl"
          style={{ color: "var(--color-text)" }}
        >
          Accès rapides
        </h2>
        <p className="text-xs text-white/55">Les pages les plus utiles, à portée.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
        {quickAccess.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            style={{
              borderColor:
                item.tone === "primary"
                  ? hexToRgba(accent, 0.4)
                  : "rgba(255,255,255,0.12)",
              backgroundColor:
                item.tone === "primary"
                  ? hexToRgba(accent, 0.1)
                  : "rgba(255,255,255,0.04)",
              color:
                item.tone === "primary" ? hexToRgba(accent, 0.96) : "var(--color-text)",
            }}
          >
            <span className="line-clamp-1">{item.label}</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
