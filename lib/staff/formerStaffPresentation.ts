import type { OrgChartEntry } from "@/lib/staff/orgChartTypes";

export const FORMER_STAFF_ACCENT = "#d4a853";
export const FORMER_STAFF_BORDER = "rgba(212, 168, 83, 0.42)";
export const FORMER_STAFF_ROLE_LABEL = "Ancien Staff TENF";

export function formerStaffDisplayBio(entry: OrgChartEntry): string {
  const custom = entry.bioShort?.trim();
  if (custom) return custom;

  const name = entry.member.displayName || entry.member.twitchLogin || "Cette personne";
  return `${name} a contribué à TENF en tant qu'ancien membre du staff. Son investissement fait partie de l'histoire de la communauté.`;
}

export function formerStaffInitials(entry: OrgChartEntry): string {
  const source = entry.member.displayName || entry.member.twitchLogin || "?";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
