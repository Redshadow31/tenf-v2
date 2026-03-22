"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

const SPLASH_DURATION_MS = 2600; // Affichage un peu plus long
const FADE_OUT_MS = 500;

export default function PwaSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isPwaStandalone()) return;

    setVisible(true);

    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, SPLASH_DURATION_MS);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pwa-splash-overlay"
      data-fade-out={fadeOut}
      aria-hidden="true"
    >
      <div className="pwa-splash-content">
        {/* Trainée lumineuse - balayage de lumière */}
        <div className="pwa-splash-trail" />
        {/* Glow derrière le logo */}
        <div className="pwa-splash-glow" />
        {/* Logo principal */}
        <div className="pwa-splash-logo-wrapper">
          <Image
            src="/Tenf.png"
            alt="TENF"
            width={160}
            height={160}
            priority
            className="pwa-splash-logo"
          />
        </div>
      </div>
    </div>
  );
}
