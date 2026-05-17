import type { Metadata } from "next";
import ChangelogPageClient from "./ChangelogPageClient";

export const metadata: Metadata = {
  title: "Quoi de neuf sur TENF — nouveautés du site",
  description:
    "Récap mois par mois des nouveautés TENF : ce qui change pour les membres, viewers et streamers, et ce qui aide l'équipe d'animation — sans jargon, du premier hiver sur le site jusqu'aux envies pour l'été 2026.",
  alternates: {
    canonical: "https://tenf-community.com/changelog",
  },
};

export default function ChangelogPage() {
  return <ChangelogPageClient />;
}
