"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  RefreshCcw,
  Rocket,
  User,
  Users,
  X,
} from "lucide-react";
import type { LiveMember } from "@/components/lives/types";
import TwitchLivePreview from "@/components/lives/TwitchLivePreview";
import theme from "@/components/lives/lives-theme.module.css";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

type RandomRaidModalProps = {
  live: LiveMember | null;
  isOpen: boolean;
  onClose: () => void;
  onPickAnother: () => void;
  onOpenMemberProfile?: () => void;
};

function normalizeRaidLogin(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

export default function RandomRaidModal({
  live,
  isOpen,
  onClose,
  onPickAnother,
  onOpenMemberProfile,
}: RandomRaidModalProps) {
  const [copiedRaid, setCopiedRaid] = useState(false);

  const raidLogin = useMemo(() => (live ? normalizeRaidLogin(live.twitchLogin) : ""), [live]);
  const raidCommand = raidLogin ? `/raid ${raidLogin}` : "";

  const copyRaidCommand = useCallback(async () => {
    if (!raidCommand) return;
    try {
      await navigator.clipboard.writeText(raidCommand);
      setCopiedRaid(true);
      window.setTimeout(() => setCopiedRaid(false), 2200);
    } catch {
      /* ignore */
    }
  }, [raidCommand]);

  useEffect(() => {
    if (!isOpen) {
      setCopiedRaid(false);
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !live) return null;

  const description =
    live.description?.trim() ||
    `Membre ${getRoleBadgeLabel(live.role)} de la communauté TENF — passe en live pour lui envoyer de la visibilité.`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="random-raid-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div
        className={`relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl ${theme.panel} ${theme.panelSpotlight}`}
      >
        <div className={theme.panelOrbViolet} aria-hidden />
        <div className={theme.panelOrbRed} aria-hidden />

        <div className={`${theme.panelInner} flex min-h-0 flex-1 flex-col`}>
          <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
            <div>
              <p className={theme.badgeViolet}>
                <Rocket className="h-3.5 w-3.5" aria-hidden />
                Raid aléatoire TENF
              </p>
              <h2 id="random-raid-title" className="mt-2 text-lg font-bold text-white sm:text-xl">
                Cible suggérée : {live.displayName}
              </h2>
              <p className="mt-1 text-xs text-violet-200/80">
                Tirage parmi les lives filtrés — copie la commande puis lance le raid depuis ton chat Twitch.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
              aria-label="Fermer la fenêtre"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
              <section className={`${theme.glassCard} ${theme.glassCardViolet} space-y-3 p-4`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-200/90">
                  Fiche publique
                </p>
                <div className="flex items-start gap-3">
                  <img
                    src={live.avatar}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full border border-white/15 object-cover"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).src =
                        `https://placehold.co/56x56?text=${live.displayName.charAt(0)}`;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">{live.displayName}</p>
                    <p className="text-sm text-zinc-400">@{raidLogin}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={getRoleBadgeClassName(live.role)}>{getRoleBadgeLabel(live.role)}</span>
                      {live.isVip ? (
                        <span className="rounded-full border border-amber-300/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                          VIP
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-zinc-300">{description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span className={`${theme.badgeNeutral} gap-1`}>
                    <Users className="h-3 w-3" aria-hidden />
                    {live.viewerCount} viewer{live.viewerCount !== 1 ? "s" : ""}
                  </span>
                  {live.game ? <span className={theme.badgeNeutral}>{live.game}</span> : null}
                </div>
                {live.title ? (
                  <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-zinc-300">
                    <span className="font-semibold text-violet-200">En direct :</span> {live.title}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  {onOpenMemberProfile ? (
                    <button
                      type="button"
                      onClick={onOpenMemberProfile}
                      className={`${theme.btnSecondary} text-xs`}
                    >
                      <User className="h-3.5 w-3.5" aria-hidden />
                      Fiche membre complète
                    </button>
                  ) : null}
                  <Link
                    href={`/membres?member=${encodeURIComponent(raidLogin)}`}
                    className={`${theme.btnSecondary} text-xs`}
                  >
                    Annuaire
                  </Link>
                  <a
                    href={live.twitchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.btnSecondary} text-xs`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Ouvrir Twitch
                  </a>
                </div>
              </section>

              <TwitchLivePreview channel={raidLogin} title={live.displayName} />
            </div>

            <div className={`${theme.glassCard} ${theme.glassCardAmber} space-y-3 p-4`}>
              <p className="text-sm font-semibold text-amber-100">Commande de raid (chat Twitch)</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 rounded-lg border border-amber-300/25 bg-black/30 px-3 py-2.5 font-mono text-sm text-amber-50">
                  {raidCommand}
                </code>
                <button
                  type="button"
                  onClick={() => void copyRaidCommand()}
                  className={`${theme.btnAmber} shrink-0`}
                >
                  {copiedRaid ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden />
                      Copier la commande
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-amber-100/75">
                Colle la commande dans ton chat Twitch pendant que tu es en live pour envoyer ta communauté vers{" "}
                <strong className="text-amber-50">{live.displayName}</strong>.
              </p>
            </div>
          </div>

          <footer className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
            <button type="button" onClick={onPickAnother} className={`${theme.btnPrimary} flex-1 sm:flex-none`}>
              <RefreshCcw className="h-4 w-4" aria-hidden />
              Autre raid au hasard
            </button>
            <button type="button" onClick={onClose} className={`${theme.btnSecondary} flex-1 sm:flex-none`}>
              Fermer
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
