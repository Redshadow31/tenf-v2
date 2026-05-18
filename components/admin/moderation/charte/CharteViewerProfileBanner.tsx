"use client";

import { UserCircle } from "lucide-react";
import { Q_LAYOUT } from "@/components/admin/moderation/questionnaire/questionnaire-ui";
import {
  CHARTE_AUDIENCE_COLORS,
  CHARTE_AUDIENCE_LABELS,
  type CharteAudience,
} from "./charteModerationContent";

type CharteViewerProfileBannerProps = {
  roleLabel: string;
  charteAudience: CharteAudience | null;
  roleBrief: string | null;
  reducedActivityActive: boolean;
  profileFilter: boolean;
  onProfileFilterChange: (value: boolean) => void;
  relevantCount: number;
  totalCount: number;
};

export function CharteViewerProfileBanner({
  roleLabel,
  charteAudience,
  roleBrief,
  reducedActivityActive,
  profileFilter,
  onProfileFilterChange,
  relevantCount,
  totalCount,
}: CharteViewerProfileBannerProps) {
  if (!charteAudience) {
    return (
      <aside
        className={`${Q_LAYOUT.panel} border-zinc-500/20 p-4 text-sm text-zinc-400`}
        aria-label="Profil staff"
      >
        <p>
          Ton rôle staff n&apos;a pas été reconnu automatiquement. Lis la charte complète — en cas de doute, vois
          l&apos;article 4 ou demande à un coordinateur.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={`${Q_LAYOUT.panel} border-violet-500/20 p-4`}
      aria-label="Ton profil staff"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
            <UserCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/90">
              Profil détecté (connexion)
            </p>
            <p className="mt-0.5 font-semibold text-white">{roleLabel}</p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${CHARTE_AUDIENCE_COLORS[charteAudience]}`}
            >
              {CHARTE_AUDIENCE_LABELS[charteAudience]}
            </span>
            {reducedActivityActive && charteAudience === "activite_reduite" ? (
              <p className="mt-2 text-xs text-zinc-400">
                Période d&apos;activité réduite active sur ta fiche membre.
              </p>
            ) : null}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-200">
          <input
            type="checkbox"
            checked={profileFilter}
            onChange={(e) => onProfileFilterChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-violet-500"
          />
          Voir surtout ce qui me concerne ({relevantCount}/{totalCount})
        </label>
      </div>

      {roleBrief ? (
        <p className="mt-4 rounded-xl border border-violet-400/20 bg-violet-950/25 px-3 py-2.5 text-sm leading-relaxed text-violet-50/95">
          <span className="font-semibold text-violet-200">Pour toi — </span>
          {roleBrief}
        </p>
      ) : null}
    </aside>
  );
}
