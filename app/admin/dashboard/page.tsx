import type { Metadata } from "next";
import AdminDashboardView from "@/components/admin/dashboard/AdminDashboardView";

export const metadata: Metadata = {
  title: "Tableau de bord — Administration",
  description:
    "Cockpit staff TENF : priorités modération, accompagnement par rôle et signaux communauté.",
};

export default function DashboardPage() {
  return <AdminDashboardView />;
}
