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
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
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
      </span>
    </Link>
  );
}

export default function UserSidebar() {
  const pathname = usePathname();
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

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
            setHasAdminAccess(data.hasAdminAccess || false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      
      setLoading(false);
    }
    fetchUser();
  }, []);

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
          {memberSidebarSections.map((section) => {
            if (section.adminOnly && !hasAdminAccess) return null;

            return (
              <SidebarSection key={section.title} title={section.title}>
                {section.groups.map((group) => {
                  const visibleItems = group.items.filter((item) => !item.adminOnly || hasAdminAccess);
                  if (visibleItems.length === 0) return null;

                  return (
                    <SidebarCollapsibleGroup key={`${section.title}-${group.title}`} title={group.title}>
                      {visibleItems.map((item) => (
                        <SidebarLink
                          key={`${group.title}-${item.href}`}
                          href={item.href}
                          label={item.label}
                          active={pathname === item.href || pathname?.startsWith(`${item.href}/`)}
                          icon={item.icon}
                        />
                      ))}
                    </SidebarCollapsibleGroup>
                  );
                })}
              </SidebarSection>
            );
          })}

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

