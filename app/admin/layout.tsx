"use client";

import { useState, type ReactNode } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Footer from "@/components/Footer";
import { AdminNavAccessProvider } from "@/components/admin/AdminNavAccessContext";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: AdminLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <AdminNavAccessProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <AdminTopBar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />
        <div className="flex">
          <AdminSidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
          <main className="flex-1 p-4 md:p-6 pb-16 overflow-auto min-h-[calc(100vh-5rem)]">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </AdminNavAccessProvider>
  );
}
