import Link from "next/link";
import { History } from "lucide-react";
import { HONORARY_ROLES_HIDDEN_ON_PUBLIC_DISCOVERY } from "@/lib/roleBadgeSystem";
import { isHonoraryStaffRole } from "@/lib/memberRoles";

/** Aide contextuelle admin quand le rôle « Ancien Staff TENF » est sélectionné. */
export function MemberHonoraryRoleHint({ role }: { role: string }) {
  if (!isHonoraryStaffRole(role)) return null;

  return (
    <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95">
      <p className="flex items-center gap-1.5 font-semibold text-amber-200">
        <History className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Rôle honorifique — Ancien Staff TENF
      </p>
      <p className="mt-1.5 text-amber-100/85">
        Reconnaissance d&apos;un investissement passé dans l&apos;équipe. Ce rôle n&apos;est pas compté comme staff actif
        (filtres, organigramme, stats ops).
      </p>
      {HONORARY_ROLES_HIDDEN_ON_PUBLIC_DISCOVERY ? (
        <p className="mt-1.5 text-amber-100/75">
          Sur l&apos;annuaire public et les lives, le badge staff n&apos;est pas affiché — la personne apparaît comme
          membre créateur classique. Sa reconnaissance est visible sur{" "}
          <Link href="/remerciements" className="font-semibold underline underline-offset-2 hover:text-white">
            /remerciements
          </Link>
          .
        </p>
      ) : (
        <p className="mt-1.5 text-amber-100/75">
          Le badge « Ancien Staff TENF » est également visible sur l&apos;annuaire et les lives (politique publique
          activée).
        </p>
      )}
      <p className="mt-1.5 text-amber-100/70">
        Pense à synchroniser le profil dans l&apos;organigramme staff (rôle <code className="text-[10px]">ANCIEN_STAFF_TENF</code>
        ) pour la page Remerciements.
      </p>
    </div>
  );
}
