"use client";

import { useState, useEffect } from "react";

interface EventEvaluation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  members: Array<{
    twitchLogin: string;
    present: boolean;
    comment?: string;
  }>;
  createdAt: string;
  createdBy: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventEvaluation | null;
  monthKey: string;
  onSave: (event: EventEvaluation) => void;
}

export default function EventModal({
  isOpen,
  onClose,
  event,
  monthKey,
  onSave,
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<EventEvaluation>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    members: [],
  });
  const [members, setMembers] = useState<Array<{ twitchLogin: string; displayName: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      if (event) {
        setFormData(event);
      } else {
        setFormData({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          members: [],
        });
      }
    }
  }, [isOpen, event]);

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
          comment: '',
        });
      }
      
      return { ...prev, members: newMembers };
    });
  }

  function handleMemberComment(twitchLogin: string, comment: string) {
    setFormData((prev) => {
      const newMembers = (prev.members || []).map(m => 
        m.twitchLogin === twitchLogin ? { ...m, comment } : m
      );
      return { ...prev, members: newMembers };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const eventData: EventEvaluation = {
      id: event?.id || `event-${Date.now()}`,
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      members: formData.members || [],
      createdAt: event?.createdAt || new Date().toISOString(),
      createdBy: event?.createdBy || '',
    };

    onSave(eventData);
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
            {event ? 'Modifier Événement' : 'Nouvel Événement TENF'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nom de l'événement *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
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

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.find(m => m.twitchLogin === member.twitchLogin);
                return (
                  <div
                    key={member.twitchLogin}
                    className={`p-3 rounded-lg border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-[#0e0e10] border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{member.displayName}</p>
                        <p className="text-sm text-gray-400">{member.twitchLogin}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => handleMemberToggle(member.twitchLogin)}
                          className="w-4 h-4 text-blue-600 bg-[#0e0e10] border-gray-700 rounded"
                        />
                        <span className="text-sm text-gray-300">Présent</span>
                      </label>
                    </div>
                    {isSelected && (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-400 mb-1">Commentaire</label>
                        <textarea
                          value={isSelected.comment || ''}
                          onChange={(e) => handleMemberComment(member.twitchLogin, e.target.value)}
                          className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-1 text-white text-sm"
                          rows={2}
                          placeholder="Commentaire du modérateur..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
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

