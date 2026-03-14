"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import WizebotImportModal from "@/components/admin/WizebotImportModal";
import FollowImportFollowingModal from "@/components/admin/FollowImportFollowingModal";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

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
  const [dataSourceMonth, setDataSourceMonth] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [saving, setSaving] = useState(false);
  const [showWizebotImport, setShowWizebotImport] = useState(false);
  const [showFollowingImport, setShowFollowingImport] = useState(false);
  const [showRemainingMembers, setShowRemainingMembers] = useState(false);
  type SortableColumn = "displayName" | "twitchLogin" | "role" | "jeSuis" | "meSuit" | "validatedAt";
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [memberName, setMemberName] = useState<string>(slug);
  const [isValidSlug, setIsValidSlug] = useState<boolean | null>(null);

  useEffect(() => {
    initializeMonth();
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess && slug) {
      fetch(`/api/follow/staff`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          const entry = (data?.staff || []).find((s: { slug: string; displayName: string }) => s.slug === slug);
          setIsValidSlug(!!entry);
          setMemberName(entry?.displayName || slug);
        })
        .catch(() => setMemberName(slug));
    }
  }, [hasAccess, slug]);

  useEffect(() => {
    if (monthKey && hasAccess) {
      loadData();
    }
  }, [monthKey, hasAccess, slug]);

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
      
      let allMembers: Member[] = [];
      
      // Charger les membres TENF
      const membersResponse = await fetch('/api/admin/members', { cache: 'no-store' });
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        allMembers = (membersData.members || [])
          .map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.twitchLogin || '',
            role: m.role,
            isActive: m.isActive,
          }))
          .filter((m: Member) => m.twitchLogin);
        setMembers(allMembers);
        
        // Initialiser les statuts follow avec normalisation
        const initialFollows: Record<string, { jeSuis: boolean; meSuit: boolean | null }> = {};
        allMembers.forEach((m: Member) => {
          const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
          if (normalizedLogin) {
            initialFollows[normalizedLogin] = { jeSuis: false, meSuit: null };
          }
        });
        setMemberFollows(initialFollows);
      }

      // Charger la validation existante (forcer le rechargement pour avoir les dernières données)
      const validationResponse = await fetch(`/api/follow/validations/${monthKey}/${slug}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        setDataSourceMonth(validationData.dataSourceMonth || null);
        setValidation(validationData.validation ?? null);
        if (validationData.validation) {
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
          // Utiliser allMembers qui vient d'être chargé dans cette fonction
          const mergedFollows: Record<string, { jeSuis: boolean; meSuit: boolean | null }> = {};
          // Utiliser allMembers si disponible, sinon fallback sur members du state
          const membersToProcess = allMembers.length > 0 ? allMembers : members;
          membersToProcess.forEach((m: Member) => {
            const normalizedLogin = (m.twitchLogin || '').toLowerCase().trim();
            if (normalizedLogin) {
              // Chercher dans follows avec normalisation, mais aussi avec le login original comme fallback
              mergedFollows[normalizedLogin] = follows[normalizedLogin] || 
                follows[m.twitchLogin?.toLowerCase().trim() || ''] || 
                { jeSuis: false, meSuit: null };
            }
          });
          
          setMemberFollows(mergedFollows);
        } else {
          setModeratorComments('');
          setMemberFollows({});
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
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

  // Fonction pour gérer le tri
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, trier par ordre croissant
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Composant pour les en-têtes triables
  const SortableHeader = ({ column, label }: { column: SortableColumn; label: string }) => (
    <th 
      className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortColumn === column && (
          <span className="text-purple-400">
            {sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </div>
    </th>
  );

  // Trier les membres selon la colonne sélectionnée
  const sortedMembers = [...members].sort((a, b) => {
    if (!sortColumn) return 0;

    const normalizedLoginA = (a.twitchLogin || '').toLowerCase().trim();
    const normalizedLoginB = (b.twitchLogin || '').toLowerCase().trim();
    const followA = memberFollows[normalizedLoginA] || memberFollows[a.twitchLogin] || { jeSuis: false, meSuit: null };
    const followB = memberFollows[normalizedLoginB] || memberFollows[b.twitchLogin] || { jeSuis: false, meSuit: null };
    const validationA = validation?.members.find(m => 
      (m.twitchLogin || '').toLowerCase().trim() === normalizedLoginA || 
      m.twitchLogin === a.twitchLogin
    );
    const validationB = validation?.members.find(m => 
      (m.twitchLogin || '').toLowerCase().trim() === normalizedLoginB || 
      m.twitchLogin === b.twitchLogin
    );

    let comparison = 0;

    switch (sortColumn) {
      case "displayName":
        comparison = (a.displayName || '').localeCompare(b.displayName || '', 'fr', { sensitivity: 'base' });
        break;
      case "twitchLogin":
        comparison = (a.twitchLogin || '').localeCompare(b.twitchLogin || '', 'fr', { sensitivity: 'base' });
        break;
      case "role":
        comparison = (a.role || '').localeCompare(b.role || '', 'fr', { sensitivity: 'base' });
        break;
      case "jeSuis":
        comparison = (followA.jeSuis ? 1 : 0) - (followB.jeSuis ? 1 : 0);
        break;
      case "meSuit":
        const meSuitA = followA.meSuit === true ? 2 : followA.meSuit === false ? 1 : 0;
        const meSuitB = followB.meSuit === true ? 2 : followB.meSuit === false ? 1 : 0;
        comparison = meSuitA - meSuitB;
        break;
      case "validatedAt":
        const dateA = validationA?.validatedAt ? new Date(validationA.validatedAt).getTime() : 0;
        const dateB = validationB?.validatedAt ? new Date(validationB.validatedAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

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

  if (isValidSlug === false) {
    return (
      <div className="text-white">
        <div className="mb-8">
          <Link href="/admin/follow" className="text-gray-400 hover:text-white transition-colors inline-block">
            ← Retour au hub Suivi Follow
          </Link>
        </div>
        <div className="bg-[#1a1a1d] border border-amber-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-amber-400 mb-4">Membre du staff introuvable</h1>
          <p className="text-gray-400">
            Ce membre n'existe pas ou a été retiré de la liste. Consultez la page de gestion du staff pour modifier la liste.
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
          <div className="flex flex-wrap items-center gap-4">
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
            {dataSourceMonth && dataSourceMonth !== monthKey && (
              <span className="text-amber-400 text-sm">
                Données affichées : {formatMonthKey(dataSourceMonth)} (aucune donnée pour {formatMonthKey(monthKey)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Boutons d'import (additif uniquement - pas de suppression automatique) */}
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
                <SortableHeader column="displayName" label="Pseudo" />
                <SortableHeader column="twitchLogin" label="Chaîne Twitch" />
                <SortableHeader column="role" label="Rôle" />
                <SortableHeader column="jeSuis" label="Je suis" />
                <SortableHeader column="meSuit" label="Me suit" />
                <SortableHeader column="validatedAt" label="Date de validation" />
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length > 0 ? (
                sortedMembers.map((member) => {
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
                      <td className="py-3 px-4">
                        {member.twitchLogin ? (
                          <a
                            href={`https://twitch.tv/${member.twitchLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9146ff] hover:text-[#7c3aed] hover:underline transition-colors flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-sm font-mono">@{member.twitchLogin}</span>
                            <svg 
                              className="w-3.5 h-3.5 text-gray-400" 
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
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
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
                  <td colSpan={6} className="py-12 text-center text-gray-400">
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-white font-medium truncate">
                                    {member.displayName}
                                  </p>
                                  {twitchLogin && twitchLogin.toLowerCase() !== member.displayName.toLowerCase() && (
                                    <span className="text-[#9146ff] text-xs font-mono bg-[#9146ff]/10 px-2 py-0.5 rounded border border-[#9146ff]/30">
                                      @{twitchLogin}
                                    </span>
                                  )}
                                </div>
                                {twitchLogin && (
                                  <p className="text-gray-400 text-xs truncate mt-1">
                                    twitch.tv/{twitchLogin}
                                  </p>
                                )}
                                {member.role && (
                                  <span className={`${getRoleBadgeClassName(member.role)} mt-2`}>
                                    {getRoleBadgeLabel(member.role)}
                                  </span>
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
