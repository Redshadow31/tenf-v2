"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  renderConseilsOverride,
  renderDiscoursOverride,
  renderPointsOverride,
  useDiscoursCustomContent,
} from "@/components/admin/discours/customText";

export default function Partie2Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const custom = useDiscoursCustomContent("partie-2");

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
            href="/admin/integration/discours"
            className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Retour au guide
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Partie 2 - Rôles, Spotlight, C&apos;est aussi...</h1>
          <p className="text-gray-400">Slides 6, 4, 5</p>
        </div>

        {/* SLIDE 6 : RÔLES ADAPTÉS */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide6">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">4. Des Rôles Adaptés à Chacun</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 2-3 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Présenter les 6 rôles communautaires</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout modérateur</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              {custom.points ? renderPointsOverride(custom.points) : (
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">6 rôles communautaires : Créateurs Affiliés, En Développement, Jeunes Créateurs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Créateurs en Pause, Communautés, Les P&apos;tits Jeunes</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Chaque rôle a sa place - tous sont égaux</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Pas de hiérarchie, pas de compétition</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les rôles permettent de mieux accompagner chacun</li>
              </ul>
              )}
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              {custom.discours ? renderDiscoursOverride(custom.discours) : (
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Dans la <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>, on a mis en place des <strong>rôles</strong>, mais il y a une chose très importante à comprendre dès le départ : ici, <span style={{color: '#7b4fd6'}}><strong>chacun a sa place</strong></span>.</p>
                <p>Les rôles ne servent <strong>ni à classer</strong>, ni à comparer, ni à mettre la pression. Ils servent simplement à comprendre <strong>où chacun en est</strong>, pour pouvoir mieux accompagner chaque membre selon <strong>son rythme</strong>, <strong>sa situation</strong> et <strong>ses envies</strong>.</p>
                <p>On distingue d&apos;abord les <span style={{color: '#7b4fd6'}}><strong>créateurs actifs</strong></span>.</p>
                <p>Les <strong>créateurs affiliés</strong> sont les streamers qui ont obtenu le statut Twitch Affiliate. Les <strong>créateurs en développement</strong> sont ceux qui ne sont pas encore affiliés. Ici, ce terme est important : ce n&apos;est <strong>pas un &quot;moins&quot;</strong>, c&apos;est une <strong>étape</strong>, un chemin. Les <strong>créateurs en pause</strong> sont les streamers qui font une pause courte, tout en restant intégrés au fonctionnement de la communauté.</p>
                <p>Il y a ensuite le rôle <span style={{color: '#7b4fd6'}}><strong>Communauté</strong></span>, et il est essentiel de bien le comprendre.</p>
                <p>Ce rôle regroupe des <strong>viewers engagés</strong>, des <strong>streamers qui ne souhaitent pas de mise en avant</strong>, des <strong>créateurs en pause longue</strong>, ou encore des membres qui, à un moment donné, ne participaient plus activement à l&apos;entraide.</p>
                <p>Les membres en Communauté ont <strong>accès à tout le serveur</strong> et participent pleinement à la vie communautaire. La seule différence, c&apos;est que leurs lives ne sont plus <strong>mis en avant automatiquement</strong>, et que leur chaîne ne figure plus dans les <strong>outils de promotion</strong>.</p>
                <p>Et c&apos;est très important de le dire clairement : <span style={{color: '#7b4fd6'}}><strong>ce rôle n&apos;est jamais une sanction</strong></span>. Il ne juge ni la valeur, ni la légitimité d&apos;une personne. Avec un simple message au staff pour dire &quot;je suis motivé pour revenir&quot;, le rôle actif est récupéré, <strong>sans pression</strong>, <strong>sans justification</strong>, <strong>sans jugement</strong>.</p>
                <p>Enfin, certains rôles existent pour <span style={{color: '#7b4fd6'}}><strong>protéger les plus jeunes</strong></span>. Les <strong>Jeunes Créateurs</strong> concernent les streamers mineurs. Les <strong>P&apos;tits Jeunes</strong> concernent les viewers mineurs. Cela permet d&apos;adapter l&apos;accès à certains contenus et de garantir un cadre sain et sécurisé.</p>
                <p>Pour résumer : les rôles évoluent, rien n&apos;est figé, et tout est pensé pour <span style={{color: '#7b4fd6'}}><strong>accompagner</strong></span>, jamais pour juger.</p>
                <p>Ici, on avance <span style={{color: '#7b4fd6'}}><strong>ensemble</strong></span>, à son rythme — et c&apos;est ce qui fait la richesse de la New Family.&quot;</p>
              </div>
              )}
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              {custom.conseils ? renderConseilsOverride(custom.conseils) : (
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎨 Référez-vous aux couleurs</strong> des rôles sur la slide</li>
                <li><strong>⚖️ Insistez sur l&apos;égalité</strong> - pas de hiérarchie</li>
                <li><strong>👶 Expliquez</strong> la protection des mineurs (rôles adaptés)</li>
                <li><strong>🔄 Mentionnez</strong> que les rôles peuvent évoluer</li>
                <li><strong>💜 Rassurer</strong> : c&apos;est pour mieux accompagner, pas pour juger</li>
              </ul>
              )}
            </div>

            <a href="https://www.genspark.ai/api/files/s/1aaW6czY" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 4 HD</a>
          </div>
        </section>

        {/* SLIDE 4 : LE SPOTLIGHT */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide4">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">5. Le Spotlight New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 3-4 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer le système phare</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout fondateur</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              {custom.points ? renderPointsOverride(custom.points) : (
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le Spotlight remplace l&apos;ancien &quot;Live Gagnant&quot;</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">C&apos;est une heure guidée et structurée</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Objectifs : présenter son univers, créer du lien, attirer des viewers</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ce n&apos;est pas un examen - c&apos;est VOTRE moment</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Accessible à tous (plus de prérequis)</li>
              </ul>
              )}
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              {custom.discours ? renderDiscoursOverride(custom.discours) : (
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Le <span style={{color: '#7b4fd6'}}><strong>Spotlight New Family</strong></span> est le système phare de la communauté. Il a remplacé l&apos;ancien concept du *Live Gagnant*, avec une idée très claire : <span style={{color: '#7b4fd6'}}><strong>vous mettre en lumière, mais de la bonne manière</strong></span>.</p>
                <p>Le Spotlight n&apos;est pas une simple mise en avant. C&apos;est <span style={{color: '#7b4fd6'}}><strong>une heure guidée, structurée et bienveillante</strong></span>, pensée pour vous aider à :</p>
                <p>• <strong>présenter votre univers</strong><br />
                • <strong>créer de vrais liens humains</strong><br />
                • <strong>rencontrer de nouvelles personnes</strong><br />
                • <strong>attirer des viewers qui resteront</strong><br />
                • <strong>montrer qui vous êtes, au-delà du jeu</strong></p>
                <p>Et c&apos;est très important de le dire clairement : le Spotlight <span style={{color: '#7b4fd6'}}><strong>n&apos;est pas un examen</strong></span>. On n&apos;attend pas une performance parfaite. C&apos;est <span style={{color: '#7b4fd6'}}><strong>votre moment</strong></span>, un moment fait pour être à l&apos;aise et être vous-mêmes.</p>
                <p>Le but n&apos;est pas de &quot;faire un gros live d&apos;un soir&quot;. Le but, c&apos;est de créer des <strong>connexions durables</strong>, des <strong>viewers réguliers</strong>, et parfois même de vraies <strong>amitiés</strong>.</p>
                <p>Aujourd&apos;hui, le Spotlight est <span style={{color: '#7b4fd6'}}><strong>accessible à tous</strong></span>. Il n&apos;y a plus de prérequis de followers, ni de conditions cachées. Si vous en avez envie, vous pouvez y accéder via la <strong>boutique de points</strong> ou grâce à votre <strong>implication dans la communauté</strong>.</p>
                <p>Un guide complet existe pour vous accompagner pas à pas. Il n&apos;est pas là pour vous brider, mais pour vous rassurer et vous aider à faire de ce moment une expérience <span style={{color: '#7b4fd6'}}><strong>douce, humaine et positive</strong></span>.</p>
                <p>Le Spotlight, c&apos;est un <span style={{color: '#7b4fd6'}}><strong>tremplin</strong></span>. Pas une pression. Pas une compétition. Juste une opportunité de briller, <span style={{color: '#7b4fd6'}}><strong>ensemble</strong></span>.&quot;</p>
              </div>
              )}
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              {custom.conseils ? renderConseilsOverride(custom.conseils) : (
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎯 Expliquez clairement</strong> la différence avec l&apos;ancien système</li>
                <li><strong>✨ Insistez</strong> : &quot;Fait pour briller&quot; - pas de prérequis</li>
                <li><strong>🎤 Rassurer</strong> : ce n&apos;est pas un examen, c&apos;est un accompagnement</li>
                <li><strong>💡 Mentionnez</strong> que le Spotlight peut s&apos;acheter avec les points</li>
                <li><strong>📅 Encouragez</strong> les nouveaux à s&apos;inscrire dès qu&apos;ils sont prêts</li>
              </ul>
              )}
            </div>

            <a href="https://www.genspark.ai/api/files/s/ZqveM0Ra" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 5 HD</a>
          </div>
        </section>

        {/* SLIDE 5 : C'EST AUSSI... */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide5">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">6. La New Family, c&apos;est aussi...</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 2-3 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Montrer l&apos;écosystème complet</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout modérateur</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              {custom.points ? renderPointsOverride(custom.points) : (
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Événements réguliers : soirées film, gaming, défis créatifs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Projets collaboratifs entre membres</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ressources : guides, tutoriels, conseils d&apos;experts</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Formations régulières sur le streaming</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Réseau de créateurs bienveillants</li>
              </ul>
              )}
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              {custom.discours ? renderDiscoursOverride(custom.discours) : (
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;La <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span> n&apos;est pas seulement le Spotlight ou un serveur Discord. C&apos;est un <span style={{color: '#7b4fd6'}}><strong>véritable écosystème d&apos;entraide</strong></span>, pensé pour créer du lien, faire grandir les projets et avancer ensemble.</p>
                <p>Côté <span style={{color: '#7b4fd6'}}><strong>événements et projets</strong></span>, la communauté vit toute l&apos;année. On organise régulièrement des <strong>soirées film communautaires</strong>, des <strong>soirées gaming</strong>, des <strong>défis créatifs</strong> et des <strong>événements thématiques</strong>, toujours dans un esprit convivial et bienveillant.</p>
                <p>La New Family, ce sont aussi des <span style={{color: '#7b4fd6'}}><strong>projets collaboratifs</strong></span> entre membres : collabs entre streamers, concepts communs, événements croisés ou idées lancées directement par la communauté. L&apos;objectif n&apos;est pas la performance, mais la <strong>création de liens durables</strong>.</p>
                <p>Et parfois, l&apos;aventure sort du virtuel. Un projet important est en préparation : <span style={{color: '#7b4fd6'}}><strong>un voyage IRL communautaire à PortAventura prévu au mois de mai</strong></span>. Ce moment permettra de se rencontrer autrement, de partager une expérience forte et de renforcer les liens humains déjà créés en ligne.</p>
                <p>Côté <span style={{color: '#7b4fd6'}}><strong>ressources et soutien</strong></span>, vous trouverez des <strong>guides</strong>, des <strong>tutoriels</strong>, des <strong>conseils d&apos;experts</strong> et des <strong>formations régulières</strong> autour du streaming : OBS, communication, montage, organisation et bien plus encore.</p>
                <p>Tout cela s&apos;appuie sur un <span style={{color: '#7b4fd6'}}><strong>réseau de créateurs bienveillants</strong></span> qui s&apos;entraident au quotidien. Ici, on ne vous laisse pas seuls : il y a toujours quelqu&apos;un, quelque chose ou un projet pour vous aider à progresser, à votre rythme.&quot;</p>
              </div>
              )}
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              {custom.conseils ? renderConseilsOverride(custom.conseils) : (
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎉 Donnez des exemples concrets</strong> d&apos;événements récents</li>
                <li><strong>📚 Mentionnez</strong> les salons ressources sur le Discord</li>
                <li><strong>🤝 Insistez</strong> sur le côté &quot;plus qu&apos;un Discord&quot;</li>
                <li><strong>✨ Valorisez</strong> les formations régulières</li>
                <li><strong>💡 Encouragez</strong> à consulter les guides disponibles</li>
              </ul>
              )}
            </div>

            <a href="https://www.genspark.ai/api/files/s/zPR35qRy" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 6 HD</a>
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

