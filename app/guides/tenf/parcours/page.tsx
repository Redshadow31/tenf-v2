import type { Metadata } from "next";
import GuideTenfParcoursView from "@/components/guides/tenf/GuideTenfParcoursView";

export const metadata: Metadata = {
  title: "Parcours découverte — guide TENF | TENF",
  description: "Parcours en 4 étapes pour découvrir la culture TENF : entraide, Spotlights, points et mise en pratique.",
  alternates: {
    canonical: "https://tenf-community.com/guides/tenf/parcours",
  },
};

export default function GuideTenfParcoursPage() {
  return <GuideTenfParcoursView />;
}
