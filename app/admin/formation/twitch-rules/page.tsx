"use client";

import { useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { ArrowLeft, BookOpen, FileText, Presentation } from "lucide-react";
import {
  ModuleSection,
  ModuleContent1,
  ModuleContent2,
  ModuleContent3,
  ModuleContent4,
  ModuleContent5,
  ModuleContent6,
  ModuleContent7,
  ModuleContent8,
  ModuleContent9,
} from "./components";
import {
  PresentationSlides,
  SlideContent,
  SlideList,
  SlideComparison,
  SlideNumber,
} from "./presentation-slides";
import { PresentationHTML } from "./presentation-html";

type TabType = "discours" | "presentation";

export default function TwitchRulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("discours");
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([1]));
  const [openExercises, setOpenExercises] = useState<Set<string>>(new Set());
  const [showAllQuizAnswers, setShowAllQuizAnswers] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleModule = (moduleNum: number) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleNum)) {
        next.delete(moduleNum);
      } else {
        next.add(moduleNum);
      }
      return next;
    });
  };

  const toggleExercise = (exerciseId: string) => {
    setOpenExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  // Slides de présentation
  const presentationSlides = [
    // Slide 1 - Titre
    {
      id: 1,
      title: "Titre",
      module: 0,
      content: (
        <SlideContent title="TENF Academy" subtitle="Comprendre Twitch et ses Règles" icon="📚">
          <p className="text-xl mt-4" style={{ color: '#a0a0a0' }}>
            Formation communautaire - Durée : 1h30 à 2h
          </p>
        </SlideContent>
      ),
    },
    // Slide 2 - Disclaimer
    {
      id: 2,
      title: "Avertissement",
      module: 0,
      content: (
        <SlideContent title="⚠️ Avertissement Important">
          <div className="text-left max-w-4xl space-y-4">
            <p>Cette formation est une initiative <strong>indépendante et communautaire</strong> créée par et pour la communauté <strong>TENF</strong>.</p>
            <p>Elle <strong>ne représente pas Twitch</strong> et n'est pas affiliée officiellement à la plateforme.</p>
            <p className="text-lg font-semibold mt-6" style={{ color: '#9146ff' }}>
              Objectif : éducation, prévention et entraide
            </p>
          </div>
        </SlideContent>
      ),
    },
    // Slide 3 - Sommaire
    {
      id: 3,
      title: "Sommaire",
      module: 0,
      content: (
        <SlideContent title="📋 Plan de la formation">
          <SlideList
            title=""
            items={[
              "Module 1 : Introduction",
              "Module 2 : Guidelines Twitch",
              "Module 3 : ToS & DMCA",
              "Module 4 : Erreurs fréquentes",
              "Module 5 : Sanctions",
              "Module 6 : Zones grises",
              "Module 7 : Responsabilité",
              "Module 8 : Cas pratiques",
              "Module 9 : Synthèse & Quiz",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 1 - Slide 4
    {
      id: 4,
      title: "Module 1 - Introduction",
      module: 1,
      content: (
        <SlideContent title="🟣 Module 1 – Introduction" subtitle="8–10 min">
          <div className="text-left max-w-4xl space-y-4">
            <p className="text-2xl font-semibold mb-4" style={{ color: '#9146ff' }}>Guide de survie pour streamers</p>
            <p>On va parler <strong>concret</strong>, parler <strong>sanctions</strong>, <strong>exemples</strong>, cas réels et bonnes pratiques.</p>
            <p className="text-xl mt-6" style={{ color: '#9146ff' }}>Objectif : Protéger vos chaînes et vos communautés</p>
          </div>
        </SlideContent>
      ),
    },
    // Module 1 - Slide 5
    {
      id: 5,
      title: "Twitch est privé",
      module: 1,
      content: (
        <SlideContent title="Point clé : Twitch est une plateforme privée">
          <SlideComparison
            leftTitle="Espace public"
            rightTitle="Plateforme privée"
            left={[
              "Liberté d'expression totale",
              "Droits garantis",
              "Pas de règles strictes",
            ]}
            right={[
              "Conditions d'utilisation (ToS)",
              "Twitch peut refuser le service",
              "Règles à respecter",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 1 - Slide 6
    {
      id: 6,
      title: "Impact vs Intention",
      module: 1,
      content: (
        <SlideContent title="Impact &gt; Intention">
          <div className="text-left max-w-4xl space-y-6">
            <div className="text-center mb-6">
              <p className="text-4xl font-bold mb-2" style={{ color: '#ef4444' }}>Impact</p>
              <p className="text-2xl">vs</p>
              <p className="text-4xl font-bold mt-2" style={{ color: '#10b981' }}>Intention</p>
            </div>
            <p className="text-xl">Twitch juge d'abord <strong>l'impact</strong>, pas l'intention.</p>
            <p className="text-lg">Une "blague" qui blesse peut être sanctionnée même si le streamer dit "je rigolais".</p>
          </div>
        </SlideContent>
      ),
    },
    // Module 2 - Slide 7
    {
      id: 7,
      title: "Module 2 - Guidelines",
      module: 2,
      content: (
        <SlideContent title="🔵 Module 2 – Guidelines Twitch" subtitle="15–20 min">
          <SlideList
            title="Les règles principales"
            items={[
              "Harcèlement & discours haineux",
              "Contenu sexuel & suggestif",
              "Violence & automutilation",
              "Protection des mineurs",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 2 - Slide 8
    {
      id: 8,
      title: "Harcèlement",
      module: 2,
      content: (
        <SlideContent title="Harcèlement & Discours haineux">
          <div className="text-left max-w-4xl space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#10b98120' }}>
                <p className="font-semibold mb-2">Critique / Désaccord</p>
                <p className="text-sm">"Ton gameplay est nul"</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f59e0b20' }}>
                <p className="font-semibold mb-2">Harcèlement</p>
                <p className="text-sm">Insultes répétées, acharnement</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#ef444420' }}>
                <p className="font-semibold mb-2">Discours haineux</p>
                <p className="text-sm">Attaque sur l'identité</p>
              </div>
            </div>
          </div>
        </SlideContent>
      ),
    },
    // Module 2 - Slide 9
    {
      id: 9,
      title: "Contenu sexuel",
      module: 2,
      content: (
        <SlideContent title="Contenu sexuel & suggestif">
          <SlideComparison
            leftTitle="❌ Interdit"
            rightTitle="✅ Autorisé"
            left={[
              "Nudité",
              "Lingerie hors contexte",
              "Focus sur zones érogènes",
            ]}
            right={[
              "Maillots de bain (plage/piscine)",
              "Contexte cohérent",
              "Tag adapté",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 3 - Slide 10
    {
      id: 10,
      title: "Module 3 - ToS & DMCA",
      module: 3,
      content: (
        <SlideContent title="🟢 Module 3 – ToS & DMCA" subtitle="8–10 min">
          <div className="text-left max-w-4xl space-y-4">
            <p className="text-2xl font-semibold mb-4" style={{ color: '#9146ff' }}>Droits & devoirs du streamer</p>
            <p>En streamant, vous donnez à Twitch le droit de diffuser votre contenu.</p>
            <p className="text-xl mt-6" style={{ color: '#ef4444' }}>⚠️ Vous acceptez de respecter les règles et la loi</p>
          </div>
        </SlideContent>
      ),
    },
    // Module 3 - Slide 11
    {
      id: 11,
      title: "DMCA & Musique",
      module: 3,
      content: (
        <SlideContent title="DMCA & Musique">
          <div className="text-left max-w-4xl space-y-6">
            <p className="text-2xl font-semibold mb-4" style={{ color: '#9146ff' }}>Vous pouvez utiliser :</p>
            <ul className="space-y-3 text-xl">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span>Musique dont vous possédez les droits</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span>Musique libre de droits / DMCA-free</span>
              </li>
            </ul>
            <p className="text-lg mt-6" style={{ color: '#ef4444' }}>
              ⚠️ Supprimer la VOD ne protège pas : le live peut être scanné
            </p>
          </div>
        </SlideContent>
      ),
    },
    // Module 4 - Slide 12
    {
      id: 12,
      title: "Module 4 - Erreurs",
      module: 4,
      content: (
        <SlideContent title="🟡 Module 4 – Erreurs fréquentes" subtitle="10–12 min">
          <SlideList
            title="Erreurs à éviter"
            items={[
              "Blagues limites & humour noir",
              "Dramas publics",
              "Commenter les sanctions d'autres streamers",
              "Cultiver les conflits pour le contenu",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 5 - Slide 13
    {
      id: 13,
      title: "Module 5 - Sanctions",
      module: 5,
      content: (
        <SlideContent title="🔴 Module 5 – Sanctions" subtitle="8–10 min">
          <div className="text-left max-w-4xl space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f59e0b20' }}>
                <p className="text-3xl font-bold mb-2">⚠️</p>
                <p className="font-semibold">Avertissement</p>
                <p className="text-sm mt-2">Rare, mais possible</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#ef444420' }}>
                <p className="text-3xl font-bold mb-2">⏸️</p>
                <p className="font-semibold">Suspension</p>
                <p className="text-sm mt-2">24h, 3j, 7j, 30j...</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#dc262620' }}>
                <p className="text-3xl font-bold mb-2">🚫</p>
                <p className="font-semibold">Ban</p>
                <p className="text-sm mt-2">Indéfini / Définitif</p>
              </div>
            </div>
            <p className="text-lg mt-6 text-center" style={{ color: '#9146ff' }}>
              Les sanctions s'accumulent !
            </p>
          </div>
        </SlideContent>
      ),
    },
    // Module 6 - Slide 14
    {
      id: 14,
      title: "Module 6 - Zones grises",
      module: 6,
      content: (
        <SlideContent title="🟠 Module 6 – Zones grises" subtitle="5–8 min">
          <SlideList
            title="Idées reçues"
            items={[
              '"Les gros streamers ont tous les droits" → Faux',
              '"C\'est ma communauté, je fais ce que je veux" → Faux',
              '"C\'est la liberté d\'expression" → Faux',
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 7 - Slide 15
    {
      id: 15,
      title: "Module 7 - Responsabilité",
      module: 7,
      content: (
        <SlideContent title="🧠 Module 7 – Responsabilité" subtitle="5–8 min">
          <div className="text-left max-w-4xl space-y-4">
            <p className="text-2xl font-semibold mb-4" style={{ color: '#9146ff' }}>Vous êtes responsable de :</p>
            <ul className="space-y-3 text-xl">
              <li className="flex items-start gap-3">
                <span className="text-2xl">📺</span>
                <span>Votre chaîne</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <span>Votre chat</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <span>Choix des modérateurs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <span>Consignes et actions</span>
              </li>
            </ul>
          </div>
        </SlideContent>
      ),
    },
    // Module 8 - Slide 16
    {
      id: 16,
      title: "Module 8 - Cas pratiques",
      module: 8,
      content: (
        <SlideContent title="📌 Module 8 – Cas pratiques" subtitle="15–20 min">
          <SlideList
            title="Scénarios à analyser"
            items={[
              "Conflit politique dans le chat",
              "Blague raciste en TTS",
              "Musique protégée",
            ]}
          />
        </SlideContent>
      ),
    },
    // Module 8 - Slide 17
    {
      id: 17,
      title: "Cas pratique - Conflit",
      module: 8,
      content: (
        <SlideContent title="Cas pratique 1 : Conflit politique">
          <div className="text-left max-w-4xl space-y-4">
            <p className="text-xl mb-4"><strong>Situation :</strong> Le chat s'enflamme sur une élection, les insultes fusent.</p>
            <div className="p-4 rounded-lg mt-6" style={{ backgroundColor: '#10b98120' }}>
              <p className="font-semibold mb-2">✅ Bonne pratique :</p>
              <p>Poser le cadre ("On arrête la politique ici"), rappeler les règles, appliquer des timeouts ou bans si nécessaire.</p>
            </div>
          </div>
        </SlideContent>
      ),
    },
    // Module 8 - Slide 18
    {
      id: 18,
      title: "Cas pratique - TTS",
      module: 8,
      content: (
        <SlideContent title="Cas pratique 2 : Blague raciste en TTS">
          <div className="text-left max-w-4xl space-y-4">
            <p className="text-xl mb-4"><strong>Situation :</strong> Un don avec TTS diffuse une blague raciste à voix haute.</p>
            <div className="p-4 rounded-lg mt-6" style={{ backgroundColor: '#10b98120' }}>
              <p className="font-semibold mb-2">✅ Actions immédiates :</p>
              <ul className="space-y-2 ml-4">
                <li>Couper le son si possible</li>
                <li>Désavouer clairement ("C'est inacceptable")</li>
                <li>Bannir l'auteur</li>
                <li>Ajuster les filtres TTS</li>
              </ul>
            </div>
          </div>
        </SlideContent>
      ),
    },
    // Module 9 - Slide 19
    {
      id: 19,
      title: "Module 9 - Règles d'or",
      module: 9,
      content: (
        <SlideContent title="✅ Module 9 – Les 10 règles d'or">
          <div className="text-left max-w-4xl">
            <ol className="space-y-3 text-lg list-decimal list-inside">
              <li>Connaître les règles de Twitch</li>
              <li>Modérer activement son chat</li>
              <li>Ne pas faire confiance aux liens douteux</li>
              <li>Respecter autrui, même en conflit</li>
              <li>Penser "impact" plutôt qu'intention</li>
              <li>Protéger ses données personnelles</li>
              <li>Faire attention aux droits d'auteur</li>
              <li>Rester maître de ses émotions</li>
              <li>Former son équipe de modération</li>
              <li className="font-bold text-xl" style={{ color: '#9146ff' }}>En cas de doute : s'abstenir</li>
            </ol>
          </div>
        </SlideContent>
      ),
    },
    // Slide 20 - Conclusion
    {
      id: 20,
      title: "Conclusion",
      module: 9,
      content: (
        <SlideContent title="Merci pour votre attention !" icon="🎓">
          <div className="text-left max-w-4xl space-y-4 mt-8">
            <p className="text-2xl font-semibold mb-4" style={{ color: '#9146ff' }}>
              La connaissance est votre meilleure protection
            </p>
            <p className="text-xl">L'objectif n'est pas de faire peur, mais de donner des clés concrètes pour des streams plus sereins.</p>
            <p className="text-lg mt-6" style={{ color: '#a0a0a0' }}>
              TENF Academy – Formation communautaire indépendante
            </p>
          </div>
        </SlideContent>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="TENF Academy : Comprendre Twitch et ses règles"
        navLinks={[
          { href: "/admin/dashboard", label: "Tableau de bord" },
          { href: "/admin/formation", label: "Formation TENF" },
          { href: "/admin/formation/twitch-rules", label: "Comprendre Twitch et ses règles", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <Link
            href="/admin/formation"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Formation
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            TENF Academy : Comprendre Twitch et ses règles
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Formation complète sur Twitch, ses règles, ses fonctionnalités et les bonnes pratiques
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("discours")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "discours"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5" />
              Discours
            </button>
            <button
              onClick={() => setActiveTab("presentation")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "presentation"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Presentation className="w-5 h-5" />
              Présentation
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          {activeTab === "discours" && (
            <div>
              {/* Disclaimer */}
              <div className="mb-6 p-4 rounded-lg border-l-4" style={{ backgroundColor: '#fffaf120', borderLeftColor: '#ffb300' }}>
                <p className="font-semibold mb-2" style={{ color: '#d84315' }}>
                  AVERTISSEMENT IMPORTANT
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                  Cette formation est une initiative <strong>indépendante et communautaire</strong> créée par et pour la communauté
                  <strong> Twitch Entraide New Family (TENF)</strong>.
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                  Elle <strong>ne représente pas Twitch</strong> et n'est pas affiliée officiellement à la plateforme.
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                  Les informations sont basées sur les documents publics officiels de Twitch (Community Guidelines, Terms of Service) et
                  sur l'expérience de streamers et de modération. En cas de doute ou de problème sur votre chaîne, les références
                  officielles restent :
                </p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1" style={{ color: 'var(--color-text)' }}>
                  <li>Les Community Guidelines officielles de Twitch</li>
                  <li>Les Terms of Service de Twitch</li>
                  <li>Le Support Twitch</li>
                </ul>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text)' }}>
                  Objectif : <strong>éducation, prévention et entraide</strong> pour des streams plus sûrs et responsables.
                </p>
              </div>

              {/* Sommaire */}
              <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Sommaire de la formation
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Cliquez sur un module pour y accéder. Chaque bloc peut être replié ou déplié.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <a href="#mod1" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🟣 Module 1 – Introduction</a>
                  <a href="#mod2" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🔵 Module 2 – Guidelines Twitch</a>
                  <a href="#mod3" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🟢 Module 3 – ToS & DMCA</a>
                  <a href="#mod4" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🟡 Module 4 – Erreurs fréquentes</a>
                  <a href="#mod5" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🔴 Module 5 – Sanctions</a>
                  <a href="#mod6" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🟠 Module 6 – Zones grises</a>
                  <a href="#mod7" className="hover:underline" style={{ color: 'var(--color-primary)' }}>🧠 Module 7 – Responsabilité</a>
                  <a href="#mod8" className="hover:underline" style={{ color: 'var(--color-primary)' }}>📌 Module 8 – Cas pratiques</a>
                  <a href="#mod9" className="hover:underline" style={{ color: 'var(--color-primary)' }}>✅ Module 9 – Synthèse & Quiz final</a>
                </div>
                <p className="text-xs mt-3 text-right italic" style={{ color: 'var(--color-text-secondary)' }}>
                  Durée estimée : 1h30 – 2h selon échanges & questions
                </p>
              </div>

              {/* Module 1 */}
              <ModuleSection
                id="mod1"
                number={1}
                title="🟣 Module 1 – Introduction"
                duration="8–10 min"
                isOpen={openModules.has(1)}
                onToggle={() => toggleModule(1)}
              >
                <ModuleContent1 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 2 */}
              <ModuleSection
                id="mod2"
                number={2}
                title="🔵 Module 2 – Guidelines Twitch"
                duration="15–20 min"
                isOpen={openModules.has(2)}
                onToggle={() => toggleModule(2)}
              >
                <ModuleContent2 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 3 */}
              <ModuleSection
                id="mod3"
                number={3}
                title="🟢 Module 3 – ToS & DMCA"
                duration="8–10 min"
                isOpen={openModules.has(3)}
                onToggle={() => toggleModule(3)}
              >
                <ModuleContent3 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 4 */}
              <ModuleSection
                id="mod4"
                number={4}
                title="🟡 Module 4 – Erreurs fréquentes"
                duration="10–12 min"
                isOpen={openModules.has(4)}
                onToggle={() => toggleModule(4)}
              >
                <ModuleContent4 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 5 */}
              <ModuleSection
                id="mod5"
                number={5}
                title="🔴 Module 5 – Sanctions"
                duration="8–10 min"
                isOpen={openModules.has(5)}
                onToggle={() => toggleModule(5)}
              >
                <ModuleContent5 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 6 */}
              <ModuleSection
                id="mod6"
                number={6}
                title="🟠 Module 6 – Zones grises & idées reçues"
                duration="5–8 min"
                isOpen={openModules.has(6)}
                onToggle={() => toggleModule(6)}
              >
                <ModuleContent6 />
              </ModuleSection>

              {/* Module 7 */}
              <ModuleSection
                id="mod7"
                number={7}
                title="🧠 Module 7 – Responsabilité du streamer"
                duration="5–8 min"
                isOpen={openModules.has(7)}
                onToggle={() => toggleModule(7)}
              >
                <ModuleContent7 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 8 */}
              <ModuleSection
                id="mod8"
                number={8}
                title="📌 Module 8 – Cas pratiques"
                duration="15–20 min"
                isOpen={openModules.has(8)}
                onToggle={() => toggleModule(8)}
              >
                <ModuleContent8 
                  openExercises={openExercises}
                  toggleExercise={toggleExercise}
                />
              </ModuleSection>

              {/* Module 9 */}
              <ModuleSection
                id="mod9"
                number={9}
                title="✅ Module 9 – Synthèse & Quiz final"
                duration="10–15 min"
                isOpen={openModules.has(9)}
                onToggle={() => toggleModule(9)}
              >
                <ModuleContent9 
                  showAllQuizAnswers={showAllQuizAnswers}
                  setShowAllQuizAnswers={setShowAllQuizAnswers}
                />
              </ModuleSection>
            </div>
          )}

          {activeTab === "presentation" && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Presentation className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Présentation
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Présentation visuelle pour la formation Twitch - Format 16:9
                  </p>
                </div>
              </div>

              <PresentationHTML />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
