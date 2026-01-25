"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import WizebotImportModal from "@/components/admin/WizebotImportModal";
import FollowImportFollowingModal from "@/components/admin/FollowImportFollowingModal";

const STAFF_MEMBERS: Record<string, string> = {
  red: "Red",
  clara: "Clara",
  nexou: "Nexou",
  tabs: "Tabs",
  nangel: "Nangel",
  jenny: "Jenny",
  selena: "Selena",
  dark: "Dark",
  yaya: "Yaya",
  rubby: "Rubby",
  livio: "Livio",
  rebelle: "Rebelle",
  sigurdson: "Sigurdson",
  nico: "Nico",
  willy: "Willy",
  b1nx: "B1nx",
  spydy: "Spydy",
  simon: "Simon",
  zylkao: "Zylkao",
};

type FollowStatus = 'followed' | 'not_followed' | 'unknown';

interface Member {
  twitchLogin: string;
  displayName: string;
  role?: string;
  isActive?: boolean;
}

interface MemberFollow {
  twitchLogin: string;
  displayName: string;
  role?: string;
  status: FollowStatus;
  jeSuis?: boolean; // Le staff suit ce membre
  meSuit?: boolean | null; // Ce membre suit le staff (null = inconnu)
}

interface Validation {
  staffSlug: string;
  staffName: string;
  month: string;
  members: Array<{
    twitchLogin: string;
    displayName: string;
    role?: string;
    status: FollowStatus;
    validatedAt: string;
    jeSuis?: boolean;
    meSuit?: boolean | null;
  }>;
  moderatorComments?: string;
  validatedAt: string;
  validatedBy: string;
  stats?: {
    totalMembers: number;
    totalJeSuis: number;
    totalRetour: number;
    tauxRetour: number;
  };
}

export default function FollowMemberPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberFollows, setMemberFollows] = useState<Record<string, { jeSuis: boolean; meSuit: boolean | null }>>({});
  const [moderatorComments, setModeratorComments] = useState("");
  const [monthKey, setMonthKey] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showWizebotImport, setShowWizebotImport] = useState(false);
  const [showFollowingImport, setShowFollowingImport] = useState(false);
  const [showRemainingMembers, setShowRemainingMembers] = useState(false);
  const [twitchConnected, setTwitchConnected] = useState<boolean | null>(null);

  const memberName = STAFF_MEMBERS[slug] || slug;
  const isRed = slug === 'red';

  useEffect(() => {
    initializeMonth();
    checkAccess();
  }, []);

  useEffect(() => {
    if (monthKey && hasAccess) {
      loadData();
    }
  }, [monthKey, hasAccess]);

  useEffect(() => {
    if (isRed && hasAccess) {
      checkTwitchConnection();
    }
  }, [isRed, hasAccess]);

  // Vérifier les paramètres d'URL pour les messages de succès/erreur
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'twitch_connected') {
        setSyncMessage({
          type: 'success',
          text: 'Compte Twitch connecté avec succès !',
        });
        setTwitchConnected(true);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('error')) {
        const error = params.get('error');
        let errorMessage = 'Erreur lors de la connexion Twitch';
        if (error === 'oauth_error') {
          errorMessage = 'Erreur lors de l\'autorisation Twitch';
        } else if (error === 'token_exchange_failed') {
          errorMessage = 'Erreur lors de l\'échange du token';
        }
        setSyncMessage({
          type: 'error',
          text: errorMessage,
        });
        setTwitchConnected(false);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  function initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setMonthKey(`${year}-${month}`);
  }

  async function checkAccess() {
    try {
      // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs)
      const response = await fetch('/api/user/role');
      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAdminAccess === true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erreur vérification accès:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      
      // Charger les membres TENF
      const membersResponse = await fetch('/api/members/public', { cache: 'no-store' });
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        const activeMembers = (membersData.members || [])
          .filter((m: any) => m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.twitchLogin || '',
            role: m.role,
            isActive: m.isActive,
          }))
          .filter((m: Member) => m.twitchLogin);
        setMembers(activeMembers);
        
        // Initialiser les statuts follow avec normalisation
        const initialFollows: Record<string, { jeSuis: boolean; meSuit: boolean | null }> = {};
        activeMembers.forEach((m: Member) => {
          const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
          if (normalizedLogin) {
            initialFollows[normalizedLogin] = { jeSuis: false, meSuit: null };
          }
        });
        setMemberFollows(initialFollows);
      }

      // Charger la validation existante
      const validationResponse = await fetch(`/api/follow/validations/${monthKey}/${slug}`, {
        cache: 'no-store',
      });
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        if (validationData.validation) {
          setValidation(validationData.validation);
          setModeratorComments(validationData.validation.moderatorComments || '');
          
          // Charger les statuts depuis la validation
          // Normaliser les logins pour être cohérent avec l'import
          const follows: Record<string, { jeSuis: boolean; meSuit: boolean | null }> = {};
          validationData.validation.members.forEach((m: any) => {
            const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
            if (normalizedLogin) {
              follows[normalizedLogin] = {
                jeSuis: m.jeSuis ?? (m.status === 'followed'), // Compatibilité avec ancien format
                meSuit: m.meSuit ?? null,
              };
            }
          });
          
          // Fusionner avec les membres chargés pour s'assurer que tous les membres ont une entrée
          const mergedFollows: Record<string, { jeSuis: boolean; meSuit: boolean | null }> = {};
          members.forEach((m: Member) => {
            const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
            if (normalizedLogin) {
              mergedFollows[normalizedLogin] = follows[normalizedLogin] || { jeSuis: false, meSuit: null };
            }
          });
          
          setMemberFollows(mergedFollows);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkTwitchConnection() {
    try {
      const response = await fetch('/api/auth/twitch/red/status', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setTwitchConnected(data.connected);
      }
    } catch (error) {
      console.error("Erreur vérification connexion Twitch:", error);
      setTwitchConnected(false);
    }
  }

  async function handleConnectTwitch() {
    window.location.href = '/api/auth/twitch/red/start';
  }

  async function handleSyncFromTwitch() {
    if (!isRed) return;
    
    try {
      setSyncing(true);
      setSyncMessage(null);
      
      const response = await fetch('/api/follow/red/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Mettre à jour les statuts "Je suis" pour les membres suivis
        const followedLogins = new Set((data.followedLogins || []).map((l: string) => l.toLowerCase()));
        setMemberFollows(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(login => {
            updated[login] = {
              ...updated[login],
              jeSuis: followedLogins.has(login.toLowerCase()),
            };
          });
          return updated;
        });
        
        setSyncMessage({
          type: 'success',
          text: `Synchronisation réussie : ${data.totalFollowed} membres TENF suivis par Red`,
        });
      } else {
        // Si requiresAuth est true, mettre à jour le statut de connexion
        if (data.requiresAuth) {
          setTwitchConnected(false);
        }
        setSyncMessage({
          type: 'error',
          text: data.error || 'Erreur lors de la synchronisation',
        });
      }
    } catch (error) {
      console.error("Erreur synchronisation:", error);
      setSyncMessage({
        type: 'error',
        text: 'Erreur lors de la synchronisation',
      });
    } finally {
      setSyncing(false);
    }
  }

  function handleJeSuisChange(twitchLogin: string, value: boolean) {
    // Normaliser le login pour être cohérent
    const normalizedLogin = (twitchLogin || '').toLowerCase().trim();
    setMemberFollows(prev => ({
      ...prev,
      [normalizedLogin]: {
        ...prev[normalizedLogin] || prev[twitchLogin] || { jeSuis: false, meSuit: null },
        jeSuis: value,
      },
    }));
  }

  function handleMeSuitChange(twitchLogin: string, value: boolean | null) {
    // Normaliser le login pour être cohérent
    const normalizedLogin = (twitchLogin || '').toLowerCase().trim();
    setMemberFollows(prev => ({
      ...prev,
      [normalizedLogin]: {
        ...prev[normalizedLogin] || prev[twitchLogin] || { jeSuis: false, meSuit: null },
        meSuit: value,
      },
    }));
  }

  async function handleValidate() {
    if (!slug || !monthKey) return;

    try {
      setSaving(true);
      
      // S'assurer que tous les membres sont inclus, même ceux sans données de follow
      const memberFollowsArray: MemberFollow[] = members.map(m => {
        // Normaliser le login pour la recherche (cohérence avec l'import)
        const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
        const followData = memberFollows[normalizedLogin] || memberFollows[m.twitchLogin] || { jeSuis: false, meSuit: null };
        return {
          twitchLogin: m.twitchLogin, // Garder le login original pour l'API
          displayName: m.displayName,
          role: m.role,
          status: followData.jeSuis ? 'followed' : 'not_followed', // Compatibilité
          jeSuis: followData.jeSuis ?? false,
          meSuit: followData.meSuit ?? null,
        };
      });

      // Vérifier qu'on a bien tous les membres
      if (memberFollowsArray.length !== members.length) {
        console.warn(`[Follow Validation] Nombre de membres différent: ${memberFollowsArray.length} vs ${members.length}`);
      }

      const response = await fetch(`/api/follow/validations/${monthKey}/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: memberFollowsArray,
          moderatorComments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setValidation(data.validation);
        
        // Vérifier que tous les membres ont été enregistrés
        const savedCount = data.validation?.members?.length || 0;
        if (savedCount !== memberFollowsArray.length) {
          console.warn(`[Follow Validation] Attention: ${savedCount} membres enregistrés sur ${memberFollowsArray.length} envoyés`);
          alert(`Validation enregistrée avec succès (${savedCount}/${memberFollowsArray.length} membres)`);
        } else {
          alert("Validation enregistrée avec succès");
        }
        
        await loadData();
      } else {
        const error = await response.json();
        console.error('[Follow Validation] Erreur API:', error);
        alert(`Erreur: ${error.error || 'Impossible d\'enregistrer la validation'}`);
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      alert("Erreur lors de l'enregistrement de la validation");
    } finally {
      setSaving(false);
    }
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Calculer les statistiques
  const totalMembers = members.length;
  const totalJeSuis = Object.values(memberFollows).filter(f => f.jeSuis === true).length;
  const totalRetour = Object.values(memberFollows).filter(f => f.jeSuis === true && f.meSuit === true).length;
  const tauxRetour = totalJeSuis > 0 
    ? Math.round((totalRetour / totalJeSuis) * 100 * 10) / 10 
    : 0;

  if (loading && !validation) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-white">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/follow"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Suivi Follow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Follow de {memberName}
            </h1>
            <p className="text-gray-400">
              Analyse du retour de follow des membres TENF
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-300">
              Mois :
            </label>
            <select
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              {getMonthOptions().map(option => (
                <option key={option} value={option}>
                  {formatMonthKey(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Boutons de synchronisation Twitch (uniquement pour Red) */}
      {isRed && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {twitchConnected === false ? (
              <button
                onClick={handleConnectTwitch}
                className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                🔐 Connecter Twitch (Red)
              </button>
            ) : twitchConnected === true ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">
                  ✅ Twitch connecté
                </span>
                <button
                  onClick={handleSyncFromTwitch}
                  disabled={syncing}
                  className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      🔄 Synchroniser depuis Twitch (Red)
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-gray-400">Vérification de la connexion Twitch...</div>
            )}
          </div>
          {syncMessage && (
            <div className={`p-3 rounded-lg ${
              syncMessage.type === 'success' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {syncMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Boutons d'import manuel (tous les membres du staff) */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowWizebotImport(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            📋 Importer followers (Wizebot)
          </button>
          <button
            onClick={() => setShowFollowingImport(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            📥 Importer following (Je suis)
          </button>
          <button
            onClick={() => setShowRemainingMembers(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            📝 Membres restants à suivre ({members.filter(m => {
              const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
              const follow = memberFollows[normalizedLogin] || memberFollows[m.twitchLogin] || { jeSuis: false, meSuit: null };
              return !follow.jeSuis;
            }).length})
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Taux de follow retour</p>
          <p className="text-3xl font-bold text-[#9146ff]">{tauxRetour}%</p>
          <p className="text-xs text-gray-500 mt-1">Basé sur {totalJeSuis} membres suivis</p>
        </div>
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Nombre de follows retour</p>
          <p className="text-3xl font-bold text-green-400">{totalRetour}</p>
          <p className="text-xs text-gray-500 mt-1">Sur {totalJeSuis} suivis</p>
        </div>
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Total membres</p>
          <p className="text-3xl font-bold text-white">{totalMembers}</p>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Liste des membres TENF
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Pseudo
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Rôle
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Je suis
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Me suit
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Date de validation
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((member) => {
                  // Normaliser le login pour la recherche (cohérence avec l'import)
                  const normalizedLogin = (member.twitchLogin || '').toLowerCase().trim();
                  const follow = memberFollows[normalizedLogin] || memberFollows[member.twitchLogin] || { jeSuis: false, meSuit: null };
                  const validationMember = validation?.members.find(m => 
                    (m.twitchLogin || '').toLowerCase().trim() === normalizedLogin || 
                    m.twitchLogin === member.twitchLogin
                  );
                  
                  return (
                    <tr
                      key={member.twitchLogin}
                      className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">
                            {member.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {member.role || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleJeSuisChange(member.twitchLogin, !follow.jeSuis)}
                          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                            follow.jeSuis
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title={follow.jeSuis ? "Red suit ce membre" : "Red ne suit pas ce membre"}
                        >
                          {follow.jeSuis ? '✅' : '❌'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const nextValue = follow.meSuit === true ? false : follow.meSuit === false ? null : true;
                              handleMeSuitChange(member.twitchLogin, nextValue);
                            }}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                              follow.meSuit === true
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : follow.meSuit === false
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                            }`}
                            title={
                              follow.meSuit === true 
                                ? "Ce membre suit Red" 
                                : follow.meSuit === false 
                                ? "Ce membre ne suit pas Red" 
                                : "Inconnu"
                            }
                          >
                            {follow.meSuit === true ? '✅' : follow.meSuit === false ? '❌' : '?'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {validationMember?.validatedAt
                          ? new Date(validationMember.validatedAt).toLocaleDateString('fr-FR')
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Aucun membre trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commentaire modérateur */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Commentaire du modérateur
        </h2>
        <textarea
          value={moderatorComments}
          onChange={(e) => setModeratorComments(e.target.value)}
          placeholder="Commentaire interne pour contextualiser la situation (retard, oubli, exception, etc.)"
          className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[100px]"
        />
        <p className="text-sm text-gray-500 mt-2">
          Visible par le staff uniquement
        </p>
      </div>

      {/* Bouton validation */}
      <div className="flex justify-end">
        <button
          onClick={handleValidate}
          disabled={saving}
          className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "✅ Enregistrer / Valider les stats"}
        </button>
      </div>

      {/* Info validation */}
      {validation && (
        <div className="mt-4 bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Dernière validation : {new Date(validation.validatedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}

      {/* Modal import Wizebot */}
      {showWizebotImport && (
        <WizebotImportModal
          isOpen={showWizebotImport}
          onClose={() => setShowWizebotImport(false)}
          monthKey={monthKey}
          staffSlug={slug}
          onImportComplete={loadData}
        />
      )}

      {/* Modal import Following */}
      {showFollowingImport && (
        <FollowImportFollowingModal
          isOpen={showFollowingImport}
          onClose={() => setShowFollowingImport(false)}
          monthKey={monthKey}
          staffSlug={slug}
          onImportComplete={loadData}
        />
      )}

      {/* Modal membres restants à suivre */}
      {showRemainingMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowRemainingMembers(false)}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Membres restants à suivre
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Liste des membres TENF que {memberName} ne suit pas encore
                </p>
              </div>
              <button
                onClick={() => setShowRemainingMembers(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const remainingMembers = members.filter(m => {
                  const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
                  const follow = memberFollows[normalizedLogin] || memberFollows[m.twitchLogin] || { jeSuis: false, meSuit: null };
                  return !follow.jeSuis;
                });

                if (remainingMembers.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg">
                        ✅ Tous les membres sont suivis !
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-white font-semibold">
                        {remainingMembers.length} membre{remainingMembers.length > 1 ? 's' : ''} restant{remainingMembers.length > 1 ? 's' : ''} à suivre
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {remainingMembers.map((member) => {
                        // S'assurer d'utiliser le twitchLogin original depuis la liste des membres
                        const twitchLogin = member.twitchLogin || '';
                        const twitchUrl = twitchLogin ? `https://twitch.tv/${twitchLogin}` : '#';
                        
                        return (
                          <a
                            key={member.twitchLogin}
                            href={twitchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 hover:border-[#9146ff] transition-colors cursor-pointer block"
                            onClick={(e) => {
                              if (!twitchLogin) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {member.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                  {member.displayName}
                                </p>
                                <p className="text-gray-400 text-xs truncate">
                                  {twitchLogin}
                                </p>
                                {member.role && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    {member.role}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <svg 
                                  className="w-5 h-5 text-gray-400 hover:text-[#9146ff] transition-colors" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                  />
                                </svg>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* Liste textuelle pour copier */}
                    <div className="mt-6 bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-300">
                          Liste textuelle (pour copier)
                        </p>
                        <button
                          onClick={() => {
                            const textList = remainingMembers.map(m => m.twitchLogin || '').filter(login => login).join('\n');
                            navigator.clipboard.writeText(textList);
                            alert('Liste copiée dans le presse-papiers !');
                          }}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                        >
                          📋 Copier
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={remainingMembers.map(m => m.twitchLogin || '').filter(login => login).join('\n')}
                        className="w-full bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-mono min-h-[150px] resize-none"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex-shrink-0 flex items-center justify-end">
              <button
                onClick={() => setShowRemainingMembers(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
