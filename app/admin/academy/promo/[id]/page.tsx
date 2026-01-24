"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Promo {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

interface Member {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  role: string;
}

interface Access {
  id: string;
  userId: string;
  promoId: string;
  role: string;
  accessType: string;
  accessedAt: string;
}

interface AccessWithMember extends Access {
  member?: {
    displayName: string;
    twitchLogin: string;
    discordUsername?: string;
  };
}

export default function PromoManagementPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  
  const [promo, setPromo] = useState<Promo | null>(null);
  const [accesses, setAccesses] = useState<AccessWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (promoId) {
      loadPromoData();
    }
  }, [promoId]);

  const loadPromoData = async () => {
    try {
      const [promoRes, accessesRes] = await Promise.all([
        fetch(`/api/admin/academy/promos/${promoId}`, { cache: 'no-store' }),
        fetch(`/api/admin/academy/promos/${promoId}/accesses`, { cache: 'no-store' }),
      ]);

      if (promoRes.ok) {
        const promoData = await promoRes.json();
        setPromo(promoData.promo);
      }

      if (accessesRes.ok) {
        const accessesData = await accessesRes.json();
        const rawAccesses = accessesData.accesses || [];
        
        // Récupérer les informations des membres pour chaque accès
        const accessesWithMembers = await Promise.all(
          rawAccesses.map(async (access: Access) => {
            try {
              // Récupérer le membre par Discord ID
              const memberRes = await fetch(`/api/admin/members?discordId=${access.userId}`, {
                cache: 'no-store',
              });
              
              if (memberRes.ok) {
                const memberData = await memberRes.json();
                return {
                  ...access,
                  member: memberData.member ? {
                    displayName: memberData.member.displayName || memberData.member.twitchLogin,
                    twitchLogin: memberData.member.twitchLogin,
                    discordUsername: memberData.member.discordUsername,
                  } : undefined,
                };
              }
            } catch (error) {
              console.error(`Erreur récupération membre pour ${access.userId}:`, error);
            }
            
            return access;
          })
        );
        
        setAccesses(accessesWithMembers);
      }
    } catch (error) {
      console.error("Erreur chargement promo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError("");
    
    try {
      const response = await fetch(`/api/admin/members/search?q=${encodeURIComponent(searchQuery)}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.members || []);
      } else {
        setError("Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      setError("Erreur lors de la recherche");
    } finally {
      setSearching(false);
    }
  };

  const handleAddAccess = async (member: Member) => {
    if (!member.discordId) {
      setError(`⚠️ L'ID Discord de ${member.displayName} n'est pas synchronisé dans la liste des membres. Veuillez synchroniser le membre avant de lui donner accès.`);
      return;
    }

    // Vérifier si le membre a déjà accès
    const existingAccess = accesses.find(a => a.userId === member.discordId);
    if (existingAccess) {
      setError(`${member.displayName} a déjà accès à cette promo.`);
      return;
    }

    setAdding(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/academy/promos/${promoId}/accesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: member.discordId,
          role: 'participant',
          accessType: 'discord',
        }),
      });

      if (response.ok) {
        await loadPromoData();
        setSearchQuery("");
        setSearchResults([]);
        setSelectedMember(null);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'ajout de l'accès");
      }
    } catch (error) {
      console.error("Erreur ajout accès:", error);
      setError("Erreur lors de l'ajout de l'accès");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Promo introuvable</p>
        <Link href="/admin/academy/access" className="text-[#9146ff] hover:underline mt-4 inline-block">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <Link
          href="/admin/academy/access"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">{promo.name}</h1>
        <p className="text-gray-400">{promo.description || "Gestion de la promo"}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span>Début: {new Date(promo.startDate).toLocaleDateString('fr-FR')}</span>
          {promo.endDate && (
            <span>Fin: {new Date(promo.endDate).toLocaleDateString('fr-FR')}</span>
          )}
          <span className={`px-2 py-1 rounded text-xs ${
            promo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {promo.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Ajouter un membre */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Ajouter un membre à la promo</h2>
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, Twitch login ou Discord username..."
              className="flex-1 px-4 py-2 rounded-lg bg-[#0e0e10] border border-gray-700 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold transition-colors disabled:opacity-50"
            >
              {searching ? "Recherche..." : "Rechercher"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((member) => (
              <div
                key={member.twitchLogin}
                className="p-4 bg-[#0e0e10] rounded-lg border border-gray-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{member.displayName}</h3>
                  <div className="text-sm text-gray-400 mt-1">
                    <span>Twitch: {member.twitchLogin}</span>
                    {member.discordUsername && (
                      <span className="ml-4">Discord: {member.discordUsername}</span>
                    )}
                    <span className="ml-4">Rôle: {member.role}</span>
                  </div>
                  {!member.discordId && (
                    <div className="mt-2 text-xs text-yellow-400 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>ID Discord non synchronisé</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddAccess(member)}
                  disabled={!member.discordId || adding || accesses.some(a => a.userId === member.discordId)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    !member.discordId || accesses.some(a => a.userId === member.discordId)
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } disabled:opacity-50`}
                >
                  {accesses.some(a => a.userId === member.discordId) ? "Déjà ajouté" : "Ajouter"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste des membres ayant accès */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Membres ayant accès ({accesses.length})
        </h2>
        <div className="space-y-2">
          {accesses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucun membre n'a accès à cette promo.</p>
          ) : (
            accesses.map((access) => (
              <div
                key={access.id}
                className="p-4 bg-[#0e0e10] rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {access.member ? (
                      <>
                        <p className="text-white font-semibold text-lg">
                          {access.member.displayName}
                        </p>
                        <div className="text-sm text-gray-400 mt-1 space-y-1">
                          <p>
                            <span className="text-gray-500">Twitch:</span> {access.member.twitchLogin}
                            {access.member.discordUsername && (
                              <span className="ml-4">
                                <span className="text-gray-500">Discord:</span> {access.member.discordUsername}
                              </span>
                            )}
                          </p>
                          <p>
                            <span className="text-gray-500">Rôle:</span> {access.role} | 
                            <span className="text-gray-500 ml-2">Accès:</span> {access.accessType}
                          </p>
                          <p className="text-xs text-gray-500">
                            Discord ID: {access.userId}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-semibold">Discord ID: {access.userId}</p>
                        <p className="text-sm text-yellow-400 mt-1">
                          ⚠️ Membre non trouvé dans la base de données
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Rôle: {access.role} | Accès: {access.accessType}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Ajouté le: {new Date(access.accessedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
