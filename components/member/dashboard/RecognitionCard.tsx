"use client";

import Link from "next/link";
import { ArrowRight, Crown, GraduationCap, Heart, Sparkles } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";

type RecognitionCardProps = {
  model: MemberDashboardModel;
};

export default function RecognitionCard({ model }: RecognitionCardProps) {
  const { accent, recognition } = model;
  const vipTone = recognition.vipActive ? "#facc15" : accent;

  return (
    <section
      aria-labelledby="dashboard-recognition-title"
      className="grid gap-3 rounded-3xl border p-5 sm:grid-cols-2 md:p-6 lg:grid-cols-[1.3fr_1fr]"
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
          id="dashboard-recognition-title"
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
