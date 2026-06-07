import type { CharterPayload } from "@/lib/admin/account/adminAccountTypes";

export const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

export const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-[#0a0c10]";

export function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export function firstNameFromDisplay(displayName: string | null | undefined): string {
  const trimmed = (displayName || "").trim();
  if (!trimmed) return "toi";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function formatDateFr(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function charterTimelinePercent(charter: CharterPayload): number {
  if (charter.accepted) return 100;
  const end = new Date(charter.deadlineIso).getTime();
  const start = end - FIFTEEN_DAYS_MS;
  const now = Date.now();
  const raw = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, raw));
}

export function getTimeGreeting(): "Bonjour" | "Bon après-midi" | "Bonsoir" {
  const hour = new Date().getHours();
  if (hour >= 18) return "Bonsoir";
  if (hour >= 12) return "Bon après-midi";
  return "Bonjour";
}
