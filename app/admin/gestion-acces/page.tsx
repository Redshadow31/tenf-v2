"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

interface AdminAccess {
  discordId: string;
  role: "FOUNDER" | "ADMIN_ADJOINT" | "MODO_MENTOR" | "MODO_JUNIOR";
  addedAt: string;
  addedBy: string;
  username?: string;
  avatar?: string;
}

const ROLE_LABELS: Record<string, string> = {
  FOUNDER: "Fondateur",
  ADMIN_ADJOINT: "Admin Adjoint",
  MODO_MENTOR: "Modo Mentor",
  MODO_JUNIOR: "Modo Junior",
};

export default function GestionAccesPage() {
  const [accessList, setAccessList] = useState<AdminAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN_ADJOINT" | "MODO_MENTOR" | "MODO_JUNIOR">("MODO_JUNIOR");
  const [searchDiscord, setSearchDiscord] = useState("");
  const [discordMembers, setDiscordMembers] = useState<Array<{ id: string; username: string; avatar: string | null }>>([]);
  const [searchingDiscord, setSearchingDiscord] = useState(false);

  // Vérifier si l'utilisateur est fondateur
  useEffect(() => {
    async function checkAccess() {
      try {
        // Vérifier l'accès via l'API
        const accessResponse = await fetch("/api/admin/access");
        if (accessResponse.status === 403) {
          // Accès refusé - rediriger
          window.location.href = "/unauthorized";
          return;
        }
        
        if (!accessResponse.ok) {
          throw new Error("Erreur lors de la vérification");
        }
        
        // Si on arrive ici, l'utilisateur est fondateur
        setIsFounder(true);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Erreur lors de la vérification des permissions");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  // Charger la liste des accès
  useEffect(() => {
    if (!isFounder) return;
    loadAccessList();
  }, [isFounder]);

  async function loadAccessList() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/access", {
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
      setAccessList(data.accessList || []);
    } catch (err) {
      console.error("Error loading access list:", err);
      setError("Erreur lors du chargement de la liste des accès");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchDiscord() {
    if (!searchDiscord.trim()) return;

    try {
      setSearchingDiscord(true);
      setError(null);

      // Rechercher dans les membres Discord du serveur
      const response = await fetch("/api/discord/members", {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      const searchTerm = searchDiscord.toLowerCase().trim();
      
      // Filtrer les membres qui correspondent à la recherche
      const matches = (data.members || [])
        .filter((member: any) => {
          const username = (member.discordUsername || "").toLowerCase();
          const nickname = (member.discordNickname || "").toLowerCase();
          const id = member.discordId || "";
          return username.includes(searchTerm) || nickname.includes(searchTerm) || id.includes(searchTerm);
        })
        .slice(0, 10) // Limiter à 10 résultats
        .map((member: any) => ({
          id: member.discordId,
          username: member.discordNickname || member.discordUsername || "Inconnu",
          avatar: member.avatar || null,
        }));

      setDiscordMembers(matches);

      if (matches.length === 0) {
        setError("Aucun membre Discord trouvé");
      }
    } catch (err: any) {
      console.error("Error searching Discord members:", err);
      setError(err.message || "Erreur lors de la recherche");
    } finally {
      setSearchingDiscord(false);
    }
  }

  async function handleAddAccess() {
    if (!newDiscordId.trim()) {
      setError("L'ID Discord est requis");
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discordId: newDiscordId.trim(),
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout");
      }

      // Recharger la liste
      await loadAccessList();
      setNewDiscordId("");
      setIsAdding(false);
    } catch (err: any) {
      console.error("Error adding access:", err);
      setError(err.message || "Erreur lors de l'ajout de l'accès");
    }
  }

  async function handleDeleteAccess(discordId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer l'accès de ce membre ?")) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/access?discordId=${encodeURIComponent(discordId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Recharger la liste
      await loadAccessList();
    } catch (err: any) {
      console.error("Error deleting access:", err);
      setError(err.message || "Erreur lors de la suppression de l'accès");
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "FOUNDER":
        return "bg-red-900 text-white border border-red-600";
      case "ADMIN_ADJOINT":
        return "bg-amber-900 text-white border border-amber-700";
      case "MODO_MENTOR":
        return "bg-orange-700 text-white border border-orange-600";
      case "MODO_JUNIOR":
        return "bg-blue-900 text-white border border-blue-600";
      default:
        return "bg-gray-700 text-white";
    }
  };

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
        title="Gestion des Accès Admin"
        navLinks={[
          { href: "/admin/gestion-acces", label: "Accès Dashboard", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Section d'ajout */}
        <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Plus className="w-5 h-5" />
              Ajouter un accès
            </h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isAdding ? 'var(--color-primary)' : 'var(--color-surface)',
                color: 'white',
              }}
            >
              {isAdding ? "Annuler" : "Nouveau"}
            </button>
          </div>

          {isAdding && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Rechercher un membre Discord (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchDiscord}
                    onChange={(e) => setSearchDiscord(e.target.value)}
                    placeholder="Nom d'utilisateur Discord..."
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchDiscord();
                      }
                    }}
                  />
                  <button
                    onClick={handleSearchDiscord}
                    disabled={searchingDiscord || !searchDiscord.trim()}
                    className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {searchingDiscord ? "..." : "Rechercher"}
                  </button>
                </div>
                
                {/* Résultats de recherche */}
                {discordMembers.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {discordMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setNewDiscordId(member.id);
                          setDiscordMembers([]);
                          setSearchDiscord("");
                        }}
                        className="w-full p-2 rounded-lg border flex items-center gap-3 hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium" style={{ color: 'var(--color-text)' }}>{member.username}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  ID Discord
                </label>
                <input
                  type="text"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  placeholder="123456789012345678"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  L'ID Discord de l'utilisateur (peut être rempli automatiquement via la recherche ci-dessus)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Rôle
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "ADMIN_ADJOINT" | "MODO_MENTOR" | "MODO_JUNIOR")}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <option value="ADMIN_ADJOINT">Admin Adjoint</option>
                  <option value="MODO_MENTOR">Modo Mentor</option>
                  <option value="MODO_JUNIOR">Modo Junior</option>
                </select>
              </div>

              <button
                onClick={handleAddAccess}
                className="w-full px-4 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Ajouter l'accès
              </button>
            </div>
          )}
        </div>

        {/* Liste des accès */}
        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              Membres avec accès au dashboard ({accessList.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            </div>
          ) : accessList.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Aucun accès trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Utilisateur
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Rôle
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Ajouté le
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Ajouté par
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accessList.map((access) => (
                    <tr
                      key={access.discordId}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--color-border)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {access.avatar ? (
                            <img
                              src={access.avatar}
                              alt={access.username || "User"}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))' }}
                            >
                              {(access.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                              {access.username || "Inconnu"}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {access.discordId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(access.role)}`}
                        >
                          {ROLE_LABELS[access.role] || access.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {access.addedAt && new Date(access.addedAt).getTime() > 0
                          ? new Date(access.addedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Initial'}
                      </td>
                      <td className="py-4 px-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {access.addedBy === 'system' ? 'Système' : access.addedBy}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {access.role === "FOUNDER" || (access.addedBy === 'system' && new Date(access.addedAt).getTime() === 0) ? (
                          <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                            Non modifiable
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAccess(access.discordId)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-auto"
                            style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#b91c1c';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                            }}
                            title="Supprimer l'accès admin de ce membre"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

