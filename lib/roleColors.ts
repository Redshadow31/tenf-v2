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
  "staff-founder": { bg: "linear-gradient(120deg, rgba(183, 73, 202, 0.24), rgba(255, 72, 72, 0.24))", text: "#fff7db", border: "rgba(255, 214, 102, 0.65)" },
  "staff-coordinator": { bg: "linear-gradient(120deg, rgba(227, 100, 20, 0.24), rgba(177, 45, 69, 0.24))", text: "#ffe9df", border: "rgba(243, 147, 114, 0.62)" },
  "staff-moderator": { bg: "linear-gradient(120deg, rgba(214, 40, 40, 0.24), rgba(241, 146, 146, 0.24))", text: "#ffe5e5", border: "rgba(248, 183, 183, 0.62)" },
  "staff-trainee": { bg: "linear-gradient(120deg, rgba(239, 68, 68, 0.22), rgba(139, 92, 246, 0.22))", text: "#f9f5ff", border: "rgba(181, 151, 245, 0.62)" },
  "staff-reduced": { bg: "linear-gradient(120deg, rgba(156, 163, 175, 0.2), rgba(229, 231, 235, 0.2))", text: "#f3f4f6", border: "rgba(209, 213, 219, 0.58)" },
  "staff-paused": { bg: "linear-gradient(120deg, rgba(156, 163, 175, 0.18), rgba(229, 231, 235, 0.2))", text: "#f3f4f6", border: "rgba(209, 213, 219, 0.48)" },
  contributor: { bg: "rgba(45, 212, 191, 0.2)", text: "#ccfbf1", border: "rgba(45, 212, 191, 0.55)" },
  vip: { bg: "linear-gradient(120deg, rgba(145, 70, 255, 0.24), rgba(90, 50, 180, 0.24))", text: "#ede9fe", border: "rgba(167, 139, 250, 0.62)" },
  default: { bg: "rgba(148, 163, 184, 0.2)", text: "#e2e8f0", border: "rgba(148, 163, 184, 0.52)" },
};

export function getRoleBadgeStyles(role: string): { bg: string; text: string; border?: string } {
  const variant = getRoleBadgeVariant(role);
  return INLINE_STYLES_BY_VARIANT[variant] || INLINE_STYLES_BY_VARIANT.default;
}

export function getRoleBadgeClasses(role: MemberRole | string): string {
  return getRoleBadgeClassName(role);
}

