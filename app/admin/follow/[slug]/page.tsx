"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

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
  }>;
  moderatorComments?: string;
  validatedAt: string;
  validatedBy: string;
}

export default function FollowMemberPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberFollows, setMemberFollows] = useState<Record<string, FollowStatus>>({});
  const [moderatorComments, setModeratorComments] = useState("");
  const [monthKey, setMonthKey] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [saving, setSaving] = useState(false);

  const memberName = STAFF_MEMBERS[slug] || slug;

  useEffect(() => {
    initializeMonth();
    checkAccess();
  }, []);

  useEffect(() => {
    if (monthKey && hasAccess) {
      loadData();
    }
  }, [monthKey, hasAccess]);

  function initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setMonthKey(`${year}-${month}`);
  }

  async function checkAccess() {
    try {
      const user = await getDiscordUser();
      if (user) {
        const access = hasAdminDashboardAccess(user.id);
        setHasAccess(access);
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
        
        // Initialiser les statuts follow
        const initialFollows: Record<string, FollowStatus> = {};
        activeMembers.forEach((m: Member) => {
          initialFollows[m.twitchLogin] = 'unknown';
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
          const follows: Record<string, FollowStatus> = {};
          validationData.validation.members.forEach((m: any) => {
            follows[m.twitchLogin] = m.status;
          });
          setMemberFollows(follows);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(twitchLogin: string, status: FollowStatus) {
    setMemberFollows(prev => ({
      ...prev,
      [twitchLogin]: status,
    }));
  }

  async function handleValidate() {
    if (!slug || !monthKey) return;

    try {
      setSaving(true);
      
      const memberFollowsArray: MemberFollow[] = members.map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        role: m.role,
        status: memberFollows[m.twitchLogin] || 'unknown',
      }));

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
        alert("Validation enregistrée avec succès");
        await loadData();
      } else {
        const error = await response.json();
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
  const followedCount = Object.values(memberFollows).filter(s => s === 'followed').length;
  const notFollowedCount = Object.values(memberFollows).filter(s => s === 'not_followed').length;
  const unknownCount = Object.values(memberFollows).filter(s => s === 'unknown').length;
  const followRate = totalMembers > 0 
    ? Math.round((followedCount / totalMembers) * 100 * 10) / 10 
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Taux de follow retour</p>
          <p className="text-3xl font-bold text-[#9146ff]">{followRate}%</p>
        </div>
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Nombre de follows retour</p>
          <p className="text-3xl font-bold text-green-400">{followedCount}</p>
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
                  Statut follow
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Date de validation
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((member) => {
                  const status = memberFollows[member.twitchLogin] || 'unknown';
                  const validationMember = validation?.members.find(m => m.twitchLogin === member.twitchLogin);
                  
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
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(member.twitchLogin, e.target.value as FollowStatus)}
                          className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        >
                          <option value="unknown">Inconnu</option>
                          <option value="followed">Suivi</option>
                          <option value="not_followed">Non suivi</option>
                        </select>
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
                  <td colSpan={4} className="py-12 text-center text-gray-400">
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
          {saving ? "Enregistrement..." : "Valider l'analyse"}
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
    </div>
  );
}
