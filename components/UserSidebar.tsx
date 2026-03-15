"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
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
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
  showUnreadDot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border"
      style={{
        backgroundColor: active ? "rgba(145, 70, 255, 0.18)" : "var(--color-card)",
        borderColor: active ? "rgba(145, 70, 255, 0.45)" : "var(--color-border)",
        color: active ? "#d7beff" : "var(--color-text)",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "var(--color-card-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "var(--color-card)";
      }}
    >
      <span className="flex items-center gap-2">
        {Icon ? <Icon size={14} /> : null}
        <span>{label}</span>
        {showUnreadDot ? <span className="h-2.5 w-2.5 rounded-full bg-red-500" title="Notification non lue" /> : null}
      </span>
    </Link>
  );
}

export default function UserSidebar() {
  const pathname = usePathname();
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [twitchLinked, setTwitchLinked] = useState<boolean | null>(null);

  async function loadUnreadNotificationsCount() {
    try {
      const response = await fetch("/api/members/me/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadNotifications(Number(data?.unreadCount || 0));
    } catch (error) {
      console.error("Error loading member notifications count:", error);
    }
  }

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

  useEffect(() => {
    async function fetchUser() {
      const user = await getDiscordUser();
      setDiscordUser(user);
      
      // Vérifier si l'utilisateur a accès au dashboard admin
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role", { cache: "no-store" });
          
          if (roleResponse.ok) {
            const data = await roleResponse.json();
            const hasAccess = data.hasAdminAccess || false;
            setHasAdminAccess(hasAccess);
            if (hasAccess) {
              await loadUnreadNotificationsCount();
            } else {
              setUnreadNotifications(0);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
        await loadTwitchLinkStatus();
      } else {
        setTwitchLinked(null);
      }
      
      setLoading(false);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (hasAdminAccess) {
        loadUnreadNotificationsCount();
      }
    };
    window.addEventListener("member-notifications-refresh", handler);
    return () => window.removeEventListener("member-notifications-refresh", handler);
  }, [hasAdminAccess]);

  const handleDiscordLogin = () => {
    loginWithDiscord();
  };

  const handleLogout = async () => {
    await logoutDiscord();
    setDiscordUser(null);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <aside className="w-72 border-r p-6" style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}>
        <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Chargement...</div>
      </aside>
    );
  }

  if (!discordUser) {
    return (
      <aside className="w-72 border-r p-6" style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}>
        <div className="space-y-4">
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>Connexion</h3>
          <button
            onClick={handleDiscordLogin}
            className="w-full rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            <span>Se connecter avec Discord</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-r p-6" style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}>
      <div className="space-y-5">
        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          {discordUser.avatar && (
            <img
              src={
                discordUser.avatar.startsWith("http")
                  ? discordUser.avatar
                  : `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              }
              alt={discordUser.username}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate" style={{ color: "var(--color-text)" }}>{discordUser.username}</div>
            <div className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>@{discordUser.username}</div>
          </div>
        </div>

        <nav className="space-y-4">
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
                                ? "Etat Twitch..."
                                : twitchLinked
                                  ? "Twitch lie"
                                  : "Lier mon Twitch",
                          },
                        ]
                      : visibleItems;
                    if (groupItems.length === 0) return null;

                    return (
                      <SidebarCollapsibleGroup key={`${section.title}-${group.title}`} title={group.title}>
                        {groupItems.map((item) => (
                          <SidebarLink
                            key={`${group.title}-${item.href}`}
                            href={item.href}
                            label={item.label}
                            active={pathname === item.href || pathname?.startsWith(`${item.href}/`)}
                            icon={item.icon}
                            showUnreadDot={item.href === "/member/notifications" && unreadNotifications > 0}
                          />
                        ))}
                      </SidebarCollapsibleGroup>
                    );
                  })}
                </SidebarSection>
                {sectionIndex < filteredSections.length - 1 ? (
                  <div
                    className="mx-1 h-px"
                    style={{ backgroundColor: "rgba(145, 70, 255, 0.16)" }}
                  />
                ) : null}
              </div>
            ))}

          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors mt-3"
            style={{ backgroundColor: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </aside>
  );
}

