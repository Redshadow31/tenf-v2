"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface ModuleSectionProps {
  id: string;
  number: number;
  title: string;
  duration: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ModuleSection({ id, number, title, duration, isOpen, onToggle, children }: ModuleSectionProps) {
  return (
    <section id={id} className="mb-4 rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 cursor-pointer transition-colors"
        style={{
          backgroundColor: isOpen ? 'var(--color-card-hover)' : 'var(--color-surface)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          }
        }}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>⏱️ {duration}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 pt-2" style={{ color: 'var(--color-text)' }}>
          {children}
        </div>
      )}
    </section>
  );
}

interface ExerciseProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function Exercise({ id, title, children, isOpen, onToggle }: ExerciseProps) {
  return (
    <div className="my-4 p-4 rounded-lg border border-dashed" style={{ backgroundColor: '#f9f5ff20', borderColor: 'var(--color-primary)' }}>
      <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        📝 {title}
      </div>
      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
      <button
        onClick={onToggle}
        className="mt-3 px-3 py-1 rounded-full text-xs transition-colors"
        style={{
          backgroundColor: isOpen ? 'var(--color-primary)' : 'transparent',
          color: isOpen ? 'white' : 'var(--color-primary)',
          border: `1px solid var(--color-primary)`,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-primary)';
          }
        }}
      >
        {isOpen ? 'Masquer la correction' : 'Afficher la correction'}
      </button>
      {isOpen && (
        <div className="mt-3 p-3 rounded border-l-4" style={{ backgroundColor: '#f1f1ff20', borderLeftColor: '#5e35b1' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface ModuleContentProps {
  openExercises: Set<string>;
  toggleExercise: (id: string) => void;
}

export function ModuleContent1({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>1.1 – Ouverture & nature de la formation</h4>
      <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-secondary)' }}>Texte du formateur à adapter à ton ton habituel.</p>
      <div className="pl-4 border-l-4 mb-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
        <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
          Bonjour / bonsoir à tous, merci d'être là pour cette formation
          <span className="px-1 py-0.5 rounded font-medium" style={{ backgroundColor: '#f3e9ff', color: '#4527a0' }}>
            TENF Academy : Comprendre Twitch et ses règles
          </span>.
        </p>
        <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
          Cette formation n'est pas un cours de droit "sec", mais un <strong>guide de survie pour streamers</strong> :
          on va parler concret, parler sanctions, exemples, cas réels et bonnes pratiques.
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
          L'objectif : vous aider à <strong>protéger vos chaînes</strong>, vos communautés, et vous-même, en comprenant
          comment Twitch raisonne lorsqu'il applique ses règles.
        </p>
      </div>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>1.2 – Twitch est une plateforme privée</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Point clé : <span className="px-1 py-0.5 rounded font-medium" style={{ backgroundColor: '#f3e9ff', color: '#4527a0' }}>Twitch n'est pas un espace public</span>, c'est une entreprise privée.
        Quand vous créez un compte, vous acceptez les <strong>Conditions d'utilisation (ToS)</strong>.
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Votre "liberté d'expression" n'est pas totale sur Twitch.</li>
        <li>Twitch peut refuser le service en cas de non-respect des règles.</li>
        <li>"J'ai le droit de dire ce que je veux" ne protège pas d'une sanction.</li>
      </ul>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>1.3 – Impact &gt; Intention</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Twitch juge d'abord <span className="px-1 py-0.5 rounded font-medium" style={{ backgroundColor: '#f3e9ff', color: '#4527a0' }}>l'impact</span>, pas l'intention.
        Une "blague" qui blesse une personne ou une communauté peut être sanctionnée même si le streamer dit :
        "je rigolais".
      </p>

      <Exercise
        id="ex1"
        title="Exercice 1 – Intention vs impact"
        isOpen={openExercises.has("ex1")}
        onToggle={() => toggleExercise("ex1")}
      >
        <p className="mb-2">
          <span className="px-2 py-0.5 rounded text-xs mr-2" style={{ backgroundColor: '#e8eaf6', color: '#3f51b5' }}>Consigne</span>
          Lisez la situation suivante et réfléchissez :
        </p>
        <p className="italic mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Un streamer imite l'accent d'un pays pendant 30 secondes en rigolant. Le chat spam rigole, mais une personne
          de ce pays se sent mal à l'aise.
        </p>
        <p className="mb-2">Question : pour Twitch, qu'est-ce qui pèse le plus : l'intention ou l'impact ?</p>
        <div>
          <strong>Correction :</strong><br />
          Pour Twitch, c'est <strong>l'impact</strong> qui compte : si le comportement est perçu comme moqueur ou
          discriminant envers une identité, ça se rapproche du contenu haineux, même si le streamer "ne voulait pas
          blesser". L'intention ne protège pas d'une sanction.
        </div>
      </Exercise>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>1.4 – Mythes vs réalités</h4>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li><strong>"Tant que personne ne reporte, c'est bon."</strong> → Faux, Twitch a des outils automatiques.</li>
        <li><strong>"Ce qui se passe sur Discord reste sur Discord."</strong> → Faux, certains comportements graves hors
          Twitch peuvent mener à des sanctions.</li>
        <li><strong>"Je suis trop petit pour être surveillé."</strong> → Faux, les règles s'appliquent dès 0 viewer.</li>
      </ul>
      <p className="text-xs italic mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        [Inviter le groupe à partager le mythe qu'il entend le plus souvent.]
      </p>
    </>
  );
}

export function ModuleContent2({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>2.1 – Harcèlement & discours haineux</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>Twitch différencie :</p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Critique / désaccord (ex : "ton gameplay est nul")</li>
        <li>Harcèlement (insultes répétées, acharnement)</li>
        <li>Discours haineux (attaque sur l'identité : race, genre, handicap, orientation, etc.)</li>
      </ul>

      <Exercise
        id="ex2"
        title="Exercice 2 – Classer les situations"
        isOpen={openExercises.has("ex2")}
        onToggle={() => toggleExercise("ex2")}
      >
        <p className="mb-2">
          <span className="px-2 py-0.5 rounded text-xs mr-2" style={{ backgroundColor: '#e8eaf6', color: '#3f51b5' }}>Consigne</span>
          Pour chaque situation, décidez si c'est :
        </p>
        <ul className="list-disc list-inside ml-4 mb-2 space-y-1">
          <li>✅ Plutôt OK</li>
          <li>⚠️ À risque</li>
          <li>❌ Interdit</li>
        </ul>
        <ol className="list-decimal list-inside ml-4 space-y-1 mb-2">
          <li>"Franchement t'es un noob, mais j'aime bien ton énergie."</li>
          <li>Spammer "kill yourself" à un streamer tilt.</li>
          <li>Un viewer insulte le gameplay, le streamer rigole et répond.</li>
          <li>Un viewer se moque du handicap physique d'un autre.</li>
        </ol>
        <div>
          <strong>Correction :</strong><br />
          1. ⚠️ Zone grise : tout dépend du ton, du contexte, de la répétition.<br />
          2. ❌ Interdit : incitation à l'automutilation, très grave.<br />
          3. ✅ En général OK si ça reste ponctuel et non ciblé.<br />
          4. ❌ Interdit : moquer un handicap = harcèlement grave / discours haineux.
        </div>
      </Exercise>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>2.2 – Contenu sexuel & suggestif</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Règle simple : si vous vous demandez "est-ce que ce n'est pas trop ?", c'est probablement <strong>trop</strong>
        pour Twitch.
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>❌ Nudité, lingerie hors contexte plage/piscine, focus sur zones érogènes.</li>
        <li>✅ Maillots de bain dans un contexte cohérent (plage, piscine, jacuzzi) avec le tag adapté.</li>
      </ul>

      <Exercise
        id="ex3"
        title="Exercice 3 – Contexte & tenue"
        isOpen={openExercises.has("ex3")}
        onToggle={() => toggleExercise("ex3")}
      >
        <p className="mb-2">Classer en 🔵 OK, 🟡 limite, 🔴 non :</p>
        <ol className="list-decimal list-inside ml-4 space-y-1 mb-2">
          <li>Stream en maillot de bain dans son salon, en Just Chatting.</li>
          <li>Stream en maillot à la plage, stream IRL, angle normal.</li>
          <li>Stream avec gros zoom constant sur la poitrine ou les fesses.</li>
        </ol>
        <div>
          <strong>Correction :</strong><br />
          1. 🔴 Risqué / souvent considéré non conforme (contexte inadapté).<br />
          2. 🔵 OK si attitude normale, contexte cohérent, bon tag.<br />
          3. 🔴 Interdit : focus constant sur zones érogènes.
        </div>
      </Exercise>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>2.3 – Violence, automutilation & mineurs (rappel)</h4>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Jeux violents : autorisés, mais pas de violence réelle ni de menaces crédibles.</li>
        <li>Automutilation / comportements dangereux : interdiction de promouvoir ou d'encourager.</li>
        <li>Mineurs : protection maximale, aucune sexualisation, même en dessin.</li>
      </ul>
    </>
  );
}

export function ModuleContent3({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>3.1 – Droits & devoirs du streamer</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        En streamant, vous donnez à Twitch le droit de diffuser votre contenu, et vous acceptez de respecter
        les règles de la plateforme et la loi de votre pays.
      </p>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>3.2 – DMCA & musique</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Vous ne pouvez utiliser que de la musique :
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>dont vous possédez les droits, ou</li>
        <li>qui est libre de droits / DMCA-free.</li>
      </ul>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Supprimer la VOD ne protège pas : le live lui-même peut être scanné.
      </p>

      <Exercise
        id="ex4"
        title="Exercice 4 – Musique & risques"
        isOpen={openExercises.has("ex4")}
        onToggle={() => toggleExercise("ex4")}
      >
        <p className="mb-2">Pour chaque scénario, dites si c'est OK ou à éviter :</p>
        <ol className="list-decimal list-inside ml-4 space-y-1 mb-2">
          <li>Playlist Spotify avec les derniers hits du moment.</li>
          <li>Playlist DMCA-free d'un label pour streamers.</li>
          <li>Rediffusion d'un film Netflix en stream, sans outil officiel.</li>
        </ol>
        <div>
          <strong>Correction :</strong><br />
          1. À éviter / ❌ : musique commerciale = risque DMCA élevé.<br />
          2. ✅ OK en principe, à condition de respecter les termes du label.<br />
          3. ❌ Interdit : violation des droits d'auteur (film/série protégé).
        </div>
      </Exercise>
    </>
  );
}

export function ModuleContent4({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>4.1 – Blagues limites & humour noir</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Un seul clip de 30 secondes, sorti de son contexte, peut détruire une réputation ou mener à une sanction.
        "C'était de l'humour noir" ne suffit pas comme défense.
      </p>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>4.2 – Dramas publics</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Commenter les sanctions d'autres streamers, faire des clashs publics, cultiver les dramas pour le contenu :
        c'est très risqué (diffamation, harcèlement…).
      </p>

      <Exercise
        id="ex5"
        title="Exercice 5 – Gérer un drama"
        isOpen={openExercises.has("ex5")}
        onToggle={() => toggleExercise("ex5")}
      >
        <p className="mb-2 italic" style={{ color: 'var(--color-text-secondary)' }}>
          Un streamer que vous connaissez se fait bannir. Votre chat vous spamme : "Tu trouves ça normal ? T'en
          penses quoi ?"
        </p>
        <p className="mb-2">Comment répondre sans vous mettre en danger ?</p>
        <div>
          <strong>Proposition de réponse :</strong><br />
          "Je ne connais pas tous les détails, ce n'est pas à moi de juger les décisions de Twitch.
          Ce que je peux faire par contre, c'est me concentrer sur notre contenu ici et continuer à respecter les règles."
          <br /><br />
          → Vous restez neutre, vous évitez la diffamation et vous ne vous exposez pas.
        </div>
      </Exercise>
    </>
  );
}

export function ModuleContent5({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>5.1 – Échelle des sanctions</h4>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Avertissement (rare, mais possible).</li>
        <li>Suspension temporaire : 24h, 3j, 7j, 30j…</li>
        <li>Ban indéfini / définitif.</li>
      </ul>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Les sanctions s'accumulent : plusieurs "petites" infractions peuvent mener à un ban définitif.
      </p>

      <Exercise
        id="ex6"
        title="Mini-quiz – Sanctions"
        isOpen={openExercises.has("ex6")}
        onToggle={() => toggleExercise("ex6")}
      >
        <ol className="list-decimal list-inside ml-4 space-y-1 mb-2">
          <li>Twitch est-il obligé de te donner un avertissement avant un ban lourd ?</li>
          <li>Être un "petit" streamer te protège-t-il des sanctions ?</li>
        </ol>
        <div>
          <strong>Correction :</strong><br />
          1. Non, Twitch peut sanctionner directement si la violation est grave.<br />
          2. Non, les règles s'appliquent à tout le monde, quelle que soit la taille de la chaîne.
        </div>
      </Exercise>
    </>
  );
}

export function ModuleContent6() {
  return (
    <>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>Quelques idées reçues :</p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li><strong>"Les gros streamers ont tous les droits."</strong> → Faux, les règles sont les mêmes (même si l'application
          peut sembler différente).</li>
        <li><strong>"C'est ma communauté, je fais ce que je veux."</strong> → Votre communauté reste sur la plateforme
          de Twitch, donc sous leurs règles.</li>
        <li><strong>"C'est la liberté d'expression."</strong> → La liberté d'expression ne garantit pas une plateforme pour
          la diffuser.</li>
      </ul>
    </>
  );
}

export function ModuleContent7({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Vous êtes responsable de votre chaîne et de votre chat : choix des modérateurs, consignes, actions.
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Vos modérateurs sont vos boucliers, mais vous restez responsable.</li>
        <li>Les logs, clips, VOD peuvent être utilisés pour examiner un cas.</li>
        <li>Certains comportements (harcèlement, menace, doxxing) relèvent aussi de la loi.</li>
      </ul>

      <Exercise
        id="ex7"
        title="Exercice 6 – Rôle des modérateurs"
        isOpen={openExercises.has("ex7")}
        onToggle={() => toggleExercise("ex7")}
      >
        <p className="mb-2">
          Quelles sont, selon vous, les 3 choses les plus importantes à expliquer à un modérateur avant de lui donner l'épée ?
        </p>
        <div>
          <strong>Éléments clés :</strong><br />
          • Ce que vous considérez comme tolérable ou non dans votre chat.<br />
          • Les limites absolues (haine, triggers personnels, sujets sensibles).<br />
          • La procédure : quand avertir, quand timeout, quand ban, et quand vous prévenir pour escalader.
        </div>
      </Exercise>
    </>
  );
}

export function ModuleContent8({ openExercises, toggleExercise }: ModuleContentProps) {
  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>Cas pratique 1 – Conflit politique dans le chat</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Le chat s'enflamme sur une élection, les insultes fusent.
      </p>
      <Exercise
        id="ex8"
        title="🧪 Réflexion"
        isOpen={openExercises.has("ex8")}
        onToggle={() => toggleExercise("ex8")}
      >
        <p className="mb-2">Quelle est la réaction la plus saine pour la chaîne ?</p>
        <div>
          Poser le cadre ("On arrête la politique ici, on revient au jeu"), rappeler les règles du chat
          et appliquer des timeouts ou bans si nécessaire. Ne pas laisser le conflit dériver pour "l'engagement".
        </div>
      </Exercise>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>Cas pratique 2 – Blague raciste en TTS</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>Un don avec TTS diffuse une blague raciste à voix haute.</p>
      <Exercise
        id="ex9"
        title="🧪 Réflexion"
        isOpen={openExercises.has("ex9")}
        onToggle={() => toggleExercise("ex9")}
      >
        <p className="mb-2">Que faire immédiatement ?</p>
        <div>
          Couper le son si possible, désavouer clairement ("C'est inacceptable ici"), bannir l'auteur, puis ajuster
          les filtres / règles du TTS pour éviter que ça se reproduise.
        </div>
      </Exercise>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>Cas pratique 3 – Musique protégée</h4>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
        Vous voulez passer le dernier hit très connu de Beyoncé en fond de live.
      </p>
      <Exercise
        id="ex10"
        title="🧪 Réflexion"
        isOpen={openExercises.has("ex10")}
        onToggle={() => toggleExercise("ex10")}
      >
        <p className="mb-2">Bonne idée ou non ? Pourquoi ?</p>
        <div>
          Mauvaise idée : musique commerciale = risque de DMCA (strikes, voire ban). Il vaut mieux privilégier
          des playlists DMCA-free prévues pour le streaming.
        </div>
      </Exercise>
    </>
  );
}

interface ModuleContent9Props {
  showAllQuizAnswers: boolean;
  setShowAllQuizAnswers: (show: boolean) => void;
}

export function ModuleContent9({ showAllQuizAnswers, setShowAllQuizAnswers }: ModuleContent9Props) {
  const quizQuestions = [
    {
      id: "q1",
      question: "1. Twitch juge-t-il l'intention ou l'impact ?",
      options: "A) L'intention\nB) L'impact",
      answer: "B – Twitch se concentre sur l'impact."
    },
    {
      id: "q2",
      question: "2. Est-il autorisé de diffuser de la musique protégée si on supprime la VOD ?",
      options: "A) Oui\nB) Non, le live peut être scanné",
      answer: "B – Le live lui-même est soumis au DMCA."
    },
    {
      id: "q3",
      question: "3. Qui est responsable des propos tenus dans le chat ?",
      options: "A) Les viewers uniquement\nB) Le streamer",
      answer: "B – Le streamer est responsable de la modération."
    },
    {
      id: "q4",
      question: "4. Un comportement hors Twitch peut-il entraîner une sanction sur Twitch ?",
      options: "A) Non, jamais\nB) Oui, si le comportement est grave",
      answer: "B – En cas de comportement grave (violence, etc.)."
    },
    {
      id: "q5",
      question: "5. Que faire face à un conflit politique violent dans le chat ?",
      options: "A) Laisser faire pour l'engagement\nB) Recadrer le chat, interdire le sujet, modérer si nécessaire",
      answer: "B – On protège l'ambiance, on modère."
    },
    {
      id: "q6",
      question: "6. Les gros streamers ont-ils plus de droits que les petits ?",
      options: "A) Oui\nB) Non",
      answer: "B – Les règles sont les mêmes pour tous."
    },
    {
      id: "q7",
      question: "7. \"C'était une blague\" suffit-il à se défendre d'un propos offensant ?",
      options: "A) Oui\nB) Non",
      answer: "B – L'impact compte plus que l'intention."
    },
    {
      id: "q8",
      question: "8. Quels contenus doivent être signalés comme sponsorisés ?",
      options: "A) Seulement les gros contrats\nB) Tout contenu où il y a rémunération ou échange de valeur",
      answer: "B – Toute forme de sponsoring doit être indiquée."
    },
    {
      id: "q9",
      question: "9. Si un modérateur abuse de ses pouvoirs, qui est responsable ?",
      options: "A) Le modérateur\nB) Le streamer",
      answer: "B – Le streamer choisit et encadre ses modos."
    },
    {
      id: "q10",
      question: "10. Que signifie \"shadow sanction\" ?",
      options: "A) Aucune sanction réelle\nB) Réduction de visibilité sans notification officielle",
      answer: "B – Visibilité réduite sans avertissement clair."
    }
  ];

  return (
    <>
      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>9.1 – Les 10 règles d'or</h4>
      <ol className="list-decimal list-inside ml-4 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
        <li>Connaître les règles de Twitch.</li>
        <li>Modérer activement son chat.</li>
        <li>Ne pas faire confiance aux liens / fichiers douteux.</li>
        <li>Respecter autrui, même en cas de conflit.</li>
        <li>Penser "impact" plutôt qu'intention.</li>
        <li>Protéger ses données personnelles (et celles des autres).</li>
        <li>Faire attention aux droits d'auteur (musique, vidéo).</li>
        <li>Rester maître de ses émotions en live.</li>
        <li>Former son équipe de modération.</li>
        <li>En cas de doute : <strong>s'abstenir</strong>.</li>
      </ol>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>9.2 – Quiz final (10 questions)</h4>
      <div className="my-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {quizQuestions.map((q) => (
          <div key={q.id} className="mb-4 pb-4 border-b last:border-b-0" style={{ borderBottomColor: 'var(--color-border)' }}>
            <div className="font-semibold mb-2 text-sm" style={{ color: 'var(--color-text)' }}>{q.question}</div>
            <div className="text-xs mb-2 whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>{q.options}</div>
            {showAllQuizAnswers && (
              <div className="text-xs mt-2" style={{ color: '#2e7d32' }}>
                <strong>Réponse :</strong> {q.answer}
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowAllQuizAnswers(true)}
            className="px-3 py-1 rounded-full text-xs border transition-colors"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: showAllQuizAnswers ? 'var(--color-primary)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!showAllQuizAnswers) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!showAllQuizAnswers) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
          >
            Afficher toutes les réponses
          </button>
          <button
            onClick={() => setShowAllQuizAnswers(false)}
            className="px-3 py-1 rounded-full text-xs border transition-colors"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: !showAllQuizAnswers ? 'var(--color-primary)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (showAllQuizAnswers) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (showAllQuizAnswers) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
          >
            Masquer toutes les réponses
          </button>
        </div>
      </div>

      <h4 className="font-semibold mb-2 mt-4" style={{ color: 'var(--color-text)' }}>9.3 – Clôture</h4>
      <p className="text-sm" style={{ color: 'var(--color-text)' }}>
        Merci d'avoir suivi cette formation. L'objectif n'est pas de faire peur, mais de donner des clés concrètes pour
        des streams plus sereins. La <strong>connaissance</strong> est votre meilleure protection sur Twitch.
      </p>
    </>
  );
}
