"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Partie1Page() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Partie 1 - Bienvenue, Fondations, Staff</h1>
          <p className="text-gray-400">Slides 1, 2, 3</p>
        </div>

        {/* SLIDE 1 : BIENVENUE */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide1">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">1. Bienvenue sur Twitch Entraide New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 3-4 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Créer une atmosphère chaleureuse</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Red_Shadow_31</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Accueillir chaleureusement tous les participants</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Présenter la New Family comme une famille, pas un simple Discord</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Expliquer le but de cette réunion d&apos;intégration</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Rassurer : pas de jugement, chacun à son rythme</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Poser le ton : bienveillance et entraide avant tout</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Salut tout le monde et bienvenue officiellement dans la New Family !</p>
                <p>On est vraiment super heureux de vous avoir avec nous aujourd&apos;hui. Vous n&apos;avez pas rejoint un Discord parmi d&apos;autres : ici, vous entrez dans une <strong>famille francophone</strong> de streamers et de passionnés, un endroit où on s&apos;entraide, où on progresse ensemble, et où <strong>chacun peut avancer à son rythme</strong>, sans pression et sans jugement.</p>
                <p>La New Family, c&apos;est des rires, du soutien, des galères parfois – comme partout – mais toujours dans la bonne humeur et la bienveillance.</p>
                <p>Ce moment qu&apos;on partage ensemble maintenant, c&apos;est votre <strong>porte d&apos;entrée dans l&apos;aventure</strong> : vous allez découvrir notre fonctionnement, nos valeurs, et tout ce qu&apos;on met en place pour vous aider à évoluer dans votre streaming.</p>
                <p>Alors installez-vous confortablement… <strong>vous êtes à la maison.</strong>&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎵 Ton chaleureux et souriant</strong> - Le premier contact est crucial</li>
                <li><strong>👋 Saluez nominativement</strong> si possible les participants dans le vocal</li>
                <li><strong>⏸️ Faites une pause</strong> après l&apos;intro pour laisser l&apos;ambiance s&apos;installer</li>
                <li><strong>✅ Vérifiez</strong> que tout le monde entend bien et est à l&apos;aise</li>
                <li><strong>😊 Souriez en parlant</strong> - ça s&apos;entend dans la voix</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/BJN4Yrwq" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 1 HD</a>
          </div>
        </section>

        {/* SLIDE 2 : LES FONDATIONS */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide2">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">2. Les Fondations de la New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 5-6 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Raconter l&apos;histoire et les valeurs</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Red_Shadow_31 ou fondateur</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;histoire : de Twitch Entraide Family à la New Family</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le point de rupture : refus de faire payer l&apos;entrée/visibilité</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La relance le 2 septembre 2024</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 3 piliers : Objectif, Modération, Valeurs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La croissance : de 70 à 400+ membres (160 actifs)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La philosophie : un échec = un tremplin</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Avant d&apos;être la New Family que vous découvrez aujourd&apos;hui, il y a eu une première version du serveur : <strong>Twitch Entraide Family</strong>.</p>
                <p>À l&apos;origine, c&apos;était une petite idée lancée entre deux frères sur un groupe Facebook… et très vite, d&apos;autres passionnés ont suivi. Clara et Nexou ont été les premiers volontaires pour modérer, puis une autre modératrice les a rejoints. Red, qui participait aux réunions dès le début, a rapidement intégré l&apos;équipe lui aussi.</p>
                <p>Petit à petit, on a posé les bases : des salons, des outils, des idées, des tests… mais surtout, <strong>une ambiance humaine et bienveillante</strong>, où chacun pouvait trouver sa place.</p>
                <p>Et puis, les deux créateurs d&apos;origine ont quitté le projet. Le point de rupture, ça a été quand <strong>l&apos;un d&apos;eux a voulu faire payer l&apos;entrée et/ou la visibilité</strong>. C&apos;était totalement à l&apos;encontre de nos valeurs, alors on a dit non… et il nous a laissé les clés.</p>
                <p>Le vrai départ, c&apos;est le <strong>2 septembre 2024</strong> : on a relancé tout le serveur dans une version plus claire, plus solide et plus libre — la <strong>Twitch Entraide New Family</strong>.</p>
                <p>Depuis, on a connu des hauts, des bas, des idées qui ont fonctionné, d&apos;autres qu&apos;on a abandonnées… mais toujours avec la même philosophie : <strong>un échec, ce n&apos;est jamais une fin — c&apos;est un tremplin vers mieux.</strong></p>
                <p>On a commencé la V2 à <strong>70 membres</strong>. Aujourd&apos;hui, vous êtes plus de <strong>400, dont plus de 160 actifs</strong> dans l&apos;entraide. Il y a des streamers, bien sûr, mais aussi des viewers, des créateurs débutants, d&apos;autres super expérimentés… Et c&apos;est cette diversité qui fait notre richesse.</p>
                <p>Voilà qui on est : une communauté qui <strong>avance ensemble, qui apprend, qui se soutient</strong>… et qui croit profondément en la force de l&apos;humain.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>📖 Racontez l&apos;histoire</strong> avec émotion - c&apos;est notre ADN</li>
                <li><strong>💪 Insistez sur le refus de monétiser</strong> l&apos;entraide - c&apos;est fondamental</li>
                <li><strong>📊 Donnez les chiffres</strong> (70→400 membres) pour montrer la croissance</li>
                <li><strong>🎯 Mettez en avant</strong> la philosophie : échec = tremplin</li>
                <li><strong>⏰ Précisez la date</strong> du 2 septembre 2024 - c&apos;est notre anniversaire</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/xjEY6Gh3" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 2 HD</a>
          </div>
        </section>

        {/* SLIDE 3 : LE STAFF */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide3">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">3. Le Staff</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 4-5 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Présenter l&apos;équipe humaine</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout fondateur/adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 3 fondateurs : ClaraStoneWall, Red_Shadow_31, Nexou31</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 4 administrateurs adjoints : Selena_akemi, Nangel89, Jenny31200, Tab&apos;s_up</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;équipe de modérateurs : mentors et juniors</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le rôle de chacun dans la communauté</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;accessibilité du staff (Discord, vocal, MP)</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Derrière la New Family, il y a d&apos;abord <strong>trois fondateurs</strong> : Clara, Nexou et Red.</p>
                <p>Ce sont eux qui portent le projet depuis le début, et vous les croiserez absolument partout : sur Discord, en vocal, en MP, dans les salons… mais aussi sur les <strong>Spotlight, les événements communautaires</strong>, les événements sponsorisés, et même dans les lives des membres, pour soutenir, encourager et accompagner chacun.</p>
                <p>Ils gèrent la communication, les visuels, les événements, les formations, les réunions, le suivi des lives et tout ce qui fait tourner la machine au quotidien. Ce ne sont pas juste des admins : <strong>ce sont trois cœurs qui font battre la New Family</strong>, avec passion, bienveillance et beaucoup de travail dans l&apos;ombre.</p>
                <p>À leurs côtés, nous avons aujourd&apos;hui <strong>quatre administrateurs adjoints</strong> : Selena_akemi, Nangel89, Jenny31200 et Tab&apos;s_up. Ils sont là pour soutenir les fondateurs, assurer la continuité, coordonner les équipes et prendre le relais quand c&apos;est nécessaire. Ils sont maintenant pleinement en place et jouent un rôle essentiel dans la stabilité du serveur.</p>
                <p>Et bien sûr, la New Family ne serait rien sans nos <strong>modérateurs mentors et juniors</strong>. Les mentors sont les piliers du terrain : formés, expérimentés, présents dans les discussions, les raids, l&apos;accueil, et le soutien des membres. Les juniors, eux, sont en formation : ils apprennent avec nous, accompagnés par les fondateurs et les mentors, pour devenir à leur tour des acteurs clés de la communauté.</p>
                <p>Ensemble, fondateurs, adjoints et modérateurs forment <strong>une équipe soudée, à l&apos;écoute, disponible</strong>, et toujours là pour faire avancer cette grande famille qu&apos;est la New Family.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>👥 Présentez brièvement</strong> chaque membre du staff présent dans le vocal</li>
                <li><strong>💜 Insistez sur l&apos;accessibilité</strong> de l&apos;équipe (MP, salons, vocal)</li>
                <li><strong>🌟 Valorisez le travail</strong> dans l&apos;ombre (organisation, visuels, etc.)</li>
                <li><strong>🤝 Mentionnez la soudure</strong> de l&apos;équipe - on avance ensemble</li>
                <li><strong>📢 Encouragez</strong> les nouveaux à poser des questions au staff</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/Y7i7dZS6" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 3 HD</a>
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

