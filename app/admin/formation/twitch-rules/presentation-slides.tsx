"use client";

import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";

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
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentSlide > 0) {
      onSlideChange(currentSlide - 1);
    } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
      onSlideChange(currentSlide + 1);
    } else if (e.key === 'Escape' && isFullscreen) {
      onToggleFullscreen();
    }
  };

  useEffect(() => {
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [currentSlide, isFullscreen]);

  const slide = slides[currentSlide];
  const aspectRatio = 16 / 9;

  return (
    <div className="relative">
      {/* Contrôles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: currentSlide === 0 ? 'var(--color-surface)' : 'var(--color-card)',
              color: 'var(--color-text)',
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm px-3" style={{ color: 'var(--color-text-secondary)' }}>
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: currentSlide === slides.length - 1 ? 'var(--color-surface)' : 'var(--color-card)',
              color: 'var(--color-text)',
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-text)',
          }}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Slide */}
      <div
        className="rounded-lg border overflow-hidden shadow-lg"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          aspectRatio: `${aspectRatio}`,
          maxWidth: isFullscreen ? '100vw' : '100%',
          maxHeight: isFullscreen ? '100vh' : 'auto',
        }}
      >
        <div className="h-full w-full p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#0e0e10' }}>
          {slide.content}
        </div>
      </div>

      {/* Miniatures des slides (navigation) */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => onSlideChange(idx)}
            className="flex-shrink-0 rounded border transition-all"
            style={{
              width: '80px',
              height: `${80 / aspectRatio}px`,
              backgroundColor: idx === currentSlide ? 'var(--color-primary)' : 'var(--color-surface)',
              borderColor: idx === currentSlide ? 'var(--color-primary)' : 'var(--color-border)',
              opacity: idx === currentSlide ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (idx !== currentSlide) {
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              if (idx !== currentSlide) {
                e.currentTarget.style.opacity = '0.6';
              }
            }}
          >
            <div className="text-xs p-1 text-center truncate" style={{ color: idx === currentSlide ? 'white' : 'var(--color-text-secondary)' }}>
              {idx + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SlideContent({ children, title, subtitle, icon }: { children: React.ReactNode; title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center">
      {icon && <div className="text-6xl mb-6">{icon}</div>}
      <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#9146ff' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-xl md:text-2xl mb-8" style={{ color: '#a0a0a0' }}>
          {subtitle}
        </p>
      )}
      <div className="text-lg md:text-xl max-w-4xl" style={{ color: '#e0e0e0' }}>
        {children}
      </div>
    </div>
  );
}

export function SlideList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: '#9146ff' }}>
        {title}
      </h2>
      <ul className="space-y-4 text-left max-w-3xl mx-auto">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-lg md:text-xl" style={{ color: '#e0e0e0' }}>
            <span className="text-2xl flex-shrink-0" style={{ color: '#9146ff' }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SlideComparison({ left, right, leftTitle, rightTitle }: { left: string[]; right: string[]; leftTitle: string; rightTitle: string }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center" style={{ color: '#ef4444' }}>
            {leftTitle}
          </h3>
          <ul className="space-y-3">
            {left.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-lg" style={{ color: '#e0e0e0' }}>
                <span className="text-xl">❌</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center" style={{ color: '#10b981' }}>
            {rightTitle}
          </h3>
          <ul className="space-y-3">
            {right.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-lg" style={{ color: '#e0e0e0' }}>
                <span className="text-xl">✅</span>
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
