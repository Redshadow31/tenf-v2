"use client";

import { CalendarDays, MessageSquare } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { DISCORD_ACTIVITY_ACCENT } from "@/components/member/engagement/discord-activity/discordActivityUtils";

type DiscordActivityEmptyPanelProps = {
  variant: "empty" | "unmatched";
};

export default function DiscordActivityEmptyPanel({ variant }: DiscordActivityEmptyPanelProps) {
  const isUnmatched = variant === "unmatched";

  return (
    <DashboardPanel
      id="discord-stats"
      tone="accent"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-empty-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker={isUnmatched ? "Profil" : "Historique"}
        title={isUnmatched ? "On te cherche dans les exports" : "Pas encore de données"}
        icon={isUnmatched ? MessageSquare : CalendarDays}
        tone="accent"
        accentHex={DISCORD_ACTIVITY_ACCENT}
        titleId="discord-empty-title"
      />

      <div
        className={`rounded-2xl border px-5 py-8 text-center ${
          isUnmatched ? "border-amber-500/25 bg-amber-500/[0.07]" : "border-white/10 bg-black/20"
        }`}
      >
        {isUnmatched ? (
          <>
            <p className="text-sm leading-relaxed text-amber-100/90">
              Des mois sont enregistrés côté TENF, mais aucune ligne ne correspond encore à ton profil. Vérifie ton{" "}
              <strong className="text-white">pseudo Twitch</strong> et le lien Discord sur ta fiche membre.
            </p>
            <p className="mt-3 text-xs text-amber-100/70">
              En attendant, le serveur reste ouvert — tu peux y passer même si ces stats mettent un moment à apparaître.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-white/70">
              Dès que l&apos;équipe aura importé les exports Discord du serveur TENF, ton historique messages et vocal
              apparaîtra ici automatiquement.
            </p>
            <p className="mt-3 text-xs text-white/45">
              Un simple passage sur Discord pour souhaiter bon live, c&apos;est déjà de l&apos;entraide.
            </p>
          </>
        )}
      </div>
    </DashboardPanel>
  );
}
