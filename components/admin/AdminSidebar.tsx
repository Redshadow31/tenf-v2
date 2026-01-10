"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
    href: "/admin/gestion-acces",
    label: "Gestion du Site",
    icon: "⚙️",
    children: [
      {
        href: "/admin/gestion-acces",
        label: "Accès Dashboard",
      },
    ],
  },
  {
    href: "/admin/membres",
    label: "Membres",
    icon: "👥",
    children: [
      {
        href: "/admin/membres",
        label: "Hub",
      },
      {
        href: "/admin/membres/gestion",
        label: "Gestion",
      },
      {
        href: "/admin/membres/erreurs",
        label: "Erreurs & incohérences",
      },
      {
        href: "/admin/membres/incomplets",
        label: "Comptes incomplets",
      },
      {
        href: "/admin/membres/synchronisation",
        label: "Synchronisation",
      },
      {
        href: "/admin/membres/historique",
        label: "Historique",
      },
    ],
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
    children: [
      {
        href: "/admin/follow",
        label: "Hub",
      },
      {
        href: "/admin/follow/red",
        label: "Follow de Red",
      },
      {
        href: "/admin/follow/clara",
        label: "Follow de Clara",
      },
      {
        href: "/admin/follow/nexou",
        label: "Follow de Nexou",
      },
      {
        href: "/admin/follow/tabs",
        label: "Follow de Tabs",
      },
      {
        href: "/admin/follow/nangel",
        label: "Follow de Nangel",
      },
      {
        href: "/admin/follow/jenny",
        label: "Follow de Jenny",
      },
      {
        href: "/admin/follow/selena",
        label: "Follow de Selena",
      },
      {
        href: "/admin/follow/dark",
        label: "Follow de Dark",
      },
      {
        href: "/admin/follow/yaya",
        label: "Follow de Yaya",
      },
      {
        href: "/admin/follow/rubby",
        label: "Follow de Rubby",
      },
      {
        href: "/admin/follow/livio",
        label: "Follow de Livio",
      },
      {
        href: "/admin/follow/rebelle",
        label: "Follow de Rebelle",
      },
      {
        href: "/admin/follow/sigurdson",
        label: "Follow de Sigurdson",
      },
      {
        href: "/admin/follow/nico",
        label: "Follow de Nico",
      },
      {
        href: "/admin/follow/willy",
        label: "Follow de Willy",
      },
      {
        href: "/admin/follow/b1nx",
        label: "Follow de B1nx",
      },
      {
        href: "/admin/follow/spydy",
        label: "Follow de Spydy",
      },
      {
        href: "/admin/follow/simon",
        label: "Follow de Simon",
      },
      {
        href: "/admin/follow/zylkao",
        label: "Follow de Zylkao",
      },
    ],
  },
  {
    href: "/admin/evaluation",
    label: "Évaluation Mensuelle",
    icon: "📊",
    children: [
      {
        href: "/admin/evaluation",
        label: "Hub",
      },
      {
        href: "/admin/evaluation/a",
        label: "A. Présence Active",
        children: [
          {
            href: "/admin/evaluation/a/spotlights",
            label: "Spotlights",
          },
          {
            href: "/admin/evaluation/a/raids",
            label: "Raids",
          },
        ],
      },
      {
        href: "/admin/evaluation/b",
        label: "B. Engagement Communautaire",
        children: [
          {
            href: "/admin/evaluation/b/discord",
            label: "Discord",
          },
          {
            href: "/admin/evaluation/b/events-serveur",
            label: "Events serveur",
          },
        ],
      },
      {
        href: "/admin/evaluation/c",
        label: "C. Follow",
      },
      {
        href: "/admin/evaluation/d",
        label: "D. Synthèse & Bonus",
      },
      {
        href: "/admin/evaluation/result",
        label: "Résultat Final",
      },
    ],
  },
  {
    href: "/admin/evaluations",
    label: "Intégration",
    icon: "📝",
    children: [
      {
        href: "/admin/evaluations",
        label: "Hub",
      },
      {
        href: "/admin/evaluations/planification",
        label: "Planification",
      },
      {
        href: "/admin/evaluations/inscription",
        label: "Inscription",
      },
      {
        href: "/admin/evaluations/presence-retour",
        label: "Présence et retour",
      },
      {
        href: "/admin/evaluations/statistique",
        label: "Statistique",
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
      {
        href: "/admin/raids/historique",
        label: "Historique",
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
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  // Ouvrir automatiquement les menus parents si on est sur une de leurs pages enfants
  useEffect(() => {
    const newOpenMenus = new Set<string>();
    navItems.forEach((item) => {
      if (item.children) {
        const isOnChildPage = item.children.some(child => {
          if (child.href === "/admin/evaluations") {
            return pathname?.startsWith("/admin/evaluations") ?? false;
          }
          if (child.href === "/admin/raids" || child.href === "/admin/raids/historique") {
            return pathname?.startsWith("/admin/raids") ?? false;
          }
          if (child.href === "/admin/spotlight") {
            return pathname?.startsWith("/admin/spotlight") ?? false;
          }
          if (child.href === "/admin/follow") {
            return pathname?.startsWith("/admin/follow") ?? false;
          }
          if (child.href === "/admin/membres") {
            return pathname?.startsWith("/admin/membres") ?? false;
          }
          if (child.href === "/admin/gestion-acces") {
            return pathname?.startsWith("/admin/gestion-acces") ?? false;
          }
          return pathname === child.href;
        });
        if (isOnChildPage) {
          newOpenMenus.add(item.href);
        }
      }
    });
    setOpenMenus(newOpenMenus);
  }, [pathname]);

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
    if (href === "/admin/follow") {
      return pathname === "/admin/follow" || (pathname?.startsWith("/admin/follow/") ?? false);
    }
    if (href === "/admin/membres") {
      return pathname === "/admin/membres" || (pathname?.startsWith("/admin/membres/") ?? false);
    }
    if (href === "/admin/gestion-acces") {
      return pathname === "/admin/gestion-acces" || (pathname?.startsWith("/admin/gestion-acces/") ?? false);
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

  function toggleMenu(href: string) {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  }

  return (
    <div className="w-64 border-r min-h-screen p-4" style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}>
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))' }}>
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>TENF Admin</span>
        </Link>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const parentActive = isParentActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isMenuOpen = openMenus.has(item.href);

          return (
            <div key={item.href}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--color-primary)' : parentActive ? 'var(--color-card-hover)' : 'transparent',
                    color: active ? 'white' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!active && !parentActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
                      e.currentTarget.style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active && !parentActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isMenuOpen ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? 'white' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
                      e.currentTarget.style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}

              {/* Sous-menu pour les éléments avec children */}
              {hasChildren && isMenuOpen && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children?.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 rounded-lg text-sm transition-colors"
                        style={{
                          backgroundColor: childActive ? 'var(--color-primary)' : 'transparent',
                          color: childActive ? 'white' : 'var(--color-text-secondary)',
                          opacity: childActive ? '1' : '0.7'
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
                            e.currentTarget.style.color = 'var(--color-text)';
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                            e.currentTarget.style.opacity = '0.7';
                          }
                        }}
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
      <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>←</span>
          <span>Retour au site</span>
        </Link>
      </div>
    </div>
  );
}

