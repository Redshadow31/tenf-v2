"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Compass, Crown, Heart, Sparkles } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";

type DashboardHeroProps = {
  model: MemberDashboardModel;
};

export default function DashboardHero({ model }: DashboardHeroProps) {
  const { accent, status } = model;
  const StatusIcon =
    status === "vip"
      ? Crown
      : status === "newcomer"
      ? Sparkles
      : status === "paused"
      ? Heart
      : status === "staff"
      ? Compass
      : CheckCircle2;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-5 md:p-8"
      style={{
        borderColor: hexToRgba(accent, 0.28),
        background: `linear-gradient(145deg, ${hexToRgba(accent, 0.16)} 0%, rgba(18,18,22,0.97) 45%, rgba(12,12,16,0.99) 100%)`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 80px ${hexToRgba(accent, 0.08)}`,
      }}
      aria-labelledby="dashboard-hero-title"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: hexToRgba(accent, 0.14) }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: hexToRgba(accent, 0.08) }}
        aria-hidden
      />

      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
            style={{
              borderColor: hexToRgba(accent, 0.45),
              backgroundColor: hexToRgba(accent, 0.12),
              color: hexToRgba(accent, 0.98),
            }}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden />
            {model.welcomeKicker}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={{
              borderColor: hexToRgba(accent, 0.4),
              backgroundColor: hexToRgba(accent, 0.08),
              color: hexToRgba(accent, 0.92),
            }}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {model.statusBadge}
          </span>
        </div>

        <h1
          id="dashboard-hero-title"
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{ color: "var(--color-text)" }}
        >
          {model.welcomeTitle}
        </h1>

        <p
          className="max-w-3xl text-sm leading-relaxed md:text-base"
          style={{ color: "rgba(236,236,239,0.92)" }}
        >
          {model.welcomeMessage}
        </p>

        <p className="text-sm" style={{ color: "rgba(236,236,239,0.7)" }}>
          {model.encouragement}
        </p>

        {model.welcomeBanner ? (
          <div
            className="mt-2 grid items-start gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5"
            style={{
              borderColor: hexToRgba(accent, 0.35),
              backgroundColor: "rgba(9, 17, 25, 0.55)",
            }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                {model.welcomeBanner.title}
              </p>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "rgba(236,236,239,0.82)" }}
              >
                {model.welcomeBanner.description}
              </p>
            </div>
            <Link
              href={model.welcomeBanner.cta.href}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                backgroundColor: hexToRgba(accent, 0.95),
                color: "#1f1a12",
              }}
            >
              {model.welcomeBanner.cta.label}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
