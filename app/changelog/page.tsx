import type { Metadata } from "next";
import ChangelogPageClient from "./ChangelogPageClient";

export const metadata: Metadata = {
  title: "Quoi de neuf sur TENF — nouveautés du site",
  description:
    "Récap mois par mois : ce qui change pour les membres et viewers, et ce qui aide l’équipe d’animation — sans jargon, du premier hiver sur le site jusqu’aux envies pour l’été.",
  alternates: {
    canonical: "https://tenf-community.com/changelog",
  },
};

export default function ChangelogPage() {
  return <ChangelogPageClient />;
}
