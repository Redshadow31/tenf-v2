"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import UserSidebar from "@/components/UserSidebar";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLandingPage = pathname === "/upa-event";

  // Pour les routes admin, laisser le layout admin gérer l'affichage
  if (isAdmin) {
    return (
      <SessionProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SessionProvider>
    );
  }

  // Pages landing (UPA Event, etc.) : header visible, pas de sidebar, pleine largeur
  if (isLandingPage) {
    return (
      <SessionProvider>
        <ThemeProvider>
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
            <Header />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <Header />
          <div className="flex">
            <UserSidebar />
            <main className="flex-1 mx-auto max-w-7xl px-8 py-6">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

