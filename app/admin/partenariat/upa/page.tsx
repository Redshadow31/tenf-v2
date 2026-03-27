"use client";

import Link from "next/link";
import AdminUpaEventPage from "@/app/admin/upa-event/page";

export default function AdminPartenariatUpaPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/upa-event" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Basculer vers la route historique /admin/upa-event
      </Link>
      <AdminUpaEventPage />
    </div>
  );
}
