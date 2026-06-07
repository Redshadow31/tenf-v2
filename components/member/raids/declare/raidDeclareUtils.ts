import { CheckCircle2, Clock3, Info, XCircle } from "lucide-react";

export const RAID_DECLARE_ACCENT = "#8b5cf6";

export const RAID_DECLARE_FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white placeholder:text-white/35 transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60";

export const RAID_DECLARE_FIELD_LABEL = "mb-1.5 block text-sm font-medium text-white/85";

export type RaidTargetSuggestion = {
  login: string;
  label: string;
  segment: "Actif" | "Nouveau membre" | "Inactif" | "Historique raids" | "Communaute";
  role?: "Moderateur" | "Staff" | "Membre";
};

export type DeclaredRaidRow = {
  id: string;
  target: string;
  date: string;
  note: string;
  status: "validated" | "processing" | "to_study" | "rejected";
  approximate: boolean;
};

export type LowRaidedSuggestion = {
  login: string;
  label: string;
  receivedCount: number;
};

export type DeclarationFilter = "all" | DeclaredRaidRow["status"];

export function getNowAsLocalInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatDeclarationStatus(status: DeclaredRaidRow["status"]) {
  if (status === "to_study") {
    return {
      label: "À étudier",
      border: "rgba(96,165,250,0.45)",
      color: "#93c5fd",
      bg: "rgba(96,165,250,0.12)",
      icon: Info,
    };
  }
  if (status === "validated") {
    return {
      label: "Validé",
      border: "rgba(52,211,153,0.45)",
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      icon: CheckCircle2,
    };
  }
  if (status === "rejected") {
    return {
      label: "Refusé",
      border: "rgba(248,113,113,0.45)",
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      icon: XCircle,
    };
  }
  return {
    label: "En traitement",
    border: "rgba(250,204,21,0.45)",
    color: "#facc15",
    bg: "rgba(250,204,21,0.12)",
    icon: Clock3,
  };
}

export function segmentBadgeClass(segment: string): string {
  switch (segment) {
    case "Actif":
      return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
    case "Nouveau membre":
      return "text-sky-300 border-sky-500/30 bg-sky-500/10";
    case "Inactif":
      return "text-white/45 border-white/10 bg-white/5";
    case "Historique raids":
      return "text-amber-300 border-amber-500/30 bg-amber-500/10";
    default:
      return "text-violet-300 border-violet-500/30 bg-violet-500/10";
  }
}

export function twitchChannelUrl(login: string): string {
  return `https://www.twitch.tv/${login.trim().toLowerCase()}`;
}

export function countDeclarationsByStatus(declarations: DeclaredRaidRow[]) {
  const base = { all: declarations.length, validated: 0, processing: 0, to_study: 0, rejected: 0 };
  for (const row of declarations) {
    if (row.status === "validated") base.validated += 1;
    else if (row.status === "processing") base.processing += 1;
    else if (row.status === "to_study") base.to_study += 1;
    else if (row.status === "rejected") base.rejected += 1;
  }
  return base;
}
