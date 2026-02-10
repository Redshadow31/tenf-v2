"use client";

import { useState, useEffect } from "react";

type MemberRole = "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" | "Communauté";

interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: "Actif" | "Inactif";
  discord: string;
  discordId?: string;
  twitch: string;
  twitchId?: string; // ID Twitch numérique
  notesInternes?: string;
  description?: string;
  badges?: string[];
  isVip?: boolean;
  createdAt?: string; // Date ISO de création (membre depuis)
  integrationDate?: string; // Date ISO d'intégration
  roleHistory?: Array<{
    fromRole: string;
    toRole: string;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>;
  parrain?: string; // Pseudo/nom du membre parrain
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSave: (member: Member) => void;
}

export default function EditMemberModal({
  isOpen,
  onClose,
  member,
  onSave,
}: EditMemberModalProps) {
  const [formData, setFormData] = useState<Member>(member);
  const [badgeInput, setBadgeInput] = useState("");
  const [showRoleHistory, setShowRoleHistory] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [availableMembers, setAvailableMembers] = useState<Array<{ nom: string; twitch: string }>>([]);
  const [parrainSuggestions, setParrainSuggestions] = useState<string[]>([]);
  const [showParrainSuggestions, setShowParrainSuggestions] = useState(false);
  const originalRole = member.role;

  useEffect(() => {
    if (isOpen) {
      setFormData(member);
      setBadgeInput("");
      setRoleChangeReason("");
      // Charger la liste des membres actifs pour l'autocomplétion
      loadAvailableMembers();
    }
  }, [isOpen, member]);

  const loadAvailableMembers = async () => {
    try {
      const response = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const members = (data.members || [])
          .filter((m: any) => m.displayName && m.displayName !== member.nom) // Exclure le membre lui-même
          .map((m: any) => ({
            nom: m.displayName,
            twitch: m.twitchLogin || "",
          }));
        setAvailableMembers(members);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  };

  const handleParrainInputChange = (value: string) => {
    setFormData({ ...formData, parrain: value });
    if (value.trim().length > 0) {
      const filtered = availableMembers
        .filter(m => 
          m.nom.toLowerCase().includes(value.toLowerCase()) ||
          m.twitch.toLowerCase().includes(value.toLowerCase())
        )
        .map(m => m.nom)
        .slice(0, 10); // Limiter à 10 suggestions
      setParrainSuggestions(filtered);
      setShowParrainSuggestions(true);
    } else {
      setParrainSuggestions([]);
      setShowParrainSuggestions(false);
    }
  };

  const selectParrain = (parrainName: string) => {
    setFormData({ ...formData, parrain: parrainName });
    setShowParrainSuggestions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Si le rôle a changé, ajouter roleChangeReason aux données
    const dataToSave = { ...formData };
    if (formData.role !== originalRole) {
      (dataToSave as any).roleChangeReason = roleChangeReason || undefined;
    }
    onSave(dataToSave);
  };

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case "Créateur Junior":
        return "bg-[#9146ff]/20 text-[#9146ff] border-[#9146ff]/30";
      default:
        return "bg-gray-700/20 text-gray-300 border-gray-700/30";
    }
  };

  const getStatusBadgeColor = (statut: "Actif" | "Inactif") => {
    return statut === "Actif"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
      : "bg-purple-900/20 text-purple-400 border-purple-900/30";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixe */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={formData.avatar}
              alt={formData.nom}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{formData.nom}</h2>
              <p className="text-sm text-gray-400">ID: {formData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(formData.role)}`}>
              {formData.role}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(formData.statut)}`}>
              {formData.statut}
            </span>
            {formData.isVip && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30">
                VIP
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="edit-member-form">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-6">
                {/* Section Identité */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Identité</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Nom du créateur *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Section Twitch */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Twitch</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pseudo Twitch *
                      </label>
                      <input
                        type="text"
                        value={formData.twitch}
                        onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        ID Twitch (numérique)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.twitchId || ""}
                          onChange={(e) => setFormData({ ...formData, twitchId: e.target.value })}
                          className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          placeholder="Ex: 123456789 (résolu automatiquement)"
                        />
                        {formData.twitch && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Synchroniser l'ID Twitch pour ${formData.twitch} ?`)) return;
                              try {
                                const response = await fetch('/api/admin/members/sync-twitch-id', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ twitchLogin: formData.twitch }),
                                });
                                const data = await response.json();
                                if (response.ok && data.success && data.results?.[0]?.twitchId) {
                                  setFormData({ ...formData, twitchId: data.results[0].twitchId });
                                  alert(`✅ ID Twitch synchronisé: ${data.results[0].twitchId}`);
                                } else {
                                  alert(`❌ ${data.error || 'Impossible de synchroniser l\'ID Twitch'}`);
                                }
                              } catch (error) {
                                console.error('Erreur sync Twitch ID:', error);
                                alert('❌ Erreur lors de la synchronisation');
                              }
                            }}
                            className="text-sm text-purple-400 hover:text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 px-3 py-2 rounded-lg border border-purple-500/30 whitespace-nowrap"
                            title="Synchroniser depuis Twitch API"
                          >
                            🔄 Sync
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.twitchId ? (
                          <span className="text-green-400">✅ ID Twitch lié</span>
                        ) : (
                          <span className="text-yellow-400">⚠️ ID manquant - utilisez le bouton Sync pour résoudre automatiquement</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Discord */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Discord</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pseudo Discord *
                      </label>
                      <input
                        type="text"
                        value={formData.discord}
                        onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        ID Discord
                      </label>
                      <input
                        type="text"
                        value={formData.discordId || ""}
                        onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Ex: 535244297214361603"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                {/* Section Statut */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Statut</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-300">
                          Rôle
                        </label>
                        {formData.roleHistory && formData.roleHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowRoleHistory(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                          >
                            📜 Historique
                          </button>
                        )}
                      </div>
                      {originalRole === "Communauté" && (
                        <div className="mb-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <p className="text-xs text-orange-300">
                            ⚠️ Rôle &quot;Communauté&quot; forcé par l&apos;évaluation mensuelle. Changez le rôle ci-dessous pour le retirer.
                          </p>
                        </div>
                      )}
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
                        className={`w-full bg-[#0e0e10] border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 ${
                          formData.role === "Communauté" ? 'border-orange-500/50' : 'border-gray-700'
                        }`}
                      >
                        <option value="Affilié">Affilié</option>
                        <option value="Développement">Développement</option>
                        <option value="Modérateur Junior">Modérateur Junior</option>
                        <option value="Mentor">Mentor</option>
                        <option value="Admin">Admin</option>
                        <option value="Admin Adjoint">Admin Adjoint</option>
                        <option value="Créateur Junior">Créateur Junior</option>
                        <option value="Communauté">Communauté (évaluation)</option>
                      </select>
                      {formData.role !== originalRole && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-400 mb-1">
                            Raison du changement de rôle (optionnel)
                          </label>
                          <input
                            type="text"
                            value={roleChangeReason}
                            onChange={(e) => setRoleChangeReason(e.target.value)}
                            className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            placeholder="Ex: Promotion, changement de fonction..."
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Statut
                      </label>
                      <select
                        value={formData.statut}
                        onChange={(e) =>
                          setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
                        }
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        VIP
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isVip || false}
                          onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                          className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Membre VIP</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section Badges */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Badges</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={badgeInput}
                        onChange={(e) => setBadgeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                              setFormData({
                                ...formData,
                                badges: [...(formData.badges || []), badgeInput.trim()],
                              });
                              setBadgeInput("");
                            }
                          }
                        }}
                        className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Ajouter un badge (ex: VIP Élite, Modérateur Junior...)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                            setFormData({
                              ...formData,
                              badges: [...(formData.badges || []), badgeInput.trim()],
                            });
                            setBadgeInput("");
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
                      >
                        Ajouter
                      </button>
                    </div>
                    {formData.badges && formData.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.badges.map((badge, index) => (
                          <span
                            key={index}
                            className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2"
                          >
                            {badge}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  badges: formData.badges?.filter((_, i) => i !== index),
                                });
                              }}
                              className="text-purple-300 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Dates */}
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Dates</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date de création (membre depuis)
                      </label>
                      <input
                        type="date"
                        value={formData.createdAt ? formData.createdAt.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            createdAt: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Date d'ajout du membre dans TENF V2 (utilisée pour "membre depuis X")
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date d'intégration
                      </label>
                      <input
                        type="date"
                        value={formData.integrationDate ? formData.integrationDate.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            integrationDate: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Date de la réunion d'intégration validée
                      </p>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Parrain / Marraine
                      </label>
                      <input
                        type="text"
                        value={formData.parrain || ""}
                        onChange={(e) => handleParrainInputChange(e.target.value)}
                        onFocus={() => {
                          if (formData.parrain) {
                            handleParrainInputChange(formData.parrain);
                          }
                        }}
                        onBlur={() => {
                          // Délai pour permettre le clic sur une suggestion
                          setTimeout(() => setShowParrainSuggestions(false), 200);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Rechercher un membre..."
                      />
                      {showParrainSuggestions && parrainSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {parrainSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectParrain(suggestion)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-600/20 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Membre qui a parrainé ce membre dans TENF
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bas pleine largeur */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Descriptif du streamer
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Description publique du streamer..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Notes internes
                </label>
                <textarea
                  value={formData.notesInternes || ""}
                  onChange={(e) => setFormData({ ...formData, notesInternes: e.target.value })}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Notes internes (non visibles publiquement)..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer fixe */}
        <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-member-form"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enregistrer
          </button>
        </div>

        {/* Modal Historique des rôles */}
        {showRoleHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowRoleHistory(false)}
          >
            <div
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Historique des rôles</h3>
                <button
                  onClick={() => setShowRoleHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {formData.roleHistory && formData.roleHistory.length > 0 ? (
                <div className="space-y-3">
                  {formData.roleHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold">
                            {entry.fromRole} → {entry.toRole}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-500">Modifié par:</span> {entry.changedBy}
                      </div>
                      {entry.reason && (
                        <div className="text-sm text-gray-400 mt-2 italic">
                          Raison: {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Aucun historique de changement de rôle
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
