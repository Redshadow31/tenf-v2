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

type ModalTab = "profil" | "soutien" | "activite" | "planning" | "reseaux";

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
  const [activeTab, setActiveTab] = useState<ModalTab>("profil");

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

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("profil");
  }, [isOpen, member.twitchLogin]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-lg border p-2 transition-colors"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
          aria-label="Fermer la modale"
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

        <div
          className="border-b px-6 py-5"
          style={{
            borderColor: "rgba(145, 70, 255, 0.30)",
            background:
              "linear-gradient(135deg, rgba(145, 70, 255, 0.18), rgba(59, 130, 246, 0.08) 55%, rgba(14, 165, 233, 0.08))",
          }}
        >
          <div className="flex items-start gap-4 pr-12">
            <div className="relative shrink-0">
              <img
                src={member.avatar}
                alt={member.name}
                className="h-20 w-20 rounded-2xl border object-cover"
                style={{ borderColor: "rgba(145, 70, 255, 0.50)" }}
              />
              {member.isVip ? (
                <div
                  className="absolute -bottom-2 -right-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {member.vipBadge || "VIP"}
                </div>
              ) : null}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {member.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                @{member.twitchLogin}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className={getRoleBadgeClassName(member.role)}>{getRoleBadgeLabel(member.role)}</span>
                {member.badges?.map((badge) => (
                  <span key={badge} className={getRoleBadgeClassName(badge)}>
                    {getRoleBadgeLabel(badge)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b px-6 py-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "profil", label: "Profil" },
              { id: "soutien", label: "Soutien" },
              { id: "activite", label: "Activite" },
              { id: "planning", label: "Planning" },
              { id: "reseaux", label: "Reseaux" },
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ModalTab)}
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: selected ? "rgba(145, 70, 255, 0.60)" : "var(--color-border)",
                    backgroundColor: selected ? "rgba(145, 70, 255, 0.18)" : "var(--color-surface)",
                    color: selected ? "var(--color-text)" : "var(--color-text-secondary)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "58vh" }}>
          {activeTab === "profil" ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Description
                </h3>
                <DiscordMarkdownPreview
                  content={member.description || ""}
                  emptyFallback="Aucune description disponible pour le moment."
                />
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Infos stream
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    🎮 {member.mainGame || "Communaute"}
                  </span>
                  <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {member.isAffiliated ? "⭐ Affilie" : "🌱 Developpement"}
                  </span>
                  {member.streamTags?.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-1"
                      style={{ borderColor: "rgba(145,70,255,0.45)", color: "var(--color-text)" }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              {isAdmin ? (
                <button
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  Modifier la description
                </button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "soutien" ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  💜 Soutenir ce createur
                </h3>
                {followStatusConfig ? (
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${followStatusConfig.className}`}>
                      {followStatusConfig.icon} {followStatusConfig.label}
                    </span>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href={`https://www.twitch.tv/${member.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    🚪 Ouvrir la porte
                  </Link>
                  <Link
                    href={`https://www.twitch.tv/${member.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    ⭐ Suivre sur Twitch
                  </Link>
                  <Link
                    href="/lives/calendrier"
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    📅 Voir le planning global
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "activite" ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Activite generale
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {member.isActiveThisWeek ? "🔥 Actif cette semaine" : "🌙 Activite plus calme"}
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {member.planningStatus === "shared"
                      ? "📅 Stream regulier"
                      : member.planningStatus === "partial"
                        ? "📅 Planning partiel"
                        : "📅 Planning non renseigne"}
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    💜 Soutien communautaire recommande
                  </div>
                </div>
              </div>

              {member.discordId ? (
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                    Activite Discord (ce mois-ci)
                  </h3>
                  {loadingDiscordStats ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5865F2]" />
                    </div>
                  ) : discordStats ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Messages</div>
                        <div className="text-xl font-bold" style={{ color: "#5865F2" }}>
                          {discordStats.messages.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Temps vocal</div>
                        <div className="text-xl font-bold" style={{ color: "#5865F2" }}>
                          {Math.round(discordStats.voiceMinutes / 60)}h
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Rang</div>
                        <div className="text-xl font-bold" style={{ color: "#5865F2" }}>
                          #{discordStats.rank}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm py-3" style={{ color: "var(--color-text-secondary)" }}>
                      Aucune donnee disponible pour ce mois.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "planning" ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
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
          ) : null}

          {activeTab === "reseaux" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  Reseaux du createur
                </h3>
                {isAdmin ? (
                  <button
                    className="rounded-lg border px-3 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                  >
                    + Ajouter
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
              {member.socials?.discord && (
                <Link
                  href={member.socials.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#5865F2" }}
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
                  style={{ backgroundColor: "#1DA1F2" }}
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
                  style={{ backgroundColor: "#000000" }}
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
                  style={{ backgroundColor: "#FF0000" }}
                >
                  YouTube
                </Link>
              )}
              {!member.socials?.discord &&
              !member.socials?.instagram &&
              !member.socials?.twitter &&
              !member.socials?.tiktok &&
              !member.socials?.youtube ? (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Aucun reseau social ajoute
                </p>
              ) : null}
            </div>
            </div>
          ) : null}
        </div>

        <div className="border-t px-6 py-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

