"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import StreamPlanningCalendar, { type StreamPlanningCalendarItem } from "@/components/member/StreamPlanningCalendar";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";

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
    planningStatus?: "shared" | "partial" | "none";
    streamTags?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
};

export default function MemberModal({
  member,
  isOpen,
  onClose,
  isAdmin = false,
}: MemberModalProps) {
  const followStatusConfig =
    member.followStatus === "followed"
      ? {
          icon: "❤️",
          label: "Tu suis deja cette chaine",
          className: "bg-green-500/20 text-green-300 border border-green-500/30",
        }
      : member.followStatus === "not_followed"
        ? {
            icon: "🤍",
            label: "Tu ne suis pas encore cette chaine",
            className: "bg-gray-500/20 text-gray-200 border border-gray-500/30",
          }
        : member.followStatus === "unknown"
          ? {
              icon: "❔",
              label: "Statut follow inconnu",
              className: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
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

  // Charger les stats Discord si le membre a un discordId
  useEffect(() => {
    if (isOpen && member.discordId) {
      async function loadDiscordStats() {
        setLoadingDiscordStats(true);
        try {
          const response = await fetch('/api/statbot/data', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const memberStats = data.members?.find((m: any) => m.discordId === member.discordId);
            if (memberStats) {
              setDiscordStats({
                messages: memberStats.messages || 0,
                voiceMinutes: memberStats.voiceMinutes || 0,
                rank: memberStats.rank || 0,
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des stats Discord:', error);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border p-8 lg:max-w-4xl xl:max-w-5xl"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 transition-colors"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Contenu du modal */}
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Avatar avec badge VIP */}
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="h-32 w-32 rounded-full object-cover border-4"
              style={{ borderColor: 'var(--color-border)' }}
            />
            {member.isVip && (
              <div className="absolute -bottom-2 -right-2 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                {member.vipBadge || "VIP"}
              </div>
            )}
          </div>

          {/* Nom et badge rôle */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{member.name}</h2>
            <span
              className={getRoleBadgeClassName(member.role)}
            >
              {getRoleBadgeLabel(member.role)}
            </span>
            
            {/* Badges personnalisés */}
            {member.badges && member.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {member.badges.map((badge) => (
                  <span
                    key={badge}
                    className={getRoleBadgeClassName(badge)}
                  >
                    {getRoleBadgeLabel(badge)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description Twitch - aligné à gauche, retours à la ligne préservés */}
          <div className="w-full space-y-2 text-left">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Description</h3>
            <DiscordMarkdownPreview
              content={member.description || ""}
              emptyFallback="Aucune description disponible pour le moment."
            />
            {isAdmin && (
              <button className="mt-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-medium)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; }}>
                Modifier la description
              </button>
            )}
          </div>

          {/* Bloc soutien */}
          <div className="w-full space-y-3">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>💜 Soutenir ce créateur</h3>
            {followStatusConfig && (
              <div className="flex justify-center">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${followStatusConfig.className}`}>
                  {followStatusConfig.icon} {followStatusConfig.label}
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`https://www.twitch.tv/${member.twitchLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                🚪 Ouvrir la porte
              </Link>
              <Link
                href={`https://www.twitch.tv/${member.twitchLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                ⭐ Suivre sur Twitch
              </Link>
              <Link
                href="/lives/calendrier"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                📅 Voir le planning
              </Link>
            </div>
          </div>

          {/* Bloc infos */}
          <div className="w-full space-y-3 text-left">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Infos stream</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                🎮 {member.mainGame || "Communaute"}
              </span>
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {member.isAffiliated ? "⭐ Affilié" : "🌱 Développement"}
              </span>
              {member.streamTags && member.streamTags.length > 0
                ? member.streamTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-1"
                      style={{ borderColor: 'rgba(145,70,255,0.45)', color: 'var(--color-text)' }}
                    >
                      #{tag}
                    </span>
                  ))
                : null}
            </div>
          </div>

          {/* Bloc activité */}
          <div className="w-full space-y-3 text-left">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Activité</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {member.isActiveThisWeek ? "🔥 Actif cette semaine" : "🌙 Activité plus calme"}
              </div>
              <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {member.planningStatus === "shared"
                  ? "📅 Stream régulier"
                  : member.planningStatus === "partial"
                    ? "📅 Planning partiel"
                    : "📅 Planning non renseigné"}
              </div>
              <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                💜 Soutien communautaire recommandé
              </div>
            </div>
          </div>

          {/* Statistiques Discord du mois */}
          {member.discordId && (
            <div className="w-full space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Activité Discord (ce mois-ci)
              </h3>
              {loadingDiscordStats ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5865F2]"></div>
                </div>
              ) : discordStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg p-4 text-center border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Messages</div>
                    <div className="text-xl font-bold" style={{ color: '#5865F2' }}>
                      {discordStats.messages.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-4 text-center border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Temps vocal</div>
                    <div className="text-xl font-bold" style={{ color: '#5865F2' }}>
                      {Math.round(discordStats.voiceMinutes / 60)}h
                    </div>
                  </div>
                  <div className="rounded-lg p-4 text-center border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rang</div>
                    <div className="text-xl font-bold" style={{ color: '#5865F2' }}>
                      #{discordStats.rank}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  Aucune donnée disponible pour ce mois
                </div>
              )}
            </div>
          )}

          {/* Planning streams du membre */}
          <div className="w-full space-y-3 text-left">
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Planning des streams
            </h3>
            {loadingStreamPlannings ? (
              <div className="py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Chargement du planning...
              </div>
            ) : (
              <StreamPlanningCalendar
                plannings={streamPlannings}
                emptyMessage="Aucun planning stream public pour le moment."
              />
            )}
          </div>

          {/* Autres réseaux sociaux */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Autres réseaux
              </h3>
              {isAdmin && (
                <button className="rounded-lg px-3 py-1 text-xs font-medium transition-colors border" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-medium)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; }}>
                  + Ajouter
                </button>
            )}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {member.socials?.discord && (
                <Link
                  href={member.socials.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#5865F2' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4752C4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#5865F2';
                  }}
                >
                  Discord
                </Link>
              )}
              {member.socials?.instagram && (
                <Link
                  href={member.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Instagram
                </Link>
              )}
              {member.socials?.twitter && (
                <Link
                  href={member.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#1DA1F2' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a8cd8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1DA1F2';
                  }}
                >
                  Twitter
                </Link>
              )}
              {member.socials?.tiktok && (
                <Link
                  href={member.socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#000000' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }}
                >
                  TikTok
                </Link>
              )}
              {member.socials?.youtube && (
                <Link
                  href={member.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#FF0000' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#cc0000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF0000';
                  }}
                >
                  YouTube
                </Link>
              )}
              {(!member.socials?.discord &&
                !member.socials?.instagram &&
                !member.socials?.twitter &&
                !member.socials?.tiktok &&
                !member.socials?.youtube) && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Aucun réseau social ajouté
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

