"use client";

import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0e0e10] flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
