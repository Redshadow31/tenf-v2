"use client";

import type { ReactNode } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import { DashboardAmbientBackground } from "@/components/member/dashboard/dashboardUi";

type MemberBentoRowProps = {
  children: ReactNode;
};

type MemberBentoCellProps = {
  span: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  children: ReactNode;
};

const SPAN_CLASS: Record<MemberBentoCellProps["span"], string> = {
  12: "lg:col-span-12",
  8: "lg:col-span-8",
  7: "lg:col-span-7",
  6: "lg:col-span-6",
  5: "lg:col-span-5",
  4: "lg:col-span-4",
  3: "lg:col-span-3",
};

type MemberBentoShellProps = {
  children: ReactNode;
  accentHex?: string;
  className?: string;
};

/** Enveloppe bento pleine largeur du `<main>` — padding fluide au zoom, sans plafond 120rem interne. */
export default function MemberBentoShell({ children, accentHex, className = "" }: MemberBentoShellProps) {
  return (
    <MemberSurface layout="fluid" wide fill>
      <div className={`relative w-full min-w-0 ${className}`}>
        {accentHex ? <DashboardAmbientBackground accentHex={accentHex} /> : null}
        <div className="relative flex w-full min-w-0 flex-col gap-[clamp(0.5rem,0.95vw,1.15rem)] md:gap-[clamp(0.6rem,1.05vw,1.25rem)]">
          {children}
        </div>
      </div>
    </MemberSurface>
  );
}

export function MemberBentoRow({ children, stretch = false }: MemberBentoRowProps & { stretch?: boolean }) {
  return (
    <div
      className={`grid w-full min-w-0 gap-[clamp(0.5rem,0.9vw,1rem)] md:gap-[clamp(0.55rem,1vw,1.1rem)] lg:grid-cols-12 ${stretch ? "lg:items-stretch" : "lg:items-start"}`}
    >
      {children}
    </div>
  );
}

export function MemberBentoCell({ span, children, stretch }: MemberBentoCellProps & { stretch?: boolean }) {
  return (
    <div
      className={`flex min-h-0 w-full min-w-0 flex-col ${stretch ? "h-full [&>*]:h-full" : "[&>*]:w-full"} ${SPAN_CLASS[span]}`}
    >
      {children}
    </div>
  );
}
