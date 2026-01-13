"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Partie3Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/evaluations/discours"
            className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Retour au guide
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Partie 3 - VIP Élite, Récompenses, Bien s&apos;Intégrer</h1>
          <p className="text-gray-400">Slides 7, 11, 12</p>
        </div>

        {/* SLIDE 7 : PLUS QU'UN DISCORD (VIP ÉLITE) */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide7">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">7. Pourquoi c&apos;est Plus qu&apos;un Simple Discord ?</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 3-4 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer le VIP Élite</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Fondateur ou adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le Spotlight : mise en avant structurée et guidée</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La Communauté active : entraide au quotidien</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le VIP Élite : reconnaissance de l&apos;implication humaine</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">VIP Élite NON ACHETABLE - basé sur l&apos;entraide</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Indépendant des chiffres Twitch</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Faire partie de la New Family, ce n&apos;est pas juste rejoindre un Discord de plus. C&apos;est entrer dans un <strong>vrai système d&apos;entraide</strong>, pensé pour vous accompagner, vous mettre en valeur, et vous aider à évoluer.</p>
                <p><strong>Le Spotlight</strong>, on en a déjà parlé : c&apos;est notre vitrine pour tous, accessible dès ton arrivée, sans prérequis.</p>
                <p><strong>La Communauté active</strong>, c&apos;est la vraie force ici : vous trouverez des streamers qui comprennent vos galères, des membres qui vous encouragent, qui vous suivent, qui vous raid. Du soutien sur vos scènes, vos réglages, votre contenu, votre stress avant un live…</p>
                <p>Et puis, il y a le <strong>rôle VIP Élite</strong>. C&apos;est notre façon de remercier les membres les plus actifs dans l&apos;entraide :</p>
                <p>• présence sur Discord<br />
                • participation aux Spotlight<br />
                • raids communautaires<br />
                • participation aux événements<br />
                • soutien régulier aux autres membres</p>
                <p>Ce rôle donne accès à des <strong>salons privés, des tutoriels exclusifs, le droit de participer à certaines décisions, l&apos;annonce automatique de ton live, la mention @everyone</strong>, et un <strong>badge unique</strong>.</p>
                <p>Et attention : <strong>le VIP Élite ne s&apos;achète PAS</strong>. Il se mérite par la régularité et l&apos;esprit d&apos;entraide, <strong>jamais par les chiffres</strong>. C&apos;est une reconnaissance de ton implication humaine.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>⚠️ INSISTEZ LOURDEMENT</strong> : VIP Élite NON ACHETABLE</li>
                <li><strong>💜 Valorisez</strong> l&apos;aspect humain vs les chiffres</li>
                <li><strong>🎯 Listez les avantages</strong> du VIP Élite clairement</li>
                <li><strong>🤝 Expliquez</strong> que c&apos;est basé sur l&apos;entraide régulière</li>
                <li><strong>✨ Mentionnez</strong> le badge exclusif comme reconnaissance</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/rTr0F4GN" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 7 HD</a>
          </div>
        </section>

        {/* SLIDE 11 : RÉCOMPENSES */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide11">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">8. Gagne des Points et Débloque des Récompenses !</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 5-6 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer le système de points</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Fondateur ou adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Comment gagner des points (actions quotidiennes)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La boutique Spotlight (analyse, interview, posts, défis)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Démonstration du salon bonus-journalier et commande /journalier</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ce n&apos;est pas une compétition - c&apos;est une valorisation</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Dans la New Family, on croit que l&apos;entraide mérite d&apos;être reconnue. Chaque action positive te rapporte des points :</p>
                <p><strong>Actions Quotidiennes :</strong></p>
                <p>📷 <strong>Suivre les réseaux du serveur</strong> → +500 pts<br />
                📅 <strong>Participer aux événements Discord</strong> → +200 à +500 pts<br />
                🎫 <strong>Parrainage</strong> → +300 pts chacun<br />
                💥 <strong>Raid fait à un membre</strong> → +500 pts<br />
                🆙 <strong>Gain tous les 3 niveaux d&apos;XP</strong> → +500 pts<br />
                👋 <strong>Cadeau de bienvenue</strong> → +1 000 pts<br />
                🎂 <strong>Bonus anniversaire</strong> → +2 000 pts<br />
                📰 <strong>Bonus journalier</strong> (commande /journalier) → +500 pts par jour</p>
                <p><strong>Boutique Spotlight :</strong></p>
                <p>🎤 <strong>Spotlight complet</strong> → 30 000 pts<br />
                📊 <strong>Analyse de chaîne</strong> → De 6 000 à 25 000 pts<br />
                🎤 <strong>Interview</strong> → 10 000 pts<br />
                📷 <strong>Post sur réseaux officiels</strong> → 6 000 pts<br />
                😊 <strong>Défi rigolo et rôle rigolo</strong> → De 2 500 à 5 000 pts</p>
                <p><em>(À ce moment, faites une démo du salon ⁠🗓・bonus-journalier et de la commande /journalier)</em></p>
                <p>Ce système n&apos;est pas une compétition. C&apos;est une <strong>valorisation de ton implication</strong>, à ton rythme.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎥 DÉMONSTRATION EN DIRECT</strong> de la commande /journalier</li>
                <li><strong>📍 Montrez le salon</strong> ⁠🗓・bonus-journalier sur Discord</li>
                <li><strong>💡 Expliquez</strong> comment déclarer un raid pour les points</li>
                <li><strong>🛒 Mentionnez</strong> où trouver la boutique Spotlight</li>
                <li><strong>⚖️ Rassurez</strong> : ce n&apos;est pas une course aux points</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/g1SurR2C" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 8 HD</a>
          </div>
        </section>

        {/* SLIDE 12 : BIEN S'INTÉGRER (FOLLOW) */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide12">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">9. Bien s&apos;Intégrer dans la New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 4-5 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer le système de follow mutuel</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Fondateur ou adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Intégration officielle après la réunion</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ajout à la liste des membres actifs (serveur + site)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Engagement : suivre toutes les autres chaînes de la liste</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Système de follow mutuel = réseau humain</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Pas une course - avancer à son rythme</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Partage des liens Twitch en vocal</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré (TEXTE ADAPTÉ DU FOLLOW)</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Une fois cette réunion terminée, tu seras <strong>officiellement intégré dans la New Family</strong>.</p>
                <p>Ta chaîne sera ajoutée à la <strong>liste des membres actifs</strong>, visible sur le serveur et sur notre site.</p>
                <p>En échange, on te demande une chose simple : <strong>suivre toutes les autres chaînes déjà présentes dans cette liste</strong>.</p>
                <p>On sait que ça peut faire beaucoup d&apos;un coup, mais tu n&apos;es pas obligé de tout faire aujourd&apos;hui. <strong>Tu peux prendre ton temps, avancer à ton rythme.</strong> Ce n&apos;est pas une course, c&apos;est un engagement dans l&apos;entraide.</p>
                <p>Ce système n&apos;est pas là pour gonfler des chiffres. Il sert à <strong>construire un vrai réseau humain</strong>, où chacun découvre d&apos;autres créateurs, s&apos;inspire, échange et crée des liens sincères.</p>
                <p>Et honnêtement, beaucoup de membres ont découvert des streamers qu&apos;ils n&apos;auraient jamais rencontrés sans ça… et qui sont aujourd&apos;hui devenus des <strong>amis, des collègues ou même des viewers fidèles</strong>.</p>
                <p>👉 <strong>Tu veux qu&apos;on te découvre, qu&apos;on te soutienne, qu&apos;on t&apos;aide à grandir ?</strong><br />
                Commence par montrer que toi aussi, tu as envie de découvrir les autres.</p>
                <p>Si un membre ne te suit pas en retour :<br />
                • un petit <strong>message gentil</strong> suffit souvent<br />
                • et si tu n&apos;es pas à l&apos;aise, <strong>un modérateur peut t&apos;aider</strong> — on est là pour toi</p>
                <p>Maintenant, on va te laisser participer aussi !</p>
                <p>Si tu es à l&apos;aise, <strong>partage le lien de ta chaîne Twitch dans le vocal</strong>, et si tu as un parrain ou une marraine, n&apos;hésite pas à le dire : ça aide les autres à te situer.</p>
                <p>C&apos;est le moment parfait pour commencer à tisser tes premiers liens dans la Family.</p>
                <p>Et surtout, rappelle-toi d&apos;une chose :<br />
                ✨ <strong>Ici, tu n&apos;es pas juste une chaîne de plus. Tu fais partie d&apos;une communauté.</strong><br />
                On avance ensemble, à ton rythme, et toujours dans la bienveillance.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎯 Insistez</strong> : c&apos;est un réseau humain, pas des chiffres</li>
                <li><strong>⏰ Rassurez</strong> : pas besoin de tout faire aujourd&apos;hui</li>
                <li><strong>📝 Notez</strong> les liens Twitch partagés dans le vocal</li>
                <li><strong>🤝 Encouragez</strong> les parrains/marraines à se manifester</li>
                <li><strong>💜 Valorisez</strong> les découvertes et amitiés créées par ce système</li>
                <li><strong>✅ Proposez votre aide</strong> si quelqu&apos;un n&apos;est pas suivi en retour</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/66AmNT6N" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 9 HD</a>
          </div>
        </section>

        {/* Back to top button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-[#9146ff] hover:bg-[#7c3aed] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all hover:-translate-y-1 z-50"
            aria-label="Retour en haut"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

