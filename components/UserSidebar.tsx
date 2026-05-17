"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, LogOut, Sparkles, X } from "lucide-react";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";
import { useMemberDesktopNavOptional } from "@/contexts/MemberDesktopNavContext";
import UserSidebarNav from "@/components/member/navigation/UserSidebarNav";
import UserSidebarMemberWelcome from "@/components/member/navigation/UserSidebarMemberWelcome";

type MemberOverviewPayload = {
  member?: { displayName?: string; role?: string; twitchLogin?: string | null };
  vip?: { activeThisMonth?: boolean };
};

type UserSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  onRequestClose?: () => void;
  showMobileCloseButton?: boolean;
};

export default function UserSidebar({
  className,
  onNavigate,
  onRequestClose,
  showMobileCloseButton = false,
}: UserSidebarProps) {
  const pathname = usePathname() || "";
  const desktopNav = useMemberDesktopNavOptional();

  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [twitchLinked, setTwitchLinked] = useState<boolean | null>(null);
  const [memberOverview, setMemberOverview] = useState<MemberOverviewPayload | null>(null);

  const loadUnreadNotificationsCount = useCallback(async () => {
    try {
      const response = await fetch("/api/members/me/notifications", { cache: "no-store" });
      if (!response.ok) {
        setUnreadNotifications(0);
        window.dispatchEvent(new CustomEvent("member-notifications-count", { detail: { count: 0 } }));
        return;
      }
      const data = await response.json();
      const n = Number(data?.unreadCount || 0);
      setUnreadNotifications(n);
      window.dispatchEvent(new CustomEvent("member-notifications-count", { detail: { count: n } }));
    } catch (error) {
      console.error("Error loading member notifications count:", error);
    }
  }, []);

  async function loadTwitchLinkStatus() {
    try {
      const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
      if (!response.ok) {
        setTwitchLinked(false);
        return;
      }
      const data = await response.json();
      setTwitchLinked(Boolean(data?.connected));
    } catch (error) {
      console.error("Error loading Twitch link status:", error);
      setTwitchLinked(false);
    }
  }

  async function loadMemberOverview() {
    try {
      const response = await fetch("/api/members/me/overview", { cache: "no-store" });
      if (!response.ok) {
        setMemberOverview(null);
        return;
      }
      const data = (await response.json()) as MemberOverviewPayload & { error?: string };
      if (data?.error) {
        setMemberOverview(null);
        return;
      }
      setMemberOverview({ member: data.member, vip: data.vip });
    } catch (error) {
      console.error("Error loading member overview:", error);
      setMemberOverview(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getDiscordUser();
        if (!cancelled) setDiscordUser(user);
      } catch (error) {
        console.error("Error resolving member session:", error);
        if (!cancelled) setDiscordUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!discordUser) {
      setHasAdminAccess(false);
      setTwitchLinked(null);
      setMemberOverview(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const roleResponse = await fetch("/api/user/role", { cache: "no-store" });
        if (cancelled) return;
        if (roleResponse.ok) {
          const data = await roleResponse.json();
          setHasAdminAccess(Boolean(data?.hasAdminAccess));
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }

      try {
        await loadUnreadNotificationsCount();
      } catch (error) {
        console.error("Error loading notifications count:", error);
      }

      if (cancelled) return;

      try {
        await loadTwitchLinkStatus();
      } catch (error) {
        console.error("Error loading Twitch link status:", error);
        setTwitchLinked(false);
      }

      if (cancelled) return;

      try {
        await loadMemberOverview();
      } catch (error) {
        console.error("Error loading member overview:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [discordUser, loadUnreadNotificationsCount]);

  useEffect(() => {
    const handler = () => {
      void loadUnreadNotificationsCount();
    };
    window.addEventListener("member-notifications-refresh", handler);
    return () => window.removeEventListener("member-notifications-refresh", handler);
  }, [loadUnreadNotificationsCount]);

  const handleDiscordLogin = () => {
    loginWithDiscord("/member/dashboard");
    onNavigate?.();
  };

  const handleLogout = async () => {
    await logoutDiscord();
    setDiscordUser(null);
    onNavigate?.();
    window.location.href = "/";
  };

  const asideClassName =
    `h-full min-h-0 w-full min-w-0 shrink-0 border-r p-5 sm:p-6 xl:sticky xl:top-0 xl:max-h-[100dvh] xl:overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent] ${className ?? ""}`.trim();

  if (loading) {
    return (
      <aside
        className={asideClassName}
        style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          {showMobileCloseButton ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 items-center justify-center rounded-xl border transition-colors xl:hidden"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
              aria-label="Fermer le panneau membre"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="min-h-[4.5rem] rounded-2xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
          <span className="min-w-0 break-words leading-snug">Chargement de ton espace membre…</span>
        </p>
      </aside>
    );
  }

  if (!discordUser) {
    return (
      <aside
        className={asideClassName}
        style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
      >
        <div className="space-y-4">
          {showMobileCloseButton ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onRequestClose}
                className="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 items-center justify-center rounded-xl border transition-colors xl:hidden"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
                aria-label="Fermer le panneau membre"
              >
                <X size={20} />
              </button>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Espace membre TENF
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Connexion
            </h3>
            <p className="mt-2 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Connecte-toi avec Discord pour accéder au tableau de bord, aux événements, aux raids et à toute l&apos;entraide de la
              communauté.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDiscordLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4752C4] active:scale-[0.99]"
          >
            <span className="break-words text-center">Se connecter avec Discord</span>
          </button>
        </div>
      </aside>
    );
  }

  const showDesktopCollapse = Boolean(desktopNav?.isMemberArea && !showMobileCloseButton);

  return (
    <aside
      className={asideClassName}
      style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
    >
      <div className="flex min-h-0 flex-col gap-5">
        {showMobileCloseButton ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRequestClose}
              className="inline-flex h-10 min-h-[44px] min-w-[44px] w-10 items-center justify-center rounded-xl border transition-colors xl:hidden"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
              aria-label="Fermer le panneau membre"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}

        <UserSidebarMemberWelcome
          discordUser={discordUser}
          overview={memberOverview}
          twitchLinked={twitchLinked}
          pathname={pathname}
          unreadNotifications={unreadNotifications}
          onNavigate={onNavigate}
        />

        <UserSidebarNav
          pathname={pathname}
          hasAdminAccess={hasAdminAccess}
          twitchLinked={twitchLinked}
          unreadNotifications={unreadNotifications}
          onNavigate={onNavigate}
          showDesktopCollapse={showDesktopCollapse}
          onRequestCollapseDesktop={() => desktopNav?.setDesktopCollapsed(true)}
        />

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-rose-500/30 hover:bg-rose-950/20 hover:text-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/60"
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <span className="break-words text-center">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
