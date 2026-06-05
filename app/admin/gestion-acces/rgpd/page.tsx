"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import RgpdMemberWorkspace from "@/components/admin/gestion-acces/RgpdMemberWorkspace";
import { administrationSiteHubNav } from "@/lib/admin/gestionAccesNav";

export default function AdminRgpdPage() {
  return (
    <div className="min-h-screen bg-[#0a0b10] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <AdminHeader
          title="RGPD — accès & effacement"
          navLinks={administrationSiteHubNav("/admin/gestion-acces/rgpd")}
        />
        <RgpdMemberWorkspace canErase={false} />
      </div>
    </div>
  );
}
