"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Heart, Info, Users } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
  MemberPrimaryLink,
} from "@/components/member/dashboard/dashboardUi";
import {
  INCOMING_PITFALLS,
  INCOMING_RAID_TIPS,
  OUTGOING_PITFALLS,
  OUTGOING_RAID_TIPS,
  RAID_CULTURE_INTRO,
  RAID_TWITCH_BASICS,
} from "@/components/member/raids/raidCultureContent";
import { RAID_HISTORY_ACCENT } from "@/components/member/raids/raidHistoryUtils";

export default function RaidHistoryCulturePanel() {
  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");

  const tips = tab === "outgoing" ? OUTGOING_RAID_TIPS : INCOMING_RAID_TIPS;
  const pitfalls = tab === "outgoing" ? OUTGOING_PITFALLS : INCOMING_PITFALLS;
  const tabAccent = tab === "outgoing" ? "#38bdf8" : "#34d399";

  return (
    <DashboardPanel
      id="raid-culture"
      tone="neutral"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="soft"
      ariaLabelledBy="raid-culture-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker={RAID_CULTURE_INTRO.kicker}
        title={RAID_CULTURE_INTRO.title}
        icon={Heart}
        tone="rose"
        accentHex="#f472b6"
        titleId="raid-culture-title"
      />

      <div className={MEMBER_MESSAGE_BOX}>
        <p className="text-sm font-medium leading-[1.65] text-white/90">{RAID_CULTURE_INTRO.lead}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{RAID_CULTURE_INTRO.footnote}</p>
      </div>

      <DashboardInnerCard hover={false} className="mt-3 !p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexToRgba("#38bdf8", 0.15), color: "#7dd3fc" }}
          >
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">{RAID_TWITCH_BASICS.title}</p>
            <ul className="mt-1.5 space-y-1">
              {RAID_TWITCH_BASICS.points.map((point, i) => (
                <li key={i} className="text-[11px] leading-snug text-white/58">
                  {point.text}
                  {point.emphasis ? (
                    <strong className="font-semibold text-white/82">{point.emphasis}</strong>
                  ) : null}
                  {point.suffix ?? ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardInnerCard>

      <div className="mt-3 flex gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setTab("outgoing")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
            tab === "outgoing" ? "bg-sky-500/15 text-sky-100" : "text-white/50 hover:text-white/75"
          }`}
        >
          <Heart className="h-3.5 w-3.5" aria-hidden />
          Quand tu envoies un raid
        </button>
        <button
          type="button"
          onClick={() => setTab("incoming")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
            tab === "incoming" ? "bg-emerald-500/15 text-emerald-100" : "text-white/50 hover:text-white/75"
          }`}
        >
          <Users className="h-3.5 w-3.5" aria-hidden />
          Quand tu es raidé·e
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/50">
        {tab === "outgoing"
          ? "Tu coupes ton live et tu veux soutenir quelqu'un ? Voici comment faire en sorte que ton raid aide vraiment — pas juste sur le papier."
          : "Des viewers arrivent d'une autre chaîne ? C'est une opportunité : bien gérée, elle agrandit ta commu sans trahir l'esprit TENF."}
      </p>

      <ol className="mt-3 space-y-2">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <li key={tip.id}>
              <DashboardInnerCard hover={false} className="!p-3">
                <div className="flex gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold"
                      style={{
                        backgroundColor: hexToRgba(tabAccent, 0.18),
                        color: tabAccent,
                      }}
                    >
                      {index + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-white/35" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-white">{tip.title}</p>
                    <p className="mt-1.5 text-xs leading-[1.6] text-white/68">{tip.body}</p>
                    {tip.example ? (
                      <p
                        className="mt-2 rounded-lg border px-2.5 py-2 text-[11px] italic leading-snug text-white/55"
                        style={{
                          borderColor: hexToRgba(tabAccent, 0.2),
                          backgroundColor: hexToRgba(tabAccent, 0.06),
                        }}
                      >
                        {tip.example}
                      </p>
                    ) : null}
                  </div>
                </div>
              </DashboardInnerCard>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-4 rounded-xl border px-3 py-3"
        style={{
          borderColor: hexToRgba("#f87171", 0.22),
          backgroundColor: hexToRgba("#f87171", 0.06),
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-300/90" aria-hidden />
          <p className="text-xs font-bold text-red-100/95">Pièges à éviter</p>
        </div>
        <ul className="mt-2 space-y-2">
          {pitfalls.map((pitfall) => (
            <li key={pitfall.id} className="text-[11px] leading-snug text-white/62">
              <span className="font-semibold text-white/82">{pitfall.label}</span>
              <span className="text-white/45"> — </span>
              {pitfall.detail}
            </li>
          ))}
        </ul>
      </div>

      {tab === "outgoing" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <MemberPrimaryLink href="/lives" accentHex={RAID_HISTORY_ACCENT}>
            Trouver un live TENF à raider
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </MemberPrimaryLink>
          <Link
            href="/member/raids/declarer"
            className="text-xs font-semibold text-white/45 underline-offset-2 transition hover:text-white/75 hover:underline"
          >
            Raid non détecté ? Signaler en secours
          </Link>
        </div>
      ) : null}
    </DashboardPanel>
  );
}
