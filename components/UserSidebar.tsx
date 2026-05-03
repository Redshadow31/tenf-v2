"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Cog,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";
import { memberSidebarSections } from "@/lib/navigation/memberSidebar";
import SidebarSection from "@/components/member/navigation/SidebarSection";
import SidebarCollapsibleGroup from "@/components/member/navigation/SidebarCollapsibleGroup";

function SidebarLink({
  href,
  label,
  active,
  icon: Icon,
  showUnreadDot = false,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
  showUnreadDot?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-start gap-2.5 rounded-xl border px-2.5 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/55 focus-visible:ring-offset-2"
      style={
        {
          borderColor: active ? "rgba(196, 181, 253, 0.45)" : "rgba(139, 92, 246, 0.22)",
          background: active
            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(139, 92, 246, 0.08) 55%, rgba(15, 16, 22, 0.4) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)",
          color: active ? "#ede9fe" : "var(--color-text)",
          boxShadow: active ? "0 0 24px rgba(139, 92, 246, 0.12)" : undefined,
          ["--tw-ring-offset-color" as string]: "var(--color-sidebar-bg)",
        } as CSSProperties
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.38)";
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.22)";
          e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)";
        }
      }}
    >
      {Icon ? (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition group-hover:border-violet-400/35"
          style={{
            borderColor: active ? "rgba(196, 181, 253, 0.35)" : "rgba(139, 92, 246, 0.25)",
            backgroundColor: active ? "rgba(139, 92, 246, 0.25)" : "rgba(0, 0, 0, 0.2)",
            color: active ? "#ddd6fe" : "var(--color-text-secondary)",
          }}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="min-w-0 break-words text-pretty leading-snug">{label}</span>
          {showUnreadDot ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]" title="Notifications non lues" />
              Non lu
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-violet-300/50 transition group-hover:translate-x-0.5 group-hover:text-violet-200/90"
        aria-hidden
      />
    </Link>
  );
}

function QuickPill({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.98]"
      style={{
        borderColor: active ? "rgba(196, 181, 253, 0.5)" : "rgba(139, 92, 246, 0.28)",
        backgroundColor: active ? "rgba(139, 92, 246, 0.22)" : "rgba(0,0,0,0.2)",
        color: active ? "#ede9fe" : "var(--color-text)",
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
      <span className="min-w-0 break-words text-pretty leading-tight">{label}</span>
    </Link>
  );
}

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
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [twitchLinked, setTwitchLinked] = useState<boolean | null>(null);

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

  // Session seule : ne pas bloquer la navigation sur les APIs secondaires (sinon écran
  // « Chargement… » infini si /notifications ou Twitch restent en pending).
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

  const asideClassName = useMemo(
    () =>
      `w-[min(20rem,100%)] max-w-[22rem] shrink-0 border-r p-5 sm:p-6 xl:sticky xl:top-0 xl:max-h-[100dvh] xl:overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(124,58,237,0.42)_transparent] ${className ?? ""}`.trim(),
    [className],
  );

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
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-400" />
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
          <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 to-transparent p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-200/90">
              <Sparkles className="h-3.5 w-3.5" />
              Espace membre TENF
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Connexion
            </h3>
            <p className="mt-2 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Connecte-toi avec Discord pour accéder au tableau de bord, aux événements, aux raids et à toute
              l&apos;entraide de la communauté.
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

  return (
    <aside
      className={asideClassName}
      style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
    >
      <div className="space-y-5">
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

        <div
          className="relative overflow-hidden rounded-2xl border p-3.5"
          style={{
            borderColor: "rgba(139, 92, 246, 0.35)",
            background: "linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, rgba(15, 16, 22, 0.65) 100%)",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative flex items-start gap-3">
            {discordUser.avatar ? (
              <img
                src={
                  discordUser.avatar.startsWith("http")
                    ? discordUser.avatar
                    : `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                }
                alt=""
                className="h-12 w-12 shrink-0 rounded-full border-2 border-violet-500/40 object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-violet-500/40 text-lg font-bold text-violet-200"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.25)" }}
                aria-hidden
              >
                {discordUser.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-violet-300/90">
                Espace membre TENF
              </p>
              <p className="mt-0.5 break-words text-pretty font-semibold leading-snug text-white">{discordUser.username}</p>
              <p className="mt-0.5 break-words text-xs leading-snug text-slate-400">@{discordUser.username}</p>
              <p className="mt-2 text-[11px] leading-relaxed break-words text-pretty text-slate-400/95">
                Bienvenue : les menus ci-dessous s&apos;ouvrent par groupe — les textes longs vont à la ligne sans couper
                les mots au milieu.
              </p>
            </div>
          </div>

          <div className="relative mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <QuickPill
              href="/member/dashboard"
              label="Tableau de bord"
              icon={LayoutDashboard}
              active={pathname === "/member/dashboard" || pathname.startsWith("/member/dashboard/")}
              onNavigate={onNavigate}
            />
            <QuickPill
              href="/member/parametres"
              label="Paramètres"
              icon={Cog}
              active={pathname.startsWith("/member/parametres")}
              onNavigate={onNavigate}
            />
          </div>
        </div>

        <nav className="space-y-4 pb-2">
          {memberSidebarSections
            .filter((section) => !section.adminOnly || hasAdminAccess)
            .map((section, sectionIndex, filteredSections) => (
              <div key={section.title} className="space-y-3">
                <SidebarSection title={section.title}>
                  {section.groups.map((group) => {
                    const visibleItems = group.items.filter((item) => !item.adminOnly || hasAdminAccess);
                    const shouldInjectTwitchShortcut =
                      section.title === "Espace membre" && group.title === "Navigation" && Boolean(discordUser);
                    const safeCallbackPath =
                      pathname && pathname.startsWith("/") && !pathname.startsWith("//")
                        ? pathname
                        : "/member/profil/completer";
                    const directTwitchLinkHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent(safeCallbackPath)}`;

                    const groupItems = shouldInjectTwitchShortcut
                      ? [
                          ...visibleItems,
                          {
                            href: twitchLinked ? "/member/profil" : directTwitchLinkHref,
                            label:
                              twitchLinked === null
                                ? "État de la liaison Twitch…"
                                : twitchLinked
                                  ? "Chaîne Twitch liée (voir profil)"
                                  : "Lier ma chaîne Twitch",
                            icon: Link2,
                          },
                        ]
                      : visibleItems;
                    if (groupItems.length === 0) return null;

                    const hasActiveItem = groupItems.some(
                      (item) =>
                        pathname === item.href || (pathname != null && item.href !== "/" && pathname.startsWith(`${item.href}/`)),
                    );

                    const navUnreadDot =
                      section.title === "Espace membre" && group.title === "Navigation" && unreadNotifications > 0;

                    return (
                      <SidebarCollapsibleGroup
                        key={`${section.title}-${group.title}`}
                        title={group.title}
                        defaultOpen={hasActiveItem}
                        showTitleUnreadDot={navUnreadDot}
                      >
                        {groupItems.map((item) => (
                          <SidebarLink
                            key={`${group.title}-${item.href}`}
                            href={item.href}
                            label={item.label}
                            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                            icon={item.icon}
                            showUnreadDot={item.href === "/member/notifications" && unreadNotifications > 0}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </SidebarCollapsibleGroup>
                    );
                  })}
                </SidebarSection>
                {sectionIndex < filteredSections.length - 1 ? (
                  <div className="mx-1 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />
                ) : null}
              </div>
            ))}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-gradient-to-r from-rose-950/50 to-transparent px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400/50 hover:bg-rose-950/40 active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="break-words text-center">Déconnexion</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
