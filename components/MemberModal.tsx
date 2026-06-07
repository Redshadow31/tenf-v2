"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  Heart,
  MessageCircle,
  Mic2,
  Radio,
  Share2,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import { getRoleBadgeClassName, getRoleBadgeLabel, resolvePublicDiscoveryRoleBadge } from "@/lib/roleBadgeSystem";
import StreamPlanningCalendar, { type StreamPlanningCalendarItem } from "@/components/member/StreamPlanningCalendar";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";
import theme from "@/components/members/membres-theme.module.css";

type MemberModalProps = {
  member: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    twitchLogin: string;
    description?: string;
    twitchUrl?: string;
    discordId?: string;
    socials?: {
      discord?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
    };
    isVip?: boolean;
    vipBadge?: string;
    badges?: string[];
    followStatus?: "followed" | "not_followed" | "unknown";
    mainGame?: string;
    isAffiliated?: boolean;
    isActiveThisWeek?: boolean;
    isLive?: boolean;
    planningStatus?: "shared" | "partial" | "none";
    streamTags?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  /** Bandeau contextuel (ex. ouverture depuis la page Lives ou le calendrier) */
  contextBanner?: string;
  /** Surcharge du libellé du bouton Twitch (sinon « Rejoindre le live » si contextBanner lives, sinon « Ouvrir Twitch ») */
  primaryTwitchLabel?: string;
};

type ModalTab = "profil" | "soutien" | "activite" | "planning" | "reseaux";

const TAB_META: Array<{ id: ModalTab; label: string; hint: string }> = [
  { id: "profil", label: "Profil", hint: "Bio & univers du stream" },
  { id: "soutien", label: "Soutien", hint: "Twitch & communauté" },
  { id: "activite", label: "Activité", hint: "Rythme & Discord" },
  { id: "planning", label: "Planning", hint: "Prochains lives annoncés" },
  { id: "reseaux", label: "Réseaux", hint: "Liens directs" },
];

export default function MemberModal({
  member,
  isOpen,
  onClose,
  isAdmin = false,
  contextBanner,
  primaryTwitchLabel: primaryTwitchLabelProp,
}: MemberModalProps) {
  const twitchHref = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;
  const twitchPrimaryLabel =
    primaryTwitchLabelProp ?? (contextBanner ? "Rejoindre le live" : "Ouvrir Twitch");

  const followStatusConfig =
    member.followStatus === "followed"
      ? {
          icon: "❤️",
          label: "Tu suis déjà cette chaîne",
          className: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/35",
        }
      : member.followStatus === "not_followed"
        ? {
            icon: "🤍",
            label: "Tu ne suis pas encore cette chaîne sur Twitch",
            className: "bg-white/8 text-zinc-200 ring-1 ring-white/15",
          }
        : member.followStatus === "unknown"
          ? {
              icon: "❔",
              label: "Statut follow non disponible (connecte-toi avec Twitch pour le voir)",
              className: "bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/30",
            }
          : null;

  const [discordStats, setDiscordStats] = useState<{
    messages: number;
    voiceMinutes: number;
    rank: number;
  } | null>(null);
  const [loadingDiscordStats, setLoadingDiscordStats] = useState(false);
  const [streamPlannings, setStreamPlannings] = useState<StreamPlanningCalendarItem[]>([]);
  const [loadingStreamPlannings, setLoadingStreamPlannings] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("profil");
  const [copiedLogin, setCopiedLogin] = useState(false);

  const copyLogin = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(member.twitchLogin);
      setCopiedLogin(true);
      window.setTimeout(() => setCopiedLogin(false), 2000);
    } catch {
      /* ignore */
    }
  }, [member.twitchLogin]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && member.discordId) {
      async function loadDiscordStats() {
        setLoadingDiscordStats(true);
        try {
          const response = await fetch("/api/statbot/data", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          });

          if (response.ok) {
            const data = await response.json();
            const memberStats = data.members?.find((m: { discordId?: string }) => m.discordId === member.discordId);
            if (memberStats) {
              setDiscordStats({
                messages: memberStats.messages || 0,
                voiceMinutes: memberStats.voiceMinutes || 0,
                rank: memberStats.rank || 0,
              });
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des stats Discord:", error);
        } finally {
          setLoadingDiscordStats(false);
        }
      }

      loadDiscordStats();
    } else {
      setDiscordStats(null);
    }
  }, [isOpen, member.discordId]);

  useEffect(() => {
    if (!isOpen || !member.twitchLogin) {
      setStreamPlannings([]);
      return;
    }

    async function loadMemberPlanning() {
      setLoadingStreamPlannings(true);
      try {
        const response = await fetch(
          `/api/members/public/${encodeURIComponent(member.twitchLogin)}/stream-plannings`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          setStreamPlannings([]);
          return;
        }
        const data = await response.json();
        setStreamPlannings(data.plannings || []);
      } catch (error) {
        console.error("Erreur chargement planning membre:", error);
        setStreamPlannings([]);
      } finally {
        setLoadingStreamPlannings(false);
      }
    }

    loadMemberPlanning();
  }, [isOpen, member.twitchLogin]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("profil");
    setCopiedLogin(false);
  }, [isOpen, member.twitchLogin]);

  if (!isOpen) return null;

  const publicRoleBadge = isAdmin
    ? { label: getRoleBadgeLabel(member.role), className: getRoleBadgeClassName(member.role) }
    : resolvePublicDiscoveryRoleBadge(member.role);

  const planningSummary =
    member.planningStatus === "shared"
      ? "Planning visible — plusieurs créneaux à venir"
      : member.planningStatus === "partial"
        ? "Quelques dates annoncées"
        : "Peu ou pas de créneaux publics pour l’instant";

  const jumpTo = (tab: ModalTab) => setActiveTab(tab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button type="button" className={`absolute inset-0 ${theme.modalBackdrop}`} aria-label="Fermer" onClick={onClose} />
      <div
        className={`${theme.panel} ${theme.modalShell} relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:max-w-3xl sm:rounded-3xl lg:max-w-4xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={theme.panelOrbViolet} aria-hidden />
        <div className={theme.panelOrbGreen} aria-hidden />

        <div className={`${theme.panelInner} flex min-h-0 flex-1 flex-col`}>
        <div className={theme.modalHero}>
          <div className="pointer-events-none absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.avatar} alt="" className="h-full w-full scale-125 object-cover opacity-[0.2] blur-3xl saturate-150" />
            <div className={theme.modalHeroFade} />
          </div>

          <button type="button" onClick={onClose} className={`absolute right-3 top-3 z-20 ${theme.modalClose} sm:right-4 sm:top-4`} aria-label="Fermer la fenêtre">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="relative px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div
                  className={`rounded-2xl p-1 ${member.isLive ? "ring-2 ring-red-500/80 ring-offset-2 ring-offset-transparent animate-pulse" : "ring-1 ring-white/20"}`}
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.45)" }}
                >
                  <img
                    src={member.avatar}
                    alt=""
                    className="h-28 w-28 rounded-[0.85rem] border border-white/10 object-cover sm:h-32 sm:w-32"
                  />
                </div>
                {member.isVip ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                    {member.vipBadge || "VIP"}
                  </span>
                ) : null}
                {member.isLive ? (
                  <span className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                    <Radio className="h-3 w-3" aria-hidden />
                    Live
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className={`${theme.badgeViolet} mb-2`}>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Fiche TENF
                </p>
                <h2 id="member-modal-title" className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {member.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-sm text-zinc-400">@{member.twitchLogin}</span>
                  <button
                    type="button"
                    onClick={copyLogin}
                    className={`${theme.btnSecondary} !min-h-0 !px-2 !py-1 !text-[11px]`}
                  >
                    {copiedLogin ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedLogin ? "Copié" : "Copier le pseudo"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {publicRoleBadge ? (
                    <span className={publicRoleBadge.className}>{publicRoleBadge.label}</span>
                  ) : null}
                  {member.badges?.map((badge) => (
                    <span key={badge} className={getRoleBadgeClassName(badge)}>
                      {getRoleBadgeLabel(badge)}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2.5 py-0.5 text-[11px] text-zinc-300">
                    <Gamepad2 className="h-3 w-3 opacity-80" aria-hidden />
                    {member.mainGame || "Communauté"}
                  </span>
                </div>

                {followStatusConfig ? (
                  <p
                    className={`mt-3 inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium ${followStatusConfig.className}`}
                  >
                    <span aria-hidden>{followStatusConfig.icon}</span>
                    {followStatusConfig.label}
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                    Connecte-toi avec Twitch sur TENF pour voir si tu suis déjà ce créateur — et découvrir d’autres profils « à suivre ».
                  </p>
                )}
              </div>
            </div>

            {/* Raccourcis interactifs */}
            <div className="mt-5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <a
                href={twitchHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.btnPrimary} shrink-0 snap-start`}
              >
                <Radio className="h-4 w-4 opacity-90" aria-hidden />
                {twitchPrimaryLabel}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => jumpTo("planning")}
                className={`${theme.btnSecondary} shrink-0 snap-start`}
              >
                <CalendarDays className="h-4 w-4 text-emerald-300" aria-hidden />
                Planning
              </button>
              <button
                type="button"
                onClick={() => jumpTo("reseaux")}
                className={`${theme.btnSecondary} shrink-0 snap-start`}
              >
                <Share2 className="h-4 w-4 text-emerald-300" aria-hidden />
                Réseaux
              </button>
              <button
                type="button"
                onClick={() => jumpTo("soutien")}
                className={`${theme.btnSecondary} shrink-0 snap-start`}
              >
                <Heart className="h-4 w-4 text-emerald-300" aria-hidden />
                Soutien
              </button>
            </div>
          </div>
        </div>

        {contextBanner ? (
          <div className={theme.contextLiveBanner}>
            <p className="flex items-start gap-2.5">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-red-400" aria-hidden />
              <span>{contextBanner}</span>
            </p>
          </div>
        ) : null}

        <div className={`${theme.modalSection} !pb-2`} role="tablist" aria-label="Sections de la fiche membre">
          <div className={`${theme.glassInset} flex gap-1 overflow-x-auto p-1`}>
            {TAB_META.map((tab) => {
              const selected = activeTab === tab.id;
              const TabIcon =
                tab.id === "profil"
                  ? User
                  : tab.id === "soutien"
                    ? Heart
                    : tab.id === "activite"
                      ? Activity
                      : tab.id === "planning"
                        ? CalendarDays
                        : Share2;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={tab.hint}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${theme.modalTab} ${selected ? theme.modalTabActive : ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    <TabIcon className="h-3.5 w-3.5 opacity-85" aria-hidden />
                    {tab.label}
                  </span>
                  <span className={theme.modalTabHint}>{tab.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={theme.modalBody}>
          {activeTab === "profil" ? (
            <div className="space-y-4">
              <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4 sm:p-5`}>
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
                  <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
                  À propos
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-zinc-500">
                  La bio peut contenir du markdown façon Discord — parfait pour capter le ton du stream avant de passer sur Twitch.
                </p>
                <DiscordMarkdownPreview
                  content={member.description || ""}
                  emptyFallback="Ce créateur n’a pas encore rempli sa bio publique. Passe sur Twitch ou les réseaux pour mieux le·la connaître."
                />
              </div>
              <div className={`${theme.glassCard} ${theme.glassCardGreen} p-4 sm:p-5`}>
                <h3 className="mb-3 text-base font-bold text-white">Univers du stream</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => jumpTo("soutien")}
                    className="rounded-full border border-violet-500/35 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/20"
                  >
                    {member.isAffiliated ? "⭐ Affilié·e Twitch" : "🌱 En développement"}
                  </button>
                  {member.streamTags?.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-violet-400/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo("planning")}
                  className={`${theme.linkAccent} mt-4 inline-flex items-center gap-2 text-xs`}
                >
                  Voir les créneaux annoncés
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                </button>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded-xl border border-violet-500/50 px-4 py-2 text-sm font-medium text-violet-200"
                >
                  Modifier la description (admin)
                </button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "soutien" ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-zinc-400">
                Un follow ou une présence sur le live, ça compte. Voici les actions les plus directes pour soutenir{" "}
                <span className="font-semibold text-zinc-200">{member.name}</span> et la scène TENF.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={twitchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${theme.glassCard} ${theme.glassCardViolet} ${theme.glassCardInteractive} ${theme.actionCardLink} flex-col p-4`}
                >
                  <span className="flex items-center gap-2 text-lg font-black text-white">
                    <Radio className="h-5 w-5" aria-hidden />
                    Chaîne Twitch
                  </span>
                  <span className="mt-2 text-xs text-violet-100/80">Ouvre le live, les VOD et les clips.</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white">
                    Y aller
                    <ExternalLink className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </a>
                <Link
                  href="/lives/calendrier"
                  className={`${theme.glassCard} ${theme.glassCardGreen} ${theme.glassCardInteractive} ${theme.actionCardLink} flex-col p-4`}
                >
                  <span className="flex items-center gap-2 text-base font-bold text-white">
                    <CalendarDays className="h-5 w-5 text-emerald-300" aria-hidden />
                    Planning global TENF
                  </span>
                  <span className="mt-2 text-xs text-zinc-400">Repère d’autres créateurs et événements communautaires.</span>
                  <span className={`${theme.linkAccent} mt-3 text-sm`}>Voir le calendrier →</span>
                </Link>
              </div>
              {followStatusConfig ? (
                <div className={`${theme.glassInset} p-4 text-center`}>
                  <p className="text-xs font-medium text-zinc-400">Ton statut sur cette chaîne</p>
                  <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${followStatusConfig.className}`}>
                    <span aria-hidden>{followStatusConfig.icon}</span>
                    {followStatusConfig.label}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "activite" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Indicateurs publics pour situer le rythme du créateur — les stats Discord détaillées sont surtout utiles aux membres déjà sur le serveur.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Activity className="h-4 w-4 text-emerald-400" aria-hidden />
                    Rythme
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">
                    {member.isActiveThisWeek ? "🔥 Actif·ve cette semaine" : "🌙 Plus calme en ce moment"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo("planning")}
                  className={`${theme.glassCard} ${theme.glassCardGreen} ${theme.glassCardInteractive} p-4 text-left`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <CalendarDays className="h-4 w-4 text-emerald-400" aria-hidden />
                    Annonces
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">{planningSummary}</p>
                  <p className={`${theme.linkAccent} mt-1 text-xs`}>Ouvrir l’onglet planning</p>
                </button>
                <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Heart className="h-4 w-4 text-emerald-400" aria-hidden />
                    Communauté
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">Chaque visite sur Twitch aide la visibilité TENF.</p>
                </div>
              </div>

              {member.discordId ? (
                <div className="rounded-2xl border border-[#5865F2]/35 bg-[#5865F2]/10 p-4">
                  <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-white">
                    <MessageCircle className="h-4 w-4 text-[#5865F2]" aria-hidden />
                    Aperçu Discord (mois en cours)
                  </h3>
                  <p className="mb-4 text-xs text-zinc-400">Données Statbot lorsqu’elles sont disponibles.</p>
                  {loadingDiscordStats ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5865F2] border-t-transparent" />
                    </div>
                  ) : discordStats ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                        <MessageCircle className="mx-auto h-4 w-4 text-[#5865F2]" aria-hidden />
                        <div className="mt-2 text-[10px] font-medium uppercase text-zinc-500">Messages</div>
                        <div className="text-xl font-black text-white">{discordStats.messages.toLocaleString("fr-FR")}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                        <Mic2 className="mx-auto h-4 w-4 text-[#5865F2]" aria-hidden />
                        <div className="mt-2 text-[10px] font-medium uppercase text-zinc-500">Vocal</div>
                        <div className="text-xl font-black text-white">{Math.round(discordStats.voiceMinutes / 60)}h</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                        <Trophy className="mx-auto h-4 w-4 text-amber-400" aria-hidden />
                        <div className="mt-2 text-[10px] font-medium uppercase text-zinc-500">Rang</div>
                        <div className="text-xl font-black text-white">#{discordStats.rank}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-zinc-400">Pas de données pour cette période.</p>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-zinc-500">
                  Pas de lien Discord public sur cette fiche.
                </p>
              )}
            </div>
          ) : null}

          {activeTab === "planning" ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Les créateurs mettent à jour leur grille quand ils le souhaitent — pense à vérifier Twitch pour les imprévus.
              </p>
              {loadingStreamPlannings ? (
                <div className="flex flex-col items-center gap-2 py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  <span className="text-sm text-zinc-500">Chargement du planning…</span>
                </div>
              ) : (
                <StreamPlanningCalendar
                  plannings={streamPlannings}
                  emptyMessage="Aucun créneau public pour l’instant. Un clic sur « Ouvrir Twitch » reste le meilleur moyen de voir si un live est annoncé."
                />
              )}
            </div>
          ) : null}

          {activeTab === "reseaux" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Liens laissés par le créateur — idéal pour suivre les annonces hors Twitch.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {member.socials?.discord ? (
                  <Link
                    href={member.socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-[#5865F2]/40 bg-[#5865F2]/15 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-[#5865F2]/25"
                  >
                    <span className="font-bold text-white">Discord</span>
                    <ExternalLink className="h-4 w-4 text-[#5865F2] opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ) : null}
                {member.socials?.instagram ? (
                  <Link
                    href={member.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-pink-500/35 bg-gradient-to-br from-purple-600/20 to-pink-600/15 px-4 py-4 transition hover:-translate-y-0.5"
                  >
                    <span className="font-bold text-white">Instagram</span>
                    <ExternalLink className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ) : null}
                {member.socials?.twitter ? (
                  <Link
                    href={member.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-sky-500/35 bg-sky-500/10 px-4 py-4 transition hover:-translate-y-0.5"
                  >
                    <span className="font-bold text-white">Twitter / X</span>
                    <ExternalLink className="h-4 w-4 text-sky-400 opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ) : null}
                {member.socials?.tiktok ? (
                  <Link
                    href={member.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-4 transition hover:-translate-y-0.5"
                  >
                    <span className="font-bold text-white">TikTok</span>
                    <ExternalLink className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ) : null}
                {member.socials?.youtube ? (
                  <Link
                    href={member.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-red-500/35 bg-red-600/15 px-4 py-4 transition hover:-translate-y-0.5"
                  >
                    <span className="font-bold text-white">YouTube</span>
                    <ExternalLink className="h-4 w-4 text-red-400 opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
              {!member.socials?.discord &&
              !member.socials?.instagram &&
              !member.socials?.twitter &&
              !member.socials?.tiktok &&
              !member.socials?.youtube ? (
                <div className={`${theme.emptyState} p-8`}>
                  <Share2 className="mx-auto h-10 w-10 text-zinc-600" aria-hidden />
                  <p className="mt-3 text-sm text-zinc-400">Aucun réseau renseigné sur cette fiche pour le moment.</p>
                  <a
                    href={twitchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.linkAccent} mt-4 inline-flex items-center gap-2 text-sm`}
                  >
                    Retourner sur Twitch
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              ) : null}
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded-xl border border-violet-500/50 px-3 py-2 text-xs font-medium text-violet-200"
                >
                  + Ajouter (admin)
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className={theme.modalFooter}>
          <button type="button" onClick={onClose} className={`${theme.btnSecondary} flex-1 sm:flex-none`}>
            Fermer
          </button>
          <a href={twitchHref} target="_blank" rel="noopener noreferrer" className={`${theme.btnPrimary} flex-1 sm:flex-none`}>
            {twitchPrimaryLabel}
            <ExternalLink className="h-4 w-4 opacity-90" aria-hidden />
          </a>
        </footer>
        </div>
      </div>
    </div>
  );
}
