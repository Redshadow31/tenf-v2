"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function PresentationPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PDF URL - À adapter selon vos besoins (peut être stocké dans une config ou une API)
  const pdfUrl = "/Presentation.pdf"; // Fichier dans /public

  // Gestion du mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Entrer en plein écran
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Sortir du plein écran
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Erreur lors du changement de mode plein écran:", error);
    }
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Présentation</h1>
            <p className="text-gray-400">Visualisation de la présentation d'intégration</p>
            <Link
              href="/admin/evaluations/presentation-anime"
              className="mt-2 inline-flex items-center gap-2 text-sm text-[#9146ff] hover:text-[#7c3aed] transition-colors"
            >
              🎬 Découvrir la présentation animée
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h4m-4 0V4m0 4l5-5M20 8h-4m4 0V4m0 4l-5-5M4 16h4m-4 0v4m0-4l5 5M20 16h-4m4 0v4m0-4l-5 5"
                  />
                </svg>
                <span>Sortir du plein écran</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                <span>Plein écran</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden"
        style={{ height: isFullscreen ? "100vh" : "calc(100vh - 250px)", minHeight: "600px" }}
      >
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          className="w-full h-full"
          style={{ border: "none" }}
          title="Présentation PDF"
        />
      </div>

      {!isFullscreen && (
        <div className="mt-4 text-sm text-gray-400">
          <p>💡 Astuce : Utilisez le bouton "Plein écran" pour une meilleure expérience de lecture</p>
        </div>
      )}
    </div>
  );
}
