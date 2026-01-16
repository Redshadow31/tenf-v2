"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { Search, User, ExternalLink } from "lucide-react";
import { getRoleBadgeClasses } from "@/lib/roleColors";

interface MemberSearchResult {
  id: string;
  twitchLogin?: string;
  displayName: string;
  siteUsername?: string;
  discordUsername?: string;
  discordId?: string;
  role: string;
  isVip: boolean;
  isActive: boolean;
  twitchUrl?: string;
  badges?: string[];
  description?: string;
}

export default function AdminSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce de la recherche
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/search/members?q=${encodeURIComponent(query)}&limit=20`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      setResults(data.members || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleMemberClick(member: MemberSearchResult) {
    // Utiliser twitchLogin comme identifiant principal, avec fallback sur discordId ou displayName
    const memberId = member.twitchLogin || member.discordId || member.id || encodeURIComponent(member.displayName);
    router.push(`/admin/members/${memberId}`);
  }

  function getMemberIdentifier(member: MemberSearchResult): string {
    return member.twitchLogin || member.discordId || member.displayName;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="🔎 Recherche membre"
        navLinks={[
          { href: "/admin/search", label: "Recherche", active: true },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Barre de recherche */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Rechercher un membre (pseudo Twitch, Discord, nom d'affichage)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg border text-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              Recherche en cours...
            </p>
          </div>
        )}

        {/* Résultats */}
        {!loading && hasSearched && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  Aucun membre trouvé pour "{searchQuery}"
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Essayez avec un autre pseudo ou nom
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-4">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid gap-4">
                  {results.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-lg border p-4 cursor-pointer transition-all"
                      style={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)',
                      }}
                      onClick={() => handleMemberClick(member)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-card)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {member.discordId ? (
                            <img
                              src={`https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`}
                              alt={member.displayName}
                              className="w-12 h-12 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                if ((e.target as HTMLImageElement).nextElementSibling) {
                                  (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-semibold ${member.discordId ? 'hidden' : ''}`}>
                            {(member.displayName || member.twitchLogin || '?')[0].toUpperCase()}
                          </div>
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                              {member.siteUsername || member.displayName}
                            </h3>
                            {member.isVip && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#9146ff] text-white">
                                VIP
                              </span>
                            )}
                            {member.role && (
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeClasses(member.role)}`}>
                                {member.role}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              member.isActive
                                ? "bg-green-900/30 text-green-300"
                                : "bg-red-900/30 text-red-300"
                            }`}>
                              {member.isActive ? "Actif" : "Inactif"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {member.twitchLogin && (
                              <div className="flex items-center gap-1">
                                <span>Twitch:</span>
                                <span className="font-medium">{member.twitchLogin}</span>
                              </div>
                            )}
                            {member.discordUsername && (
                              <div className="flex items-center gap-1">
                                <span>Discord:</span>
                                <span className="font-medium">{member.discordUsername}</span>
                              </div>
                            )}
                          </div>

                          {member.description && (
                            <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                              {member.description}
                            </p>
                          )}
                        </div>

                        {/* Bouton action */}
                        <div className="flex-shrink-0">
                          <button
                            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMemberClick(member);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <User className="w-4 h-4" />
                            Voir fiche 360°
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* État initial */}
        {!loading && !hasSearched && searchQuery.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto w-12 h-12 mb-4" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Recherchez un membre par son pseudo Twitch, Discord ou nom d'affichage
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Minimum 2 caractères requis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
