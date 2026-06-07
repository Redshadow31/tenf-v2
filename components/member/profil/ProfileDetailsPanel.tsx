"use client";

import Link from "next/link";
import { ChevronDown, Contact, Link2 } from "lucide-react";
import { useCallback, useState } from "react";
import ProfileSectionCard from "@/components/member/profil/ProfileSectionCard";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";

type Member = {
  twitchLogin: string;
  displayName: string;
  role: string;
  timezone?: string | null;
  bio: string;
  tenfSummary: { status: string };
  socials: { twitch: string; discord: string; instagram: string; tiktok: string; twitter: string };
};

type ProfileDetailsPanelProps = {
  member: Member;
};

const SOCIAL_LABELS = [
  ["Twitch", "twitch"],
  ["Discord", "discord"],
  ["Instagram", "instagram"],
  ["TikTok", "tiktok"],
  ["Twitter / X", "twitter"],
] as const;

export default function ProfileDetailsPanel({ member }: ProfileDetailsPanelProps) {
  const [openDetail, setOpenDetail] = useState<string | null>("identity");
  const toggle = useCallback(
    (key: string) => setOpenDetail((prev) => (prev === key ? null : key)),
    [],
  );

  const panels: {
    key: string;
    title: string;
    subtitle: string;
    body: React.ReactNode;
  }[] = [
    {
      key: "identity",
      title: "Identité créateur",
      subtitle: "Pseudo, rôle TENF, fuseau — ce qui structure ta présence.",
      body: (
        <div className="grid gap-[clamp(0.6rem,0.8vw,0.85rem)] grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))]">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-[clamp(0.75rem,1vw,1.15rem)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Compte</p>
            <ul
              className="mt-2 space-y-1.5 text-white/85"
              style={{ fontSize: "clamp(0.8rem,0.9vw,0.9rem)" }}
            >
              <li>
                <span className="text-white/45">Pseudo Twitch · </span>
                {member.twitchLogin}
              </li>
              <li>
                <span className="text-white/45">Nom affiché · </span>
                {member.displayName}
              </li>
              <li>
                <span className="text-white/45">Rôle TENF · </span>
                {member.role}
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-[clamp(0.75rem,1vw,1.15rem)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Serveur</p>
            <ul
              className="mt-2 space-y-1.5 text-white/85"
              style={{ fontSize: "clamp(0.8rem,0.9vw,0.9rem)" }}
            >
              <li>
                <span className="text-white/45">Statut · </span>
                {member.tenfSummary.status}
              </li>
              <li>
                <span className="text-white/45">Fuseau · </span>
                {member.timezone || "Non renseigné"}
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: "socials",
      title: "Réseaux & liens",
      subtitle: "Ce que tu affiches sur ta fiche — complète pour être retrouvable.",
      body: (
        <ul className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))]">
          {SOCIAL_LABELS.map(([label, key]) => {
            const value = member.socials[key];
            return (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</span>
                <span
                  className={"truncate font-medium " + (value ? "text-white" : "text-white/35")}
                  style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
                  title={value || undefined}
                >
                  {value || "À renseigner"}
                </span>
              </li>
            );
          })}
        </ul>
      ),
    },
    {
      key: "bio",
      title: "Bio & présentation",
      subtitle: "Markdown façon Discord — c’est ce qui raconte qui tu es aux autres membres.",
      body: (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/15 p-[clamp(0.85rem,1.1vw,1.2rem)]">
          <DiscordMarkdownPreview
            content={member.bio || ""}
            emptyFallback="Pas encore de bio — un bon moment pour te présenter en quelques lignes."
          />
        </div>
      ),
    },
  ];

  return (
    <ProfileSectionCard
      id="profile-details"
      kicker="Identité"
      title="Infos & bio"
      description="Identité, réseaux et présentation — trois volets repliables. Modifie via « Compléter mon profil »."
      icon={Contact}
      tone="neutral"
      rightSlot={
        <Link
          href="/member/profil/completer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[12px] font-bold text-violet-100 transition hover:border-violet-300/55 hover:bg-violet-500/20"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Modifier
        </Link>
      }
    >
      <div className="space-y-2">
        {panels.map((panel) => {
          const open = openDetail === panel.key;
          return (
            <div
              key={panel.key}
              className="overflow-hidden rounded-xl border border-white/[0.06]"
              style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
            >
              <button
                type="button"
                onClick={() => toggle(panel.key)}
                className="flex w-full items-center justify-between gap-4 px-[clamp(0.75rem,1vw,1.15rem)] py-3 text-left transition hover:bg-white/[0.04]"
                aria-expanded={open}
              >
                <div className="min-w-0">
                  <p
                    className="text-pretty font-bold text-white"
                    style={{ fontSize: "clamp(0.88rem,0.95vw,0.95rem)" }}
                  >
                    {panel.title}
                  </p>
                  <p
                    className="mt-0.5 text-pretty text-white/45"
                    style={{ fontSize: "clamp(0.72rem,0.78vw,0.78rem)" }}
                  >
                    {panel.subtitle}
                  </p>
                </div>
                <ChevronDown
                  className={"h-5 w-5 shrink-0 text-violet-400 transition-transform " + (open ? "rotate-180" : "")}
                  aria-hidden
                />
              </button>
              {open ? (
                <div className="border-t border-white/[0.06] px-[clamp(0.75rem,1vw,1.15rem)] py-[clamp(0.75rem,1vw,1.15rem)]">
                  {panel.body}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ProfileSectionCard>
  );
}
