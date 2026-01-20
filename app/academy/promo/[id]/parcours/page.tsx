"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

interface StreamPlanning {
  id: string;
  name: string;
  date: string;
  time: string;
  approximateDuration: string;
}

interface FormResponse {
  id: string;
  formType: string;
  formData: any;
  submittedAt: string;
  isPublic?: boolean;
}

export default function ParcoursPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [twitchLogin, setTwitchLogin] = useState<string>("");
  const [plannings, setPlannings] = useState<StreamPlanning[]>([]);
  const [evaluations, setEvaluations] = useState<FormResponse[]>([]);
  const [feedbacks, setFeedbacks] = useState<FormResponse[]>([]);
  const [showAddPlanning, setShowAddPlanning] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newPlanning, setNewPlanning] = useState({
    name: "",
    date: "",
    time: "",
    approximateDuration: "",
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const discordUser = await getDiscordUser();
        setUser(discordUser);
        
        const response = await fetch("/api/academy/check-access", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && data.activePromoId === promoId) {
            setHasAccess(true);
            loadUserData();
            loadData();
          } else {
            router.push("/academy/access");
          }
        } else {
          router.push("/academy/access");
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        router.push("/academy/access");
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, [promoId, router]);

  const loadUserData = async () => {
    try {
      const response = await fetch("/api/academy/user-data", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.twitchLogin) {
          setTwitchLogin(data.twitchLogin);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données utilisateur:", error);
    }
  };

  const loadData = async () => {
    await Promise.all([
      loadPlannings(),
      loadEvaluations(),
      loadFeedbacks(),
    ]);
  };

  const loadPlannings = async () => {
    try {
      const response = await fetch(`/api/academy/promo/${promoId}/stream-plannings`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setPlannings(data.plannings || []);
      }
    } catch (error) {
      console.error("Erreur chargement plannings:", error);
    }
  };

  const loadEvaluations = async () => {
    try {
      // Charger les auto-évaluations de l'utilisateur
      const [debutResponse, finResponse] = await Promise.all([
        fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-debut`, { cache: 'no-store' }),
        fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-fin`, { cache: 'no-store' }),
      ]);

      const evaluationsList: FormResponse[] = [];
      
      if (debutResponse.ok) {
        const data = await debutResponse.json();
        if (data.formData) {
          evaluationsList.push({
            id: data.id || 'debut',
            formType: 'auto-evaluation-debut',
            formData: data.formData,
            submittedAt: data.submittedAt || new Date().toISOString(),
            isPublic: data.isPublic || false,
          });
        }
      }
      
      if (finResponse.ok) {
        const data = await finResponse.json();
        if (data.formData) {
          evaluationsList.push({
            id: data.id || 'fin',
            formType: 'auto-evaluation-fin',
            formData: data.formData,
            submittedAt: data.submittedAt || new Date().toISOString(),
            isPublic: data.isPublic || false,
          });
        }
      }

      setEvaluations(evaluationsList);
    } catch (error) {
      console.error("Erreur chargement évaluations:", error);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const response = await fetch(`/api/academy/promo/${promoId}/feedbacks`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrer les feedbacks concernant l'utilisateur (par Twitch login)
        const userFeedbacks = (data.feedbacks || []).filter((fb: FormResponse) => {
          const pseudoMembre = fb.formData?.pseudoMembre;
          return pseudoMembre && pseudoMembre.toLowerCase() === twitchLogin.toLowerCase();
        });
        setFeedbacks(userFeedbacks);
      }
    } catch (error) {
      console.error("Erreur chargement feedbacks:", error);
    }
  };

  useEffect(() => {
    if (twitchLogin) {
      loadFeedbacks();
    }
  }, [twitchLogin, promoId]);

  const handleAddPlanning = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/academy/promo/${promoId}/stream-plannings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlanning),
      });

      if (response.ok) {
        setNewPlanning({ name: "", date: "", time: "", approximateDuration: "" });
        setShowAddPlanning(false);
        loadPlannings();
      } else {
        alert("Erreur lors de l'ajout du planning");
      }
    } catch (error) {
      console.error("Erreur ajout planning:", error);
      alert("Erreur lors de l'ajout du planning");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlanning = async (planningId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce planning ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/academy/promo/${promoId}/stream-plannings?planningId=${planningId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        loadPlannings();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression planning:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleTogglePublic = async (formResponseId: string, currentPublic: boolean) => {
    try {
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formResponseId,
          isPublic: !currentPublic,
        }),
      });

      if (response.ok) {
        loadEvaluations();
      } else {
        alert("Erreur lors de la mise à jour de la visibilité");
      }
    } catch (error) {
      console.error("Erreur mise à jour visibilité:", error);
      alert("Erreur lors de la mise à jour de la visibilité");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirection en cours
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <Link
          href={`/academy/dashboard`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Mon parcours (J1–J15)</h1>
        <p className="text-gray-400">Suivez votre progression jour par jour</p>
      </div>

      {/* Planning de stream individuel */}
      <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📅</span>
            <span>Planning de mes streams</span>
          </h2>
          <button
            onClick={() => setShowAddPlanning(!showAddPlanning)}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
          >
            {showAddPlanning ? "Annuler" : "+ Ajouter un stream"}
          </button>
        </div>

        {showAddPlanning && (
          <form onSubmit={handleAddPlanning} className="mb-6 p-4 rounded-lg bg-[#0e0e10] border-2 border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-white text-sm">
                  Nom du stream :
                </label>
                <input
                  type="text"
                  value={newPlanning.name}
                  onChange={(e) => setNewPlanning({ ...newPlanning, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: Live Gaming"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-white text-sm">
                  Date :
                </label>
                <input
                  type="date"
                  value={newPlanning.date}
                  onChange={(e) => setNewPlanning({ ...newPlanning, date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-white text-sm">
                  Heure :
                </label>
                <input
                  type="time"
                  value={newPlanning.time}
                  onChange={(e) => setNewPlanning({ ...newPlanning, time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-white text-sm">
                  Durée approximative :
                </label>
                <input
                  type="text"
                  value={newPlanning.approximateDuration}
                  onChange={(e) => setNewPlanning({ ...newPlanning, approximateDuration: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: 2h, 90min"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          </form>
        )}

        {plannings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun planning de stream pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {plannings.map((planning) => (
              <div
                key={planning.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{planning.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>📅 {new Date(planning.date).toLocaleDateString('fr-FR')}</span>
                    <span>🕐 {planning.time}</span>
                    <span>⏱️ {planning.approximateDuration}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePlanning(planning.id)}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-évaluations */}
      <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>📝</span>
          <span>Mes auto-évaluations</span>
        </h2>
        {evaluations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Vous n'avez pas encore rempli d'auto-évaluation.</p>
            <Link
              href={`/academy/promo/${promoId}/formulaires`}
              className="inline-block px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
            >
              Remplir mes auto-évaluations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="p-4 rounded-lg bg-[#0e0e10] border-2 border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">
                    {evaluation.formType === 'auto-evaluation-debut' ? '🟣 Auto-évaluation (début)' : '🏁 Auto-évaluation (fin)'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      evaluation.isPublic 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {evaluation.isPublic ? '🌐 Public' : '🔒 Privé'}
                    </span>
                    <button
                      onClick={() => handleTogglePublic(evaluation.id, evaluation.isPublic || false)}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
                    >
                      {evaluation.isPublic ? 'Rendre privé' : 'Rendre public'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Complété le {new Date(evaluation.submittedAt).toLocaleDateString('fr-FR')}
                </p>
                <Link
                  href={`/academy/promo/${promoId}/formulaires/${evaluation.formType}`}
                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                >
                  Voir les détails →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedbacks d'autres membres */}
      <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>🤝</span>
          <span>Feedbacks reçus d'autres membres</span>
        </h2>
        {feedbacks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun feedback reçu pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 rounded-lg bg-[#0e0e10] border-2 border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">
                    Live du {feedback.formData?.dateLive || 'Date non spécifiée'}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date(feedback.submittedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  {feedback.formData?.apprecie && (
                    <div>
                      <span className="font-semibold text-purple-400">Ce qui a été apprécié :</span>
                      <p className="mt-1">{feedback.formData.apprecie}</p>
                    </div>
                  )}
                  {feedback.formData?.pointFort && (
                    <div>
                      <span className="font-semibold text-green-400">Point fort :</span>
                      <p className="mt-1">{feedback.formData.pointFort}</p>
                    </div>
                  )}
                  {feedback.formData?.pisteAmelioration && (
                    <div>
                      <span className="font-semibold text-blue-400">Piste d'amélioration :</span>
                      <p className="mt-1">{feedback.formData.pisteAmelioration}</p>
                    </div>
                  )}
                  {feedback.formData?.messageEncouragement && (
                    <div className="mt-3 p-3 rounded-lg bg-green-500/10 border-l-4 border-green-400">
                      <span className="font-semibold text-green-400">💙 Message d'encouragement :</span>
                      <p className="mt-1 text-white">{feedback.formData.messageEncouragement}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
