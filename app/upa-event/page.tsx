import type { Metadata } from "next";
import "./upa-event.css";
import UpaEventLandingClient from "./UpaEventLandingClient";
import { getUpaEventConfig } from "@/lib/upaEvent/getUpaEventConfig";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UPA Event × TENF | Unis pour l'Avenir",
  description:
    "Rétrospective de l’édition caritative UPA × TENF : bilan, timeline, FAQ et liens — la mobilisation de cette édition est terminée ; les prochaines actions sur upa-event.fr.",
  alternates: {
    canonical: "https://tenf-community.com/upa-event",
  },
};

export default async function UpaEventPage() {
  const config = await getUpaEventConfig("upa-event");
  return <UpaEventLandingClient initialContent={config} />;
}
