import type { Metadata } from "next";
import FaqRejoindreClient from "./FaqRejoindreClient";

export const metadata: Metadata = {
  title: "FAQ — Rejoindre TENF",
  description:
    "Questions fréquentes pour rejoindre TENF : intégration, réunion, rôles, points et communauté. Contact staff depuis la page.",
  openGraph: {
    title: "FAQ — Rejoindre TENF",
    description: "Réponses sur le parcours d’intégration, le fonctionnement du serveur et la communauté TENF.",
  },
};

export default function RejoindreFaqPage() {
  return <FaqRejoindreClient />;
}
