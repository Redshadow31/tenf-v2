"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoleBadgeStyles } from "@/lib/roleColors";

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
  const [discordStats, setDiscordStats] = useState<{
    messages: number;
    voiceMinutes: number;
    rank: number;
  } | null>(null);
  const [loadingDiscordStats, setLoadingDiscordStats] = useState(false);

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

  if (!isOpen) return null;

  // Utiliser la fonction utilitaire pour les couleurs de rôles
  const getBadgeColor = (role: string) => getRoleBadgeStyles(role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border p-8"
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
              className="inline-block rounded-lg px-4 py-1 text-sm font-bold"
              style={{
                backgroundColor: getBadgeColor(member.role).bg,
                color: getBadgeColor(member.role).text,
                border: getBadgeColor(member.role).border ? `1px solid ${getBadgeColor(member.role).border}` : 'none',
              }}
            >
              {member.role}
            </span>
            
            {/* Badges personnalisés */}
            {member.badges && member.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {member.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-block rounded-lg px-3 py-1 text-xs font-semibold border"
                    style={{
                      backgroundColor: 'rgba(145, 70, 255, 0.2)',
                      color: '#c084fc',
                      borderColor: 'rgba(145, 70, 255, 0.3)',
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description Twitch */}
          <div className="w-full space-y-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Description</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {member.description ||
                "Aucune description disponible pour le moment."}
            </p>
            {isAdmin && (
              <button className="mt-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-medium)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; }}>
                Modifier la description
              </button>
            )}
          </div>

          {/* Lien Twitch */}
          <div className="w-full space-y-3">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Chaîne Twitch</h3>
            <Link
              href={`https://www.twitch.tv/${member.twitchLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
              Voir sur Twitch
            </Link>
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

