"use client";

import { useState, useEffect } from "react";

interface SpotlightEvaluation {
  id: string;
  date: string;
  streamerTwitchLogin: string;
  moderatorDiscordId: string;
  moderatorUsername: string;
  members: Array<{
    twitchLogin: string;
    present: boolean;
    note?: number;
    comment?: string;
  }>;
  validated: boolean;
  validatedAt?: string;
  createdAt: string;
  createdBy: string;
}

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotlight: SpotlightEvaluation | null;
  monthKey: string;
  onSave: (spotlight: SpotlightEvaluation) => void;
}

export default function SpotlightModal({
  isOpen,
  onClose,
  spotlight,
  monthKey,
  onSave,
}: SpotlightModalProps) {
  const [formData, setFormData] = useState<Partial<SpotlightEvaluation>>({
    date: new Date().toISOString().split('T')[0],
    streamerTwitchLogin: '',
    moderatorUsername: '',
    members: [],
    validated: false,
  });
  const [members, setMembers] = useState<Array<{ twitchLogin: string; displayName: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      if (spotlight) {
        setFormData(spotlight);
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          streamerTwitchLogin: '',
          moderatorUsername: '',
          members: [],
          validated: false,
        });
      }
    }
  }, [isOpen, spotlight]);

  async function loadMembers() {
    try {
      const response = await fetch('/api/admin/members');
      if (response.ok) {
        const result = await response.json();
        const memberList = (result.members || []).map((m: any) => ({
          twitchLogin: m.twitchLogin || m.twitch || '',
          displayName: m.displayName || m.nom || m.twitchLogin || m.twitch || '',
        })).filter((m: any) => m.twitchLogin);
        setMembers(memberList);
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  }

  function handleMemberToggle(twitchLogin: string) {
    setFormData((prev) => {
      const existingIndex = prev.members?.findIndex(m => m.twitchLogin === twitchLogin) ?? -1;
      const newMembers = [...(prev.members || [])];
      
      if (existingIndex >= 0) {
        newMembers.splice(existingIndex, 1);
      } else {
        newMembers.push({
          twitchLogin,
          present: true,
          note: undefined,
          comment: '',
        });
      }
      
      return { ...prev, members: newMembers };
    });
  }

  function handleMemberUpdate(twitchLogin: string, updates: Partial<SpotlightEvaluation['members'][0]>) {
    setFormData((prev) => {
      const newMembers = (prev.members || []).map(m => 
        m.twitchLogin === twitchLogin ? { ...m, ...updates } : m
      );
      return { ...prev, members: newMembers };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.date || !formData.streamerTwitchLogin || !formData.moderatorUsername) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const spotlightData: SpotlightEvaluation = {
      id: spotlight?.id || `spotlight-${Date.now()}`,
      date: formData.date,
      streamerTwitchLogin: formData.streamerTwitchLogin,
      moderatorDiscordId: formData.moderatorDiscordId || '',
      moderatorUsername: formData.moderatorUsername,
      members: formData.members || [],
      validated: formData.validated || false,
      validatedAt: formData.validatedAt,
      createdAt: spotlight?.createdAt || new Date().toISOString(),
      createdBy: spotlight?.createdBy || '',
    };

    onSave(spotlightData);
  }

  if (!isOpen) return null;

  const filteredMembers = members.filter(m => 
    m.twitchLogin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMembers = formData.members || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {spotlight ? 'Modifier Spotlight' : 'Nouveau Spotlight'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Streamer (Twitch Login) *
              </label>
              <input
                type="text"
                value={formData.streamerTwitchLogin || ''}
                onChange={(e) => setFormData({ ...formData, streamerTwitchLogin: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Modérateur *
            </label>
            <input
              type="text"
              value={formData.moderatorUsername || ''}
              onChange={(e) => setFormData({ ...formData, moderatorUsername: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Rechercher un membre
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou Twitch login..."
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white mb-4"
            />

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.find(m => m.twitchLogin === member.twitchLogin);
                return (
                  <div
                    key={member.twitchLogin}
                    className={`p-3 rounded-lg border ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-[#0e0e10] border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{member.displayName}</p>
                        <p className="text-sm text-gray-400">{member.twitchLogin}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => handleMemberToggle(member.twitchLogin)}
                          className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded"
                        />
                        <span className="text-sm text-gray-300">Présent</span>
                      </label>
                    </div>
                    {isSelected && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Note (optionnel)</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={isSelected.note || ''}
                            onChange={(e) => handleMemberUpdate(member.twitchLogin, { 
                              note: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-1 text-white text-sm"
                            placeholder="0-20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Commentaire</label>
                          <textarea
                            value={isSelected.comment || ''}
                            onChange={(e) => handleMemberUpdate(member.twitchLogin, { comment: e.target.value })}
                            className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-1 text-white text-sm"
                            rows={2}
                            placeholder="Commentaire du modérateur..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="validated"
              checked={formData.validated || false}
              onChange={(e) => setFormData({ ...formData, validated: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded"
            />
            <label htmlFor="validated" className="text-sm text-gray-300">
              Marquer comme validé
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

