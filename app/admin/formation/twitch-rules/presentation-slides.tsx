"use client";

import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
  module?: number;
}

interface PresentationSlidesProps {
  slides: Slide[];
  currentSlide: number;
  onSlideChange: (slide: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function PresentationSlides({ slides, currentSlide, onSlideChange, isFullscreen, onToggleFullscreen }: PresentationSlidesProps) {
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentSlide > 0) {
      goToSlide(currentSlide - 1, 'left');
    } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1, 'right');
    } else if (e.key === 'Escape' && isFullscreen) {
      onToggleFullscreen();
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoPlay();
    }
  };

  const goToSlide = (newSlide: number, direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection(direction);
    setTimeout(() => {
      onSlideChange(newSlide);
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection('none');
      }, 50);
    }, 300);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(prev => !prev);
  };

  useEffect(() => {
    if (isAutoPlay && isFullscreen) {
      autoPlayIntervalRef.current = setInterval(() => {
        if (currentSlide < slides.length - 1) {
          goToSlide(currentSlide + 1, 'right');
        } else {
          setIsAutoPlay(false);
        }
      }, 5000); // 5 secondes par slide
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    }
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlay, currentSlide, isFullscreen, slides.length]);

  useEffect(() => {
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [currentSlide, isFullscreen, isAnimating]);

  const slide = slides[currentSlide];
  const aspectRatio = 16 / 9;

  return (
    <div 
      className="relative"
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a0c',
        padding: isFullscreen ? '0' : '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      } : {}}
    >
      {/* Contrôles - Masqués en plein écran */}
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToSlide(Math.max(0, currentSlide - 1), 'left')}
              disabled={currentSlide === 0 || isAnimating}
              className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              style={{
                backgroundColor: currentSlide === 0 ? 'var(--color-surface)' : '#9146ff',
                color: 'white',
                boxShadow: currentSlide === 0 ? 'none' : '0 4px 12px rgba(145, 70, 255, 0.4)',
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm px-3 font-semibold" style={{ color: 'var(--color-text)' }}>
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1), 'right')}
              disabled={currentSlide === slides.length - 1 || isAnimating}
              className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              style={{
                backgroundColor: currentSlide === slides.length - 1 ? 'var(--color-surface)' : '#9146ff',
                color: 'white',
                boxShadow: currentSlide === slides.length - 1 ? 'none' : '0 4px 12px rgba(145, 70, 255, 0.4)',
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: '#9146ff',
              color: 'white',
              boxShadow: '0 4px 12px rgba(145, 70, 255, 0.4)',
            }}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Slide avec animation */}
      <div
        className="relative rounded-lg border overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'transparent',
          borderColor: isFullscreen ? 'transparent' : 'var(--color-border)',
          aspectRatio: `${aspectRatio}`,
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : 'auto',
          maxWidth: isFullscreen ? '100vw' : '100%',
          maxHeight: isFullscreen ? '100vh' : 'auto',
          position: 'relative',
        }}
      >
        {/* Fond animé avec gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0e0e10 0%, #1a0a2e 50%, #16213e 100%)',
            backgroundSize: '200% 200%',
            animation: isFullscreen ? 'gradientShift 10s ease infinite' : 'none',
          }}
        />
        
        {/* Contenu de la slide avec animation */}
        <div 
          className={`h-full w-full p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10 ${
            slideDirection === 'left' ? 'slide-in-left' : 
            slideDirection === 'right' ? 'slide-in-right' : 
            'slide-fade-in'
          }`}
        >
          {slide.content}
        </div>

        {/* Indicateur de progression en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-20">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              backgroundSize: '200% 100%',
              animation: 'gradientShift 3s ease infinite',
            }}
          />
        </div>

        {/* Numéro de slide en bas à droite (plein écran) */}
        {isFullscreen && (
          <div 
            className="absolute bottom-4 right-4 px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(145, 70, 255, 0.2)',
              color: '#9146ff',
              border: '1px solid rgba(145, 70, 255, 0.3)',
            }}
          >
            <span className="text-sm font-bold">{currentSlide + 1} / {slides.length}</span>
          </div>
        )}

        {/* Navigation plein écran - Flèches invisibles mais cliquables */}
        {isFullscreen && (
          <>
            <button
              onClick={() => goToSlide(Math.max(0, currentSlide - 1), 'left')}
              disabled={currentSlide === 0 || isAnimating}
              className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer opacity-0 hover:opacity-20 transition-opacity z-30"
              style={{ backgroundColor: 'transparent' }}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-purple-500/30 backdrop-blur-sm">
                <ChevronLeft className="w-8 h-8 text-white" />
              </div>
            </button>
            <button
              onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1), 'right')}
              disabled={currentSlide === slides.length - 1 || isAnimating}
              className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer opacity-0 hover:opacity-20 transition-opacity z-30"
              style={{ backgroundColor: 'transparent' }}
            >
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-purple-500/30 backdrop-blur-sm">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
            </button>
          </>
        )}

        {/* Contrôles plein écran en haut */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <button
              onClick={toggleAutoPlay}
              className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110"
              style={{
                backgroundColor: isAutoPlay ? 'rgba(16, 185, 129, 0.3)' : 'rgba(145, 70, 255, 0.2)',
                color: isAutoPlay ? '#10b981' : '#9146ff',
                border: `1px solid ${isAutoPlay ? 'rgba(16, 185, 129, 0.3)' : 'rgba(145, 70, 255, 0.3)'}`,
              }}
              title="Lecture automatique (Espace)"
            >
              {isAutoPlay ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110"
              style={{
                backgroundColor: 'rgba(145, 70, 255, 0.2)',
                color: '#9146ff',
                border: '1px solid rgba(145, 70, 255, 0.3)',
              }}
              title="Quitter le plein écran (Echap)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Miniatures des slides (navigation) - Masquées en plein écran */}
      {!isFullscreen && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                const direction = idx > currentSlide ? 'right' : 'left';
                goToSlide(idx, direction);
              }}
              className="flex-shrink-0 rounded-lg border-2 transition-all hover:scale-110"
              style={{
                width: '100px',
                height: `${100 / aspectRatio}px`,
                backgroundColor: idx === currentSlide 
                  ? 'linear-gradient(135deg, #9146ff, #7c3aed)' 
                  : 'var(--color-surface)',
                background: idx === currentSlide 
                  ? 'linear-gradient(135deg, #9146ff, #7c3aed)' 
                  : 'var(--color-surface)',
                borderColor: idx === currentSlide ? '#9146ff' : 'var(--color-border)',
                opacity: idx === currentSlide ? 1 : 0.6,
                boxShadow: idx === currentSlide ? '0 4px 12px rgba(145, 70, 255, 0.4)' : 'none',
                transform: idx === currentSlide ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (idx !== currentSlide) {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (idx !== currentSlide) {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div className="h-full flex items-center justify-center">
                <span 
                  className="text-sm font-bold"
                  style={{ color: idx === currentSlide ? 'white' : 'var(--color-text-secondary)' }}
                >
                  {idx + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Styles CSS pour animations */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDelay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(0);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }

        .slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }

        .slide-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out;
        }

        .animate-slide-down {
          animation: slideDown 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeInDelay 1s ease-out;
        }

        .animate-bounce-in {
          animation: bounceIn 1s ease-out;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }

        .animate-list-item {
          animation: fadeInLeft 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export function SlideContent({ children, title, subtitle, icon }: { children: React.ReactNode; title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in">
      {icon && (
        <div 
          className="text-7xl md:text-8xl mb-8 animate-bounce-in"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(145, 70, 255, 0.5))',
            animation: 'bounceIn 1s ease-out',
          }}
        >
          {icon}
        </div>
      )}
      <h2 
        className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up"
        style={{ 
          color: '#9146ff',
          textShadow: '0 0 30px rgba(145, 70, 255, 0.5), 0 0 60px rgba(145, 70, 255, 0.3)',
          background: 'linear-gradient(135deg, #9146ff, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'slideUp 0.8s ease-out 0.2s both',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p 
          className="text-xl md:text-3xl mb-10 animate-slide-up"
          style={{ 
            color: '#a0a0a0',
            animation: 'slideUp 0.8s ease-out 0.4s both',
          }}
        >
          {subtitle}
        </p>
      )}
      <div 
        className="text-lg md:text-xl lg:text-2xl max-w-5xl animate-fade-in-delay"
        style={{ 
          color: '#e0e0e0',
          animation: 'fadeInDelay 1s ease-out 0.6s both',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SlideList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="h-full flex flex-col justify-center">
      {title && (
        <h2 
          className="text-3xl md:text-5xl lg:text-6xl font-bold mb-12 text-center animate-slide-down"
          style={{ 
            color: '#9146ff',
            textShadow: '0 0 20px rgba(145, 70, 255, 0.4)',
            background: 'linear-gradient(135deg, #9146ff, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'slideDown 0.6s ease-out',
          }}
        >
          {title}
        </h2>
      )}
      <ul className="space-y-5 text-left max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <li 
            key={idx} 
            className="flex items-start gap-4 text-lg md:text-2xl lg:text-3xl animate-list-item"
            style={{ 
              color: '#e0e0e0',
              animation: `slideInLeft 0.6s ease-out ${idx * 0.1 + 0.3}s both`,
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(145, 70, 255, 0.05)',
              borderLeft: '4px solid #9146ff',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(145, 70, 255, 0.15)';
              e.currentTarget.style.transform = 'translateX(10px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(145, 70, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(145, 70, 255, 0.05)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span 
              className="text-3xl md:text-4xl flex-shrink-0 animate-pulse"
              style={{ 
                color: '#9146ff',
                filter: 'drop-shadow(0 0 8px rgba(145, 70, 255, 0.6))',
              }}
            >
              •
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SlideComparison({ left, right, leftTitle, rightTitle }: { left: string[]; right: string[]; leftTitle: string; rightTitle: string }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto w-full px-4">
        <div className="animate-slide-in-left">
          <h3 
            className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8 text-center p-4 rounded-lg"
            style={{ 
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
              animation: 'slideInLeft 0.8s ease-out',
            }}
          >
            {leftTitle}
          </h3>
          <ul className="space-y-4">
            {left.map((item, idx) => (
              <li 
                key={idx} 
                className="flex items-start gap-3 text-lg md:text-xl lg:text-2xl p-3 rounded-lg transition-all hover:scale-105"
                style={{ 
                  color: '#e0e0e0',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  borderLeft: '4px solid #ef4444',
                  animation: `fadeInLeft 0.6s ease-out ${idx * 0.1 + 0.3}s both`,
                }}
              >
                <span className="text-2xl md:text-3xl animate-pulse">❌</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-slide-in-right">
          <h3 
            className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8 text-center p-4 rounded-lg"
            style={{ 
              color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
              animation: 'slideInRight 0.8s ease-out',
            }}
          >
            {rightTitle}
          </h3>
          <ul className="space-y-4">
            {right.map((item, idx) => (
              <li 
                key={idx} 
                className="flex items-start gap-3 text-lg md:text-xl lg:text-2xl p-3 rounded-lg transition-all hover:scale-105"
                style={{ 
                  color: '#e0e0e0',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderLeft: '4px solid #10b981',
                  animation: `fadeInRight 0.6s ease-out ${idx * 0.1 + 0.3}s both`,
                }}
              >
                <span className="text-2xl md:text-3xl animate-bounce">✅</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SlideNumber({ number, total }: { number: number; total: number }) {
  return (
    <div className="absolute bottom-4 right-4 text-sm" style={{ color: '#666' }}>
      {number} / {total}
    </div>
  );
}
