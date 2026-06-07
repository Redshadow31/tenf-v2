"use client";

import ProfileChecklistPanel from "@/components/member/profil/ProfileChecklistPanel";
import ProfileMetaPanel from "@/components/member/profil/ProfileMetaPanel";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";

type ProfileStatusStackProps = {
  model: MemberProfileModel;
  validationStatus: string;
};

/** Colonne droite : checklist + validation empilées sans étirement forcé. */
export default function ProfileStatusStack({ model, validationStatus }: ProfileStatusStackProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-[clamp(0.55rem,1vw,1.15rem)]">
      <ProfileChecklistPanel model={model} compact />
      <ProfileMetaPanel model={model} status={validationStatus} compact />
    </div>
  );
}
