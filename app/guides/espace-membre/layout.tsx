import type { ReactNode } from "react";
import GuideMemberShell from "@/components/guides/espace-membre/GuideMemberShell";

export default function GuideEspaceMembreLayout({ children }: { children: ReactNode }) {
  return <GuideMemberShell>{children}</GuideMemberShell>;
}
