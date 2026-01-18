"use client";

import { useState, useEffect } from "react";
import { Save, Shield, AlertCircle, CheckCircle2, X, Lock, Unlock } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { adminNavigation } from "@/lib/admin/navigation";
import type { AdminRole } from "@/lib/adminRoles";

const ROLE_LABELS: Record<AdminRole, string> = {
  FOUNDER: "Fondateur",
  ADMIN_ADJOINT: "Admin Adjoint",
  MODO_MENTOR: "Modo Mentor",
  MODO_JUNIOR: "Modo Junior",
};

interface SectionPermission {
  href: string;
  label: string;
  roles: AdminRole[];
}

interface PermissionsData {
  sections: Record<string, SectionPermission>;
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Extrait toutes les sections du dashboard depuis la navigation
 */
function extractAllSections(navItems: typeof adminNavigation): SectionPermission[] {
  const sections: SectionPermission[] = [];

  function processNavItem(item: typeof adminNavigation[0], parentLabel = "") {
    const fullLabel = parentLabel ? `${parentLabel} > ${item.label}` : item.label;
    
    // Ajouter la section principale
    sections.push({
      href: item.href,
      label: fullLabel,
      roles: [], // Par défaut, aucune restriction (accessible à tous les admins)
    });

    // Traiter les enfants récursivement
    if (item.children) {
      item.children.forEach((child) => {
        processNavItem(child as typeof adminNavigation[0], fullLabel);
      });
    }
  }

  navItems.forEach((item) => {
    processNavItem(item);
  });

  return sections;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionsData>({ sections: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);

  // Extraire toutes les sections du dashboard
  const allSections = extractAllSections(adminNavigation);

  // Vérifier si l'utilisateur est fondateur
  useEffect(() => {
    async function checkAccess() {
      try {
        const accessResponse = await fetch("/api/admin/access");
        if (accessResponse.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        if (!accessResponse.ok) {
          throw new Error("Erreur lors de la vérification");
        }
        setIsFounder(true);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Erreur lors de la vérification des permissions");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  // Charger les permissions
  useEffect(() => {
    if (!isFounder) return;
    loadPermissions();
  }, [isFounder]);

  async function loadPermissions() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/permissions", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Accès refusé. Seuls les fondateurs peuvent accéder à cette page.");
          window.location.href = "/unauthorized";
          return;
        }
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      
      // Initialiser les sections avec les permissions ou valeurs par défaut
      const sectionsData: Record<string, SectionPermission> = {};
      allSections.forEach((section) => {
        sectionsData[section.href] = data.permissions?.sections?.[section.href] || {
          href: section.href,
          label: section.label,
          roles: [], // Par défaut, tous les rôles ont accès (liste vide = tous autorisés)
        };
      });

      setPermissions({
        sections: sectionsData,
        lastUpdated: data.permissions?.lastUpdated,
        updatedBy: data.permissions?.updatedBy,
      });
    } catch (err) {
      console.error("Error loading permissions:", err);
      setError("Erreur lors du chargement des permissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissions: {
            sections: permissions.sections,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Permissions sauvegardées avec succès !");
      setTimeout(() => setSuccess(null), 3000);

      // Recharger pour obtenir les métadonnées
      await loadPermissions();
    } catch (err: any) {
      console.error("Error saving permissions:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  }

  function toggleRoleAccess(sectionHref: string, role: AdminRole) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;

      const newRoles = section.roles.includes(role)
        ? section.roles.filter((r) => r !== role)
        : [...section.roles, role];

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: {
            ...section,
            roles: newRoles,
          },
        },
      };
    });
  }

  function setAllRolesForSection(sectionHref: string, enabled: boolean) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: {
            ...section,
            roles: enabled ? [] : ["FOUNDER"], // Liste vide = tous autorisés, sinon seulement FOUNDER
          },
        },
      };
    });
  }

  function isRoleAllowed(sectionHref: string, role: AdminRole): boolean {
    const section = permissions.sections[sectionHref];
    if (!section) return true; // Par défaut, accessible
    
    // Si la liste des rôles est vide, tous les rôles ont accès
    if (section.roles.length === 0) return true;
    
    // Sinon, vérifier si le rôle est dans la liste
    return section.roles.includes(role);
  }

  function hasRestrictions(sectionHref: string): boolean {
    const section = permissions.sections[sectionHref];
    if (!section) return false;
    return section.roles.length > 0;
  }

  if (loading && !isFounder) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="Gestion des Permissions Dashboard"
        navLinks={[
          { href: "/admin/gestion-acces", label: "Accès Dashboard" },
          { href: "/admin/gestion-acces/dashboard", label: "Gestion du Dashboard" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#10b981' }}>
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* En-tête avec informations */}
        <div className="mb-6 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Contrôle des Permissions par Section
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Gérez l'accès aux différentes sections du dashboard admin par rôle. Par défaut, toutes les sections sont accessibles à tous les rôles admin.
                Si vous restreignez l'accès, seuls les rôles sélectionnés pourront accéder à cette section.
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Section restreinte</span>
                </div>
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  <span>Accessible à tous les admins</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Save className="w-5 h-5" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>

          {permissions.lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Dernière mise à jour : {new Date(permissions.lastUpdated).toLocaleString('fr-FR')}
              {permissions.updatedBy && ` par ${permissions.updatedBy}`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          </div>
        ) : (
          <div className="space-y-4">
            {allSections.map((section) => {
              const sectionPerm = permissions.sections[section.href] || {
                href: section.href,
                label: section.label,
                roles: [],
              };
              const restricted = hasRestrictions(section.href);

              return (
                <div
                  key={section.href}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: restricted ? 'var(--color-primary)' : 'var(--color-border)',
                    borderWidth: restricted ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {restricted ? (
                          <Lock className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <Unlock className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                        )}
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {section.label}
                        </h3>
                        {restricted && (
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                            Restreint
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {section.href}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllRolesForSection(section.href, true)}
                        disabled={!restricted}
                        className="px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: !restricted ? 'var(--color-surface)' : '#10b981',
                          color: !restricted ? 'var(--color-text-secondary)' : 'white',
                        }}
                        title="Autoriser tous les rôles"
                      >
                        Tous
                      </button>
                      <button
                        onClick={() => setAllRolesForSection(section.href, false)}
                        disabled={restricted && sectionPerm.roles.length === 1 && sectionPerm.roles.includes('FOUNDER')}
                        className="px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: (restricted && sectionPerm.roles.length === 1 && sectionPerm.roles.includes('FOUNDER')) ? 'var(--color-surface)' : '#dc2626',
                          color: (restricted && sectionPerm.roles.length === 1 && sectionPerm.roles.includes('FOUNDER')) ? 'var(--color-text-secondary)' : 'white',
                        }}
                        title="Restreindre aux fondateurs uniquement"
                      >
                        Fondateurs
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(Object.keys(ROLE_LABELS) as AdminRole[]).map((role) => {
                      const allowed = isRoleAllowed(section.href, role);
                      const roleLabel = ROLE_LABELS[role];

                      return (
                        <button
                          key={role}
                          onClick={() => toggleRoleAccess(section.href, role)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            allowed ? 'opacity-100' : 'opacity-40'
                          }`}
                          style={{
                            backgroundColor: allowed
                              ? role === 'FOUNDER'
                                ? '#dc2626'
                                : role === 'ADMIN_ADJOINT'
                                ? '#d97706'
                                : role === 'MODO_MENTOR'
                                ? '#ea580c'
                                : '#1e40af'
                              : 'var(--color-surface)',
                            color: allowed ? 'white' : 'var(--color-text-secondary)',
                            border: allowed ? 'none' : `1px solid var(--color-border)`,
                          }}
                          title={allowed ? `Cliquer pour refuser l'accès à ${roleLabel}` : `Cliquer pour autoriser ${roleLabel}`}
                        >
                          {allowed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          {roleLabel}
                        </button>
                      );
                    })}
                  </div>

                  {restricted && (
                    <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                      <strong>Accès restreint à :</strong> {sectionPerm.roles.map(r => ROLE_LABELS[r]).join(', ')}
                    </div>
                  )}
                  {!restricted && (
                    <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                      <strong>Tous les rôles admin ont accès à cette section</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
