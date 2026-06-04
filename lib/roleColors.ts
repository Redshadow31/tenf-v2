import { MemberRole } from "./memberRoles";
import { getRoleBadgeClassName, getRoleBadgeVariant } from "./roleBadgeSystem";

const INLINE_STYLES_BY_VARIANT: Record<string, { bg: string; text: string; border?: string }> = {
  newcomer: { bg: "#31124f", text: "#f3e8ff", border: "#9333ea" },
  "active-affilie": { bg: "rgba(154, 174, 219, 0.18)", text: "#dbe7ff", border: "rgba(154, 174, 219, 0.55)" },
  "active-dev": { bg: "rgba(184, 115, 51, 0.2)", text: "#ffd7b0", border: "rgba(184, 115, 51, 0.5)" },
  "active-support": { bg: "linear-gradient(120deg, rgba(124, 58, 237, 0.22), rgba(215, 190, 240, 0.24))", text: "#f3e8ff", border: "rgba(193, 144, 242, 0.55)" },
  "minor-creator": { bg: "rgba(255, 61, 165, 0.22)", text: "#ffd4ec", border: "rgba(255, 61, 165, 0.55)" },
  "minor-community": { bg: "rgba(34, 227, 165, 0.2)", text: "#d6fff2", border: "rgba(34, 227, 165, 0.55)" },
  community: { bg: "rgba(6, 182, 212, 0.18)", text: "#cffafe", border: "rgba(6, 182, 212, 0.55)" },
  "staff-founder": { bg: "linear-gradient(120deg, rgba(126, 52, 232, 0.35), rgba(167, 139, 250, 0.28))", text: "#faf5ff", border: "rgba(196, 181, 253, 0.62)" },
  "staff-coordinator": { bg: "linear-gradient(120deg, rgba(124, 58, 237, 0.3), rgba(52, 211, 153, 0.26))", text: "#ecfdf5", border: "rgba(110, 231, 183, 0.5)" },
  "staff-moderator": { bg: "linear-gradient(120deg, rgba(139, 92, 246, 0.32), rgba(124, 58, 237, 0.26))", text: "#ede9fe", border: "rgba(167, 139, 250, 0.55)" },
  "staff-autonomie": { bg: "linear-gradient(120deg, rgba(147, 51, 234, 0.28), rgba(52, 211, 153, 0.18))", text: "#e9d5ff", border: "rgba(192, 132, 252, 0.52)" },
  "staff-accompagnement": { bg: "linear-gradient(120deg, rgba(167, 139, 250, 0.28), rgba(192, 132, 252, 0.22))", text: "#f5f3ff", border: "rgba(216, 180, 254, 0.52)" },
  "staff-decouverte": { bg: "linear-gradient(120deg, rgba(34, 197, 94, 0.22), rgba(110, 231, 183, 0.2))", text: "#d1fae5", border: "rgba(134, 239, 172, 0.52)" },
  "staff-trainee": { bg: "linear-gradient(120deg, rgba(167, 139, 250, 0.26), rgba(139, 92, 246, 0.22))", text: "#f3e8ff", border: "rgba(216, 180, 254, 0.48)" },
  "staff-reduced": { bg: "linear-gradient(120deg, rgba(113, 113, 122, 0.22), rgba(161, 161, 170, 0.16))", text: "#e4e4e7", border: "rgba(161, 161, 170, 0.42)" },
  "staff-paused": { bg: "linear-gradient(120deg, rgba(82, 82, 91, 0.16), rgba(113, 113, 122, 0.12))", text: "#d4d4d8", border: "rgba(161, 161, 170, 0.34)" },
  contributor: { bg: "linear-gradient(120deg, rgba(45, 212, 191, 0.24), rgba(124, 58, 237, 0.18))", text: "#ccfbf1", border: "rgba(45, 212, 191, 0.52)" },
  vip: { bg: "linear-gradient(120deg, rgba(234, 179, 8, 0.28), rgba(245, 158, 11, 0.22))", text: "#fef9c3", border: "rgba(253, 224, 71, 0.58)" },
  default: { bg: "rgba(148, 163, 184, 0.2)", text: "#e2e8f0", border: "rgba(148, 163, 184, 0.52)" },
};

export function getRoleBadgeStyles(role: string): { bg: string; text: string; border?: string } {
  const variant = getRoleBadgeVariant(role);
  return INLINE_STYLES_BY_VARIANT[variant] || INLINE_STYLES_BY_VARIANT.default;
}

export function getRoleBadgeClasses(role: MemberRole | string): string {
  return getRoleBadgeClassName(role);
}

