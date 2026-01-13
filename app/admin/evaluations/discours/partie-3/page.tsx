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
                <p>&quot;Faire partie de la <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>, ce n&apos;est pas simplement rejoindre un serveur Discord de plus. C&apos;est entrer dans un <span style={{color: '#7b4fd6'}}><strong>véritable système d&apos;entraide humaine</strong></span>, pensé pour accompagner les personnes avant les chiffres.</p>
                <p>On vous a déjà parlé du <span style={{color: '#7b4fd6'}}><strong>Spotlight</strong></span> : une mise en avant guidée, structurée et accessible à tous, sans condition de taille de chaîne. Mais ce n&apos;est qu&apos;une partie de ce qui fait que la New Family est différente.</p>
                <p>Ce qui fait la vraie force de la communauté, c&apos;est la <span style={{color: '#7b4fd6'}}><strong>Communauté active</strong></span>. Ici, vous trouverez des streamers qui comprennent vos galères, des membres qui passent sur vos lives, qui vous encouragent, qui vous soutiennent quand un live se passe moins bien. On parle de soutien sur les scènes, les réglages, le contenu, mais aussi sur le stress, la motivation et les moments de doute.</p>
                <p>Et c&apos;est dans cet esprit qu&apos;existe le rôle <span style={{color: '#7b4fd6'}}><strong>VIP Élité</strong></span>. Ce rôle n&apos;est pas là pour créer une élite ou une hiérarchie. Il existe pour <span style={{color: '#7b4fd6'}}><strong>reconnaître l&apos;implication humaine</strong></span> des membres qui font vivre l&apos;entraide au quotidien.</p>
                <p>Le VIP Élité valorise des actions simples mais essentielles : être présent aux Spotlights, participer aux raids communautaires, s&apos;impliquer dans les événements, soutenir régulièrement les autres membres et contribuer à une ambiance saine et bienveillante.</p>
                <p>Ce rôle peut donner accès à certains avantages comme des salons dédiés, des ressources spécifiques, la participation à certaines décisions ou un badge distinctif. Mais ce n&apos;est pas ça l&apos;essentiel. L&apos;essentiel, c&apos;est ce qu&apos;il représente.</p>
                <p>Et c&apos;est très important de le dire clairement : le <span style={{color: '#7b4fd6'}}><strong>VIP Élité ne s&apos;achète pas</strong></span>. Il ne dépend pas des chiffres Twitch, du nombre de followers ou des stats. Il se mérite par la régularité, la bienveillance et l&apos;esprit d&apos;entraide.</p>
                <p>À la New Family, la reconnaissance ne se mesure pas en chiffres, mais en <span style={{color: '#7b4fd6'}}><strong>présence humaine</strong></span>. Et c&apos;est pour ça que ce n&apos;est pas juste un Discord de plus.&quot;</p>
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
                <p>&quot;Dans la <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>, on part d&apos;un principe simple : l&apos;entraide mérite d&apos;être reconnue. Chaque action positive que vous faites pour la communauté vous rapporte des <strong>points</strong>, non pas pour créer une compétition, mais pour <span style={{color: '#7b4fd6'}}><strong>valoriser votre implication</strong></span>.</p>
                <p>Ces points se gagnent naturellement, en faisant ce que la New Family encourage déjà : être présent, aider, participer, soutenir.</p>
                <p>Au quotidien, vous pouvez gagner des points en <strong>suivant les réseaux du serveur</strong>, en <strong>participant aux événements Discord</strong>, en <strong>parrainant de nouveaux membres</strong>, en <strong>raidant un autre membre</strong>, en <strong>progressant avec l&apos;XP</strong>, ou simplement grâce au <strong>bonus journalier</strong>. Il y a aussi des moments spéciaux comme le <strong>cadeau de bienvenue</strong> ou le <strong>bonus d&apos;anniversaire</strong>.</p>
                <p>Les points servent ensuite dans la <span style={{color: '#7b4fd6'}}><strong>boutique Spotlight</strong></span>. On y retrouve des choses utiles et fun : un <strong>Spotlight complet</strong>, une <strong>analyse de chaîne</strong>, une <strong>interview</strong>, des <strong>posts sur les réseaux officiels</strong>, ou encore des <strong>défis ludiques</strong>. Là encore, ce n&apos;est pas une course : chacun avance à son rythme.</p>
                <p>À ce moment-là de la réunion, on va faire une petite démo ensemble. On vous montre le salon <span style={{color: '#7b4fd6'}}><strong>🗓・bonus-journalier</strong></span> et comment utiliser la commande <span style={{color: '#7b4fd6'}}><strong>/journalier</strong></span> pour récupérer vos points chaque jour.</p>
                <p>C&apos;est aussi l&apos;occasion de vous montrer comment déclarer un raid pour que les points soient comptabilisés. La phrase est toute simple, par exemple : <strong>@user1 a raid @user2</strong>. Cette déclaration permet de valoriser concrètement l&apos;entraide entre membres.</p>
                <p>Et on insiste vraiment sur un point : ce système de points <span style={{color: '#7b4fd6'}}><strong>n&apos;est pas une compétition</strong></span>. Personne n&apos;est en retard, personne n&apos;est obligé de tout faire. C&apos;est un outil ludique, pensé pour récompenser l&apos;implication, encourager les bonnes habitudes et rendre l&apos;entraide encore plus vivante.</p>
                <p>Ici, chaque point raconte une action positive. Et ça, c&apos;est très New Family.&quot;</p>
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
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">🌍 <strong>Explorez les univers</strong></h4>
                  <p className="text-sm text-gray-400 mb-3 italic">(premier pilier de l&apos;intégration)</p>
                  <p>Le <strong>premier pas</strong> pour bien s&apos;intégrer dans la <strong>New Family</strong>, c&apos;est <strong>découvrir les autres créateurs</strong>.</p>
                  <p>Concrètement, cela passe par une chose simple :</p>
                  <p className="pl-4">👉 <strong>suivre les chaînes des membres actifs de la New Family</strong>.</p>
                  <p>Ce <strong>follow</strong> n&apos;est <strong>pas une obligation froide ou automatique</strong>.</p>
                  <p>C&apos;est une <strong>porte d&apos;entrée</strong> pour explorer des univers différents, des styles variés, et <strong>commencer à créer des liens</strong>.</p>
                </div>

                <hr className="border-gray-600 my-4" />

                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">💜 <strong>Raidez la New Family… mais pas uniquement</strong></h4>
                  <p className="text-sm text-gray-400 mb-3 italic">(ouverture et équilibre)</p>
                  <p>Bien sûr, <strong>raider les membres de la New Family</strong>, c&apos;est <strong>important</strong>.</p>
                  <p>Ça permet de <strong>renforcer les liens</strong>, de <strong>soutenir les créateurs</strong>, et de <strong>faire vivre la communauté</strong>.</p>
                  <p>Mais attention :</p>
                  <p className="pl-4">👉 <strong>l&apos;objectif n&apos;est pas de s&apos;enfermer entre nous</strong>.</p>
                  <p>Vous pouvez — et vous <strong>devez aussi</strong> — <strong>raider ailleurs</strong>, vers des créateurs que vous appréciez, même s&apos;ils <strong>ne sont pas dans la Family</strong>.</p>
                  <p>Cela permet de :</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>créer des ponts entre communautés</strong></li>
                    <li><strong>faire découvrir la New Family à l&apos;extérieur</strong></li>
                    <li><strong>garder un réseau sain, ouvert et naturel</strong></li>
                  </ul>
                </div>

                <hr className="border-gray-600 my-4" />

                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">💬 <strong>Participez à l&apos;échange</strong></h4>
                  <p className="text-sm text-gray-400 mb-3 italic">(au-delà du follow et du raid)</p>
                  <p>La force de la <strong>New Family</strong>, ce n&apos;est <strong>pas juste le raid</strong>.</p>
                  <p>C&apos;est aussi <strong>l&apos;échange</strong>, la <strong>discussion</strong>, le <strong>respect dans le chat</strong>, le <strong>soutien sincère</strong>.</p>
                  <p>Que ce soit ici ou ailleurs, on vous demande toujours la même chose :</p>
                  <p className="pl-4">👉 une <strong>attitude positive</strong>, <strong>respectueuse</strong> et <strong>bienveillante</strong>.</p>
                </div>

                <hr className="border-gray-600 my-4" />

                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">✨ <strong>Phrase de synthèse</strong></h4>
                  <p className="text-sm text-gray-400 mb-3 italic">(à afficher comme un bloc fort / encadré visuel)</p>
                  <div className="bg-gray-800/50 border-l-4 border-amber-500 p-4 my-4 rounded">
                    <p className="text-lg font-semibold text-amber-300 mb-3">&quot;<strong>La New Family est un point d&apos;ancrage, pas une cage.</strong>&quot;</p>
                    <p>On se soutient entre nous,</p>
                    <p>mais on reste <strong>ouverts au monde</strong>.</p>
                    <p className="mt-3">On sait que ça peut faire <strong>beaucoup au début</strong>.</p>
                    <p>Tu n&apos;es <strong>pas obligé de tout faire d&apos;un coup</strong>.</p>
                    <p>Tu peux <strong>prendre ton temps</strong>, <strong>avancer à ton rythme</strong>, et <strong>découvrir les chaînes petit à petit</strong>.</p>
                    <p className="mt-3">Et surtout, ce <strong>follow mutuel</strong> n&apos;a <strong>pas pour but de vous enfermer</strong> dans la communauté.</p>
                    <p>La <strong>New Family est un point de départ</strong>, pas une limite.</p>
                    <p className="mt-3">On t&apos;encourage aussi à <strong>explorer en dehors</strong>, à <strong>suivre d&apos;autres créateurs</strong>, même s&apos;ils <strong>ne font pas partie de la Family</strong>.</p>
                  </div>
                </div>

                <hr className="border-gray-600 my-4" />

                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">✨ <strong>Phrase clé à faire passer à l&apos;oral</strong></h4>
                  <p className="text-sm text-gray-400 mb-3 italic">(mise en avant visuelle claire)</p>
                  <div className="bg-gray-800/50 border-l-4 border-amber-500 p-4 my-4 rounded">
                    <p className="text-lg font-semibold text-amber-300">&quot;<strong>Le follow est le premier pas vers la découverte.</strong>&quot;</p>
                  </div>
                </div>
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

