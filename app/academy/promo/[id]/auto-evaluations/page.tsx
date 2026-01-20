"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

interface PublicEvaluation {
  promoId: string;
  userId: string;
  evaluations: Array<{
    id: string;
    formType: string;
    formData: any;
    submittedAt: string;
    isPublic?: boolean;
  }>;
}

export default function AutoEvaluationsPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [publicEvaluations, setPublicEvaluations] = useState<PublicEvaluation[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

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
            loadPublicEvaluations();
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

  const loadPublicEvaluations = async () => {
    try {
      const response = await fetch("/api/academy/public-evaluations", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrer uniquement les auto-évaluations de cette promo
        const promoEvaluations = data.grouped?.filter((group: PublicEvaluation) => 
          group.promoId === promoId
        ) || [];
        setPublicEvaluations(promoEvaluations);
        loadMemberNames(promoEvaluations);
      }
    } catch (error) {
      console.error("Erreur chargement auto-évaluations publiques:", error);
    }
  };

  const loadMemberNames = async (evaluations: PublicEvaluation[]) => {
    try {
      // Récupérer les noms des membres pour chaque userId
      const userIds = [...new Set(evaluations.map(e => e.userId))];
      const names: Record<string, string> = {};
      
      for (const userId of userIds) {
        try {
          // Récupérer le pseudo Twitch depuis les auto-évaluations
          const userEvals = evaluations.find(e => e.userId === userId);
          if (userEvals && userEvals.evaluations.length > 0) {
            const twitchPseudo = userEvals.evaluations[0].formData?.pseudoTwitch || 
                                 userEvals.evaluations[0].formData?.pseudo;
            if (twitchPseudo) {
              names[userId] = twitchPseudo;
            }
          }
        } catch (error) {
          console.error(`Erreur chargement nom pour ${userId}:`, error);
        }
      }
      
      setMemberNames(names);
    } catch (error) {
      console.error("Erreur chargement noms membres:", error);
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
        <h1 className="text-4xl font-bold text-white mb-2">Auto-évaluations publiques</h1>
        <p className="text-gray-400">Découvrez les auto-évaluations partagées par les membres de votre promo</p>
      </div>

      {publicEvaluations.length === 0 ? (
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-8 text-center backdrop-blur-sm">
          <p className="text-gray-400 text-lg mb-4">
            Aucune auto-évaluation publique pour le moment.
          </p>
          <p className="text-gray-500 text-sm">
            Les membres peuvent rendre leurs auto-évaluations publiques depuis leur page de parcours.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {publicEvaluations.map((group) => (
            <div
              key={group.userId}
              className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>👤</span>
                <span>{memberNames[group.userId] || `Membre ${group.userId.substring(0, 8)}...`}</span>
                <span className="ml-auto text-sm font-normal text-gray-400">
                  {group.evaluations.length} auto-évaluation{group.evaluations.length > 1 ? 's' : ''}
                </span>
              </h2>
              
              <div className="space-y-4">
                {group.evaluations.map((eval) => (
                  <div
                    key={eval.id}
                    className="p-4 rounded-lg bg-[#0e0e10] border-2 border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-lg">
                        {eval.formType === 'auto-evaluation-debut' 
                          ? '🟣 Auto-évaluation (début)' 
                          : '🏁 Auto-évaluation (fin)'}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {new Date(eval.submittedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-300">
                      {eval.formData?.pseudoTwitch && (
                        <div>
                          <span className="font-semibold text-purple-400">Pseudo Twitch :</span>
                          <span className="ml-2">{eval.formData.pseudoTwitch}</span>
                        </div>
                      )}
                      
                      {eval.formData?.commentTeSentis && (
                        <div>
                          <span className="font-semibold text-blue-400">Comment te sens-tu ?</span>
                          <p className="mt-1 text-white">{eval.formData.commentTeSentis}</p>
                        </div>
                      )}
                      
                      {eval.formData?.changements && (
                        <div>
                          <span className="font-semibold text-green-400">Changements mis en place :</span>
                          <p className="mt-1 text-white">{eval.formData.changements}</p>
                        </div>
                      )}
                      
                      {eval.formData?.plusUtile && (
                        <div>
                          <span className="font-semibold text-yellow-400">Retour le plus utile :</span>
                          <p className="mt-1 text-white">{eval.formData.plusUtile}</p>
                        </div>
                      )}
                      
                      {eval.formData?.fier && (
                        <div>
                          <span className="font-semibold text-pink-400">De quoi es-tu le plus fier(e) ?</span>
                          <p className="mt-1 text-white">{eval.formData.fier}</p>
                        </div>
                      )}
                      
                      {eval.formData?.difficile && (
                        <div>
                          <span className="font-semibold text-red-400">Ce qui reste difficile :</span>
                          <p className="mt-1 text-white">{eval.formData.difficile}</p>
                        </div>
                      )}
                      
                      {eval.formData?.progressionGlobale !== undefined && (
                        <div>
                          <span className="font-semibold text-purple-400">Progression globale :</span>
                          <span className="ml-2 text-yellow-400 text-lg">
                            {'⭐'.repeat(Math.round(eval.formData.progressionGlobale))}
                          </span>
                          <span className="ml-2 text-gray-400">
                            ({eval.formData.progressionGlobale}/10)
                          </span>
                        </div>
                      )}
                      
                      {eval.formData?.messageFinal && (
                        <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border-l-4 border-purple-400">
                          <span className="font-semibold text-purple-400">Message final :</span>
                          <p className="mt-1 text-white">{eval.formData.messageFinal}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
