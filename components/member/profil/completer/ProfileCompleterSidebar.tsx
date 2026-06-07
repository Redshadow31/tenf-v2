"use client";

import { CheckCircle2, Circle, ShieldCheck, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";
import type { IdentityCheck } from "@/components/member/profil/completer/profileCompleterModel";
import type { ProfileCompleterViewModel } from "@/components/member/profil/completer/profileCompleterModel";

type ProfileCompleterSidebarProps = {
  model: ProfileCompleterViewModel;
  identityChecks: readonly IdentityCheck[];
  activeTab: "identite" | "public";
  onSelectTab: (tab: "identite" | "public") => void;
  onScrollToField: (fieldId: string) => void;
};

export default function ProfileCompleterSidebar({
  model,
  identityChecks,
  activeTab,
  onSelectTab,
  onScrollToField,
}: ProfileCompleterSidebarProps) {
  const { accent, requiredIdentityReady, hasPublicDescription } = model;

  return (
    <DashboardPanel tone="accent" accentHex={accent} intensity="soft" className="h-full">
      <DashboardPanelHeader
        kicker="Guide"
        title="Ton parcours"
        icon={Sparkles}
        tone="accent"
        accentHex={accent}
        badge={
          <DashboardBadge tone="accent" accentHex={accent}>
            2 étapes
          </DashboardBadge>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid gap-2">
          <TabButton
            active={activeTab === "identite"}
            done={requiredIdentityReady}
            label="Identité TENF"
            sub="Discord, Twitch, parrain…"
            onClick={() => onSelectTab("identite")}
            accent={accent}
          />
          <TabButton
            active={activeTab === "public"}
            done={hasPublicDescription}
            label="Fiche publique"
            sub="Bio, jeux, réseaux"
            onClick={() => onSelectTab("public")}
            accent="#f472b6"
          />
        </div>

        <DashboardInnerCard className="!p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            Checklist identité
          </p>
          <ul className="mt-2 space-y-1.5">
            {identityChecks.map((item) => (
              <li key={item.fieldId}>
                <button
                  type="button"
                  onClick={() => onScrollToField(item.fieldId)}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-2 text-left text-xs transition hover:border-white/14 hover:bg-white/[0.03]"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-white/30" aria-hidden />
                  )}
                  <span className={item.done ? "font-semibold text-white" : "text-white/60"}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DashboardInnerCard>

        <DashboardInnerCard className="mt-auto !p-3.5">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            <div className="text-[11px] leading-relaxed text-white/55">
              <p className="font-semibold text-white/85">Après l&apos;envoi</p>
              <p className="mt-1">
                Le staff relit si besoin — pas de jugement sur ton contenu. Tu gardes l&apos;accès à ton espace
                membre pendant ce temps. RGPD : tes données servent uniquement au fonctionnement TENF.
              </p>
            </div>
          </div>
        </DashboardInnerCard>
      </div>
    </DashboardPanel>
  );
}

function TabButton({
  active,
  done,
  label,
  sub,
  onClick,
  accent,
}: {
  active: boolean;
  done: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        active
          ? "text-white shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
          : "border-white/10 bg-black/22 hover:border-white/16 hover:bg-white/[0.03]"
      }`}
      style={
        active
          ? {
              background: `linear-gradient(155deg, ${hexToRgba(accent, 0.28)}, ${hexToRgba(accent, 0.08)})`,
              border: `1px solid ${hexToRgba(accent, 0.35)}`,
              boxShadow: `inset 0 1px 0 ${hexToRgba(accent, 0.12)}`,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">{label}</span>
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
        ) : (
          <Circle className="h-4 w-4 text-white/25" aria-hidden />
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-white/45">{sub}</p>
    </button>
  );
}
