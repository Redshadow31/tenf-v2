"use client";

import { useState, useEffect, useCallback } from "react";

// Liste des slides dans l'ordre spécifié
const slides = [
  "Slide1.html",
  "slide2.html",
  "slide3.html",
  "slide4.html",
  "slide5.html",
  "slide6.html",
  "Slide7.html",
  "slide8.html",
  "slide9.html",
  "slide10.html",
  "slide11.html",
  "slide12.html",
  "slide13.html",
  "slide14.html",
];

export default function PresentationAnimePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Vérifier la préférence reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Navigation clavier
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleExitPresentation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentationMode, currentSlide]);

  const handleNextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const handlePreviousSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  const handleExitPresentation = useCallback(() => {
    setIsPresentationMode(false);
  }, []);

  const handleStartPresentation = () => {
    setCurrentSlide(0);
    setIsPresentationMode(true);
  };

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="text-white min-h-screen">
      {!isPresentationMode ? (
        // Mode normal : page avec bouton et prévisualisation
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Présentation animée</h1>
            <p className="text-gray-400">Découvrez la présentation TENF en mode animé</p>
          </div>

          <div className="mb-8">
            <button
              onClick={handleStartPresentation}
              className="px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#9146ff]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎬 Lancer la présentation
            </button>
          </div>

          {/* Prévisualisation du slide 1 */}
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Aperçu - Slide 1</h2>
            </div>
            <div className="relative" style={{ paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
              <iframe
                src={`/slides/tenf/${slides[0]}`}
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Aperçu Slide 1"
                style={{ pointerEvents: "none" }}
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>💡 Astuce : Utilisez les flèches du clavier (← →) pour naviguer, ou ESC pour quitter</p>
          </div>
        </div>
      ) : (
        // Mode présentation plein écran
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/95"></div>

          {/* Conteneur 16:9 plein écran */}
          <div className="relative w-full h-full" style={{ width: "100vw", height: "100vh" }}>
            {/* Indicateur de progression + Bouton fermer en haut à droite */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
              {/* Indicateur de progression */}
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-gray-600">
                <span className="text-sm text-gray-300">
                  {currentSlide + 1} / {slides.length}
                </span>
              </div>
              {/* Bouton fermer */}
              <button
                onClick={handleExitPresentation}
                className="w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110 border border-gray-600"
                aria-label="Quitter la présentation"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Flèche gauche */}
            <button
              onClick={handlePreviousSlide}
              disabled={isFirstSlide}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110 border border-gray-600 ${
                isFirstSlide ? "opacity-30 cursor-not-allowed" : "hover:shadow-lg hover:shadow-[#9146ff]/50"
              }`}
              aria-label="Slide précédent"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ transition: prefersReducedMotion ? "none" : "all 0.2s" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Flèche droite */}
            <button
              onClick={handleNextSlide}
              disabled={isLastSlide}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110 border border-gray-600 ${
                isLastSlide ? "opacity-30 cursor-not-allowed" : "hover:shadow-lg hover:shadow-[#9146ff]/50"
              }`}
              aria-label="Slide suivant"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ transition: prefersReducedMotion ? "none" : "all 0.2s" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Slide actuel - plein écran */}
            <div className="w-full h-full bg-[#1a1a1d] overflow-hidden">
              <iframe
                src={`/slides/tenf/${slides[currentSlide]}`}
                className="w-full h-full border-0"
                title={`Slide ${currentSlide + 1}`}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
