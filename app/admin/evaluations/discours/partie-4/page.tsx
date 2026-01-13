"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Partie4Page() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Partie 4 - Progresser, Invitation, Prochaines Étapes</h1>
          <p className="text-gray-400">Slides 15, 13, 16</p>
        </div>

        {/* SLIDE 15 : PROGRESSER NATURELLEMENT */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide15">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">10. Comment Progresser Naturellement</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 2-3 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer la progression humaine</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout modérateur</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ce qu&apos;on peut faire : participer, aider, raids, conseils, événements</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ce qui compte vraiment : authenticité, présence, écoute, aide</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Message central : on mesure l&apos;implication à l&apos;humanité</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Pas de course, pas de compétition</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Comment progresser naturellement dans la New Family ?</p>
                <p><strong>Ce que tu peux faire :</strong></p>
                <p>• Participer activement aux discussions<br />
                • Aider les nouveaux membres<br />
                • Faire des raids et lurk<br />
                • Partager des conseils et ton expérience<br />
                • Participer aux événements communautaires<br />
                • Être bienveillant et à l&apos;écoute</p>
                <p><strong>Ce qui compte vraiment :</strong></p>
                <p>• Ton <strong>authenticité</strong><br />
                • Ta <strong>présence</strong> régulière<br />
                • Ton <strong>écoute</strong> des autres<br />
                • Ton <strong>aide</strong> sans attendre de retour<br />
                • Ton <strong>évolution</strong> personnelle<br />
                • Les <strong>liens</strong> que tu crées<br />
                • Ton <strong>impact positif</strong> sur la communauté</p>
                <p><strong>ICI, ON NE MESURE PAS TON IMPLICATION AUX CHIFFRES, MAIS À TON HUMANITÉ.</strong></p>
                <p>Pas de course, pas de compétition. Chacun avance à son rythme.&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>💜 INSISTEZ LOURDEMENT</strong> sur le message central</li>
                <li><strong>🎯 Valorisez</strong> les actions humaines vs les chiffres</li>
                <li><strong>🤝 Donnez des exemples concrets</strong> d&apos;aide entre membres</li>
                <li><strong>✨ Rassurez</strong> : chacun à son rythme</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/ZeamRQ5a" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 10 HD</a>
          </div>
        </section>

        {/* SLIDE 13 : INVITATION */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide13">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">11. Partage l&apos;Aventure avec d&apos;Autres !</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 3-4 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Expliquer comment inviter</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Fondateur ou adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Étape 1 : Dire de lire le règlement</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Étape 2 : Choisir son rôle (Communauté ou Streamer)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Étape 3 : Réunion d&apos;intégration obligatoire</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">On privilégie la qualité humaine</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Sur la New Family, on ne recrute pas au hasard. On cherche des gens qui partagent nos valeurs : <strong>l&apos;entraide, la bienveillance et l&apos;envie de s&apos;impliquer sincèrement</strong>.</p>
                <p>Si tu veux inviter quelqu&apos;un, voici ce que tu peux lui dire :</p>
                <p><strong>1️⃣ Dis-leur de faire un petit tour par le règlement en arrivant</strong><br />
                C&apos;est ce qui fait la force de notre Family.</p>
                <p><strong>2️⃣ Pense aussi à leur dire de choisir leur rôle</strong><br />
                Communauté ou streamer, pour qu&apos;ils trouvent direct leur place !</p>
                <p><strong>3️⃣ Parle-leur de la réunion d&apos;intégration</strong><br />
                C&apos;est là qu&apos;ils rencontreront l&apos;équipe, découvriront tous nos outils et se sentiront vraiment accueillis !</p>
                <p><strong>On privilégie la qualité humaine, les liens sincères et l&apos;envie de grandir ensemble.</strong>&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>🎯 Insistez</strong> : qualité &gt; quantité</li>
                <li><strong>📖 Expliquez</strong> l&apos;importance du règlement</li>
                <li><strong>🤝 Valorisez</strong> le rôle de parrain/marraine</li>
                <li><strong>✅ Rassurez</strong> : la réunion d&apos;intégration est conviviale</li>
              </ul>
            </div>

            <a href="https://www.genspark.ai/api/files/s/lH052eMD" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 11 HD</a>
          </div>
        </section>

        {/* SLIDE 16 : PROCHAINES ÉTAPES & SITE WEB */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide16">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">12. Prochaines Étapes & Découvre Notre Site Web !</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 7-9 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Clôturer, Q&A, présenter le site</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Fondateur principal</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">📌 Points Clés à Aborder</h3>
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Ouvrir aux questions des participants (3-5 min)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Expliquer le processus d&apos;ajout (rôle actif, site web)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Timing : rôle dans les heures qui suivent, site en fin de semaine</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Présenter le site web : teamnewfamily.netlify.app</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Sections du site : Documentation, Spotlight, Équipe, Créateurs, Lives</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Encourager à profiter de la communauté</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400 mb-4">🎤 Discours Suggéré (SLIDES 16+17 FUSIONNÉES)</h3>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Et voilà, on arrive à la fin de cette réunion d&apos;intégration. Merci à vous d&apos;avoir été présents, d&apos;avoir écouté, posé des questions, et surtout d&apos;avoir choisi de rejoindre la New Family.</p>
                
                <p><strong>Avant de conclure : vos questions !</strong></p>
                <p>Le micro est ouvert : fonctionnement du serveur, rôles, points, Spotlight, organisation… <strong>ici, il n&apos;y a aucune question bête</strong>. Vous pouvez parler directement en vocal, ou poser vos questions dans le salon textuel juste en dessous.</p>
                <p><em>(Prendre 3-5 minutes pour répondre aux questions)</em></p>
                
                <p><strong>Prochaines étapes :</strong></p>
                <p>Dans les prochaines heures — ou d&apos;ici demain :<br />
                ✔ votre <strong>rôle actif</strong> sera attribué<br />
                ✔ votre chaîne sera ajoutée à la <strong>liste interne</strong> des membres actifs<br />
                ✔ vous serez officiellement intégrés au <strong>système d&apos;entraide</strong></p>
                <p>Et l&apos;ajout sur le site arrivera dans la <strong>mise à jour hebdomadaire</strong> (en fin de semaine).</p>
                
                <p><strong>À propos du site web de la New Family</strong></p>
                <p>On va vous montrer rapidement notre <strong>site web officiel</strong> :</p>
                <p className="text-2xl font-bold text-[#9146ff] text-center my-6">
                  <strong>teamnewfamily.netlify.app</strong>
                </p>
                
                <p>Sur le site, vous trouverez :</p>
                <p>📚 <strong>Documentation</strong> - Guides, règlement, ressources<br />
                🎯 <strong>Spotlight</strong> - Les prochains événements<br />
                👥 <strong>Équipe</strong> - Présentation du staff<br />
                🎮 <strong>Liste des créateurs actifs</strong> - Tous les membres<br />
                🔴 <strong>Lives en cours</strong> - Qui stream en ce moment</p>
                
                <p><em>(Faire une rapide démo du site à l&apos;écran si possible)</em></p>
                
                <p>Petit rappel important : <strong>votre ajout sur le site ne se fait pas immédiatement</strong>. Nous faisons les mises à jour <strong>en fin de semaine</strong>, donc pas d&apos;inquiétude si vous ne vous voyez pas tout de suite — c&apos;est normal !</p>
                
                <p><strong>À partir de maintenant… profitez !</strong></p>
                <p>Passez sur les lives, discutez, raid, découvrez de nouveaux créateurs, testez les salons d&apos;entraide, posez vos questions. Vous êtes maintenant dans une communauté qui fonctionne sur <strong>l&apos;humain, pas sur les chiffres</strong>.</p>
                
                <p><strong>Bienvenue officiellement dans la New Family.</strong></p>
                <p>On est vraiment très heureux de vous compter parmi nous !</p>
                
                <p><strong>Rejoins-nous et fais partie de l&apos;aventure New Family !</strong> 💜&quot;</p>
              </div>
            </div>

            <div className="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Conseils pour les Modérateurs</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>⏰ Prenez le temps</strong> pour les questions - c&apos;est important</li>
                <li><strong>📝 Notez</strong> les questions récurrentes pour améliorer le guide</li>
                <li><strong>🌐 Partagez le lien</strong> du site dans le chat textuel</li>
                <li><strong>🖥️ Faites un partage d&apos;écran</strong> pour montrer le site</li>
                <li><strong>📅 Rappelez</strong> : mise à jour hebdomadaire (fin de semaine)</li>
                <li><strong>🎯 Montrez</strong> où trouver la liste des créateurs sur le site</li>
                <li><strong>💜 Terminez sur une note chaleureuse</strong> et accueillante</li>
              </ul>
            </div>

            <div className="flex gap-4 mt-4">
              <a href="https://www.genspark.ai/api/files/s/AeTiU4ZE" className="inline-block px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 16 HD</a>
              <a href="https://www.genspark.ai/api/files/s/sa5HmN2b" className="inline-block px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 17 HD</a>
            </div>
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

