import type { Metadata } from "next";
import { Dashboard2View } from "@/components/admin/dashboard/Dashboard2View";

export const metadata: Metadata = {
  title: "Pilotage serveur — Administration TENF",
  description:
    "Cockpit staff : files modération, pouls communauté Discord et pilotage opérationnel de l'entraide TENF.",
};

export default function PilotageServerPage() {
  return <Dashboard2View variant="pilotage" />;
}
