"use client";



import { ArrowLeft, ArrowUpRight, FileText, UserCircle2 } from "lucide-react";

import type { ProfileCompleterViewModel } from "@/components/member/profil/completer/profileCompleterModel";

import {

  DashboardBadge,

  DashboardPanel,

  MEMBER_FOOTER_DIVIDER,

  MEMBER_HERO_TITLE,

  MEMBER_MESSAGE_BOX,

  MemberHeroStat,

  MemberProgressBar,

  MemberSecondaryLink,

} from "@/components/member/dashboard/dashboardUi";



type ProfileCompleterHeroProps = {

  model: ProfileCompleterViewModel;

};



export default function ProfileCompleterHero({ model }: ProfileCompleterHeroProps) {

  const {

    accent,

    welcomeKicker,

    welcomeTitle,

    welcomeMessage,

    completionPercent,

    identityDoneCount,

    identityTotal,

    hasPublicDescription,

    requiredIdentityReady,

  } = model;



  return (

    <DashboardPanel tone="accent" accentHex={accent} intensity="bold" className="h-full md:p-6">

      <div className="flex min-h-0 flex-1 flex-col gap-4">

        <div className="grid gap-4 xl:grid-cols-[1fr_11.5rem] xl:items-start">

          <div className="min-w-0 space-y-3.5">

            <div className="flex flex-wrap items-center gap-2">

              <DashboardBadge tone="accent" accentHex={accent}>

                {welcomeKicker}

              </DashboardBadge>

              <DashboardBadge tone="accent" accentHex={accent}>

                {completionPercent}% complété

              </DashboardBadge>

            </div>



            <h1 className={MEMBER_HERO_TITLE}>{welcomeTitle}</h1>



            <div className={MEMBER_MESSAGE_BOX}>

              <p className="text-sm leading-[1.65] text-white/78">{welcomeMessage}</p>

            </div>



            <MemberProgressBar percent={completionPercent} accentHex={accent} label="Progression globale" />

          </div>



          <div className="grid grid-cols-3 gap-2 xl:grid-cols-1 xl:gap-2.5">

            <MemberHeroStat

              icon={UserCircle2}

              label="Identité"

              value={`${identityDoneCount}/${identityTotal}`}

              accent={requiredIdentityReady ? "#22c55e" : accent}

            />

            <MemberHeroStat

              icon={FileText}

              label="Bio"

              value={hasPublicDescription ? "OK" : "Option"}

              accent={hasPublicDescription ? "#22c55e" : "#f472b6"}

            />

            <MemberHeroStat

              icon={ArrowUpRight}

              label="Envoi"

              value={requiredIdentityReady ? "Prêt" : "—"}

              accent={accent}

            />

          </div>

        </div>



        <div className={MEMBER_FOOTER_DIVIDER}>

          <MemberSecondaryLink href="/member/profil">

            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />

            Retour au profil

          </MemberSecondaryLink>

        </div>

      </div>

    </DashboardPanel>

  );

}


