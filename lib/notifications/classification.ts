import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * Audience UI (ce que le membre voit). Sépare clairement Personnel / Communauté / Staff.
 * Différent des audiences DB (`community_broadcast`, `member_direct`, `admin_access`) mais dérivé d’elles.
 */
export type NotificationAudienceUI = "personal" | "community" | "staff";

/** Catégorie UI (utilisée pour l’icône / la couleur / le filtre fin). */
export type NotificationCategoryUI = "agenda" | "annonce" | "compte" | "staff" | "system";

export type NotificationDescriptor = {
  /** Audience UI (groupe principal d’onglet). */
  audience: NotificationAudienceUI;
  /** Catégorie UI fine. */
  category: NotificationCategoryUI;
  /** Libellé court à afficher dans un chip. */
  label: string;
  /** Icône Lucide associée à la catégorie. */
  icon: LucideIcon;
  /** Classe tailwind pour le chip (border / bg / text). */
  chipClass: string;
  /** Vrai si l’action utilisateur est attendue (rappel, validation, etc.). */
  actionable: boolean;
};

export type NotificationInput = {
  type: string;
  /** Audience d’origine (DB) — peut être absente sur d’anciens payloads. */
  audience?: string;
  link?: string | null;
};

const CATEGORY_STYLES: Record<NotificationCategoryUI, { icon: LucideIcon; chipClass: string }> = {
  agenda: {
    icon: CalendarClock,
    chipClass: "border-sky-400/35 bg-sky-500/10 text-sky-100 ring-1 ring-sky-400/15",
  },
  annonce: {
    icon: Megaphone,
    chipClass: "border-amber-400/35 bg-amber-500/10 text-amber-100 ring-1 ring-amber-400/15",
  },
  compte: {
    icon: ClipboardCheck,
    chipClass: "border-violet-400/35 bg-violet-500/10 text-violet-100 ring-1 ring-violet-400/15",
  },
  staff: {
    icon: ShieldAlert,
    chipClass: "border-rose-400/35 bg-rose-500/10 text-rose-100 ring-1 ring-rose-400/15",
  },
  system: {
    icon: Bell,
    chipClass: "border-white/12 bg-white/[0.05] text-zinc-200 ring-1 ring-white/8",
  },
};

const STAFF_AUDIENCES = new Set(["admin_access"]);
const COMMUNITY_AUDIENCES = new Set(["community_broadcast"]);
const PERSONAL_AUDIENCES = new Set(["member_direct"]);

/** Mapping explicite type → catégorie/audience UI (à compléter quand de nouveaux types arrivent). */
const TYPE_MAP: Record<string, { category: NotificationCategoryUI; label: string; actionable: boolean }> = {
  server_announcement: { category: "annonce", label: "Annonce", actionable: false },
  profile_validation_pending: { category: "staff", label: "Profils à valider", actionable: true },
  registration_reminder_eve: { category: "agenda", label: "Rappel agenda", actionable: true },
  registration_reminder_day: { category: "agenda", label: "Rappel agenda", actionable: true },
};

function resolveAudience(dbAudience: string | undefined, category: NotificationCategoryUI): NotificationAudienceUI {
  if (dbAudience && STAFF_AUDIENCES.has(dbAudience)) return "staff";
  if (category === "staff") return "staff";
  if (dbAudience && COMMUNITY_AUDIENCES.has(dbAudience)) return "community";
  if (dbAudience && PERSONAL_AUDIENCES.has(dbAudience)) return "personal";
  return category === "annonce" ? "community" : "personal";
}

export function classifyNotification(input: NotificationInput): NotificationDescriptor {
  const mapped = TYPE_MAP[input.type];
  const category: NotificationCategoryUI = mapped?.category ?? "system";
  const label = mapped?.label ?? "Information";
  const actionable = mapped?.actionable ?? Boolean(input.link);
  const style = CATEGORY_STYLES[category];
  const audience = resolveAudience(input.audience, category);
  return {
    audience,
    category,
    label,
    icon: style.icon,
    chipClass: style.chipClass,
    actionable,
  };
}

export const NOTIFICATION_AUDIENCE_LABELS: Record<NotificationAudienceUI, string> = {
  personal: "Personnel",
  community: "Communauté",
  staff: "Staff",
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategoryUI, string> = {
  agenda: "Agenda",
  annonce: "Annonces",
  compte: "Compte",
  staff: "Staff",
  system: "Information",
};
