"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Plus, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

interface MonthlyDataPoint {
  month: string;
  value: number;
}

interface RankingMember {
  id: number;
  name: string;
  avatar: string;
  value: number;
  progression?: string;
  messages?: number; // Pour vocalRanking
}

interface TopClip {
  id: number;
  name: string;
  avatar: string;
  duration: string;
  thumbnail: string;
}

interface DashboardData {
  twitchActivity: MonthlyDataPoint[];
  spotlightProgression: MonthlyDataPoint[];
  vocalRanking: RankingMember[];
  textRanking: RankingMember[];
  topClips: TopClip[];
  lastUpdated?: string;
  updatedBy?: string;
}

const MONTHS = ["Janv", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

export default function DashboardManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    twitchActivity: [],
    spotlightProgression: [],
    vocalRanking: [],
    textRanking: [],
    topClips: [],
  });

  // Vérifier si l'utilisateur est fondateur
  useEffect(() => {
    async function checkAccess() {
      try {
        const accessResponse = await fetch("/api/admin/access");
        if (accessResponse.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        if (!accessResponse.ok) {
          throw new Error("Erreur lors de la vérification");
        }
        setIsFounder(true);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Erreur lors de la vérification des permissions");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  // Charger les données
  useEffect(() => {
    if (!isFounder) return;
    loadDashboardData();
  }, [isFounder]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/dashboard/data", {
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

      const result = await response.json();
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/dashboard/data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullData: dashboardData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Données sauvegardées avec succès !");
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les données pour obtenir les métadonnées
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error saving dashboard data:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  }

  function addDataPoint(section: 'twitchActivity' | 'spotlightProgression', month: string, value: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: [...prev[section], { month, value }].sort((a, b) => {
        const aIndex = MONTHS.indexOf(a.month);
        const bIndex = MONTHS.indexOf(b.month);
        return aIndex - bIndex;
      }),
    }));
  }

  function updateDataPoint(section: 'twitchActivity' | 'spotlightProgression', index: number, month: string, value: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { month, value } : item
      ),
    }));
  }

  function removeDataPoint(section: 'twitchActivity' | 'spotlightProgression', index: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }

  function addRankingMember(section: 'vocalRanking' | 'textRanking', member: RankingMember) {
    setDashboardData(prev => ({
      ...prev,
      [section]: [...prev[section], member],
    }));
  }

  function updateRankingMember(section: 'vocalRanking' | 'textRanking', index: number, member: RankingMember) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? member : item
      ),
    }));
  }

  function removeRankingMember(section: 'vocalRanking' | 'textRanking', index: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }

  function addTopClip(clip: TopClip) {
    setDashboardData(prev => ({
      ...prev,
      topClips: [...prev.topClips, clip],
    }));
  }

  function updateTopClip(index: number, clip: TopClip) {
    setDashboardData(prev => ({
      ...prev,
      topClips: prev.topClips.map((item, i) => 
        i === index ? clip : item
      ),
    }));
  }

  function removeTopClip(index: number) {
    setDashboardData(prev => ({
      ...prev,
      topClips: prev.topClips.filter((_, i) => i !== index),
    }));
  }

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
        title="Gestion du Dashboard"
        navLinks={[
          { href: "/admin/gestion-acces", label: "Accès Dashboard" },
          { href: "/admin/gestion-acces/dashboard", label: "Gestion du Dashboard", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#10b981' }}>
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* En-tête avec bouton de sauvegarde */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Gestion des données du Dashboard
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Modifiez manuellement les données affichées sur le dashboard principal
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              if (!saving && !loading) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              if (!saving && !loading) e.currentTarget.style.opacity = '1';
            }}
          >
            <Save className="w-5 h-5" />
            {saving ? "Sauvegarde..." : "Sauvegarder tout"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activité Twitch */}
            <DataSection
              title="Activité Twitch"
              description="Données mensuelles pour le graphique d'activité Twitch"
              data={dashboardData.twitchActivity}
              onAdd={(month, value) => addDataPoint('twitchActivity', month, value)}
              onUpdate={(index, month, value) => updateDataPoint('twitchActivity', index, month, value)}
              onRemove={(index) => removeDataPoint('twitchActivity', index)}
              type="monthly"
            />

            {/* Progression Spotlight */}
            <DataSection
              title="Progression Spotlight"
              description="Données mensuelles pour le graphique de progression Spotlight"
              data={dashboardData.spotlightProgression}
              onAdd={(month, value) => addDataPoint('spotlightProgression', month, value)}
              onUpdate={(index, month, value) => updateDataPoint('spotlightProgression', index, month, value)}
              onRemove={(index) => removeDataPoint('spotlightProgression', index)}
              type="monthly"
            />

            {/* Ranking Vocal */}
            <RankingSection
              title="Top Membres Vocaux"
              description="Classement des membres par heures vocales"
              data={dashboardData.vocalRanking}
              onAdd={(member) => addRankingMember('vocalRanking', member)}
              onUpdate={(index, member) => updateRankingMember('vocalRanking', index, member)}
              onRemove={(index) => removeRankingMember('vocalRanking', index)}
              valueLabel="Heures vocales"
            />

            {/* Ranking Textuel */}
            <RankingSection
              title="Top Membres Messages"
              description="Classement des membres par nombre de messages"
              data={dashboardData.textRanking}
              onAdd={(member) => addRankingMember('textRanking', member)}
              onUpdate={(index, member) => updateRankingMember('textRanking', index, member)}
              onRemove={(index) => removeRankingMember('textRanking', index)}
              valueLabel="Messages"
              showProgression={true}
            />

            {/* Top Clips */}
            <TopClipsSection
              title="Top Clips"
              description="Meilleurs clips de la communauté"
              data={dashboardData.topClips}
              onAdd={(clip) => addTopClip(clip)}
              onUpdate={(index, clip) => updateTopClip(index, clip)}
              onRemove={(index) => removeTopClip(index)}
            />
          </div>
        )}

        {/* Informations de dernière mise à jour */}
        {dashboardData.lastUpdated && (
          <div className="mt-6 p-4 rounded-lg border text-sm" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Dernière mise à jour : {new Date(dashboardData.lastUpdated).toLocaleString('fr-FR')}
              {dashboardData.updatedBy && ` par ${dashboardData.updatedBy}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les sections de données mensuelles
function DataSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
  type,
}: {
  title: string;
  description: string;
  data: MonthlyDataPoint[];
  onAdd: (month: string, value: number) => void;
  onUpdate: (index: number, month: string, value: number) => void;
  onRemove: (index: number) => void;
  type: "monthly";
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMonth, setNewMonth] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newMonth && newValue) {
      onAdd(newMonth, parseInt(newValue) || 0);
      setNewMonth("");
      setNewValue("");
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>

      {/* Liste des données */}
      <div className="space-y-2 mb-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <>
                <select
                  value={item.month}
                  onChange={(e) => onUpdate(index, e.target.value, item.value)}
                  className="px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => onUpdate(index, item.month, parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                <span className="font-medium w-16" style={{ color: 'var(--color-text)' }}>{item.month}</span>
                <span className="flex-1" style={{ color: 'var(--color-text-secondary)' }}>{item.value}</span>
                <button
                  onClick={() => setEditingIndex(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter une nouvelle entrée */}
      <div className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <select
          value={newMonth}
          onChange={(e) => setNewMonth(e.target.value)}
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="">Sélectionner un mois</option>
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Valeur"
          className="flex-1 px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newMonth || !newValue}
          className="px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

// Composant pour les sections de ranking
function RankingSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
  valueLabel,
  showProgression = false,
}: {
  title: string;
  description: string;
  data: RankingMember[];
  onAdd: (member: RankingMember) => void;
  onUpdate: (index: number, member: RankingMember) => void;
  onRemove: (index: number) => void;
  valueLabel: string;
  showProgression?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newProgression, setNewProgression] = useState("");

  const handleAdd = () => {
    if (newName && newAvatar && newValue) {
      onAdd({
        id: Date.now(),
        name: newName,
        avatar: newAvatar,
        value: parseInt(newValue) || 0,
        ...(showProgression && newProgression ? { progression: newProgression } : {}),
      });
      setNewName("");
      setNewAvatar("");
      setNewValue("");
      setNewProgression("");
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>

      {/* Liste des membres */}
      <div className="space-y-2 mb-4">
        {data.map((member, index) => (
          <div key={member.id || index} className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => onUpdate(index, { ...member, name: e.target.value })}
                  placeholder="Nom"
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  value={member.avatar}
                  onChange={(e) => onUpdate(index, { ...member, avatar: e.target.value })}
                  placeholder="URL Avatar"
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="number"
                  value={member.value}
                  onChange={(e) => onUpdate(index, { ...member, value: parseInt(e.target.value) || 0 })}
                  placeholder={valueLabel}
                  className="w-32 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                {showProgression && (
                  <input
                    type="text"
                    value={member.progression || ""}
                    onChange={(e) => onUpdate(index, { ...member, progression: e.target.value })}
                    placeholder="Progression"
                    className="w-24 px-3 py-1 rounded border text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                )}
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                <span className="font-medium flex-1" style={{ color: 'var(--color-text)' }}>{member.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{member.value} {valueLabel.toLowerCase()}</span>
                {showProgression && member.progression && (
                  <span className="px-2 py-1 rounded text-xs" style={{ 
                    backgroundColor: member.progression.startsWith('+') ? '#10b98120' : '#dc262620',
                    color: member.progression.startsWith('+') ? '#10b981' : '#dc2626'
                  }}>
                    {member.progression}
                  </span>
                )}
                <button
                  onClick={() => setEditingIndex(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter un nouveau membre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="text"
          value={newAvatar}
          onChange={(e) => setNewAvatar(e.target.value)}
          placeholder="URL Avatar"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={valueLabel}
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        {showProgression && (
          <input
            type="text"
            value={newProgression}
            onChange={(e) => setNewProgression(e.target.value)}
            placeholder="Progression (ex: +3)"
            className="px-3 py-1 rounded border text-sm"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        )}
        <button
          onClick={handleAdd}
          disabled={!newName || !newAvatar || !newValue}
          className="col-span-2 md:col-span-1 px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

// Composant pour les top clips
function TopClipsSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  description: string;
  data: TopClip[];
  onAdd: (clip: TopClip) => void;
  onUpdate: (index: number, clip: TopClip) => void;
  onRemove: (index: number) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");

  const handleAdd = () => {
    if (newName && newAvatar && newDuration && newThumbnail) {
      onAdd({
        id: Date.now(),
        name: newName,
        avatar: newAvatar,
        duration: newDuration,
        thumbnail: newThumbnail,
      });
      setNewName("");
      setNewAvatar("");
      setNewDuration("");
      setNewThumbnail("");
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>

      {/* Liste des clips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {data.map((clip, index) => (
          <div key={clip.id || index} className="p-4 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={clip.name}
                  onChange={(e) => onUpdate(index, { ...clip, name: e.target.value })}
                  placeholder="Nom"
                  className="w-full px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  value={clip.avatar}
                  onChange={(e) => onUpdate(index, { ...clip, avatar: e.target.value })}
                  placeholder="URL Avatar"
                  className="w-full px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  value={clip.duration}
                  onChange={(e) => onUpdate(index, { ...clip, duration: e.target.value })}
                  placeholder="Durée (ex: 316 h)"
                  className="w-full px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  value={clip.thumbnail}
                  onChange={(e) => onUpdate(index, { ...clip, thumbnail: e.target.value })}
                  placeholder="URL Thumbnail"
                  className="w-full px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="w-full px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓ Enregistrer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <img src={clip.avatar} alt={clip.name} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>{clip.name}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{clip.duration}</div>
                  </div>
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="px-3 py-1 rounded text-sm text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="px-3 py-1 rounded text-sm text-white"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <img src={clip.thumbnail} alt={clip.name} className="w-full rounded" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter un nouveau clip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="text"
          value={newAvatar}
          onChange={(e) => setNewAvatar(e.target.value)}
          placeholder="URL Avatar"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="text"
          value={newDuration}
          onChange={(e) => setNewDuration(e.target.value)}
          placeholder="Durée (ex: 316 h)"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="text"
          value={newThumbnail}
          onChange={(e) => setNewThumbnail(e.target.value)}
          placeholder="URL Thumbnail"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName || !newAvatar || !newDuration || !newThumbnail}
          className="col-span-2 md:col-span-4 px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un clip
        </button>
      </div>
    </div>
  );
}

