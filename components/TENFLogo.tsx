"use client";

import Link from "next/link";
import Image from "next/image";

interface TENFLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  useImage?: boolean; // Si true, utilise l'image depuis /logo.png au lieu du SVG
}

export default function TENFLogo({ 
  className = "", 
  showTagline = true,
  size = "md",
  useImage = false
}: TENFLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  };

  // Si une image logo existe, l'utiliser
  if (useImage) {
    return (
      <Link href="/" className={`flex items-center gap-3 ${className}`}>
        <div className={`${sizeClasses[size]} relative`}>
          <Image
            src="/logo.png"
            alt="TENF Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        {showTagline && (
          <div className="flex flex-col">
            <span className={`font-bold ${textSizes[size]} text-white`}>TENF</span>
            <span className="text-xs text-gray-400">Plus qu'une communauté</span>
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      {/* Logo SVG avec forme rouge abstraite */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Forme rouge abstraite (brushstroke/pétales) */}
          <defs>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
            </filter>
          </defs>
          
          {/* Forme principale rouge */}
          <path
            d="M30 20 Q50 15, 70 25 Q85 35, 80 50 Q75 65, 60 70 Q45 75, 35 70 Q20 65, 25 50 Q30 35, 30 20 Z"
            fill="url(#redGradient)"
            filter="url(#blur)"
            opacity="0.9"
          />
          
          {/* Zone plus claire (highlight) en haut à droite */}
          <ellipse
            cx="65"
            cy="35"
            rx="15"
            ry="12"
            fill="#f87171"
            opacity="0.6"
            filter="url(#blur)"
          />
          
          {/* Texte TENF en rose clair */}
          <text
            x="50"
            y="45"
            fontSize="24"
            fontWeight="bold"
            fill="#fda4af"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="2"
          >
            TENF
          </text>
          
          {/* Texte "New Family" en script blanc */}
          <text
            x="50"
            y="65"
            fontSize="10"
            fill="#ffffff"
            textAnchor="middle"
            fontFamily="cursive"
            opacity="0.95"
          >
            New Family
          </text>
        </svg>
      </div>
      
      {/* Texte alternatif pour mobile/clarté */}
      <div className="flex flex-col">
        <span className={`font-bold ${textSizes[size]} text-white`}>TENF</span>
        {showTagline && (
          <span className="text-xs text-gray-400">Plus qu'une communauté</span>
        )}
      </div>
    </Link>
  );
}

