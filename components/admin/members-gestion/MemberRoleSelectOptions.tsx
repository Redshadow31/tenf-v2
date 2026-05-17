import { MEMBER_ROLE_PICKER_GROUPS, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

/** Options de rôle groupées (staff / communauté) pour les &lt;select&gt;. */
export function MemberRoleSelectOptions() {
  return (
    <>
      {MEMBER_ROLE_PICKER_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.keys.map((role) => (
            <option key={role} value={role}>
              {getRoleBadgeLabel(role)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
