"use client";

import { ArrowRight, BookOpen, GraduationCap, Library, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberHeroStat,
  MemberInsightChip,
  MemberSecondaryLink,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import type { FormationsCatalogHeroModel } from "@/components/member/formations/catalog/formationsCatalogModel";
import { FORMATIONS_CATALOG_ACCENT } from "@/components/member/formations/catalog/formationsCatalogUtils";

type FormationsCatalogHeroProps = {
  model: FormationsCatalogHeroModel;
  upcomingCount: number;
  catalogCount: number;
  interestedCount: number;
  loading: boolean;
  onOpenRequest: () => void;
};

export default function FormationsCatalogHero({
  model,
  upcomingCount,
  catalogCount,
  interestedCount,
  loading,
  onOpenRequest,
}: FormationsCatalogHeroProps) {
  return (
    <DashboardPanel id="formations-hero" tone="accent" accentHex={FORMATIONS_CATALOG_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_10.5rem] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={FORMATIONS_CATALOG_ACCENT}>
              <GraduationCap className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={FORMATIONS_CATALOG_ACCENT}>
              {model.profileBadge}
            </DashboardBadge>
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères formations">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenRequest}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5"
              style={{
                backgroundColor: FORMATIONS_CATALOG_ACCENT,
                boxShadow: "0 6px 18px rgba(139, 92, 246, 0.32)",
              }}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
              Demander une formation
            </button>
            <MemberSecondaryLink href="/member/formations/validees">
              Mes validées
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
            <MemberSecondaryLink href="/member/academy">Academy</MemberSecondaryLink>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat
            icon={BookOpen}
            label="À venir"
            value={loading ? "…" : String(upcomingCount)}
            accent="#f59e0b"
          />
          <MemberHeroStat
            icon={Library}
            label="Catalogue"
            value={loading ? "…" : String(catalogCount)}
            accent={FORMATIONS_CATALOG_ACCENT}
          />
          <MemberHeroStat
            icon={GraduationCap}
            label="Intérêts"
            value={loading ? "…" : String(interestedCount)}
            accent="#34d399"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { href: "/member/objectifs", label: "Objectifs du mois" },
          { href: "/member/progression", label: "Ma progression" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.08] hover:text-white/80"
          >
            {link.label}
            <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
