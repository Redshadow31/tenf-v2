import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Boutique TENF",
  description:
    "Merch et goodies officiels TENF New Family : soutien aux projets communautaires, collections créateurs, drops et petits prix — pour tous et pour les membres.",
};

export default function BoutiqueLayout({ children }: { children: ReactNode }) {
  return children;
}
