"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import UserSidebar from "@/components/UserSidebar";
import MemberGlobalNotificationHint from "@/components/MemberGlobalNotificationHint";
import ConnectionTracker from "@/components/ConnectionTracker";
import PwaSplashScreen from "@/components/PwaSplashScreen";

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isMemberArea = pathname?.startsWith("/member") || pathname?.startsWith("/membres");
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1279px)").matches;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1279px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    if (!isMobileViewport) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen, isMobileViewport]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Pour les routes admin, laisser le layout admin gérer l'affichage
  if (isAdmin) {
    return (
      <SessionProvider>
        <ThemeProvider>
          <PwaSplashScreen />
          <ConnectionTracker />
          {children}
        </ThemeProvider>
      </SessionProvider>
    );
  }

  const shouldRenderDesktopSidebar = !isMobileViewport;
  const shouldRenderMobileSidebarTrigger = isMobileViewport && Boolean(isMemberArea);
  const shouldRenderMobileSidebar = isMobileViewport && isMobileSidebarOpen;

  return (
    <SessionProvider>
      <ThemeProvider>
        <PwaSplashScreen />
        <ConnectionTracker />
        <div className="min-h-screen min-w-0 overflow-x-hidden" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <Header
            onOpenMemberSidebar={shouldRenderMobileSidebarTrigger ? () => setIsMobileSidebarOpen(true) : undefined}
            memberAreaHref={isMobileViewport && !isMemberArea ? "/member/dashboard" : undefined}
            showMemberMenuInBurger={isMemberArea}
          />
          <MemberGlobalNotificationHint />
          <div className="flex min-w-0 overflow-x-hidden">
            {shouldRenderDesktopSidebar ? <UserSidebar /> : null}
            <main className="flex-1 min-w-0 mx-auto max-w-7xl w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
          </div>
          {shouldRenderMobileSidebar ? (
            <div className="fixed inset-0 z-[70] xl:hidden flex" role="dialog" aria-modal="true" aria-label="Panneau membre">
              <button
                type="button"
                className="absolute inset-0 h-full w-full animate-[member-sidebar-backdrop-fade_0.2s_ease-out]"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Fermer le panneau membre"
              />
              <UserSidebar
                className="relative z-10 h-full w-72 max-w-[85vw] overflow-y-auto shadow-2xl animate-[member-sidebar-slide-in_0.25s_ease-out]"
                onNavigate={() => setIsMobileSidebarOpen(false)}
                onRequestClose={() => setIsMobileSidebarOpen(false)}
                showMobileCloseButton={true}
              />
            </div>
          ) : null}
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

