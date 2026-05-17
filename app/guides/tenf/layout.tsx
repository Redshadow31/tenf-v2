import type { ReactNode } from "react";
import GuideTenfShell from "@/components/guides/tenf/GuideTenfShell";

export default function GuideTenfLayout({ children }: { children: ReactNode }) {
  return <GuideTenfShell>{children}</GuideTenfShell>;
}
