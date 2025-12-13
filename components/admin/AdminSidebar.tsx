"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    href: "/admin/membres",
    label: "Membres",
    icon: "👥",
  },
  {
    href: "/admin/spotlight",
    label: "Spotlight",
    icon: "⭐",
    children: [
      {
        href: "/admin/spotlight",
        label: "Hub",
      },
      {
        href: "/admin/spotlight/gestion",
        label: "Gestion",
      },
      {
        href: "/admin/spotlight/membres",
        label: "Données individuelles",
      },
      {
        href: "/admin/spotlight/presence",
        label: "Présence",
      },
      {
        href: "/admin/spotlight/evaluation",
        label: "Évaluation streamer",
      },
    ],
  },
  {
    href: "/admin/follow",
    label: "Suivi Follow",
    icon: "👁️",
  },
  {
    href: "/admin/evaluations",
    label: "Évaluation Mensuelle",
    icon: "📝",
    children: [
      {
        href: "/admin/evaluations",
        label: "Vue d'ensemble",
      },
    ],
  },
  {
    href: "/admin/raids",
    label: "Suivi Raids",
    icon: "🚀",
    children: [
      {
        href: "/admin/raids",
        label: "Suivi des Raids",
      },
      {
        href: "/admin/raids/twitch",
        label: "Raids Twitch",
      },
    ],
  },
  {
    href: "/admin/statistiques",
    label: "Statistiques",
    icon: "📈",
  },
  {
    href: "/admin/boutique",
    label: "Boutique",
    icon: "🛒",
  },
  {
    href: "/admin/planification",
    label: "Événements",
    icon: "📅",
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: "📋",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/evaluations") {
      return pathname?.startsWith("/admin/evaluations") ?? false;
    }
    if (href === "/admin/raids") {
      return pathname?.startsWith("/admin/raids") ?? false;
    }
    if (href === "/admin/spotlight") {
      return pathname?.startsWith("/admin/spotlight") ?? false;
    }
    return pathname === href;
  }

  function isParentActive(item: NavItem): boolean {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  }

  return (
    <div className="w-64 bg-[#1a1a1d] border-r border-gray-700 min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-[#9146ff] to-[#5a32b4]">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold text-white">TENF Admin</span>
        </Link>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const parentActive = isParentActive(item);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-[#9146ff] text-white"
                    : parentActive
                    ? "bg-[#252529] text-gray-200"
                    : "text-gray-300 hover:bg-[#252529] hover:text-white"
                }`}
              >
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <span className="font-medium">{item.label}</span>
              </Link>

              {/* Sous-menu pour les éléments avec children */}
              {hasChildren && parentActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children?.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                          childActive
                            ? "bg-[#9146ff]/30 text-white"
                            : "text-gray-400 hover:text-white hover:bg-[#252529]"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Retour au site */}
      <div className="mt-8 pt-8 border-t border-gray-700">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#252529] rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Retour au site</span>
        </Link>
      </div>
    </div>
  );
}

