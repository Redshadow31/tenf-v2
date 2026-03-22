"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Compass, Heart, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type RaidEntry = {
  id: string;
  source: "manual" | "raids_sub";
  eventAt: string;
  targetLogin: string;
  targetLabel: string;
  viewers: number | null;
  raidStatus: "validated" | "pending" | "rejected";
  raidStatusLabel: string;
  pointsStatus: "awarded" | "pending";
  pointsStatusLabel: string;
  note: string | null;
};

type RaidHistoryResponse = {
  month: string;
  months: string[];
  entries: RaidEntry[];
  summary: {
    total: number;
    validated: number;
    pending: number;
    rejected: number;
    pointsAwarded: number;
    pointsPending: number;
  };
};

const TENF_VALUES = [
  {
    title: "Bienveillance active",
    description: "Chaque raid est un geste de soutien concret. On celebre les efforts, pas la perfection.",
    icon: Heart,
  },
  {
    title: "Ouverture et inclusion",
    description: "On valorise la diversite des styles, des tailles de chaine et des parcours de streaming.",
    icon: Users,
  },
  {
    title: "Esprit de progression",
    description: "Un raid construit des ponts durables: decouverte, entraide et evolution collective.",
    icon: Compass,
  },
];

const RAID_GUIDELINES = [
  "Presenter la cible avec respect et contexte avant le raid.",
  "Encourager le chat a adopter une attitude positive et accueillante.",
  "Favoriser les createurs peu raides pour amplifier la solidarite TENF.",
  "Transformer chaque raid en opportunite de connexion humaine.",
];

const RECEIVED_RAID_GUIDELINES = [
  "Accueillir la communaute entrante avec un message chaleureux et inclusif.",
  "Prendre 20 secondes pour remercier publiquement le streamer raider.",
  "Presenter l univers de la chaine sans surjouer: naturel, clair et authentique.",
  "Inviter les nouveaux a interagir sans pression et avec bienveillance.",
];

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function statusRaidBadge(status: RaidEntry["raidStatus"]) {
  if (status === "validated") {
    return { border: "rgba(52,211,153,0.45)", bg: "rgba(52,211,153,0.12)", color: "#34d399" };
  }
  if (status === "rejected") {
    return { border: "rgba(248,113,113,0.45)", bg: "rgba(248,113,113,0.12)", color: "#f87171" };
  }
  return { border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.12)", color: "#facc15" };
}

function statusPointsBadge(status: RaidEntry["pointsStatus"]) {
  if (status === "awarded") {
    return { border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.12)", color: "#93c5fd" };
  }
  return { border: "rgba(167,139,250,0.45)", bg: "rgba(167,139,250,0.12)", color: "#c4b5fd" };
}

function sourceBadge(source: RaidEntry["source"]) {
  if (source === "manual") {
    return {
      label: "Source: declaration manuelle",
      border: "rgba(250,204,21,0.45)",
      bg: "rgba(250,204,21,0.12)",
      color: "#fde68a",
    };
  }
  return {
    label: "Source: raids-sub automatique",
    border: "rgba(96,165,250,0.45)",
    bg: "rgba(96,165,250,0.12)",
    color: "#93c5fd",
  };
}

function raidCardStyle(status: RaidEntry["raidStatus"]) {
  if (status === "validated") {
    return {
      borderColor: "rgba(52,211,153,0.35)",
      backgroundColor: "rgba(17,37,33,0.55)",
    };
  }
  if (status === "rejected") {
    return {
      borderColor: "rgba(248,113,113,0.35)",
      backgroundColor: "rgba(61,24,24,0.45)",
    };
  }
  return {
    borderColor: "rgba(250,204,21,0.35)",
    backgroundColor: "rgba(60,49,22,0.45)",
  };
}

function formatRaidDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

export default function MemberRaidHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [months, setMonths] = useState<string[]>([]);
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [summary, setSummary] = useState<RaidHistoryResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      setLoading(true);
      try {
        setError("");
        const response = await fetch(`/api/members/me/raids-history?month=${encodeURIComponent(selectedMonth)}`, {
          cache: "no-store",
        });
        const body = (await response.json()) as RaidHistoryResponse & { error?: string };
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Tu dois etre connecte pour voir ton historique.");
          }
          if (response.status === 404) {
            throw new Error("Profil membre introuvable. Contacte un admin TENF.");
          }
          throw new Error(body.error || "Impossible de charger l'historique.");
        }
        setRaids(body.entries || []);
        setSummary(body.summary || null);
        setMonths(body.months || []);
      } finally {
        setLoading(false);
      }
    })().catch((e) => {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
      setRaids([]);
      setSummary(null);
      setMonths([]);
    });
  }, [selectedMonth]);

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes raids" description="Historique consolidé de tes raids." badge="Historique" />

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.18), rgba(22,23,30,0.96) 42%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
              Espace raids TENF
            </p>
            <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Pilotage simple et humain de tes raids
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Visualise ton impact mensuel et garde le cap sur les valeurs TENF: respect, ouverture, entraide.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <label className="mb-1 block text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
              Mois
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(10,10,14,0.55)", color: "var(--color-text)" }}
            >
              {(months.length > 0 ? months : [selectedMonth]).map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Raids du mois" value={summary?.total ?? 0} icon={<Sparkles size={15} />} />
        <Card label="Raids valides" value={summary?.validated ?? 0} icon={<ShieldCheck size={15} />} />
        <Card label="Points attribues" value={summary?.pointsAwarded ?? 0} icon={<Clock3 size={15} />} />
        <Card label="Raids en attente" value={summary?.pending ?? 0} icon={<Target size={15} />} />
      </section>

      {error ? (
        <section className="rounded-xl border p-4" style={{ borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(127,29,29,0.25)" }}>
          <p className="text-sm text-red-200">{error}</p>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TENF_VALUES.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-xl border p-4"
              style={{
                borderColor: "rgba(167,139,250,0.28)",
                background: "linear-gradient(160deg, rgba(31,41,55,0.65), rgba(22,24,34,0.92))",
              }}
            >
              <div className="mb-2 inline-flex rounded-lg border p-2" style={{ borderColor: "rgba(196,181,253,0.4)", color: "#c4b5fd" }}>
                <Icon size={16} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.title}
              </h3>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section
        className="rounded-xl border p-4"
        style={{
          borderColor: "rgba(59,130,246,0.32)",
          background: "linear-gradient(120deg, rgba(30,41,59,0.62), rgba(20,27,38,0.94))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Heart size={16} style={{ color: "#93c5fd" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Intention de raid TENF
          </h3>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Une ligne de conduite simple pour transmettre une energie bienveillante et ouverte a chaque raid.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
          {RAID_GUIDELINES.map((tip) => (
            <div
              key={tip}
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: "rgba(147,197,253,0.3)", backgroundColor: "rgba(15,23,42,0.46)", color: "var(--color-text)" }}
            >
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-xl border p-4"
        style={{
          borderColor: "rgba(52,211,153,0.32)",
          background: "linear-gradient(120deg, rgba(18,45,39,0.58), rgba(17,31,35,0.94))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Users size={16} style={{ color: "#6ee7b7" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Intention d accueil raid recu TENF
          </h3>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Quand un streamer nous raid, on transforme ce moment en experience positive, ouverte et memorable.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
          {RECEIVED_RAID_GUIDELINES.map((tip) => (
            <div
              key={tip}
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: "rgba(110,231,183,0.3)", backgroundColor: "rgba(16,38,34,0.46)", color: "var(--color-text)" }}
            >
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={16} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Timeline des raids
          </h3>
        </div>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Chargement des raids...</p>
        ) : raids.length === 0 ? (
          <div className="rounded-lg border px-4 py-4 text-sm" style={{ borderColor: "rgba(148,163,184,0.35)", backgroundColor: "rgba(15,23,42,0.4)" }}>
            <p style={{ color: "var(--color-text)" }}>Aucun raid trouve pour ce mois.</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Prochaine etape: cible un streamer a soutenir et partage la vibe TENF avec ton chat.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {raids.map((raid) => (
              <article
                key={raid.id}
                className="rounded-lg border px-3 py-3 text-sm"
                style={raidCardStyle(raid.raidStatus)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p style={{ color: "var(--color-text)" }}>
                    {raid.targetLabel}{" "}
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      ({raid.targetLogin || "inconnu"})
                    </span>
                  </p>
                  <span
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: sourceBadge(raid.source).border,
                      color: sourceBadge(raid.source).color,
                      backgroundColor: sourceBadge(raid.source).bg,
                    }}
                  >
                    {sourceBadge(raid.source).label}
                  </span>
                </div>

                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {formatRaidDate(raid.eventAt)}
                  {typeof raid.viewers === "number" ? ` - viewers: ${raid.viewers}` : ""}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: statusRaidBadge(raid.raidStatus).border,
                      color: statusRaidBadge(raid.raidStatus).color,
                      backgroundColor: statusRaidBadge(raid.raidStatus).bg,
                    }}
                  >
                    Statut raid: {raid.raidStatusLabel}
                  </span>
                  <span
                    className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: statusPointsBadge(raid.pointsStatus).border,
                      color: statusPointsBadge(raid.pointsStatus).color,
                      backgroundColor: statusPointsBadge(raid.pointsStatus).bg,
                    }}
                  >
                    Statut points: {raid.pointsStatusLabel}
                  </span>
                </div>

                {raid.note ? (
                  <p className="mt-2 rounded-md border px-2 py-1 text-xs" style={{ borderColor: "rgba(148,163,184,0.32)", color: "var(--color-text-secondary)" }}>
                    Note: {raid.note}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

function Card({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div className="mb-1 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </article>
  );
}
