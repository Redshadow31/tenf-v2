import type { DiscoverClip } from "@/components/decouvrir/types";

export function formatViews(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function styleLabel(style: DiscoverClip["style"]): string {
  if (style === "best-of") return "Best-of";
  if (style === "educatif") return "Éducatif";
  if (style === "epic") return "Epic";
  return "Fun";
}

export function styleChipClass(style: DiscoverClip["style"]): string {
  if (style === "best-of") return "bg-amber-500/90 text-black";
  if (style === "educatif") return "bg-sky-600/95 text-white";
  if (style === "epic") return "bg-violet-600/95 text-white";
  return "bg-emerald-600/95 text-white";
}

export function categoryLabel(category: DiscoverClip["category"]): string {
  if (category === "gaming") return "Gaming";
  if (category === "just-chatting") return "Discussion";
  if (category === "irl") return "IRL";
  return "Autre";
}
