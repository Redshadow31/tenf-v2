import type { ReactNode } from "react";
import GuidePublicShell from "@/components/guides/partie-publique/GuidePublicShell";

export default function GuidePartiePubliqueLayout({ children }: { children: ReactNode }) {
  return <GuidePublicShell>{children}</GuidePublicShell>;
}
