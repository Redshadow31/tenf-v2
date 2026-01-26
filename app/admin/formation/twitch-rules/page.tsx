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

type TabType = "discours" | "presentation";

export default function TwitchRulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("discours");
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([1]));
  const [openExercises, setOpenExercises] = useState<Set<string>>(new Set());
  const [showAllQuizAnswers, setShowAllQuizAnswers] = useState(false);

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
            Retour au Hub Formation
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
                    Présentation visuelle pour la formation Twitch
                  </p>
                </div>
              </div>

              <div className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                <p>
                  Cette section contiendra la présentation visuelle pour la formation sur Twitch et ses règles.
                </p>
                <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                  Le contenu sera ajouté prochainement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
