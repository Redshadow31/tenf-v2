"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import ProfileSectionCard from "@/components/member/profil/ProfileSectionCard";

type PlanningItem = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
};

type ProfilePlanningSectionProps = {
  plannings: PlanningItem[];
  planningHref: string;
};

export default function ProfilePlanningSection({ plannings, planningHref }: ProfilePlanningSectionProps) {
  const sorted = [...plannings].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime(),
  );
  const upcoming = sorted.filter(
    (item) => new Date(`${item.date}T${item.time}:00`).getTime() >= Date.now(),
  );
  const preview = upcoming.slice(0, 6);
  const hasPlanning = upcoming.length > 0;

  return (
    <ProfileSectionCard
      id="planning"
      title="Mon planning de live"
      description={
        hasPlanning
          ? "Tes prochains créneaux affichés à la communauté et au staff."
          : "Pas encore de créneau renseigné — ajoute au moins une intention de live."
      }
      icon={CalendarDays}
      accentClassName="border-sky-400/35 bg-sky-500/10 text-sky-200"
      rightSlot={
        <Link
          href={planningHref}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[12px] font-bold text-violet-100 transition hover:border-violet-300/55 hover:bg-violet-500/20"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Modifier
        </Link>
      }
    >
      {!hasPlanning ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center text-zinc-500" style={{ fontSize: "clamp(0.82rem,0.9vw,0.9rem)" }}>
          Aucun créneau enregistré — la communauté ne sait pas quand venir te voir.
        </div>
      ) : (
        <ul className="grid gap-[clamp(0.4rem,0.6vw,0.6rem)] grid-cols-[repeat(auto-fit,minmax(min(10.5rem,100%),1fr))]">
          {preview.map((item) => {
            const dt = new Date(`${item.date}T${item.time}:00`);
            const dayLabel = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-violet-500/8 via-transparent to-transparent px-[clamp(0.7rem,0.95vw,1rem)] py-[clamp(0.55rem,0.8vw,0.85rem)] transition hover:border-violet-400/35"
              >
                <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-violet-400 via-fuchsia-400 to-violet-600" />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-300">{dayLabel}</p>
                <p className="mt-1 font-bold text-white" style={{ fontSize: "clamp(0.95rem,1.05vw,1.05rem)" }}>
                  {item.time}
                </p>
                <p className="mt-0.5 truncate text-zinc-400" style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}>
                  {item.liveType}
                  {item.title ? ` · ${item.title}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileSectionCard>
  );
}
