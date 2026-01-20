"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function AutoEvaluationDebutPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [formData, setFormData] = useState({
    twitchLogin: "",
    depuisQuand: "",
    descriptionChaine: "",
    evolutionChaine: "",
    forces: "",
    difficultes: "",
    attentesAcademy: "",
    sentimentFin: "",
    messageLibre: "",
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-debut`, {
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-debut`, {
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
          <span className="text-5xl">🧠</span>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              Auto-évaluation – Début de parcours
            </h1>
            <p className="text-purple-400 font-semibold">TENF Academy 🎓</p>
          </div>
        </div>
        
        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-500/10 p-4 mt-6">
          <p className="text-white text-sm leading-relaxed">
            <span className="font-semibold">✍️ À remplir</span> dans ce salon, en <span className="font-semibold">un seul message</span>, au <span className="font-semibold">début de la TENF Academy</span>.
            <br />
            Il n'y a <span className="font-semibold">pas de bonne ou mauvaise réponse</span>.
            <br />
            Ce questionnaire sert uniquement à <span className="font-semibold">t'aider à te situer</span>, et à permettre un mentorat plus juste.
            <br />
            <br />
            <span className="text-purple-300">Prends le temps de répondre honnêtement, pour toi avant tout.</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📋</span>
              <span>Informations de base</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-white text-lg">
                  🎙️ Pseudo Twitch :
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
                  📅 Depuis quand streams-tu ? (approx.)
                </label>
                <input
                  type="text"
                  value={formData.depuisQuand}
                  onChange={(e) => setFormData({ ...formData, depuisQuand: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="Ex: Depuis 6 mois, depuis janvier 2023, etc."
                  required
                />
                <p className="text-sm text-gray-400 mt-2">💡 Une approximation suffit, pas besoin d'être précis au jour près</p>
              </div>
            </div>
          </div>
        </div>

        {/* Question 1 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
            <span>🧭 Comment décrirais-tu ta chaîne aujourd'hui ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ton univers, ton ton, ton contenu, ton rythme de live, l'ambiance, la relation avec ton chat…
            </p>
          </div>
          <textarea
            value={formData.descriptionChaine}
            onChange={(e) => setFormData({ ...formData, descriptionChaine: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Décris ta chaîne avec tes propres mots..."
            required
          />
        </div>

        {/* Question 2 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
            <span>📈 Comment ta chaîne a-t-elle évolué depuis tes débuts ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ce qui a changé, ce que tu faisais avant, ce que tu fais différemment aujourd'hui, ce dont tu es fier(e).
            </p>
          </div>
          <textarea
            value={formData.evolutionChaine}
            onChange={(e) => setFormData({ ...formData, evolutionChaine: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Parle de ton évolution..."
            required
          />
        </div>

        {/* Question 3 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
            <span>💪 Quelles sont, selon toi, tes principales forces en tant que streamer ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Exemple : interaction avec le chat, authenticité, régularité, humour, narration, technique, ambiance, créativité…
            </p>
          </div>
          <textarea
            value={formData.forces}
            onChange={(e) => setFormData({ ...formData, forces: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui te rend unique ? Qu'est-ce qui fonctionne bien ?"
            required
          />
        </div>

        {/* Question 4 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
            <span>⚠️ Quels sont tes points de difficulté ou axes d'amélioration actuels ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Exemple : confiance, stress, régularité, technique, gestion du chat, contenu, visibilité, énergie en live…
            </p>
          </div>
          <textarea
            value={formData.difficultes}
            onChange={(e) => setFormData({ ...formData, difficultes: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui te bloque ou te pose problème actuellement ?"
            required
          />
        </div>

        {/* Question 5 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
            <span>🎯 Qu'attends-tu de la TENF Academy sur ces 15 jours ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Ce que tu aimerais comprendre, débloquer, tester ou améliorer (pas forcément des objectifs chiffrés).
            </p>
          </div>
          <textarea
            value={formData.attentesAcademy}
            onChange={(e) => setFormData({ ...formData, attentesAcademy: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'espères-tu retirer de cette expérience ?"
            required
          />
        </div>

        {/* Question 6 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">6</span>
            <span>💭 Dans l'idéal, comment aimerais-tu te sentir à la fin de la TENF Academy ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Plus confiant(e), plus clair(e), motivé(e), rassuré(e), inspiré(e)…
              <br />
              <span className="font-semibold">👉</span> Ou autre chose.
            </p>
          </div>
          <textarea
            value={formData.sentimentFin}
            onChange={(e) => setFormData({ ...formData, sentimentFin: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Comment veux-tu te sentir dans 15 jours ?"
            required
          />
        </div>

        {/* Question 7 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">7</span>
            <span>✨ Y a-t-il quelque chose d'important à savoir pour bien t'accompagner ?</span>
            <span className="text-sm text-gray-400 font-normal">(optionnel)</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Contrainte, peur, blocage, situation personnelle liée au streaming, ou simplement un message libre.
            </p>
          </div>
          <textarea
            value={formData.messageLibre}
            onChange={(e) => setFormData({ ...formData, messageLibre: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="C'est ton espace libre, dis ce que tu veux..."
          />
        </div>

        {/* Message de fin */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
          <p className="text-white text-center text-lg mb-4">
            🙏 <span className="font-semibold">Merci pour ton honnêteté.</span>
          </p>
          <p className="text-gray-300 text-center text-sm mb-2">
            Ce message servira de <span className="font-semibold text-purple-300">point de départ</span> pour mesurer ton évolution à la fin du parcours.
          </p>
          <p className="text-purple-400 text-center font-bold text-lg">
            🎓 Bienvenue dans la TENF Academy.
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
