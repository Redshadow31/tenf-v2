"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import UserSidebar from "@/components/UserSidebar";
import ConnectionTracker from "@/components/ConnectionTracker";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isMemberArea = pathname?.startsWith("/member");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => setIsMobileViewport(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  // Pour les routes admin, laisser le layout admin gérer l'affichage
  if (isAdmin) {
    return (
      <SessionProvider>
        <ThemeProvider>
          <ConnectionTracker />
          {children}
        </ThemeProvider>
      </SessionProvider>
    );
  }

  const shouldRenderSidebar = !isMobileViewport || Boolean(isMemberArea);

  return (
    <SessionProvider>
      <ThemeProvider>
        <ConnectionTracker />
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <Header />
          <div className="flex">
            {shouldRenderSidebar ? <UserSidebar /> : null}
            <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

