"use client";

import { useEffect, useRef } from "react";

export function PresentationHTML() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Charger la police Google Fonts Inter
    const linkId = "presentation-regles-fonts";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "preconnect";
      link.href = "https://fonts.googleapis.com";
      document.head.appendChild(link);

      const link2 = document.createElement("link");
      link2.rel = "preconnect";
      link2.href = "https://fonts.gstatic.com";
      link2.crossOrigin = "anonymous";
      document.head.appendChild(link2);

      const link3 = document.createElement("link");
      link3.rel = "stylesheet";
      link3.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap";
      document.head.appendChild(link3);
    }

    // Injecter les styles CSS
    const styleId = "presentation-regles-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        :root {
          --bg: #0b0c10;
          --bg2: #0f1118;
          --panel: #121522;
          --panel2: #0f1320;
          --text: #e9ecf1;
          --muted: #a8afbf;
          --border: rgba(255, 255, 255, 0.10);
          --tenf: #e04753;
          --tenf2: #ff6b75;
          --accent: #9146ff;
          --shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
          --radius: 18px;
        }

        .presentation-container {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          background: radial-gradient(1200px 600px at 20% 10%, rgba(224, 71, 83, 0.14), transparent 60%),
                      radial-gradient(900px 500px at 80% 20%, rgba(145, 70, 255, 0.12), transparent 55%),
                      linear-gradient(180deg, var(--bg), var(--bg2));
          color: var(--text);
        }

        .presentation-container:fullscreen {
          background: var(--bg);
          padding: 0;
        }

        .presentation-container:fullscreen .app {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .presentation-container:fullscreen .stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .presentation-container:fullscreen .deck {
          width: 100vw;
          height: 100vh;
          max-width: 100vw;
          max-height: 100vh;
          aspect-ratio: 16/9;
        }

        .presentation-container kbd {
          padding: 0.15rem 0.45rem;
          border: 1px solid var(--border);
          border-bottom-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          font-size: 0.9rem;
        }

        .presentation-container .app {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .presentation-container .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          gap: 12px;
        }

        .presentation-container .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .presentation-container .brand__logo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }

        .presentation-container .brand__title {
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .presentation-container .brand__subtitle {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .presentation-container .topbar__actions {
          display: flex;
          gap: 10px;
        }

        .presentation-container .progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
        }

        .presentation-container .progress__bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, var(--tenf), var(--accent));
          transition: width 0.35s ease;
        }

        .presentation-container .stage {
          padding: 12px 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }

        .presentation-container .deck {
          width: min(1200px, 96vw);
          aspect-ratio: 16/9;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }

        .presentation-container .slide {
          position: absolute;
          inset: 0;
          padding: 36px 38px;
          opacity: 0;
          transform: translateX(24px) scale(0.985);
          transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.2, 0.9, 0.2, 1);
          pointer-events: none;
        }

        .presentation-container .slide.is-active {
          opacity: 1;
          transform: translateX(0) scale(1);
          pointer-events: auto;
        }

        .presentation-container .slide__content {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .presentation-container .slide__bg {
          position: absolute;
          inset: -20%;
          filter: blur(24px);
          opacity: 0.6;
          pointer-events: none;
        }

        .presentation-container .glow {
          background: radial-gradient(400px 220px at 35% 25%, rgba(224, 71, 83, 0.35), transparent 70%),
                      radial-gradient(380px 240px at 70% 30%, rgba(145, 70, 255, 0.25), transparent 72%);
        }

        .presentation-container .h1 {
          font-size: 3rem;
          margin: 0.2rem 0 0.4rem;
          letter-spacing: 0.01em;
        }

        .presentation-container .h2 {
          font-size: 2.1rem;
          margin: 0.2rem 0;
          letter-spacing: 0.01em;
        }

        .presentation-container .lead {
          color: var(--muted);
          font-size: 1.08rem;
          line-height: 1.55;
          max-width: 70ch;
        }

        .presentation-container .btn {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.06);
          color: var(--text);
          padding: 10px 14px;
          border-radius: 14px;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
          font-weight: 600;
        }

        .presentation-container .btn:hover {
          background: rgba(255, 255, 255, 0.10);
          transform: translateY(-1px);
        }

        .presentation-container .btn--primary {
          background: linear-gradient(90deg, rgba(224, 71, 83, 0.95), rgba(255, 107, 117, 0.92));
          border-color: rgba(224, 71, 83, 0.35);
        }

        .presentation-container .btn--primary:hover {
          background: linear-gradient(90deg, rgba(224, 71, 83, 1), rgba(255, 107, 117, 1));
        }

        .presentation-container .btn--ghost {
          background: transparent;
        }

        .presentation-container .nav {
          width: min(1200px, 96vw);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .presentation-container .nav__meta {
          color: var(--muted);
          font-weight: 600;
        }

        .presentation-container .hero {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 18px;
          height: 100%;
        }

        .presentation-container .kicker {
          color: rgba(233, 236, 241, 0.8);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.9rem;
        }

        .presentation-container .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .presentation-container .chip {
          font-size: 0.85rem;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
        }

        .presentation-container .chip--red {
          color: rgba(255, 255, 255, 0.9);
          border-color: rgba(224, 71, 83, 0.35);
          background: rgba(224, 71, 83, 0.12);
        }

        .presentation-container .note {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          padding: 12px;
          border-radius: 16px;
        }

        .presentation-container .note--red {
          border-color: rgba(224, 71, 83, 0.28);
          background: rgba(224, 71, 83, 0.08);
        }

        .presentation-container .note__icon {
          width: 26px;
          height: 26px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border);
          font-weight: 800;
        }

        .presentation-container .note__text {
          color: var(--muted);
          line-height: 1.45;
        }

        .presentation-container .card {
          border: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        }

        .presentation-container .card--logo img {
          width: 100%;
          border-radius: 16px;
          display: block;
        }

        .presentation-container .card__caption {
          margin-top: 10px;
          color: var(--muted);
          font-size: 0.95rem;
        }

        .presentation-container .mini {
          margin-top: 12px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          padding: 14px;
          border-radius: var(--radius);
        }

        .presentation-container .mini__title {
          font-weight: 700;
          margin-bottom: 8px;
        }

        .presentation-container .mini__list {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 1.55;
        }

        .presentation-container .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .presentation-container .panel {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          background: rgba(18, 21, 34, 0.65);
        }

        .presentation-container .panel--soft {
          background: rgba(15, 19, 32, 0.60);
        }

        .presentation-container .panel__title {
          font-weight: 800;
          margin-bottom: 10px;
        }

        .presentation-container .reveal {
          margin-top: 10px;
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid rgba(224, 71, 83, 0.25);
          background: rgba(224, 71, 83, 0.08);
          color: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          font-weight: 700;
        }

        .presentation-container .reveal__box {
          margin-top: 10px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          color: var(--muted);
          line-height: 1.55;
          animation: pop 0.28s ease;
        }

        @keyframes pop {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .presentation-container .cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 8px;
        }

        .presentation-container .flipcard {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          text-align: left;
        }

        .presentation-container .flipcard__front,
        .presentation-container .flipcard__back {
          padding: 14px;
        }

        .presentation-container .flipcard__front {
          font-weight: 800;
        }

        .presentation-container .flipcard__back {
          color: var(--muted);
          border-top: 1px solid var(--border);
          display: none;
        }

        .presentation-container .flipcard.is-open .flipcard__back {
          display: block;
          animation: pop 0.25s ease;
        }

        .presentation-container .hint {
          margin-top: 10px;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .presentation-container .value-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 14px;
          align-items: start;
        }

        .presentation-container .value {
          border: 1px solid rgba(224, 71, 83, 0.22);
          background: rgba(224, 71, 83, 0.08);
          border-radius: 18px;
          padding: 14px;
          cursor: pointer;
          text-align: left;
        }

        .presentation-container .value__title {
          font-weight: 900;
          display: block;
        }

        .presentation-container .value__meta {
          display: block;
          color: rgba(233, 236, 241, 0.75);
          font-size: 0.92rem;
          margin-top: 3px;
        }

        .presentation-container .value__detail {
          grid-column: 1 / -1;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 18px;
          padding: 14px;
          color: var(--muted);
          line-height: 1.55;
          animation: pop 0.25s ease;
        }

        .presentation-container .callout {
          margin-top: auto;
          border: 1px solid rgba(145, 70, 255, 0.22);
          background: rgba(145, 70, 255, 0.08);
          border-radius: 18px;
          padding: 14px;
        }

        .presentation-container .callout__title {
          font-weight: 900;
          margin-bottom: 6px;
        }

        .presentation-container .accordion,
        .presentation-container .stack {
          display: grid;
          gap: 10px;
          max-width: 80ch;
        }

        .presentation-container .acc__head {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 12px 14px;
          cursor: pointer;
          text-align: left;
          color: rgba(233, 236, 241, 0.95);
          font-weight: 800;
        }

        .presentation-container .acc__panel {
          margin-top: -6px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 12px 14px;
          color: var(--muted);
          line-height: 1.55;
          animation: pop 0.25s ease;
        }

        .presentation-container .quizline {
          margin-top: 16px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 18px;
          padding: 14px;
          max-width: 80ch;
        }

        .presentation-container .quizline__q {
          font-weight: 900;
          margin-bottom: 10px;
        }

        .presentation-container .quizline__choices {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .presentation-container .choice {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 800;
        }

        .presentation-container .choice.is-right {
          border-color: rgba(56, 191, 105, 0.40);
          background: rgba(56, 191, 105, 0.10);
        }

        .presentation-container .choice.is-wrong {
          border-color: rgba(224, 71, 83, 0.35);
          background: rgba(224, 71, 83, 0.10);
        }

        .presentation-container .quizline__result {
          margin-top: 10px;
          color: var(--muted);
          animation: pop 0.25s ease;
        }

        .presentation-container .compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .presentation-container .compare__col {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius);
          padding: 16px;
        }

        .presentation-container .compare__title {
          font-weight: 900;
          margin-bottom: 10px;
        }

        .presentation-container .compare__title.ok {
          color: rgba(56, 191, 105, 0.95);
        }

        .presentation-container .compare__title.no {
          color: rgba(224, 71, 83, 0.95);
        }

        .presentation-container .tile {
          width: 100%;
          text-align: left;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 12px 14px;
          cursor: pointer;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .presentation-container .tile--danger {
          border-color: rgba(224, 71, 83, 0.22);
          background: rgba(224, 71, 83, 0.07);
        }

        .presentation-container .tile__detail {
          margin-top: -6px;
          margin-bottom: 10px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 12px 14px;
          color: var(--muted);
          animation: pop 0.25s ease;
        }

        .presentation-container .final {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 10px;
        }

        .presentation-container .final__card {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius);
          padding: 18px;
        }

        .presentation-container .final__card--soft {
          background: rgba(18, 21, 34, 0.55);
        }

        .presentation-container .final__title {
          font-weight: 900;
          margin-bottom: 10px;
        }

        .presentation-container .final__card ul {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 1.55;
        }

        .presentation-container .overlay {
          border: none;
          border-radius: 18px;
          padding: 0;
          width: min(760px, 92vw);
          background: rgba(15, 17, 24, 0.98);
          color: var(--text);
          box-shadow: var(--shadow);
        }

        .presentation-container .overlay::backdrop {
          background: rgba(0, 0, 0, 0.55);
        }

        .presentation-container .overlay__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
        }

        .presentation-container .overlay__title {
          font-weight: 900;
        }

        .presentation-container .overlay__body {
          padding: 14px 16px;
          display: grid;
          gap: 10px;
        }

        .presentation-container .overview-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 12px 14px;
          cursor: pointer;
        }

        .presentation-container .overview-item span {
          color: var(--muted);
          font-weight: 600;
        }

        @media (max-width: 920px) {
          .presentation-container .deck {
            width: 96vw;
          }
          .presentation-container .hero {
            grid-template-columns: 1fr;
          }
          .presentation-container .grid-2,
          .presentation-container .compare,
          .presentation-container .final,
          .presentation-container .value-grid {
            grid-template-columns: 1fr;
          }
          .presentation-container .slide {
            padding: 22px 20px;
          }
          .presentation-container .h1 {
            font-size: 2.3rem;
          }
          .presentation-container .h2 {
            font-size: 1.7rem;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Générer le HTML des slides de manière structurée
    const generateSlidesHTML = () => {
      const slides = [];
      
      // Slide 1 - Accueil
      slides.push(`
            <article class="slide is-active" data-title="Accueil">
              <div class="slide__bg glow"></div>
              <div class="slide__content">
                <div class="hero">
                  <div class="hero__left">
                    <div class="kicker">Bienvenue sur</div>
                    <h1 class="h1">TENF Academy</h1>
                    <p class="lead">
                      <strong>Comprendre Twitch et ses règles</strong><br />
                      Formation sérieuse et bienveillante pour protéger vos chaînes et vos communautés.
                    </p>
                    <div class="chips">
                      <span class="chip">Durée : 1h30-2h</span>
                      <span class="chip chip--red">Formation communautaire</span>
                      <span class="chip">Interactif</span>
                    </div>
                    <div class="note">
                      <div class="note__icon">i</div>
                      <div class="note__text">
                        Les exercices et quiz ont des slides séparées : énoncé puis réponse.
                      </div>
                    </div>
                  </div>
                  <div class="hero__right">
                    <div class="card card--logo">
                      <img src="/logo.png" alt="Logo TENF" />
                      <div class="card__caption">Twitch Entraide New Family (TENF)</div>
                    </div>
                    <div class="mini">
                      <div class="mini__title">Navigation</div>
                      <ul class="mini__list">
                        <li><kbd>→</kbd> suivant</li>
                        <li><kbd>←</kbd> précédent</li>
                        <li><kbd>Esc</kbd> fermer / revenir</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Slide 2 - Disclaimer
      slides.push(`
            <article class="slide" data-title="Avertissement">
              <div class="slide__content">
                <h2 class="h2">⚠️ Avertissement Important</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <p class="lead">
                    Cette formation est une initiative <strong>indépendante et communautaire</strong> créée par et pour la communauté <strong>TENF</strong>.
                  </p>
                  <p style="margin-top: 1rem;">
                    Elle <strong>ne représente pas Twitch</strong> et n'est pas affiliée officiellement à la plateforme.
                  </p>
                  <div class="callout" style="margin-top: 1.5rem;">
                    <div class="callout__title">Objectif</div>
                    <p>Éducation, prévention et entraide pour des streams plus sûrs et responsables.</p>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Slide 3 - Sommaire
      slides.push(`
            <article class="slide" data-title="Plan de la formation">
              <div class="slide__content">
                <h2 class="h2">📋 Plan de la formation</h2>
                <div class="value-grid" style="grid-template-columns: 1fr; gap: 8px; max-width: 70ch; margin: 0 auto;">
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🟣 Module 1 – Introduction (8-10 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🔵 Module 2 – Guidelines Twitch (15-20 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🟢 Module 3 – ToS & DMCA (8-10 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🟡 Module 4 – Erreurs fréquentes (10-12 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🔴 Module 5 – Sanctions (8-10 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🟠 Module 6 – Zones grises (5-8 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">🧠 Module 7 – Responsabilité (5-8 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">📌 Module 8 – Cas pratiques (15-20 min)</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">✅ Module 9 – Synthèse & Quiz (10-15 min)</span>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 1 - Slide 4
      slides.push(`
            <article class="slide" data-title="Module 1 - Introduction">
              <div class="slide__content">
                <h2 class="h2">🟣 Module 1 – Introduction</h2>
                <p class="lead">Guide de survie pour streamers</p>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title">Objectif de la formation</div>
                    <p>
                      On va parler <strong>concret</strong>, parler <strong>sanctions</strong>, <strong>exemples</strong>, cas réels et bonnes pratiques.
                    </p>
                    <p style="margin-top: 1rem;">
                      L'objectif : vous aider à <strong>protéger vos chaînes</strong>, vos communautés, et vous-même.
                    </p>
                  </div>
                  <div class="panel panel--soft">
                    <div class="panel__title">Ce que vous allez apprendre</div>
                    <ul style="list-style: disc; padding-left: 1.5rem; line-height: 1.8;">
                      <li>Comment Twitch raisonne</li>
                      <li>Les règles essentielles</li>
                      <li>Les bonnes pratiques</li>
                      <li>Comment éviter les sanctions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 1 - Slide 5
      slides.push(`
            <article class="slide" data-title="Twitch est une plateforme privée">
              <div class="slide__content">
                <h2 class="h2">Point clé : Twitch est une plateforme privée</h2>
                <div class="compare">
                  <div class="compare__col">
                    <div class="compare__title no">❌ Mythe</div>
                    <ul style="list-style: disc; padding-left: 1.5rem; line-height: 1.8;">
                      <li>Liberté d'expression totale</li>
                      <li>"J'ai le droit de dire ce que je veux"</li>
                      <li>Espace public</li>
                    </ul>
                  </div>
                  <div class="compare__col">
                    <div class="compare__title ok">✅ Réalité</div>
                    <ul style="list-style: disc; padding-left: 1.5rem; line-height: 1.8;">
                      <li>Conditions d'utilisation (ToS)</li>
                      <li>Twitch peut refuser le service</li>
                      <li>Plateforme privée = règles à respecter</li>
                    </ul>
                  </div>
                </div>
                <div class="callout" style="margin-top: 1.5rem;">
                  <div class="callout__title">Rappel important</div>
                  <p>Créer un compte = accepter des règles (ToS) et leur application.</p>
                </div>
              </div>
            </article>
      `);

      // Module 1 - Slide 6
      slides.push(`
            <article class="slide" data-title="Impact vs Intention">
              <div class="slide__content">
                <h2 class="h2">Impact &gt; Intention</h2>
                <div style="text-align: center; margin: 2rem 0;">
                  <div style="font-size: 4rem; font-weight: 900; color: #ef4444; margin-bottom: 1rem;">Impact</div>
                  <div style="font-size: 2rem; margin: 1rem 0;">vs</div>
                  <div style="font-size: 4rem; font-weight: 900; color: #10b981; margin-top: 1rem;">Intention</div>
                </div>
                <p class="lead" style="max-width: 70ch; margin: 2rem auto;">
                  Twitch juge d'abord <strong>l'impact</strong>, pas l'intention.<br />
                  Une "blague" qui blesse peut être sanctionnée même si le streamer dit "je rigolais".
                </p>
              </div>
            </article>
      `);

      // Exercice 1 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 1 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 1 – Intention vs Impact</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Consigne</div>
                  <p style="margin-bottom: 1.5rem;">
                    Lisez la situation suivante et réfléchissez :
                  </p>
                  <div style="background: rgba(224, 71, 83, 0.1); padding: 1.5rem; border-radius: 16px; border-left: 4px solid #e04753; margin: 1.5rem 0;">
                    <p style="font-style: italic; line-height: 1.8;">
                      Un streamer imite l'accent d'un pays pendant 30 secondes en rigolant. Le chat spam rigole, mais une personne de ce pays se sent mal à l'aise.
                    </p>
                  </div>
                  <div class="quizline" style="margin-top: 2rem;">
                    <div class="quizline__q">Question : Pour Twitch, qu'est-ce qui pèse le plus ?</div>
                    <div class="quizline__choices" data-quiz="ex1">
                      <button class="choice" data-choice="A">A) L'intention</button>
                      <button class="choice" data-choice="B">B) L'impact</button>
                    </div>
                    <div class="quizline__result" hidden>
                      Réponse : <strong>B — l'impact</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 1 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 1 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 1 – Correction</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponse</div>
                  <p style="line-height: 1.8; margin-top: 1rem;">
                    Pour Twitch, c'est <strong>l'impact</strong> qui compte : si le comportement est perçu comme moqueur ou discriminant envers une identité, ça se rapproche du contenu haineux, même si le streamer "ne voulait pas blesser".
                  </p>
                  <p style="margin-top: 1rem; font-weight: 700; color: #ef4444;">
                    L'intention ne protège pas d'une sanction.
                  </p>
                </div>
              </div>
            </article>
      `);

      // Module 1 - Slide 7
      slides.push(`
            <article class="slide" data-title="Mythes vs Réalités">
              <div class="slide__content">
                <h2 class="h2">Mythes vs Réalités</h2>
                <div class="accordion" data-accordion style="max-width: 80ch; margin: 0 auto;">
                  <button class="acc__head">"Tant que personne ne reporte, c'est bon."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : Twitch a des outils automatiques qui peuvent détecter les violations.
                  </div>
                  <button class="acc__head">"Ce qui se passe sur Discord reste sur Discord."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : Certains comportements graves hors Twitch peuvent mener à des sanctions.
                  </div>
                  <button class="acc__head">"Je suis trop petit pour être surveillé."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : Les règles s'appliquent dès 0 viewer.
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 2 - Slide 8
      slides.push(`
            <article class="slide" data-title="Module 2 - Guidelines">
              <div class="slide__content">
                <h2 class="h2">🔵 Module 2 – Guidelines Twitch</h2>
                <p class="lead">Les règles principales de la plateforme</p>
                <div class="value-grid">
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Harcèlement & discours haineux</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Contenu sexuel & suggestif</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Violence & automutilation</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Protection des mineurs</span>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 2 - Slide 9
      slides.push(`
            <article class="slide" data-title="Harcèlement & Discours haineux">
              <div class="slide__content">
                <h2 class="h2">Harcèlement & Discours haineux</h2>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title" style="color: #10b981;">✅ Critique / Désaccord</div>
                    <p>Exemple : "Ton gameplay est nul"</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted);">
                      Généralement toléré si ponctuel et non ciblé.
                    </p>
                  </div>
                  <div class="panel" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
                    <div class="panel__title" style="color: #f59e0b;">⚠️ Harcèlement</div>
                    <p>Insultes répétées, acharnement</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted);">
                      Zone grise selon le contexte.
                    </p>
                  </div>
                  <div class="panel" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                    <div class="panel__title" style="color: #ef4444;">❌ Discours haineux</div>
                    <p>Attaque sur l'identité (race, genre, handicap, orientation, etc.)</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted);">
                      Interdit et très grave.
                    </p>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 2 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 2 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 2 – Classer les situations</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Consigne</div>
                  <p style="margin-bottom: 1.5rem;">
                    Pour chaque situation, décidez si c'est :
                  </p>
                  <ul style="list-style: none; padding: 0; margin: 1rem 0;">
                    <li style="margin: 0.5rem 0;">✅ Plutôt OK</li>
                    <li style="margin: 0.5rem 0;">⚠️ À risque</li>
                    <li style="margin: 0.5rem 0;">❌ Interdit</li>
                  </ul>
                  <ol style="padding-left: 1.5rem; line-height: 2; margin-top: 1.5rem;">
                    <li>"Franchement t'es un noob, mais j'aime bien ton énergie."</li>
                    <li>Spammer "kill yourself" à un streamer tilt.</li>
                    <li>Un viewer insulte le gameplay, le streamer rigole et répond.</li>
                    <li>Un viewer se moque du handicap physique d'un autre.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Exercice 2 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 2 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 2 – Correction</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponses</div>
                  <ol style="padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li><strong>⚠️ Zone grise</strong> : tout dépend du ton, du contexte, de la répétition.</li>
                    <li><strong>❌ Interdit</strong> : incitation à l'automutilation, très grave.</li>
                    <li><strong>✅ En général OK</strong> si ça reste ponctuel et non ciblé.</li>
                    <li><strong>❌ Interdit</strong> : moquer un handicap = harcèlement grave / discours haineux.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Module 2 - Slide 10
      slides.push(`
            <article class="slide" data-title="Contenu sexuel & suggestif">
              <div class="slide__content">
                <h2 class="h2">Contenu sexuel & suggestif</h2>
                <p class="lead">Règle simple : si vous vous demandez "est-ce que ce n'est pas trop ?", c'est probablement <strong>trop</strong>.</p>
                <div class="compare">
                  <div class="compare__col">
                    <div class="compare__title no">❌ Interdit</div>
                    <ul style="list-style: disc; padding-left: 1.5rem; line-height: 1.8;">
                      <li>Nudité</li>
                      <li>Lingerie hors contexte</li>
                      <li>Focus sur zones érogènes</li>
                    </ul>
                  </div>
                  <div class="compare__col">
                    <div class="compare__title ok">✅ Autorisé</div>
                    <ul style="list-style: disc; padding-left: 1.5rem; line-height: 1.8;">
                      <li>Maillots de bain (plage/piscine)</li>
                      <li>Contexte cohérent</li>
                      <li>Tag adapté</li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 3 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 3 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 3 – Contexte & tenue</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Consigne</div>
                  <p style="margin-bottom: 1.5rem;">
                    Classer en 🔵 OK, 🟡 limite, 🔴 non :
                  </p>
                  <ol style="padding-left: 1.5rem; line-height: 2;">
                    <li>Stream en maillot de bain dans son salon, en Just Chatting.</li>
                    <li>Stream en maillot à la plage, stream IRL, angle normal.</li>
                    <li>Stream avec gros zoom constant sur la poitrine ou les fesses.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Exercice 3 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 3 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 3 – Correction</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponses</div>
                  <ol style="padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li><strong>🔴 Risqué</strong> / souvent considéré non conforme (contexte inadapté).</li>
                    <li><strong>🔵 OK</strong> si attitude normale, contexte cohérent, bon tag.</li>
                    <li><strong>🔴 Interdit</strong> : focus constant sur zones érogènes.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Module 2 - Slide 11
      slides.push(`
            <article class="slide" data-title="Violence & Protection mineurs">
              <div class="slide__content">
                <h2 class="h2">Violence, automutilation & mineurs</h2>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title">Jeux violents</div>
                    <p>Autorisés, mais pas de violence réelle ni de menaces crédibles.</p>
                  </div>
                  <div class="panel">
                    <div class="panel__title">Automutilation</div>
                    <p>Interdiction de promouvoir ou d'encourager.</p>
                  </div>
                  <div class="panel" style="grid-column: 1 / -1;">
                    <div class="panel__title" style="color: #ef4444;">⚠️ Mineurs : Protection maximale</div>
                    <p>Aucune sexualisation, même en dessin.</p>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 3 - Slide 12
      slides.push(`
            <article class="slide" data-title="Module 3 - ToS & DMCA">
              <div class="slide__content">
                <h2 class="h2">🟢 Module 3 – ToS & DMCA</h2>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title">Droits & devoirs du streamer</div>
                    <p>
                      En streamant, vous donnez à Twitch le droit de diffuser votre contenu, et vous acceptez de respecter les règles de la plateforme et la loi de votre pays.
                    </p>
                  </div>
                  <div class="panel panel--soft">
                    <div class="panel__title">Responsabilité</div>
                    <p>Vous êtes responsable de votre contenu et de votre chat.</p>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 3 - Slide 13
      slides.push(`
            <article class="slide" data-title="DMCA & Musique">
              <div class="slide__content">
                <h2 class="h2">DMCA & Musique</h2>
                <p class="lead">Vous pouvez utiliser :</p>
                <div class="value-grid" style="grid-template-columns: 1fr;">
                  <div class="value" style="cursor: default; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                    <span class="value__title">✅ Musique dont vous possédez les droits</span>
                  </div>
                  <div class="value" style="cursor: default; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                    <span class="value__title">✅ Musique libre de droits / DMCA-free</span>
                  </div>
                </div>
                <div class="note note--red" style="margin-top: 2rem;">
                  <div class="note__icon">!</div>
                  <div class="note__text">
                    <strong>Important</strong> : Supprimer la VOD ne protège pas : le live lui-même peut être scanné.
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 4 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 4 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 4 – Musique & risques</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Consigne</div>
                  <p style="margin-bottom: 1.5rem;">
                    Pour chaque scénario, dites si c'est OK ou à éviter :
                  </p>
                  <ol style="padding-left: 1.5rem; line-height: 2;">
                    <li>Playlist Spotify avec les derniers hits du moment.</li>
                    <li>Playlist DMCA-free d'un label pour streamers.</li>
                    <li>Rediffusion d'un film Netflix en stream, sans outil officiel.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Exercice 4 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 4 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 4 – Correction</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponses</div>
                  <ol style="padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li><strong>À éviter / ❌</strong> : musique commerciale = risque DMCA élevé.</li>
                    <li><strong>✅ OK</strong> en principe, à condition de respecter les termes du label.</li>
                    <li><strong>❌ Interdit</strong> : violation des droits d'auteur (film/série protégé).</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Module 4 - Slide 14
      slides.push(`
            <article class="slide" data-title="Module 4 - Erreurs fréquentes">
              <div class="slide__content">
                <h2 class="h2">🟡 Module 4 – Erreurs fréquentes</h2>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title">Blagues limites & humour noir</div>
                    <p>
                      Un seul clip de 30 secondes, sorti de son contexte, peut détruire une réputation ou mener à une sanction.
                    </p>
                    <p style="margin-top: 1rem; color: #ef4444; font-weight: 700;">
                      "C'était de l'humour noir" ne suffit pas comme défense.
                    </p>
                  </div>
                  <div class="panel panel--soft">
                    <div class="panel__title">Dramas publics</div>
                    <p>
                      Commenter les sanctions d'autres streamers, faire des clashs publics, cultiver les dramas pour le contenu : c'est très risqué (diffamation, harcèlement…).
                    </p>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 5 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 5 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 5 – Gérer un drama</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Situation</div>
                  <div style="background: rgba(224, 71, 83, 0.1); padding: 1.5rem; border-radius: 16px; border-left: 4px solid #e04753; margin: 1.5rem 0;">
                    <p style="font-style: italic; line-height: 1.8;">
                      Un streamer que vous connaissez se fait bannir. Votre chat vous spamme : "Tu trouves ça normal ? T'en penses quoi ?"
                    </p>
                  </div>
                  <p style="margin-top: 1.5rem; font-weight: 700;">
                    Comment répondre sans vous mettre en danger ?
                  </p>
                </div>
              </div>
            </article>
      `);

      // Exercice 5 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 5 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 5 – Proposition de réponse</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponse recommandée</div>
                  <div style="background: rgba(255, 255, 255, 0.05); padding: 1.5rem; border-radius: 12px; margin-top: 1rem; font-style: italic; line-height: 1.8;">
                    "Je ne connais pas tous les détails, ce n'est pas à moi de juger les décisions de Twitch. Ce que je peux faire par contre, c'est me concentrer sur notre contenu ici et continuer à respecter les règles."
                  </div>
                  <p style="margin-top: 1rem;">
                    → Vous restez neutre, vous évitez la diffamation et vous ne vous exposez pas.
                  </p>
                </div>
              </div>
            </article>
      `);

      // Module 5 - Slide 15
      slides.push(`
            <article class="slide" data-title="Module 5 - Sanctions">
              <div class="slide__content">
                <h2 class="h2">🔴 Module 5 – Sanctions</h2>
                <div class="grid-2" style="grid-template-columns: repeat(3, 1fr);">
                  <div class="panel" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
                    <div class="panel__title" style="color: #f59e0b; text-align: center; font-size: 3rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div class="panel__title" style="text-align: center;">Avertissement</div>
                    <p style="text-align: center; font-size: 0.9rem; margin-top: 0.5rem;">Rare, mais possible</p>
                  </div>
                  <div class="panel" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                    <div class="panel__title" style="color: #ef4444; text-align: center; font-size: 3rem; margin-bottom: 0.5rem;">⏸️</div>
                    <div class="panel__title" style="text-align: center;">Suspension</div>
                    <p style="text-align: center; font-size: 0.9rem; margin-top: 0.5rem;">24h, 3j, 7j, 30j…</p>
                  </div>
                  <div class="panel" style="background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.3);">
                    <div class="panel__title" style="color: #dc2626; text-align: center; font-size: 3rem; margin-bottom: 0.5rem;">🚫</div>
                    <div class="panel__title" style="text-align: center;">Ban</div>
                    <p style="text-align: center; font-size: 0.9rem; margin-top: 0.5rem;">Indéfini / Définitif</p>
                  </div>
                </div>
                <div class="callout" style="margin-top: 2rem;">
                  <div class="callout__title">⚠️ Important</div>
                  <p>Les sanctions s'accumulent : plusieurs "petites" infractions peuvent mener à un ban définitif.</p>
                </div>
              </div>
            </article>
      `);

      // Exercice 6 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 6 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Mini-quiz – Sanctions</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <ol style="padding-left: 1.5rem; line-height: 2.5;">
                    <li style="margin-bottom: 1.5rem;">
                      Twitch est-il obligé de te donner un avertissement avant un ban lourd ?
                    </li>
                    <li>
                      Être un "petit" streamer te protège-t-il des sanctions ?
                    </li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Exercice 6 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 6 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Mini-quiz – Correction</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Réponses</div>
                  <ol style="padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li><strong>Non</strong>, Twitch peut sanctionner directement si la violation est grave.</li>
                    <li><strong>Non</strong>, les règles s'appliquent à tout le monde, quelle que soit la taille de la chaîne.</li>
                  </ol>
                </div>
              </div>
            </article>
      `);

      // Module 6 - Slide 16
      slides.push(`
            <article class="slide" data-title="Module 6 - Zones grises">
              <div class="slide__content">
                <h2 class="h2">🟠 Module 6 – Zones grises & idées reçues</h2>
                <div class="accordion" data-accordion style="max-width: 80ch; margin: 0 auto;">
                  <button class="acc__head">"Les gros streamers ont tous les droits."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : les règles sont les mêmes (même si l'application peut sembler différente).
                  </div>
                  <button class="acc__head">"C'est ma communauté, je fais ce que je veux."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : votre communauté reste sur la plateforme de Twitch, donc sous leurs règles.
                  </div>
                  <button class="acc__head">"C'est la liberté d'expression."</button>
                  <div class="acc__panel" hidden>
                    <strong>Faux</strong> : la liberté d'expression ne garantit pas une plateforme pour la diffuser.
                  </div>
                </div>
              </div>
            </article>
      `);

      // Module 7 - Slide 17
      slides.push(`
            <article class="slide" data-title="Module 7 - Responsabilité">
              <div class="slide__content">
                <h2 class="h2">🧠 Module 7 – Responsabilité du streamer</h2>
                <p class="lead">Vous êtes responsable de votre chaîne et de votre chat.</p>
                <div class="value-grid" style="grid-template-columns: 1fr;">
                  <div class="value" style="cursor: default;">
                    <span class="value__title">📺 Votre chaîne</span>
                    <span class="value__meta">Choix des modérateurs, consignes, actions</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">💬 Votre chat</span>
                    <span class="value__meta">Modération, règles, décisions</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">📋 Logs, clips, VOD</span>
                    <span class="value__meta">Peuvent être utilisés pour examiner un cas</span>
                  </div>
                </div>
                <div class="note note--red" style="margin-top: 1.5rem;">
                  <div class="note__icon">!</div>
                  <div class="note__text">
                    Vos modérateurs sont vos boucliers, mais <strong>vous restez responsable</strong>.
                  </div>
                </div>
              </div>
            </article>
      `);

      // Exercice 7 - Énoncé
      slides.push(`
            <article class="slide" data-title="Exercice 7 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">📝 Exercice 6 – Rôle des modérateurs</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Question</div>
                  <p style="line-height: 1.8; margin-top: 1rem;">
                    Quelles sont, selon vous, les 3 choses les plus importantes à expliquer à un modérateur avant de lui donner l'épée ?
                  </p>
                </div>
              </div>
            </article>
      `);

      // Exercice 7 - Réponse
      slides.push(`
            <article class="slide" data-title="Exercice 7 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Exercice 6 – Éléments clés</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Les 3 choses essentielles</div>
                  <ul style="list-style: disc; padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li>Ce que vous considérez comme tolérable ou non dans votre chat.</li>
                    <li>Les limites absolues (haine, triggers personnels, sujets sensibles).</li>
                    <li>La procédure : quand avertir, quand timeout, quand ban, et quand vous prévenir pour escalader.</li>
                  </ul>
                </div>
              </div>
            </article>
      `);

      // Module 8 - Slide 18
      slides.push(`
            <article class="slide" data-title="Module 8 - Cas pratiques">
              <div class="slide__content">
                <h2 class="h2">📌 Module 8 – Cas pratiques</h2>
                <p class="lead">Scénarios réels à analyser</p>
                <div class="value-grid" style="grid-template-columns: 1fr;">
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Cas 1 : Conflit politique dans le chat</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Cas 2 : Blague raciste en TTS</span>
                  </div>
                  <div class="value" style="cursor: default;">
                    <span class="value__title">Cas 3 : Musique protégée</span>
                  </div>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 1 - Énoncé
      slides.push(`
            <article class="slide" data-title="Cas pratique 1 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">🧪 Cas pratique 1 – Conflit politique</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Situation</div>
                  <div style="background: rgba(224, 71, 83, 0.1); padding: 1.5rem; border-radius: 16px; border-left: 4px solid #e04753; margin: 1.5rem 0;">
                    <p style="line-height: 1.8;">
                      Le chat s'enflamme sur une élection, les insultes fusent.
                    </p>
                  </div>
                  <p style="margin-top: 1.5rem; font-weight: 700;">
                    Quelle est la réaction la plus saine pour la chaîne ?
                  </p>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 1 - Réponse
      slides.push(`
            <article class="slide" data-title="Cas pratique 1 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Cas pratique 1 – Solution</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">Bonne pratique</div>
                  <p style="line-height: 1.8; margin-top: 1rem;">
                    Poser le cadre ("On arrête la politique ici, on revient au jeu"), rappeler les règles du chat et appliquer des timeouts ou bans si nécessaire.
                  </p>
                  <p style="margin-top: 1rem; font-weight: 700;">
                    Ne pas laisser le conflit dériver pour "l'engagement".
                  </p>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 2 - Énoncé
      slides.push(`
            <article class="slide" data-title="Cas pratique 2 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">🧪 Cas pratique 2 – Blague raciste en TTS</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Situation</div>
                  <div style="background: rgba(224, 71, 83, 0.1); padding: 1.5rem; border-radius: 16px; border-left: 4px solid #e04753; margin: 1.5rem 0;">
                    <p style="line-height: 1.8;">
                      Un don avec TTS diffuse une blague raciste à voix haute.
                    </p>
                  </div>
                  <p style="margin-top: 1.5rem; font-weight: 700;">
                    Que faire immédiatement ?
                  </p>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 2 - Réponse
      slides.push(`
            <article class="slide" data-title="Cas pratique 2 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Cas pratique 2 – Actions immédiates</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981;">À faire immédiatement</div>
                  <ul style="list-style: disc; padding-left: 1.5rem; line-height: 2; margin-top: 1rem;">
                    <li>Couper le son si possible</li>
                    <li>Désavouer clairement ("C'est inacceptable ici")</li>
                    <li>Bannir l'auteur</li>
                    <li>Ajuster les filtres / règles du TTS pour éviter que ça se reproduise</li>
                  </ul>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 3 - Énoncé
      slides.push(`
            <article class="slide" data-title="Cas pratique 3 - Énoncé">
              <div class="slide__content">
                <h2 class="h2">🧪 Cas pratique 3 – Musique protégée</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title">Situation</div>
                  <div style="background: rgba(224, 71, 83, 0.1); padding: 1.5rem; border-radius: 16px; border-left: 4px solid #e04753; margin: 1.5rem 0;">
                    <p style="line-height: 1.8;">
                      Vous voulez passer le dernier hit très connu de Beyoncé en fond de live.
                    </p>
                  </div>
                  <p style="margin-top: 1.5rem; font-weight: 700;">
                    Bonne idée ou non ? Pourquoi ?
                  </p>
                </div>
              </div>
            </article>
      `);

      // Cas pratique 3 - Réponse
      slides.push(`
            <article class="slide" data-title="Cas pratique 3 - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Cas pratique 3 – Réponse</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                  <div class="panel__title" style="color: #ef4444;">❌ Mauvaise idée</div>
                  <p style="line-height: 1.8; margin-top: 1rem;">
                    Musique commerciale = risque de DMCA (strikes, voire ban).
                  </p>
                  <p style="margin-top: 1rem; font-weight: 700; color: #10b981;">
                    ✅ Il vaut mieux privilégier des playlists DMCA-free prévues pour le streaming.
                  </p>
                </div>
              </div>
            </article>
      `);

      // Module 9 - Slide 19
      slides.push(`
            <article class="slide" data-title="Module 9 - Les 10 règles d'or">
              <div class="slide__content">
                <h2 class="h2">✅ Module 9 – Les 10 règles d'or</h2>
                <div class="accordion" data-accordion style="max-width: 80ch; margin: 0 auto;">
                  <button class="acc__head">1. Connaître les règles de Twitch</button>
                  <div class="acc__panel" hidden>
                    Lisez les Community Guidelines et les Terms of Service.
                  </div>
                  <button class="acc__head">2. Modérer activement son chat</button>
                  <div class="acc__panel" hidden>
                    Ne pas laisser les situations dégénérer.
                  </div>
                  <button class="acc__head">3. Ne pas faire confiance aux liens / fichiers douteux</button>
                  <div class="acc__panel" hidden>
                    Protégez-vous et votre communauté.
                  </div>
                  <button class="acc__head">4. Respecter autrui, même en cas de conflit</button>
                  <div class="acc__panel" hidden>
                    La critique constructive est OK, les attaques personnelles non.
                  </div>
                  <button class="acc__head">5. Penser "impact" plutôt qu'intention</button>
                  <div class="acc__panel" hidden>
                    C'est ce que Twitch juge en premier.
                  </div>
                  <button class="acc__head">6. Protéger ses données personnelles (et celles des autres)</button>
                  <div class="acc__panel" hidden>
                    Éviter le doxxing, protéger les informations sensibles.
                  </div>
                  <button class="acc__head">7. Faire attention aux droits d'auteur (musique, vidéo)</button>
                  <div class="acc__panel" hidden>
                    DMCA, musique, contenus protégés.
                  </div>
                  <button class="acc__head">8. Rester maître de ses émotions en live</button>
                  <div class="acc__panel" hidden>
                    Ne pas laisser la colère ou la frustration prendre le dessus.
                  </div>
                  <button class="acc__head">9. Former son équipe de modération</button>
                  <div class="acc__panel" hidden>
                    Des modos bien formés = décisions cohérentes.
                  </div>
                  <button class="acc__head" style="color: #9146ff; font-weight: 900;">10. En cas de doute : s'abstenir</button>
                  <div class="acc__panel" hidden>
                    Principe de prévention : mieux vaut éviter que de risquer une sanction.
                  </div>
                </div>
              </div>
            </article>
      `);

      // Quiz final - Questions (slides séparées)
      const quizQuestions = [
        { q: "Twitch juge-t-il l'intention ou l'impact ?", a: "B – Twitch se concentre sur l'impact.", options: "A) L'intention\nB) L'impact" },
        { q: "Est-il autorisé de diffuser de la musique protégée si on supprime la VOD ?", a: "B – Le live lui-même est soumis au DMCA.", options: "A) Oui\nB) Non, le live peut être scanné" },
        { q: "Qui est responsable des propos tenus dans le chat ?", a: "B – Le streamer est responsable de la modération.", options: "A) Les viewers uniquement\nB) Le streamer" },
        { q: "Un comportement hors Twitch peut-il entraîner une sanction sur Twitch ?", a: "B – En cas de comportement grave (violence, etc.).", options: "A) Non, jamais\nB) Oui, si le comportement est grave" },
        { q: "Que faire face à un conflit politique violent dans le chat ?", a: "B – On protège l'ambiance, on modère.", options: "A) Laisser faire pour l'engagement\nB) Recadrer le chat, interdire le sujet, modérer si nécessaire" },
        { q: "Les gros streamers ont-ils plus de droits que les petits ?", a: "B – Les règles sont les mêmes pour tous.", options: "A) Oui\nB) Non" },
        { q: "\"C'était une blague\" suffit-il à se défendre d'un propos offensant ?", a: "B – L'impact compte plus que l'intention.", options: "A) Oui\nB) Non" },
        { q: "Quels contenus doivent être signalés comme sponsorisés ?", a: "B – Toute forme de sponsoring doit être indiquée.", options: "A) Seulement les gros contrats\nB) Tout contenu où il y a rémunération ou échange de valeur" },
        { q: "Si un modérateur abuse de ses pouvoirs, qui est responsable ?", a: "B – Le streamer choisit et encadre ses modos.", options: "A) Le modérateur\nB) Le streamer" },
        { q: "Que signifie \"shadow sanction\" ?", a: "B – Visibilité réduite sans avertissement clair.", options: "A) Aucune sanction réelle\nB) Réduction de visibilité sans notification officielle" }
      ];

      quizQuestions.forEach((quiz, idx) => {
        // Slide énoncé
        slides.push(`
            <article class="slide" data-title="Quiz Q${idx + 1} - Énoncé">
              <div class="slide__content">
                <h2 class="h2">❓ Question ${idx + 1} / 10</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto;">
                  <div class="panel__title" style="font-size: 1.5rem; margin-bottom: 1.5rem;">${quiz.q}</div>
                  <div class="quizline">
                    <div class="quizline__choices" data-quiz="quiz${idx + 1}">
                      ${quiz.options.split('\n').map(opt => {
                        const [letter, text] = opt.split(') ');
                        return `<button class="choice" data-choice="${letter.replace('A', 'A').replace('B', 'B')}">${letter}) ${text}</button>`;
                      }).join('')}
                    </div>
                    <div class="quizline__result" hidden>
                      Réponse : <strong>${quiz.a}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>
        `);

        // Slide réponse
        slides.push(`
            <article class="slide" data-title="Quiz Q${idx + 1} - Réponse">
              <div class="slide__content">
                <h2 class="h2">✅ Question ${idx + 1} – Réponse</h2>
                <div class="panel" style="max-width: 80ch; margin: 0 auto; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                  <div class="panel__title" style="color: #10b981; margin-bottom: 1rem;">${quiz.q}</div>
                  <div style="font-size: 1.2rem; font-weight: 700; color: #10b981; margin-top: 1rem;">
                    ${quiz.a}
                  </div>
                </div>
              </div>
            </article>
        `);
      });

      // Slide Conclusion
      slides.push(`
            <article class="slide" data-title="Conclusion">
              <div class="slide__content">
                <h2 class="h2">Merci pour votre attention !</h2>
                <div class="final">
                  <div class="final__card">
                    <div class="final__title">À retenir</div>
                    <ul>
                      <li>Impact &gt; intention</li>
                      <li>Modération active et cohérente</li>
                      <li>Droits d'auteur : DMCA, musique, contenus</li>
                      <li>En cas de doute : <strong>s'abstenir</strong></li>
                    </ul>
                    <button class="btn btn--primary" id="btnRestart" type="button" style="margin-top: 1.5rem;">Recommencer</button>
                  </div>
                  <div class="final__card final__card--soft">
                    <div class="final__title">Message final</div>
                    <p style="line-height: 1.8;">
                      L'objectif n'est pas de faire peur : c'est de donner des clés concrètes pour des streams plus sereins.
                    </p>
                    <p style="margin-top: 1rem; font-weight: 700; color: #9146ff;">
                      La connaissance est votre meilleure protection sur Twitch.
                    </p>
                  </div>
                </div>
              </div>
            </article>
      `);

      return slides.join('\n');
    };

    // Injecter le HTML
    container.innerHTML = `
      <div class="app" id="app">
        <header class="topbar" role="banner">
          <div class="brand">
            <img class="brand__logo" src="/logo.png" alt="Logo TENF" />
            <div class="brand__text">
              <div class="brand__title">TENF Academy</div>
              <div class="brand__subtitle">Comprendre Twitch et ses règles — formation communautaire</div>
            </div>
          </div>
          <div class="topbar__actions">
            <button class="btn btn--ghost" id="btnOverview" type="button" aria-haspopup="dialog">
              Plan
            </button>
            <button class="btn btn--primary" id="btnFullscreen" type="button">
              Plein écran
            </button>
          </div>
        </header>
        <div class="progress" aria-hidden="true">
          <div class="progress__bar" id="progressBar"></div>
        </div>
        <main class="stage" role="main">
          <section class="deck" id="deck" aria-label="Présentation TENF Academy">
${generateSlidesHTML()}
          </section>
          <nav class="nav" aria-label="Navigation des slides">
            <button class="btn btn--ghost" id="prevBtn" type="button">← Précédent</button>
            <div class="nav__meta"><span id="slideIndex">1</span>/<span id="slideTotal">1</span></div>
            <button class="btn btn--primary" id="nextBtn" type="button">Suivant →</button>
          </nav>
        </main>
      </div>
      <dialog class="overlay" id="overview">
        <div class="overlay__head">
          <div class="overlay__title">Plan de la formation</div>
          <button class="btn btn--ghost" id="closeOverview" type="button">Fermer</button>
        </div>
        <div class="overlay__body" id="overviewList"></div>
      </dialog>
    `;

    // Injecter le JavaScript
    const script = document.createElement("script");
    script.textContent = `
      (function () {
        const slides = Array.from(document.querySelectorAll(".slide"));
        const deck = document.getElementById("deck");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const slideIndexEl = document.getElementById("slideIndex");
        const slideTotalEl = document.getElementById("slideTotal");
        const progressBar = document.getElementById("progressBar");
        const overview = document.getElementById("overview");
        const overviewList = document.getElementById("overviewList");
        const btnOverview = document.getElementById("btnOverview");
        const closeOverview = document.getElementById("closeOverview");
        const btnRestart = document.getElementById("btnRestart");
        const btnFullscreen = document.getElementById("btnFullscreen");

        let i = 0;

        function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

        function setSlide(nextIndex, { focus = true } = {}) {
          i = clamp(nextIndex, 0, slides.length - 1);
          slides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));

          slideIndexEl.textContent = String(i + 1);
          slideTotalEl.textContent = String(slides.length);

          const pct = ((i + 1) / slides.length) * 100;
          progressBar.style.width = pct + "%";

          if (focus) deck.focus?.();
        }

        function next() { setSlide(i + 1); }
        function prev() { setSlide(i - 1); }

        document.querySelectorAll("[data-reveal]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const sel = btn.getAttribute("data-reveal");
            const el = document.querySelector(sel);
            if (!el) return;
            const isHidden = el.hasAttribute("hidden");
            if (isHidden) el.removeAttribute("hidden");
            else el.setAttribute("hidden", "");
          });
        });

        document.querySelectorAll("[data-flip]").forEach((card) => {
          card.addEventListener("click", () => card.classList.toggle("is-open"));
        });

        document.querySelectorAll("[data-accordion]").forEach((acc) => {
          const heads = acc.querySelectorAll(".acc__head");
          heads.forEach((head) => {
            head.addEventListener("click", () => {
              const panel = head.nextElementSibling;
              if (!panel) return;
              const isOpen = !panel.hasAttribute("hidden");
              if (isOpen) panel.setAttribute("hidden", "");
              else panel.removeAttribute("hidden");
            });
          });
        });

        const quizRules = {
          impact: "B",
          sameRules: "B",
          ex1: "B",
          quiz1: "B",  // Impact
          quiz2: "B",  // DMCA live
          quiz3: "B",  // Streamer responsable
          quiz4: "B",  // Comportement hors Twitch
          quiz5: "B",  // Modérer le conflit
          quiz6: "B",  // Mêmes règles
          quiz7: "B",  // Impact > intention
          quiz8: "B",  // Tout sponsoring
          quiz9: "B",  // Streamer responsable
          quiz10: "B"  // Shadow sanction
        };

        document.querySelectorAll("[data-quiz]").forEach((wrap) => {
          const key = wrap.getAttribute("data-quiz");
          const right = quizRules[key];
          const result = wrap.parentElement.querySelector(".quizline__result");

          wrap.querySelectorAll(".choice").forEach((btn) => {
            btn.addEventListener("click", () => {
              wrap.querySelectorAll(".choice").forEach(b => b.classList.remove("is-right", "is-wrong"));
              const pick = btn.getAttribute("data-choice");
              btn.classList.add(pick === right ? "is-right" : "is-wrong");
              if (result) result.removeAttribute("hidden");
            });
          });
        });

        function buildOverview() {
          overviewList.innerHTML = "";
          slides.forEach((s, idx) => {
            const title = s.getAttribute("data-title") || \`Slide \${idx + 1}\`;
            const item = document.createElement("button");
            item.type = "button";
            item.className = "overview-item";
            item.innerHTML = \`<strong>\${idx + 1}. \${title}</strong><span>Aller →</span>\`;
            item.addEventListener("click", () => {
              overview.close();
              setSlide(idx);
            });
            overviewList.appendChild(item);
          });
        }

        btnOverview?.addEventListener("click", () => {
          buildOverview();
          overview.showModal();
        });
        closeOverview?.addEventListener("click", () => overview.close());

        btnFullscreen?.addEventListener("click", async () => {
          try {
            const appElement = document.getElementById("app");
            if (!appElement) return;
            
            if (!document.fullscreenElement) {
              await appElement.requestFullscreen();
            } else {
              await document.exitFullscreen();
            }
          } catch (_) {}
        });

        prevBtn?.addEventListener("click", prev);
        nextBtn?.addEventListener("click", next);
        btnRestart?.addEventListener("click", () => setSlide(0));

        window.addEventListener("keydown", (e) => {
          if (overview?.open) {
            if (e.key === "Escape") overview.close();
            return;
          }
          if (e.key === "ArrowRight" || e.key === "PageDown") next();
          if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
        });

        setSlide(0, { focus: false });
      })();
    `;
    container.appendChild(script);

    return () => {
      // Cleanup
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="presentation-container"
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    />
  );
}
