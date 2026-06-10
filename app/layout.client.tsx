"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserSidebar from "@/components/UserSidebar";
import MemberGlobalNotificationHint from "@/components/MemberGlobalNotificationHint";
import ConnectionTracker from "@/components/ConnectionTracker";
import PwaSplashScreen from "@/components/PwaSplashScreen";
import { MemberDesktopNavProvider, useMemberDesktopNav } from "@/contexts/MemberDesktopNavContext";
import { MemberSidebarSearchProvider } from "@/contexts/MemberSidebarSearchContext";
import MemberSidebarExpandRail from "@/components/member/navigation/MemberSidebarExpandRail";
import { isMemberSidebarFullContext } from "@/lib/navigation/memberSidebar";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useMobilePublicViewport } from "@/lib/hooks/useMobileViewport";

type ClientLayoutProps = {
  children: ReactNode;
};

type MemberSiteLayoutProps = {
  children: ReactNode;
  isMobileViewport: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
};

function MemberSiteLayout({
  children,
  isMobileViewport,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}: MemberSiteLayoutProps) {
  const pathname = usePathname();
  const isMemberArea = Boolean(pathname?.startsWith("/member") || pathname?.startsWith("/membres"));
  const isFullMemberSidebar = isMemberSidebarFullContext(pathname);
  const shouldRenderDesktopSidebar = !isMobileViewport;
  const shouldRenderMobileSidebarTrigger = isMobileViewport && isMemberArea;
  const shouldRenderMobileSidebar = isMobileViewport && isMobileSidebarOpen;

  const { effectiveDesktopCollapsed, prefersReducedMotion } = useMemberDesktopNav();

  const FULL_WIDTH_PATHS = [
    "/guides/tenf",
    "/guides/partie-publique",
    "/guides/espace-membre",
    "/partenariats",
    "/a-propos",
    "/fonctionnement-tenf/comment-ca-marche",
    "/changelog",
    "/organisation-staff",
    "/remerciements",
    "/contact",
  ] as const;
  const FULL_WIDTH_EXACT_PATHS = [
    "/membres",
    "/lives",
    "/lives/calendrier",
    "/charte",
    "/evenements",
    "/evenements-communautaires",
    "/new-family-aventura",
    "/vip",
    "/avis-tenf",
    "/member/dashboard",
    "/decouvrir-createurs",
    "/mentions-legales",
    "/confidentialite",
    "/propriete-intellectuelle",
  ] as const;
  /** Pages membres bento / inbox : pleine largeur du `<main>` (pas de max-w-7xl). */
  const isMemberBentoPage = Boolean(
    pathname?.startsWith("/member/dashboard") ||
      pathname?.startsWith("/member/profil") ||
      pathname?.startsWith("/member/planning") ||
      pathname?.startsWith("/membres/planning") ||
      pathname?.startsWith("/member/raids") ||
      pathname?.startsWith("/member/engagement") ||
      pathname?.startsWith("/member/activite") ||
      pathname?.startsWith("/member/formations") ||
      pathname?.startsWith("/member/notifications"),
  );
  const isFullWidthPage =
    pathname === "/" ||
    (!!pathname && FULL_WIDTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) ||
    (!!pathname && FULL_WIDTH_EXACT_PATHS.some((p) => pathname === p)) ||
    isMemberBentoPage;
  const mainClassName = isFullWidthPage
    ? "flex-1 min-w-0 w-full"
    : "flex-1 min-w-0 mx-auto max-w-7xl w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8";

  const sidebarWidthClass = isFullMemberSidebar
    ? "w-[min(20rem,100%)] max-w-[22rem]"
    : "w-[min(14rem,100%)] max-w-[16rem]";

  const sidebarWrapperClass =
    "relative z-20 min-w-0 shrink-0 overflow-hidden border-r " +
    (effectiveDesktopCollapsed
      ? "w-0 max-w-0 border-transparent opacity-0 xl:pointer-events-none"
      : `${sidebarWidthClass} opacity-100`) +
    (prefersReducedMotion ? "" : " xl:transition-[width,opacity] xl:duration-200 xl:ease-out");

  return (
    <MemberSidebarSearchProvider>
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <Header
        onOpenMemberSidebar={shouldRenderMobileSidebarTrigger ? () => setIsMobileSidebarOpen(true) : undefined}
        onCloseMemberSidebar={shouldRenderMobileSidebarTrigger ? () => setIsMobileSidebarOpen(false) : undefined}
        isMemberSidebarOpen={shouldRenderMobileSidebar && isMobileSidebarOpen}
        memberAreaHref={isMobileViewport && !isMemberArea ? "/member/dashboard" : undefined}
        showMemberMenuInBurger={isMemberArea}
      />
      <div className="flex min-w-0 flex-1 overflow-x-hidden pb-14">
        {shouldRenderDesktopSidebar ? (
          <div
            className={sidebarWrapperClass}
            style={{
              borderColor: effectiveDesktopCollapsed ? "transparent" : "var(--color-sidebar-border)",
            }}
          >
            <div className={`h-full min-h-0 ${sidebarWidthClass}`}>
              <UserSidebar />
            </div>
          </div>
        ) : null}
        <main className={mainClassName}>{children}</main>
      </div>
      {shouldRenderMobileSidebar ? (
        <div className="fixed inset-0 z-[70] flex xl:hidden" role="dialog" aria-modal="true" aria-label="Panneau membre">
          <button
            type="button"
            className="absolute inset-0 h-full w-full animate-[member-sidebar-backdrop-fade_0.2s_ease-out]"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Fermer le panneau membre"
          />
          <UserSidebar
            className="relative z-10 h-full w-[min(20rem,90vw)] max-w-[22rem] overflow-y-auto shadow-2xl animate-[member-sidebar-slide-in_0.25s_ease-out]"
            onNavigate={() => setIsMobileSidebarOpen(false)}
            onRequestClose={() => setIsMobileSidebarOpen(false)}
            showMobileCloseButton={true}
          />
        </div>
      ) : null}
      <MemberSidebarExpandRail />
      <MemberGlobalNotificationHint />
      <Footer />
    </div>
    </MemberSidebarSearchProvider>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isMobileViewport = useMobilePublicViewport();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useBodyScrollLock(isMobileSidebarOpen && isMobileViewport);

  useEffect(() => {
    if (!isMobileViewport) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

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

  return (
    <SessionProvider>
      <ThemeProvider>
        <PwaSplashScreen />
        <ConnectionTracker />
        <MemberDesktopNavProvider>
          <MemberSiteLayout
            isMobileViewport={isMobileViewport}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          >
            {children}
          </MemberSiteLayout>
        </MemberDesktopNavProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

