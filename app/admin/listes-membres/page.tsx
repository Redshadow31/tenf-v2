"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

interface Member {
  twitchLogin: string;
  displayName: string;
  role: string;
}

interface MemberLists {
  list1: Member[];
  list2: Member[];
  list3: Member[];
  unassigned: Member[];
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/listes-membres", label: "Listes Membres", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
];

export default function ListesMembresPage() {
  const [lists, setLists] = useState<MemberLists>({
    list1: [],
    list2: [],
    list3: [],
    unassigned: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [targetList, setTargetList] = useState<number | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      const response = await fetch("/api/admin/members/lists");
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des listes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateMemberList(twitchLogin: string, listId: number | null) {
    try {
      const response = await fetch("/api/admin/members/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ twitchLogin, listId }),
      });

      if (response.ok) {
        await loadLists();
        setSelectedMember(null);
        setTargetList(null);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    }
  }

  const handleDragStart = (twitchLogin: string) => {
    setSelectedMember(twitchLogin);
  };

  const handleDrop = (listId: number) => {
    if (selectedMember) {
      updateMemberList(selectedMember, listId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <AdminHeader title="Gestion des Listes de Membres" navLinks={navLinks} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  const allMembers = [...lists.list1, ...lists.list2, ...lists.list3, ...lists.unassigned];

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <AdminHeader title="Gestion des Listes de Membres" navLinks={navLinks} />
      
      <div className="mt-8 space-y-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <p className="text-gray-300 mb-2">
            Les membres sont répartis en 3 listes pour optimiser les appels API Twitch (99 membres par liste).
          </p>
          <p className="text-gray-300 mb-2">
            Toutes les listes sont combinées et affichées ensemble sur les pages publiques.
          </p>
          <p className="text-gray-300">
            Cliquez sur un membre pour le déplacer vers une autre liste.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste 1 */}
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(1)}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span>Liste 1 ({lists.list1.length} membres)</span>
              <span className="text-sm text-gray-400">Max 99</span>
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {lists.list1.map((member) => (
                <div
                  key={member.twitchLogin}
                  draggable
                  onDragStart={() => handleDragStart(member.twitchLogin)}
                  onClick={() => {
                    const newList = member.twitchLogin === selectedMember ? null : 2;
                    updateMemberList(member.twitchLogin, newList);
                  }}
                  className="bg-[#252529] border border-gray-600 rounded p-3 cursor-move hover:border-[#9146ff] transition-colors"
                >
                  <div className="font-medium text-white">{member.displayName}</div>
                  <div className="text-sm text-gray-400">{member.role}</div>
                </div>
              ))}
              {lists.list1.length === 0 && (
                <div className="text-gray-500 text-center py-4">Aucun membre</div>
              )}
            </div>
          </div>

          {/* Liste 2 */}
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(2)}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span>Liste 2 ({lists.list2.length} membres)</span>
              <span className="text-sm text-gray-400">Max 99</span>
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {lists.list2.map((member) => (
                <div
                  key={member.twitchLogin}
                  draggable
                  onDragStart={() => handleDragStart(member.twitchLogin)}
                  onClick={() => {
                    const newList = member.twitchLogin === selectedMember ? null : 3;
                    updateMemberList(member.twitchLogin, newList);
                  }}
                  className="bg-[#252529] border border-gray-600 rounded p-3 cursor-move hover:border-[#9146ff] transition-colors"
                >
                  <div className="font-medium text-white">{member.displayName}</div>
                  <div className="text-sm text-gray-400">{member.role}</div>
                </div>
              ))}
              {lists.list2.length === 0 && (
                <div className="text-gray-500 text-center py-4">Aucun membre</div>
              )}
            </div>
          </div>

          {/* Liste 3 */}
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(3)}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span>Liste 3 ({lists.list3.length} membres)</span>
              <span className="text-sm text-gray-400">Max 99</span>
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {lists.list3.map((member) => (
                <div
                  key={member.twitchLogin}
                  draggable
                  onDragStart={() => handleDragStart(member.twitchLogin)}
                  onClick={() => {
                    const newList = member.twitchLogin === selectedMember ? null : 1;
                    updateMemberList(member.twitchLogin, newList);
                  }}
                  className="bg-[#252529] border border-gray-600 rounded p-3 cursor-move hover:border-[#9146ff] transition-colors"
                >
                  <div className="font-medium text-white">{member.displayName}</div>
                  <div className="text-sm text-gray-400">{member.role}</div>
                </div>
              ))}
              {lists.list3.length === 0 && (
                <div className="text-gray-500 text-center py-4">Aucun membre</div>
              )}
            </div>
          </div>
        </div>

        {/* Membres non assignés */}
        {lists.unassigned.length > 0 && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Membres non assignés ({lists.unassigned.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lists.unassigned.map((member) => (
                <div
                  key={member.twitchLogin}
                  onClick={() => updateMemberList(member.twitchLogin, 1)}
                  className="bg-[#252529] border border-gray-600 rounded p-3 cursor-pointer hover:border-[#9146ff] transition-colors text-center"
                >
                  <div className="font-medium text-white text-sm">{member.displayName}</div>
                  <div className="text-xs text-gray-400 mt-1">{member.role}</div>
                  <div className="text-xs text-[#9146ff] mt-2">Cliquer pour assigner</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total</h3>
          <p className="text-gray-300">
            {allMembers.length} membres au total (Liste 1: {lists.list1.length}, Liste 2: {lists.list2.length}, Liste 3: {lists.list3.length}, Non assignés: {lists.unassigned.length})
          </p>
        </div>
      </div>
    </div>
  );
}

