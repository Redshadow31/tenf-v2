import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CircleDot,
  ClipboardList,
  Compass,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  Map,
  MessageSquare,
  Mic2,
  Network,
  PartyPopper,
  Radio,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Video,
  Workflow,
} from "lucide-react";

export type NavGroupTheme = {
  accent: string;
  icon: LucideIcon;
};

export const NAV_GROUP_THEME: Record<string, NavGroupTheme> = {
  decouvrir: { accent: "#6366f1", icon: Compass },
  communaute: { accent: "#22c55e", icon: Users },
  rejoindre: { accent: "#a855f7", icon: UserPlus },
  "tenf-plus": { accent: "#ec4899", icon: Sparkles },
};

const NAV_ITEM_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/a-propos": Info,
  "/fonctionnement-tenf/comment-ca-marche": Workflow,
  "/charte": ScrollText,
  "/fonctionnement-tenf/faq": HelpCircle,
  "/changelog": Sparkles,
  "/membres": Users,
  "/vip": Star,
  "/lives": Radio,
  "/lives/calendrier": CalendarDays,
  "/evenements": Calendar,
  "/evenements-communautaires": PartyPopper,
  "/new-family-aventura": Gift,
  "/avis-tenf": MessageSquare,
  "/interviews": Mic2,
  "/decouvrir-createurs": Video,
  "/rejoindre": LayoutDashboard,
  "/integration": Calendar,
  "/rejoindre/guide-integration": Map,
  "/rejoindre/faq": HelpCircle,
  "/guides/tenf": BookOpen,
  "/guides/espace-membre": FileText,
  "/guides/partie-publique": Compass,
  "/postuler": ClipboardList,
  "/academy": GraduationCap,
  "/organisation-staff": Network,
  "/organisation-staff/organigramme": Workflow,
  "/partenariats": HeartHandshake,
  "/partenaire-tenf": Heart,
  "/soutenir-tenf": Heart,
  "/boutique": ShoppingBag,
  "/contact": Mail,
};

export function getNavItemIcon(href: string): LucideIcon {
  return NAV_ITEM_ICONS[href] ?? CircleDot;
}
