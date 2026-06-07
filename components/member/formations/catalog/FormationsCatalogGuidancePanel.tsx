"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Heart, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { FormationsCatalogGuidanceModel } from "@/components/member/formations/catalog/formationsCatalogModel";
import {
  FORMATIONS_CATALOG_LINKS,
  FORMATIONS_CATALOG_WHY,
} from "@/components/member/formations/catalog/formationsCatalogContent";
import { FORMATIONS_CATALOG_ACCENT } from "@/components/member/formations/catalog/formationsCatalogUtils";

type FormationsCatalogGuidancePanelProps = {
  model: FormationsCatalogGuidanceModel;
  twitchLoading: boolean;
  twitchConnected: boolean;
  onOpenRequest: () => void;
};

export default function FormationsCatalogGuidancePanel({
  model,
  twitchLoading,
  twitchConnected,
  onOpenRequest,
}: FormationsCatalogGuidancePanelProps) {
  return (
    <>
      <DashboardPanel
        id="formations-why"
        tone="accent"
        accentHex={FORMATIONS_CATALOG_ACCENT}
        intensity="soft"
        ariaLabelledBy="formations-why-title"
        className={`${MEMBER_SCROLL_MT} lg:sticky lg:top-[calc(clamp(0.4rem,0.8vw,0.85rem)+3.25rem)]`}
      >
        <DashboardPanelHeader
          kicker={FORMATIONS_CATALOG_WHY.kicker}
          title={FORMATIONS_CATALOG_WHY.title}
          icon={Heart}
          tone="rose"
          accentHex="#f472b6"
          titleId="formations-why-title"
        />

        <div className={MEMBER_MESSAGE_BOX}>
          <p className="text-sm font-medium leading-[1.65] text-white/90">{model.introLead}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/55">{FORMATIONS_CATALOG_WHY.footnote}</p>
        </div>

        <DashboardInnerCard hover={false} className="mt-3 !p-3">
          <div className="flex items-start gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: hexToRgba(FORMATIONS_CATALOG_ACCENT, 0.15), color: "#ddd6fe" }}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-xs leading-relaxed text-white/68">{model.encouragement}</p>
          </div>
        </DashboardInnerCard>

        <div className="mt-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: twitchLoading
                ? "rgba(255,255,255,0.12)"
                : twitchConnected
                  ? "rgba(52,211,153,0.45)"
                  : "rgba(248,113,113,0.45)",
              color: twitchLoading ? "rgba(255,255,255,0.45)" : twitchConnected ? "#34d399" : "#f87171",
              backgroundColor: twitchLoading
                ? "rgba(148,163,184,0.08)"
                : twitchConnected
                  ? "rgba(52,211,153,0.12)"
                  : "rgba(248,113,113,0.12)",
            }}
          >
            {twitchLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Vérification Twitch…
              </>
            ) : twitchConnected ? (
              "Twitch lié"
            ) : (
              "Twitch non lié — optionnel"
            )}
          </span>
        </div>

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
          {FORMATIONS_CATALOG_LINKS.map((link) => (
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
      </DashboardPanel>

      <DashboardPanel
        id="formations-request"
        tone="accent"
        accentHex={FORMATIONS_CATALOG_ACCENT}
        intensity="soft"
        ariaLabelledBy="formations-request-title"
        className={MEMBER_SCROLL_MT}
      >
        <DashboardPanelHeader
          kicker="Proposition"
          title="Une idée de sujet ?"
          icon={MessageSquarePlus}
          tone="accent"
          accentHex={FORMATIONS_CATALOG_ACCENT}
          titleId="formations-request-title"
        />
        <p className="text-sm leading-relaxed text-white/62">
          Titre, message pour l&apos;équipe, lien optionnel avec une formation du catalogue — visible dans l&apos;admin
          « Demandes de formation ».
        </p>
        <button
          type="button"
          onClick={onOpenRequest}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold text-violet-50 transition hover:-translate-y-0.5"
          style={{
            borderColor: hexToRgba(FORMATIONS_CATALOG_ACCENT, 0.5),
            backgroundColor: hexToRgba(FORMATIONS_CATALOG_ACCENT, 0.25),
          }}
        >
          <MessageSquarePlus className="h-5 w-5" aria-hidden />
          Ouvrir le formulaire
        </button>
        <Link
          href="/member/profil/modifier"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/45 underline-offset-2 hover:text-white/75 hover:underline"
        >
          Vérifier mon profil
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </DashboardPanel>
    </>
  );
}
