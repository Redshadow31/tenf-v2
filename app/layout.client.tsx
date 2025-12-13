"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import UserSidebar from "@/components/UserSidebar";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Pour les routes admin, laisser le layout admin gérer l'affichage
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e5e5e5]">
      <Header />
      <div className="flex">
        <UserSidebar />
        <main className="flex-1 mx-auto max-w-7xl px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

