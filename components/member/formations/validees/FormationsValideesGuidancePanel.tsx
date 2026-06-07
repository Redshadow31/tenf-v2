"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { FormationsValideesGuidanceModel } from "@/components/member/formations/validees/formationsValideesModel";
import {
  FORMATIONS_VALIDEES_LINKS,
  FORMATIONS_VALIDEES_WHY,
} from "@/components/member/formations/validees/formationsValideesContent";
import { FORMATIONS_VALIDEES_ACCENT } from "@/components/member/formations/validees/formationsValideesUtils";

type FormationsValideesGuidancePanelProps = {
  model: FormationsValideesGuidanceModel;
};

export default function FormationsValideesGuidancePanel({ model }: FormationsValideesGuidancePanelProps) {
  return (
    <DashboardPanel
      id="formations-validees-why"
      tone="accent"
      accentHex={FORMATIONS_VALIDEES_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-validees-why-title"
      className={`${MEMBER_SCROLL_MT} lg:sticky lg:top-[calc(clamp(0.4rem,0.8vw,0.85rem)+3.25rem)]`}
    >
      <DashboardPanelHeader
        kicker={FORMATIONS_VALIDEES_WHY.kicker}
        title={FORMATIONS_VALIDEES_WHY.title}
        icon={Heart}
        tone="rose"
        accentHex="#f472b6"
        titleId="formations-validees-why-title"
      />

      <div className={MEMBER_MESSAGE_BOX}>
        <p className="text-sm font-medium leading-[1.65] text-white/90">{model.introLead}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{FORMATIONS_VALIDEES_WHY.footnote}</p>
      </div>

      <DashboardInnerCard hover={false} className="mt-3 !p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexToRgba(FORMATIONS_VALIDEES_ACCENT, 0.15), color: "#ddd6fe" }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-xs leading-relaxed text-white/68">{model.encouragement}</p>
        </div>
      </DashboardInnerCard>

      <ul className="mt-3 space-y-2">
        {model.truths.map((truth) => (
          <li key={truth.id}>
            <DashboardInnerCard hover={false} className="!p-3">
              <p className="text-sm font-bold text-white">{truth.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/62">{truth.body}</p>
            </DashboardInnerCard>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {FORMATIONS_VALIDEES_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            {link.label}
            <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
          </Link>
        ))}
      </div>

      <Link
        href="/member/formations"
        className="mt-4 inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5"
        style={{
          backgroundColor: "#f0c96b",
          boxShadow: "0 6px 18px rgba(240, 201, 107, 0.28)",
        }}
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Explorer le catalogue
      </Link>
    </DashboardPanel>
  );
}
