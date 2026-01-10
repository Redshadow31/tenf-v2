"use client";

import React, { useState } from "react";
import { 
  Twitch, 
  MessageCircle, 
  Instagram, 
  Music2, 
  Twitter,
  Calendar,
  TrendingUp,
  Mic,
  MessageSquare,
  Users,
  FileText
} from "lucide-react";
import { getRoleBadgeStyles } from "@/lib/roleColors";

// ============================================
// DONNÉES MOCK
// ============================================

const mockMemberProfile = {
  displayName: "Streamer Exemple",
  twitchLogin: "streamerexemple",
  role: "Affilié",
  memberId: "MEM-2024-001",
  avatar: "https://via.placeholder.com/120x120/9146ff/ffffff?text=SE",
  bio: "Streamer passionné et membre actif de la New Family depuis 2023.",
  memberSince: "Janvier 2023",
  socials: {
    twitch: "",
    discord: "",
    instagram: "",
    tiktok: "",
    twitter: "",
  },
  tenfSummary: {
    role: "Affilié",
    status: "Actif",
    integration: {
      integrated: true,
      date: "15/03/2023",
    },
    parrain: "NeXou31",
  },
};

const mockMonthlyStats = {
  raidsTENF: 10,
  spotlightPresence: {
    present: 2,
    total: 15,
    rate: 13,
  },
  messagesRanking: {
    rank: 20,
    lastUpdate: "17/01/2026",
  },
  vocalRanking: {
    rank: 8,
    lastUpdate: "17/01/2026",
  },
};

const mockChannelDescription = {
  text: "",
  status: "Non soumis" as "Non soumis" | "En attente" | "Validé",
  characterCount: 0,
  maxCharacters: 800,
};

// ============================================
// COMPOSANTS
// ============================================

interface SocialLinkFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
}

function SocialLinkField({ icon, label, value, placeholder }: SocialLinkFieldProps) {
  const isEmpty = !value.trim();

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <label className="flex-shrink-0 text-sm font-medium min-w-[80px]" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded border text-sm bg-transparent"
        style={{ 
          borderColor: 'var(--color-border)', 
          color: 'var(--color-text)',
          cursor: 'not-allowed',
          opacity: 0.7,
        }}
      />
      {isEmpty && (
        <span className="flex-shrink-0 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
          Non renseigné
        </span>
      )}
    </div>
  );
}

interface MonthlyStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function MonthlyStatCard({ icon, title, value, subtitle, color = "#9146ff" }: MonthlyStatCardProps) {
  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            {title}
          </h3>
        </div>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
      </div>
      {subtitle && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface ProfileHeaderCardProps {
  member: typeof mockMemberProfile;
}

function ProfileHeaderCard({ member }: ProfileHeaderCardProps) {
  const roleStyles = getRoleBadgeStyles(member.role);

  return (
    <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section gauche : Avatar + Infos */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <img
                src={member.avatar}
                alt={member.displayName}
                className="w-24 h-24 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--color-primary)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                {member.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: roleStyles.bg,
                    color: roleStyles.text,
                    borderColor: roleStyles.border || roleStyles.bg,
                  }}
                >
                  {member.role}
                </span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                  ID : {member.memberId}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {member.bio}
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <Calendar className="w-4 h-4" />
                <span>Membre depuis {member.memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite : Réseaux */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Réseaux
          </h2>
          <div className="space-y-2">
            <SocialLinkField
              icon={<Twitch className="w-5 h-5" />}
              label="Twitch"
              value={member.socials.twitch}
              placeholder="twitch.tv/username ou username"
            />
            <SocialLinkField
              icon={<MessageCircle className="w-5 h-5" />}
              label="Discord"
              value={member.socials.discord}
              placeholder="Pseudo Discord ou URL"
            />
            <SocialLinkField
              icon={<Instagram className="w-5 h-5" />}
              label="Instagram"
              value={member.socials.instagram}
              placeholder="@username"
            />
            <SocialLinkField
              icon={<Music2 className="w-5 h-5" />}
              label="TikTok"
              value={member.socials.tiktok}
              placeholder="@username"
            />
            <SocialLinkField
              icon={<Twitter className="w-5 h-5" />}
              label="X/Twitter"
              value={member.socials.twitter}
              placeholder="@username"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChannelDescriptionCardProps {
  description: typeof mockChannelDescription;
}

function ChannelDescriptionCard({ description }: ChannelDescriptionCardProps) {
  const [localText, setLocalText] = useState(description.text);
  const characterCount = localText.length;
  const isOverLimit = characterCount > description.maxCharacters;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "En attente":
        return { bg: "#f59e0b20", text: "#f59e0b", border: "#f59e0b30" };
      case "Validé":
        return { bg: "#10b98120", text: "#10b981", border: "#10b98130" };
      default:
        return { bg: "var(--color-surface)", text: "var(--color-text-secondary)", border: "var(--color-border)" };
    }
  };

  // Le statut reste fixe pour l'UI (pas de logique de soumission)
  const currentStatus = description.status;
  const statusStyle = getStatusBadgeStyle(currentStatus);

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Descriptif de chaîne
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Tu pourras proposer un descriptif personnalisé. Il sera soumis à validation par les admins avant affichage public.
        </p>
      </div>

      <div className="mb-4">
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          placeholder="Décris ta chaîne, ton univers, tes jeux préférés, tes objectifs de stream... (max 800 caractères)"
          maxLength={description.maxCharacters}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border resize-none text-sm transition-colors"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: isOverLimit ? '#dc2626' : 'var(--color-border)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          onFocus={(e) => {
            if (!isOverLimit) {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isOverLimit ? '#dc2626' : 'var(--color-border)';
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${isOverLimit ? 'text-red-400' : ''}`} style={{ color: isOverLimit ? '#dc2626' : 'var(--color-text-secondary)' }}>
            {characterCount} / {description.maxCharacters} caractères
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderColor: statusStyle.border,
            }}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      <button
        disabled
        className="px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
        style={{ 
          backgroundColor: 'transparent',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }
        }}
      >
        Proposer mon descriptif
      </button>
    </div>
  );
}

interface TenfSummaryCardProps {
  summary: typeof mockMemberProfile.tenfSummary;
}

function TenfSummaryCard({ summary }: TenfSummaryCardProps) {
  const roleStyles = getRoleBadgeStyles(summary.role);
  const statusColor = summary.status === "Actif" ? "#10b981" : "#6b7280";

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
        Résumé TENF
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Rôle actuel
          </label>
          <span
            className="inline-block px-3 py-2 rounded-full text-sm font-semibold border"
            style={{
              backgroundColor: roleStyles.bg,
              color: roleStyles.text,
              borderColor: roleStyles.border || roleStyles.bg,
            }}
          >
            {summary.role}
          </span>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Statut
          </label>
          <span
            className="inline-block px-3 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}30`,
            }}
          >
            {summary.status}
          </span>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Intégration
          </label>
          <div className="space-y-1">
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {summary.integration.integrated ? "Oui" : "Non"}
            </span>
            {summary.integration.integrated && summary.integration.date && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Date : {summary.integration.date}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Parrain/Marraine
          </label>
          <span className="text-sm" style={{ color: 'var(--color-text)' }}>
            {summary.parrain || "Non renseigné"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function MyProfilePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* En-tête de page */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Mon Profil
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Gérez vos informations personnelles et consultez vos statistiques TENF
          </p>
        </div>

        {/* Header profil */}
        <div className="mb-8">
          <ProfileHeaderCard member={mockMemberProfile} />
        </div>

        {/* Stats du mois en cours */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
            TENF — Mois en cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MonthlyStatCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Raids TENF"
              value={mockMonthlyStats.raidsTENF}
              subtitle="Raids effectués ce mois"
              color="#9146ff"
            />
            <MonthlyStatCard
              icon={<Users className="w-5 h-5" />}
              title="Présence Spotlight"
              value={`${mockMonthlyStats.spotlightPresence.rate}%`}
              subtitle={`${mockMonthlyStats.spotlightPresence.present}/${mockMonthlyStats.spotlightPresence.total} spotlights`}
              color="#10b981"
            />
            <MonthlyStatCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Classement Messages"
              value={`#${mockMonthlyStats.messagesRanking.rank}`}
              subtitle={`Dernière MAJ : ${mockMonthlyStats.messagesRanking.lastUpdate}`}
              color="#5865F2"
            />
            <MonthlyStatCard
              icon={<Mic className="w-5 h-5" />}
              title="Classement Vocaux"
              value={`#${mockMonthlyStats.vocalRanking.rank}`}
              subtitle={`Dernière MAJ : ${mockMonthlyStats.vocalRanking.lastUpdate}`}
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Descriptif de chaîne */}
        <div className="mb-8">
          <ChannelDescriptionCard description={mockChannelDescription} />
        </div>

        {/* Résumé TENF */}
        <div className="mb-8">
          <TenfSummaryCard summary={mockMemberProfile.tenfSummary} />
        </div>
      </div>
    </div>
  );
}

