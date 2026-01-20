"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function RetourPostLivePage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    twitchLogin: "",
    dateHeure: "",
    duree: "",
    objectif: "",
    bienFonctionne: "",
    ameliorer: "",
    energieEtatEsprit: "",
    momentDifficile: "",
    interactionChat: "",
    detailsInteraction: "",
    ressentiGlobal: "",
    explicationRessenti: "",
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const discordUser = await getDiscordUser();
        setUser(discordUser);
        
        if (discordUser) {
          // Charger les données du membre pour récupérer le Twitch login
          try {
            const memberRes = await fetch("/api/academy/user-data", {
              cache: 'no-store',
            });
            if (memberRes.ok) {
              const memberData = await memberRes.json();
              if (memberData.twitchLogin) {
                setFormData(prev => ({ ...prev, twitchLogin: memberData.twitchLogin }));
              }
            }
          } catch (error) {
            console.error("Erreur chargement membre:", error);
          }
        }

        const response = await fetch("/api/academy/check-access", {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && data.activePromoId === promoId) {
            setHasAccess(true);
            loadExistingData();
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

  const loadExistingData = async () => {
    try {
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/retour-post-live`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.formData) {
          setFormData(prev => ({ ...prev, ...data.formData }));
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/retour-post-live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/academy/promo/${promoId}/formulaires`);
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <Link
          href={`/academy/promo/${promoId}/formulaires`}
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux formulaires
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">🎥</span>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              Retours post-live
            </h1>
            <p className="text-purple-400 font-semibold">TENF Academy 🎓</p>
          </div>
        </div>
        
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-500/10 p-4 mt-6">
          <p className="text-white text-sm leading-relaxed mb-2">
            Ce salon est dédié aux retours après un live, que ce soit :
          </p>
          <ul className="text-white text-sm list-disc list-inside mb-2 ml-2">
            <li>ton propre live (auto-analyse)</li>
            <li>le live d'un autre membre (feedback bienveillant)</li>
          </ul>
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">👉</span> Pas d'obligation de poster après chaque live,
            <br />
            <span className="font-semibold">👉</span> mais au minimum <span className="font-semibold">2 observations de lives d'autres membres</span> sur le parcours.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-500/10 p-4 mt-4">
          <p className="text-white text-sm leading-relaxed">
            <span className="font-semibold">🧠 Auto-retour – Après TON live</span>
            <br />
            <span className="font-semibold">✍️</span> À poster après l'un de tes lives, en <span className="font-semibold">un seul message</span>.
            <br />
            L'objectif n'est pas la perfection, mais la <span className="font-semibold text-purple-300">prise de conscience</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📋</span>
              <span>Informations du live</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  🎮 Pseudo Twitch :
                </label>
                <input
                  type="text"
                  value={formData.twitchLogin}
                  onChange={(e) => setFormData({ ...formData, twitchLogin: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ton pseudo Twitch"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  📅 Date & heure du live :
                </label>
                <input
                  type="text"
                  value={formData.dateHeure}
                  onChange={(e) => setFormData({ ...formData, dateHeure: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: 15/02/2026 à 20h"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  🕒 Durée approximative :
                </label>
                <input
                  type="text"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: 2h30, 3h, etc."
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  🎯 Objectif du live :
                </label>
                <div className="bg-purple-500/20 rounded-lg p-3 mb-3 border-l-4 border-purple-400">
                  <p className="text-purple-200 text-xs">
                    (ex : détente, test, interaction, contenu précis…)
                  </p>
                </div>
                <input
                  type="text"
                  value={formData.objectif}
                  onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Quel était l'objectif de ce live ?"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question 1 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">✅</span>
            <span>Ce qui a bien fonctionné sur ce live</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ambiance, contenu, rythme, interaction, technique, moment clé…
            </p>
          </div>
          <textarea
            value={formData.bienFonctionne}
            onChange={(e) => setFormData({ ...formData, bienFonctionne: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui a bien fonctionné ?"
            required
          />
        </div>

        {/* Question 2 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🔧</span>
            <span>Ce que j'aimerais améliorer ou tester différemment</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Un point précis suffit.
            </p>
          </div>
          <textarea
            value={formData.ameliorer}
            onChange={(e) => setFormData({ ...formData, ameliorer: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce que tu aimerais améliorer ?"
            required
          />
        </div>

        {/* Question 3 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🔋</span>
            <span>Mon énergie et mon état d'esprit pendant le live</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Fatigué(e), détendu(e), stressé(e), concentré(e), enthousiaste…
            </p>
          </div>
          <textarea
            value={formData.energieEtatEsprit}
            onChange={(e) => setFormData({ ...formData, energieEtatEsprit: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Comment te sentais-tu pendant le live ?"
            required
          />
        </div>

        {/* Question 4 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">🧱</span>
            <span>Y a-t-il eu un moment difficile ou inconfortable ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Si oui, pourquoi ?
              <br />
              <span className="font-semibold">👉</span> Si non, indique-le aussi.
            </p>
          </div>
          <textarea
            value={formData.momentDifficile}
            onChange={(e) => setFormData({ ...formData, momentDifficile: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Y a-t-il eu un moment difficile ? Si oui, pourquoi ? Si non, dis-le aussi."
            required
          />
        </div>

        {/* Question 5 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">💬</span>
            <span>Comment j'évalue mon interaction avec le chat ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm mb-3">
              <span className="font-semibold">👉</span> Détails si besoin.
            </p>
          </div>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="interactionChat"
                value="fluide"
                checked={formData.interactionChat === "fluide"}
                onChange={(e) => setFormData({ ...formData, interactionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Fluide et naturelle</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="interactionChat"
                value="correcte"
                checked={formData.interactionChat === "correcte"}
                onChange={(e) => setFormData({ ...formData, interactionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Correcte mais améliorable</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="interactionChat"
                value="difficile"
                checked={formData.interactionChat === "difficile"}
                onChange={(e) => setFormData({ ...formData, interactionChat: e.target.value })}
                className="w-5 h-5 text-purple-500"
                required
              />
              <span className="text-white">Difficile ce jour-là</span>
            </label>
          </div>
          <textarea
            value={formData.detailsInteraction}
            onChange={(e) => setFormData({ ...formData, detailsInteraction: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Détails si besoin..."
          />
        </div>

        {/* Question 6 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">⭐</span>
            <span>Mon ressenti global sur ce live (1 à 5)</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Explique brièvement ta note.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, ressentiGlobal: star.toString() })}
                  className={`text-4xl transition-all ${
                    parseInt(formData.ressentiGlobal) >= star
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  ⭐
                </button>
              ))}
              {formData.ressentiGlobal && (
                <span className="text-white font-semibold ml-2">
                  {formData.ressentiGlobal}/5
                </span>
              )}
            </div>
            <input
              type="hidden"
              value={formData.ressentiGlobal}
              required
            />
            <textarea
              value={formData.explicationRessenti}
              onChange={(e) => setFormData({ ...formData, explicationRessenti: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              placeholder="Explique brièvement pourquoi tu as choisi cette note..."
              required
            />
          </div>
        </div>

        {/* Message de fin */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
          <p className="text-white text-center text-lg">
            🙏 <span className="font-semibold">Ce retour t'aidera à comparer ton évolution sur la durée.</span>
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <Link
            href={`/academy/promo/${promoId}/formulaires`}
            className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "✅ Valider et enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
