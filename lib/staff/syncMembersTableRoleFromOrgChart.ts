import { memberRepository } from "@/lib/repositories";
import { toCanonicalMemberRole, type MemberRole } from "@/lib/memberRoles";
import type { OrgChartRoleKey } from "@/lib/staff/orgChartTypes";

/** Alignement `members.role` (gestion membres / API publique) avec le rôle organigramme. */
export function memberRoleFromOrgChartRoleKey(roleKey: OrgChartRoleKey): MemberRole {
  switch (roleKey) {
    case "FONDATEUR":
      return "Admin";
    case "ADMIN_COORDINATEUR":
      return "Admin Coordinateur";
    case "MODERATEUR":
      return "Modérateur";
    case "MODERATEUR_EN_FORMATION":
      return "Modérateur en formation";
    case "MODERATEUR_EN_PAUSE":
      return "Modérateur en pause";
    case "SOUTIEN_TENF":
      return "Soutien TENF";
    default: {
      const _n: never = roleKey;
      return _n;
    }
  }
}

export async function syncMembersTableRoleFromOrgChart(input: {
  memberId: string;
  roleKey: OrgChartRoleKey;
  actorDiscordId: string;
}): Promise<{ updated: boolean; twitchLogin?: string }> {
  const member = await memberRepository.findById(input.memberId);
  if (!member) {
    console.warn("[syncMembersTableRoleFromOrgChart] Membre introuvable:", input.memberId);
    return { updated: false };
  }

  const targetRole = memberRoleFromOrgChartRoleKey(input.roleKey);
  const currentCanonical = toCanonicalMemberRole(member.role || "Affilié");
  if (currentCanonical === targetRole) {
    return { updated: false, twitchLogin: member.twitchLogin };
  }

  const roleHistory = member.roleHistory || [];
  await memberRepository.update(member.twitchLogin, {
    role: targetRole,
    roleManuallySet: true,
    roleHistory: [
      ...roleHistory,
      {
        fromRole: member.role,
        toRole: targetRole,
        changedAt: new Date().toISOString(),
        changedBy: input.actorDiscordId,
        reason: "Synchronisation depuis l'organigramme staff",
      },
    ],
    updatedBy: input.actorDiscordId,
    updatedAt: new Date(),
  });

  return { updated: true, twitchLogin: member.twitchLogin };
}
