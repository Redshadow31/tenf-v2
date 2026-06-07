"use client";

import Link from "next/link";
import { ArrowRight, Crown, GraduationCap, Heart, Sparkles } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type RecognitionCardProps = {
  model: MemberDashboardModel;
  variant?: "full" | "compact";
};

export default function RecognitionCard({ model, variant = "full" }: RecognitionCardProps) {
  if (!model.showRecognitionStats) return null;

  const { accent, recognition } = model;
  const vipTone = recognition.vipActive ? "#facc15" : accent;

  if (variant === "compact") {
    const tone = recognition.vipActive ? "gold" : "accent";
    return (
      <DashboardPanel
        tone={tone}
        accentHex={vipTone}
        intensity={recognition.vipActive ? "bold" : "medium"}
        ariaLabelledBy="dashboard-recognition-title"
      >
        <DashboardPanelHeader
          kicker="Reconnaissance"
          title={recognition.vipActive ? recognition.vipLabel : "Ton engagement"}
          icon={recognition.vipActive ? Crown : Sparkles}
          tone={tone}
          accentHex={vipTone}
          titleId="dashboard-recognition-title"
          badge={
            recognition.vipActive ? (
              <DashboardBadge tone="gold" accentHex={vipTone}>
                <Crown className="h-3 w-3 text-yellow-200" aria-hidden />
                VIP
              </DashboardBadge>
            ) : null
          }
        />

        <div className="grid flex-1 grid-cols-2 gap-2">
          <CompactStat label="Actions" value={recognition.participationThisMonth} tone={accent} />
          <CompactStat label="Formations" value={recognition.formationsThisMonth} tone="#22c55e" />
        </div>

        <Link
          href="/member/engagement/score"
          className="mt-4 rounded-xl border border-white/10 bg-black/25 py-2.5 text-center text-[11px] font-bold transition hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.03]"
          style={{ color: hexToRgba(vipTone, 0.95) }}
        >
          Score & engagement →
        </Link>
      </DashboardPanel>
    );
  }

  return (
    <section
      aria-labelledby="dashboard-recognition-title-full"
      className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 md:p-6 lg:grid-cols-[1.3fr_1fr]"
      style={{
        borderColor: hexToRgba(vipTone, 0.28),
        background: `linear-gradient(150deg, ${hexToRgba(vipTone, 0.1)}, rgba(15,17,22,0.92))`,
      }}
    >
      <div className="space-y-3">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: hexToRgba(vipTone, 0.92) }}
        >
          Points & reconnaissance
        </p>
        <h2
          id="dashboard-recognition-title-full"
          className="text-xl font-bold md:text-2xl"
          style={{ color: "var(--color-text)" }}
        >
          La communauté vit aussi grâce à tes passages
        </h2>
        <p className="text-sm leading-relaxed text-white/72">
          Chaque action enregistrée — formation, présence, raid, soutien — alimente le score
          collectif. On valorise la participation, pas la performance.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/member/engagement/score"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            style={{
              backgroundColor: hexToRgba(vipTone, 0.92),
              color: "#1f1a12",
            }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Détail score & engagement
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {recognition.vipActive ? (
            <Link
              href="/vip"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                color: "var(--color-text)",
              }}
            >
              <Crown className="h-4 w-4 text-yellow-300" aria-hidden />
              Voir ma page VIP
            </Link>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-2.5 self-center">
        <RecognitionRow
          Icon={Heart}
          tone={accent}
          label="Actions enregistrées ce mois"
          value={recognition.participationThisMonth}
          hint="Présences, raids, formations, soutiens validés."
        />
        <RecognitionRow
          Icon={GraduationCap}
          tone="#22c55e"
          label="Formations validées ce mois"
          value={recognition.formationsThisMonth}
          hint="Chaque module compte, même un court."
        />
        <RecognitionRow
          Icon={Crown}
          tone="#facc15"
          label={recognition.vipActive ? "Statut VIP du mois" : "Reconnaissance TENF"}
          valueLabel={recognition.vipLabel}
          hint={
            recognition.vipActive
              ? "Tu es mis·e en lumière par le staff ce mois-ci."
              : "Continue ton chemin — le staff suit ce qui se passe."
          }
        />
      </ul>
    </section>
  );
}

function CompactStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div
      className="rounded-xl border border-white/8 bg-black/30 px-3 py-3 text-center"
      style={{ boxShadow: `inset 0 1px 0 ${hexToRgba(tone, 0.12)}` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-0.5 text-2xl font-black tabular-nums" style={{ color: hexToRgba(tone, 0.95) }}>
        {value}
      </p>
    </div>
  );
}

function RecognitionRow({
  Icon,
  tone,
  label,
  value,
  valueLabel,
  hint,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  tone: string;
  label: string;
  value?: number;
  valueLabel?: string;
  hint: string;
}) {
  return (
    <li
      className="flex items-start gap-3 rounded-2xl border p-3.5"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: hexToRgba(tone, 0.16),
          color: hexToRgba(tone, 0.95),
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold uppercase tracking-wide text-white/55"
        >
          {label}
        </p>
        <p
          className="mt-0.5 text-lg font-bold leading-tight tabular-nums"
          style={{ color: "var(--color-text)" }}
        >
          {value !== undefined ? value : valueLabel}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/55">{hint}</p>
      </div>
    </li>
  );
}
