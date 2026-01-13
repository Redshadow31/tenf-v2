"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Partie2Page() {
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
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">6 rôles communautaires : Créateurs Affiliés, En Développement, Jeunes Créateurs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Créateurs en Pause, Communautés, Les P&apos;tits Jeunes</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Chaque rôle a sa place - tous sont égaux</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Pas de hiérarchie, pas de compétition</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les rôles permettent de mieux accompagner chacun</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Dans la New Family, on a mis en place des rôles, mais il y a une chose très importante à comprendre dès le départ : ici, chaque rôle a sa place, et aucun n&apos;est au-dessus d&apos;un autre.</p>
                <p>Les rôles ne servent pas à classer, ni à mettre la pression. Ils servent simplement à comprendre où chacun en est, pour pouvoir mieux accompagner chaque membre, selon sa situation, son rythme et ses envies.</p>
                <p>On distingue d&apos;abord les créateurs actifs.</p>
                <p>Les créateurs affiliés sont les streamers qui ont obtenu le statut Twitch Affiliate.<br />
                Les créateurs en développement sont ceux qui ne sont pas encore affiliés. Et ici, ce terme est important : ce n&apos;est pas un &quot;moins&quot;, c&apos;est une étape. Un chemin, pas une comparaison.<br />
                Les créateurs en pause, ce sont les streamers qui font une pause temporaire, généralement courte, mais qui restent intégrés au fonctionnement de la communauté.</p>
                <p>Il y a ensuite le rôle Communauté, qui est un rôle très varié et très important dans la New Family.<br />
                Il regroupe des viewers qui aiment soutenir, des streamers qui ne souhaitent pas de mise en avant, des créateurs en pause longue, ou encore des membres qui, à un moment donné, ne participaient plus à l&apos;entraide active.</p>
                <p>Ce rôle donne accès à l&apos;ensemble du serveur et à la vie communautaire. La seule différence, c&apos;est que les lives ne sont plus mis en avant automatiquement et que la chaîne n&apos;apparaît plus dans les systèmes de promotion.</p>
                <p>Et c&apos;est essentiel de le dire clairement : ce rôle n&apos;est jamais une sanction.<br />
                Il ne juge pas la valeur d&apos;une personne ni sa légitimité. C&apos;est simplement une position différente à un moment donné. Et avec un simple message au staff pour dire &quot;je suis motivé pour revenir&quot;, le rôle actif est récupéré, sans pression et sans jugement.</p>
                <p>Enfin, on a des rôles spécifiques pour protéger les plus jeunes.<br />
                Les jeunes créateurs regroupent les streamers mineurs, et les P&apos;tits Jeunes concernent les viewers mineurs. Ces rôles permettent d&apos;adapter l&apos;accès à certains contenus et de garantir un cadre sain et sécurisé.</p>
                <p>Pour résumer : ici, on avance ensemble, à son rythme. Les rôles évoluent, rien n&apos;est figé, et tout est pensé pour accompagner, jamais pour juger.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎨 Référez-vous aux couleurs</strong> des rôles sur la slide</li>
                <li><strong>⚖️ Insistez sur l&apos;égalité</strong> - pas de hiérarchie</li>
                <li><strong>👶 Expliquez</strong> la protection des mineurs (rôles adaptés)</li>
                <li><strong>🔄 Mentionnez</strong> que les rôles peuvent évoluer</li>
                <li><strong>💜 Rassurer</strong> : c&apos;est pour mieux accompagner, pas pour juger</li>
              </ul>
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
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le Spotlight remplace l&apos;ancien &quot;Live Gagnant&quot;</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">C&apos;est une heure guidée et structurée</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Objectifs : présenter son univers, créer du lien, attirer des viewers</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ce n&apos;est pas un examen - c&apos;est VOTRE moment</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Accessible à tous (plus de prérequis)</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Le <strong>Spotlight</strong> a remplacé l&apos;ancien système du Live Gagnant. Et l&apos;objectif est simple : <strong>vous mettre en lumière, mais de la bonne manière</strong>.</p>
                <p>Contrairement à une simple mise en avant, le Spotlight est <strong>une heure guidée, structurée</strong>, pensée pour vous aider à :</p>
                <p>• présenter votre univers<br />
                • créer du lien avec les viewers<br />
                • attirer de nouvelles personnes<br />
                • construire une communauté qui va rester<br />
                • vous faire découvrir en tant que streamer <strong>et</strong> en tant que personne</p>
                <p>Ce n&apos;est pas un examen, ce n&apos;est pas une performance parfaite qu&apos;on attend : <strong>c&apos;est votre moment à vous.</strong></p>
                <p>Et maintenant, le Spotlight est accessible à tous : plus besoin de followers minimum, plus de prérequis. Si vous avez envie de briller, vous pouvez y accéder via la boutique de points ou en participant activement à la communauté.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎯 Expliquez clairement</strong> la différence avec l&apos;ancien système</li>
                <li><strong>✨ Insistez</strong> : &quot;Fait pour briller&quot; - pas de prérequis</li>
                <li><strong>🎤 Rassurer</strong> : ce n&apos;est pas un examen, c&apos;est un accompagnement</li>
                <li><strong>💡 Mentionnez</strong> que le Spotlight peut s&apos;acheter avec les points</li>
                <li><strong>📅 Encouragez</strong> les nouveaux à s&apos;inscrire dès qu&apos;ils sont prêts</li>
              </ul>
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
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Événements réguliers : soirées film, gaming, défis créatifs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Projets collaboratifs entre membres</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ressources : guides, tutoriels, conseils d&apos;experts</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Formations régulières sur le streaming</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Réseau de créateurs bienveillants</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;La New Family, ce n&apos;est pas que le Spotlight ou le Discord. C&apos;est <strong>un véritable écosystème d&apos;entraide</strong> :</p>
                <p><strong>Côté événements</strong>, on organise régulièrement :</p>
                <p>• Des <strong>soirées film communautaires</strong> pour se détendre ensemble<br />
                • Des <strong>projets collaboratifs</strong> entre membres<br />
                • Des <strong>défis et événements thématiques</strong><br />
                • Des <strong>soirées gaming communautaires</strong></p>
                <p><strong>Côté ressources</strong>, vous trouverez :</p>
                <p>• Des <strong>guides et tutoriels partagés</strong><br />
                • Des <strong>conseils d&apos;experts streamers</strong><br />
                • Des <strong>formations régulières</strong> sur OBS, la communication, le montage…<br />
                • Des <strong>partenariats</strong> avec d&apos;autres communautés<br />
                • Un <strong>réseau de créateurs bienveillants</strong> qui s&apos;entraident au quotidien</p>
                <p>Bref, on ne vous laisse pas seuls : il y a toujours quelque chose pour vous aider à progresser !&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎉 Donnez des exemples concrets</strong> d&apos;événements récents</li>
                <li><strong>📚 Mentionnez</strong> les salons ressources sur le Discord</li>
                <li><strong>🤝 Insistez</strong> sur le côté &quot;plus qu&apos;un Discord&quot;</li>
                <li><strong>✨ Valorisez</strong> les formations régulières</li>
                <li><strong>💡 Encouragez</strong> à consulter les guides disponibles</li>
              </ul>
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

