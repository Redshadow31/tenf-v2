export type EventItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  isPublished?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  isMaskedForAudience?: boolean;
  remainingSeats?: number | null;
  formationCategory?: string | null;
};

export function calendarUrlForEvent(event: EventItem): string {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return "/evenements";

  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const formatUtc = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = `${event.description || "Evenement communautaire TENF"}\n\n${typeof window !== "undefined" ? window.location.origin : ""}/evenements`;
  const location = event.location || "Discord TENF";

  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function categoryColor(category: string): string {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("spotlight")) {
    return "border-violet-400/35 bg-violet-500/15 text-violet-100";
  }
  if (normalized.includes("film")) {
    return "border-sky-400/35 bg-sky-500/12 text-sky-100";
  }
  if (normalized.includes("formation")) {
    return "border-emerald-400/35 bg-emerald-500/12 text-emerald-100";
  }
  if (normalized.includes("jeu")) {
    return "border-amber-400/35 bg-amber-500/12 text-amber-100";
  }
  if (normalized.includes("apero")) {
    return "border-pink-400/40 bg-pink-500/15 text-pink-100";
  }

  return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100";
}

export function categoryDotColor(category: string): string {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("spotlight")) return "bg-violet-300";
  if (normalized.includes("film")) return "bg-sky-300";
  if (normalized.includes("formation")) return "bg-emerald-300";
  if (normalized.includes("jeu")) return "bg-amber-300";
  if (normalized.includes("apero")) return "bg-pink-300";
  return "bg-fuchsia-300";
}

export function formatHour(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function getUrgencyLabel(date: string): string | null {
  const eventDate = new Date(date).getTime();
  if (Number.isNaN(eventDate)) return null;

  const diffMs = eventDate - Date.now();
  if (diffMs < 0) return null;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "C'est aujourd'hui";
  if (diffDays === 1) return "C'est demain";
  if (diffDays <= 7) return `Dans ${diffDays} jours`;
  return null;
}

export function getStatusBadge(eventDate: string): { label: string; className: string } {
  const ts = new Date(eventDate).getTime();
  const now = Date.now();

  if (Number.isNaN(ts)) {
    return {
      label: "Date à confirmer",
      className: "border-white/15 bg-white/5 text-zinc-300",
    };
  }

  if (ts < now) {
    return {
      label: "Terminé",
      className: "border-white/12 bg-white/5 text-zinc-400",
    };
  }

  const diffHours = Math.floor((ts - now) / (1000 * 60 * 60));
  if (diffHours <= 48) {
    return {
      label: "Bientôt",
      className: "border-pink-400/35 bg-pink-500/12 text-pink-100",
    };
  }

  return {
    label: "À venir",
    className: "border-violet-400/35 bg-violet-500/12 text-violet-100",
  };
}
