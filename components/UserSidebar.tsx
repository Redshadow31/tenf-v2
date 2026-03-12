"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";

type SidebarItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

const memberSections: SidebarSection[] = [
  {
    title: "Espace membre",
    items: [
      { href: "/membres/dashboard", label: "Dashboard" },
      { href: "/membres/me", label: "Mon profil" },
      { href: "/evaluation", label: "Mon évaluation" },
    ],
  },
  {
    title: "Academy & progression",
    items: [
      { href: "/academy", label: "TENF Academy" },
      { href: "/postuler", label: "Postuler staff" },
      { href: "/membres/formations-validees", label: "Mes formations validées" },
    ],
  },
  {
    title: "Activité TENF",
    items: [{ href: "/vip/historique", label: "Historique de raids" }],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/dashboard", label: "Dashboard Admin", adminOnly: true },
      { href: "/admin/membres", label: "Gestion membres", adminOnly: true },
      { href: "/admin/evaluation", label: "Gestion évaluations", adminOnly: true },
      { href: "/admin/events", label: "Gestion événements", adminOnly: true },
      { href: "/admin/gestion-acces", label: "Gestion profils site", adminOnly: true },
    ],
  },
];

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-card)";
      }}
    >
      {label}
    </Link>
  );
}

export default function UserSidebar() {
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
          {memberSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.adminOnly || hasAdminAccess);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-2">
                <div
                  className="px-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: "var(--color-text-secondary)", opacity: 0.85 }}
                >
                  {section.title}
                </div>
                <div className="space-y-2">
                  {visibleItems.map((item) => (
                    <SidebarLink key={`${section.title}-${item.href}`} href={item.href} label={item.label} />
                  ))}
                </div>
              </div>
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

