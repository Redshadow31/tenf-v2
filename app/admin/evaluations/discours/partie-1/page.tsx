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
                <p>&quot;Salut tout le monde, et <strong>bienvenue officiellement</strong> dans la<br />
                <span style={{color: '#7b4fd6'}}><strong>Twitch Entraide New Family</strong></span> !</p>
                <p>Déjà, <strong>merci d&apos;être là</strong> aujourd&apos;hui. Le simple fait d&apos;avoir pris le temps de rejoindre cette réunion montre une chose importante :<br />
                vous avez envie de <strong>comprendre</strong>, de <strong>vous intégrer</strong>, et de <strong>faire partie de quelque chose de collectif</strong>.</p>
                <p>Ici, vous n&apos;avez pas rejoint <strong>un Discord parmi tant d&apos;autres</strong>.<br />
                La New Family, c&apos;est avant tout une<br />
                <span style={{color: '#7b4fd6'}}><strong>famille choisie</strong></span> :<br />
                une communauté de streamers, de créateurs et de passionnés qui avancent <strong>ensemble</strong>, qui s&apos;entraident <strong>vraiment</strong>, et qui respectent <strong>le rythme de chacun</strong>.</p>
                <p>Il n&apos;y a <strong>aucun jugement</strong> ici.<br />
                Que vous débutiez, que vous streamiez depuis longtemps, que vous soyez très actifs ou plus discrets :<br />
                <span style={{color: '#7b4fd6'}}><strong>vous avez votre place</strong></span>.</p>
                <p>Cette réunion, c&apos;est votre<br />
                <span style={{color: '#7b4fd6'}}><strong>porte d&apos;entrée dans la New Family</strong></span>.<br />
                Le but n&apos;est pas de vous noyer sous des règles, mais de vous expliquer <strong>comment on fonctionne</strong>, <strong>pourquoi on fonctionne comme ça</strong>, et surtout <strong>comment la communauté peut vous aider à évoluer</strong>, dans votre streaming comme humainement.</p>
                <p>Ici, l&apos;entraide n&apos;est pas un mot posé dans un titre.<br />
                C&apos;est quelque chose qu&apos;on vit <strong>au quotidien</strong> :<br />
                dans les lives, sur Discord, dans les échanges entre membres.</p>
                <p>Prenez ce moment <strong>sans pression</strong>.<br />
                Écoutez, posez-vous, et surtout retenez ceci :<br />
                <span style={{color: '#7b4fd6'}}><strong>il n&apos;y a aucune question bête</strong></span>.</p>
                <p>En résumé :<br />
                vous êtes <strong>chez vous</strong>,<br />
                vous avancez <strong>à votre rythme</strong>,<br />
                et nous, on est là pour <strong>vous accompagner</strong>.</p>
                <p>Encore <strong>bienvenue dans la New Family</strong> 💜<br />
                On va maintenant voir ensemble <strong>comment tout ça fonctionne concrètement</strong>.&quot;</p>
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
                <p>&quot;Pour comprendre ce qu&apos;est aujourd&apos;hui la<br />
                <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>,<br />
                il faut revenir un peu en arrière.</p>
                <p>Avant d&apos;être ce que vous découvrez aujourd&apos;hui, le serveur s&apos;appelait<br />
                <span style={{color: '#7b4fd6'}}><strong>Twitch Entraide Family</strong></span>.<br />
                À l&apos;origine, c&apos;était une <strong>idée simple</strong>, née entre passionnés :<br />
                créer un espace où l&apos;on pouvait <strong>s&apos;entraider entre streamers</strong>, sans compétition ni pression.</p>
                <p>Très vite, une équipe s&apos;est formée.<br />
                Des personnes ont donné de leur temps, de leur énergie, pour poser les premières bases :<br />
                des salons, des outils, des règles… mais surtout une<br />
                <span style={{color: '#7b4fd6'}}><strong>ambiance humaine et bienveillante</strong></span>,<br />
                où chacun pouvait trouver sa place.</p>
                <p>Avec le temps, une divergence importante est apparue.<br />
                Le point de rupture, ça a été le moment où l&apos;un des créateurs a voulu<br />
                <span style={{color: '#7b4fd6'}}><strong>faire payer l&apos;entrée et/ou la visibilité</strong></span>.</p>
                <p>Pour nous, c&apos;était une <strong>ligne rouge</strong>.<br />
                L&apos;entraide ne se monétise pas ici.<br />
                La visibilité ne s&apos;achète pas.<br />
                On a donc dit <strong>non</strong> — et les clés du projet nous ont été laissées.</p>
                <p>C&apos;est à ce moment-là qu&apos;est née la<br />
                <span style={{color: '#7b4fd6'}}><strong>Twitch Entraide New Family</strong></span>.</p>
                <p>Le vrai nouveau départ, c&apos;est le<br />
                <span style={{color: '#7b4fd6'}}><strong>2 septembre 2024</strong></span>.<br />
                On a relancé le serveur sur des bases plus claires, plus solides, plus alignées avec nos valeurs :<br />
                une version plus libre, plus humaine, et plus cohérente.</p>
                <p>Au moment de cette relance, nous étions<br />
                <span style={{color: '#7b4fd6'}}><strong>42 membres</strong></span>.<br />
                Aujourd&apos;hui, la communauté compte<br />
                <span style={{color: '#7b4fd6'}}><strong>environ 480 membres</strong></span>,<br />
                dont<br />
                <span style={{color: '#7b4fd6'}}><strong>près de 200 réellement actifs dans le système d&apos;entraide</strong></span>.</p>
                <p>Mais au-delà des chiffres, ce qui fait notre richesse, c&apos;est la diversité :<br />
                des streamers débutants, des créateurs expérimentés, des viewers engagés.</p>
                <p>La New Family, ce n&apos;est pas une course.<br />
                Ce n&apos;est pas un classement.<br />
                C&apos;est une communauté qui avance <strong>ensemble</strong>,<br />
                qui apprend <strong>ensemble</strong>,<br />
                et qui croit profondément en<br />
                <span style={{color: '#7b4fd6'}}><strong>la force de l&apos;humain avant tout</strong></span>.&quot;</p>
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
                <p>&quot;Derrière la<br />
                <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>,<br />
                il y a avant tout des <strong>personnes</strong>.<br />
                Pas des grades, pas des titres impressionnants, mais des <strong>humains</strong> qui donnent de leur temps et de leur énergie pour faire vivre la communauté.</p>
                <p>La New Family repose d&apos;abord sur<br />
                <span style={{color: '#7b4fd6'}}><strong>trois fondateurs</strong></span> :<br />
                <strong>Clara</strong>, <strong>Nexou</strong> et <strong>Red</strong>.<br />
                Ce sont eux qui portent le projet depuis le début, qui en définissent la vision et qui veillent à ce que l&apos;esprit New Family reste intact.</p>
                <p>Vous les croiserez très souvent :<br />
                sur <strong>Discord</strong>, en <strong>vocal</strong>, en <strong>messages privés</strong>, dans les salons…<br />
                mais aussi dans les <strong>lives des membres</strong>, les <strong>raids</strong>, les <strong>événements communautaires</strong>.<br />
                Leur rôle n&apos;est pas seulement de décider, mais surtout <strong>d&apos;écouter</strong>, <strong>d&apos;organiser</strong>, <strong>d&apos;accompagner</strong> et de <strong>coordonner</strong>.</p>
                <p>À leurs côtés, il y a<br />
                <span style={{color: '#7b4fd6'}}><strong>quatre administrateurs adjoints</strong></span> :<br />
                <strong>Selena_akemi</strong>, <strong>Nangel89</strong>, <strong>Jenny31200</strong> et <strong>Tab&apos;s_up</strong>.<br />
                Ils soutiennent les fondateurs, assurent la continuité du projet, coordonnent les équipes et prennent le relais quand c&apos;est nécessaire.<br />
                Ils jouent un rôle clé dans la <strong>stabilité</strong> et la <strong>solidité</strong> du serveur.</p>
                <p>Et bien sûr, la New Family ne serait rien sans son<br />
                <span style={{color: '#7b4fd6'}}><strong>équipe de modération</strong></span>.<br />
                Les <strong>modérateurs mentors</strong> sont les piliers du terrain : formés, expérimentés, présents au quotidien pour accueillir, guider et soutenir les membres.<br />
                Les <strong>modérateurs juniors</strong>, eux, sont en apprentissage. Ils se forment avec nous, accompagnés par les mentors et les fondateurs, pour devenir à leur tour des acteurs clés de la communauté.</p>
                <p>Ce qu&apos;il est important de retenir, c&apos;est que le<br />
                <span style={{color: '#7b4fd6'}}><strong>staff est accessible</strong></span>.<br />
                Vous pouvez nous parler sur Discord, en vocal, en message privé, dans les salons.<br />
                Il n&apos;y a <strong>pas de barrière volontaire</strong>, pas de distance imposée.</p>
                <p>Ensemble, fondateurs, adjoints et modérateurs forment une<br />
                <span style={{color: '#7b4fd6'}}><strong>équipe soudée</strong></span>,<br />
                à l&apos;écoute, disponible, et engagée pour faire avancer cette grande famille qu&apos;est la New Family.&quot;</p>
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

