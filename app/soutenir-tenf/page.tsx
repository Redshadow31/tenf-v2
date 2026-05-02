import type { Metadata } from "next";
import SoutenirTenfContent from "./SoutenirTenfContent";

export const metadata: Metadata = {
  title: "Soutenir TENF | TENF",
  description:
    "Un soutien facultatif pour accompagner Twitch Entraide New Family : bots, site web, événements et projets communautaires. Transparence et bienveillance.",
  alternates: {
    canonical: "https://tenf-community.com/soutenir-tenf",
  },
};

export default function SoutenirTenfPage() {
  return <SoutenirTenfContent />;
}
