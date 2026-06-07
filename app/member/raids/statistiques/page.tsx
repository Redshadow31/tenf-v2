import { redirect } from "next/navigation";

/** Ancienne page stats — fusionnée dans /member/raids/historique */
export default function MemberRaidStatsRedirectPage() {
  redirect("/member/raids/historique#raid-pilotage");
}
