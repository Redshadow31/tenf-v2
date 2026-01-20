"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function AutoEvaluationFinPage() {
  const params = useParams();
  const router = useRouter();
  const promoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    twitchLogin: "",
    ressentiChaine: "",
    changementsConcrets: "",
    retourMarquant: "",
    fierE: "",
    difficultesResiduelles: "",
    progressionGlobale: "",
    explicationProgression: "",
    feedbacksAutres: "",
    dynamiqueGroupe: "",
    continuerTravail: "",
    motDeFin: "",
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-fin`, {
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
      const response = await fetch(`/api/academy/promo/${promoId}/formulaires/auto-evaluation-fin`, {
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
              Auto-évaluation – Fin de parcours
            </h1>
            <p className="text-purple-400 font-semibold">TENF Academy 🎓</p>
          </div>
        </div>
        
        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-500/10 p-4 mt-6">
          <p className="text-white text-sm leading-relaxed">
            <span className="font-semibold">✍️ À remplir</span> dans ce salon, en <span className="font-semibold">un seul message</span>, à la <span className="font-semibold">fin des 15 jours de la TENF Academy</span>.
            <br />
            Ce bilan est <span className="font-semibold">personnel</span>. Il n'est <span className="font-semibold">ni noté, ni jugé</span>.
            <br />
            Il sert à <span className="font-semibold">mesurer ton évolution</span> et à t'aider à repartir avec plus de clarté.
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
          </div>
        </div>

        {/* Question 1 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
            <span>🎯 Comment te sens-tu par rapport à ta chaîne aujourd'hui ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Confiance, motivation, clarté, fatigue, doutes, sérénité…
              <br />
              <span className="font-semibold">👉</span> Comparé à ton ressenti du début de parcours.
            </p>
          </div>
          <textarea
            value={formData.ressentiChaine}
            onChange={(e) => setFormData({ ...formData, ressentiChaine: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Comment te sens-tu maintenant par rapport à il y a 15 jours ?"
            required
          />
        </div>

        {/* Question 2 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
            <span>🔁 As-tu mis en place des changements concrets pendant ces 15 jours ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Contenu, posture, rythme, interaction, organisation, mindset…
              <br />
              <span className="font-semibold">👉</span> Même de petits ajustements comptent.
            </p>
          </div>
          <textarea
            value={formData.changementsConcrets}
            onChange={(e) => setFormData({ ...formData, changementsConcrets: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quels changements as-tu concrètement mis en place ?"
            required
          />
        </div>

        {/* Question 3 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
            <span>💬 Quel retour ou échange t'a le plus aidé ou marqué ? Pourquoi ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Feedback reçu, discussion, observation d'un autre live…
            </p>
          </div>
          <textarea
            value={formData.retourMarquant}
            onChange={(e) => setFormData({ ...formData, retourMarquant: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quel échange t'a le plus marqué et pourquoi ?"
            required
          />
        </div>

        {/* Question 4 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
            <span>🌟 De quoi es-tu le plus fier(e) sur cette période ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Une action, une prise de conscience, un dépassement personnel.
            </p>
          </div>
          <textarea
            value={formData.fierE}
            onChange={(e) => setFormData({ ...formData, fierE: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui te rend fier(e) de toi sur ces 15 jours ?"
            required
          />
        </div>

        {/* Question 5 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
            <span>🧱 Qu'est-ce qui reste encore difficile ou flou pour toi ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Sans jugement. Identifier un point, c'est déjà avancer.
            </p>
          </div>
          <textarea
            value={formData.difficultesResiduelles}
            onChange={(e) => setFormData({ ...formData, difficultesResiduelles: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Qu'est-ce qui reste encore difficile ou flou ?"
            required
          />
        </div>

        {/* Question 6 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">6</span>
            <span>📈 Comment évalues-tu ta progression globale ? (1 à 10)</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> <strong>1</strong> = aucun changement
              <br />
              <span className="font-semibold">👉</span> <strong>10</strong> = vraie transformation
              <br />
              <span className="font-semibold">👉</span> (Explique brièvement ton ressenti)
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="number"
              min="1"
              max="10"
              value={formData.progressionGlobale}
              onChange={(e) => setFormData({ ...formData, progressionGlobale: e.target.value })}
              className="w-32 px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all text-2xl font-bold text-center"
              placeholder="1-10"
              required
            />
            <textarea
              value={formData.explicationProgression}
              onChange={(e) => setFormData({ ...formData, explicationProgression: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              placeholder="Explique brièvement pourquoi tu as choisi cette note..."
              required
            />
          </div>
        </div>

        {/* Question 7 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">7</span>
            <span>🧩 Te sens-tu plus à l'aise pour donner des feedbacks à d'autres streamers ? Pourquoi ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Confiance, légitimité, écoute, formulation…
            </p>
          </div>
          <textarea
            value={formData.feedbacksAutres}
            onChange={(e) => setFormData({ ...formData, feedbacksAutres: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Comment te sens-tu maintenant pour donner des feedbacks ?"
            required
          />
        </div>

        {/* Question 8 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">8</span>
            <span>🤝 Comment as-tu vécu la dynamique de groupe ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Te sentais-tu soutenu(e), écouté(e), à ta place ?
              <br />
              <span className="font-semibold">👉</span> Qu'est-ce qui t'a aidé ou manqué ?
            </p>
          </div>
          <textarea
            value={formData.dynamiqueGroupe}
            onChange={(e) => setFormData({ ...formData, dynamiqueGroupe: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Comment as-tu vécu le groupe pendant ces 15 jours ?"
            required
          />
        </div>

        {/* Question 9 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">9</span>
            <span>🛠️ Sur quoi souhaites-tu continuer à travailler après la TENF Academy ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Objectifs personnels, axes prioritaires, prochaines étapes.
            </p>
          </div>
          <textarea
            value={formData.continuerTravail}
            onChange={(e) => setFormData({ ...formData, continuerTravail: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Quels sont tes objectifs pour la suite ?"
            required
          />
        </div>

        {/* Question 10 */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">10</span>
            <span>💬 Un mot de fin pour ton groupe ou l'équipe TENF Academy ?</span>
          </h2>
          <div className="bg-purple-500/20 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-purple-200 text-sm">
              <span className="font-semibold">👉</span> Remerciement, message libre, ressenti final.
            </p>
          </div>
          <textarea
            value={formData.motDeFin}
            onChange={(e) => setFormData({ ...formData, motDeFin: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0e0e10] border-2 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
            placeholder="Dis ce que tu veux, c'est ton message libre..."
            required
          />
        </div>

        {/* Message de fin */}
        <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 backdrop-blur-sm">
          <p className="text-white text-center text-lg mb-4">
            🙏 <span className="font-semibold">Merci pour ton investissement et ton honnêteté.</span>
          </p>
          <p className="text-gray-300 text-center text-sm mb-2">
            Ce bilan marque la <span className="font-semibold text-purple-300">fin du parcours</span>, pas la fin de ta progression 💙
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
