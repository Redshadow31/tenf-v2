"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { adminNavigation, type NavItem } from "@/lib/admin/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  /**
   * Vérifie si un élément de navigation est actif
   * Logique générique: un élément est actif si pathname === href OU pathname.startsWith(href + "/")
   */
  function isActive(item: NavItem): boolean {
    if (!pathname) return false;
    
    // Match exact
    if (pathname === item.href) {
      return true;
    }
    
    // Si l'élément a des enfants, utiliser startsWith pour détecter les sous-pages
    if (item.children && item.children.length > 0) {
      return pathname.startsWith(item.href + "/");
    }
    
    // Pour les éléments sans enfants mais avec routes dynamiques (ex: /admin/follow/[slug]),
    // vérifier startsWith avec "/" pour éviter les faux positifs
    const hasDynamicRoutes = item.href === "/admin/follow";
    if (hasDynamicRoutes) {
      return pathname.startsWith(item.href + "/");
    }
    
    // Sinon, match exact uniquement
    return false;
  }

  /**
   * Vérifie si un élément parent est actif (soit lui-même, soit un de ses enfants)
   * Logique générique: parent actif si pathname.startsWith(parent.href) OU si un child est actif
   */
  function isParentActive(item: NavItem): boolean {
    if (!pathname) return false;
    
    // Le parent est actif si pathname commence par son href (logique générique)
    if (pathname.startsWith(item.href)) {
      return true;
    }
    
    // Ou si un de ses enfants est actif
    if (item.children) {
      return item.children.some(child => {
        // Pour les enfants avec sous-enfants, vérifier récursivement
        if (child.children) {
          return isParentActive(child);
        }
        return isChildActive(child);
      });
    }
    
    return false;
  }

  /**
   * Vérifie si un enfant spécifique est actif
   * Logique générique: child actif si pathname === child.href OU pathname.startsWith(child.href + "/")
   */
  function isChildActive(child: NavItem): boolean {
    if (!pathname) return false;
    
    // Match exact
    if (pathname === child.href) {
      return true;
    }
    
    // Si l'enfant a des sous-enfants, utiliser startsWith pour détecter les sous-sous-pages
    if (child.children && child.children.length > 0) {
      return pathname.startsWith(child.href + "/");
    }
    
    // Pour les enfants simples, vérifier si pathname commence par child.href + "/"
    // Cela gère les routes dynamiques comme /admin/follow/[slug]
    return pathname.startsWith(child.href + "/");
  }

  // Ouvrir automatiquement les menus parents si on est sur une de leurs pages enfants
  useEffect(() => {
    const newOpenMenus = new Set<string>();
    adminNavigation.forEach((item) => {
      if (item.children && isParentActive(item)) {
        newOpenMenus.add(item.href);
        
        // Ouvrir aussi les sous-menus si nécessaire (pour les enfants avec enfants)
        item.children.forEach(child => {
          if (child.children && isParentActive(child)) {
            newOpenMenus.add(child.href);
          }
        });
      }
    });
    setOpenMenus(newOpenMenus);
  }, [pathname]);

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
        {adminNavigation.map((item) => {
          const active = isActive(item);
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
                    const childActive = isChildActive(child);
                    const childHasChildren = child.children && child.children.length > 0;
                    const isChildMenuOpen = openMenus.has(child.href);

                    return (
                      <div key={child.href}>
                        {childHasChildren ? (
                          <>
                            <button
                              onClick={() => toggleMenu(child.href)}
                              className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors"
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
                              <span>{child.label}</span>
                              <svg
                                className={`w-4 h-4 transition-transform ${isChildMenuOpen ? "rotate-90" : ""}`}
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
                            {/* Sous-sous-menu (pour évaluation mensuelle par exemple) */}
                            {isChildMenuOpen && child.children && (
                              <div className="ml-4 mt-1 space-y-1">
                                {child.children.map((grandChild) => {
                                  const grandChildActive = isChildActive(grandChild);
                                  return (
                                    <Link
                                      key={grandChild.href}
                                      href={grandChild.href}
                                      className="block px-4 py-2 rounded-lg text-xs transition-colors"
                                      style={{
                                        backgroundColor: grandChildActive ? 'var(--color-primary)' : 'transparent',
                                        color: grandChildActive ? 'white' : 'var(--color-text-secondary)',
                                        opacity: grandChildActive ? '1' : '0.6'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!grandChildActive) {
                                          e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
                                          e.currentTarget.style.color = 'var(--color-text)';
                                          e.currentTarget.style.opacity = '1';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!grandChildActive) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                                          e.currentTarget.style.opacity = '0.6';
                                        }
                                      }}
                                    >
                                      {grandChild.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
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
                        )}
                      </div>
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

