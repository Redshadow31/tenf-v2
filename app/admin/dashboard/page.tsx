import type { Metadata } from "next";
import { Dashboard2View } from "@/components/admin/dashboard/Dashboard2View";

export const metadata: Metadata = {
  title: "Tableau de bord — Administration",
  description:
    "Vue TENF pour le staff : expérience membre, files modération (raids, Discord, événements) et pilotage administrateur.",
};

export default function DashboardPage() {
  return <Dashboard2View />;
}
