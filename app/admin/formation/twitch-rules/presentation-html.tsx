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

    // Injecter le HTML
    container.innerHTML = `
      <div class="app" id="app">
        <header class="topbar" role="banner">
          <div class="brand">
            <img class="brand__logo" src="/logo.png" alt="Logo TENF" />
            <div class="brand__text">
              <div class="brand__title">TENF Academy</div>
              <div class="brand__subtitle">Règles & valeurs — formation communautaire</div>
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
            <article class="slide is-active" data-title="Accueil">
              <div class="slide__bg glow"></div>
              <div class="slide__content">
                <div class="hero">
                  <div class="hero__left">
                    <div class="kicker">Bienvenue sur</div>
                    <h1 class="h1">TENF Academy</h1>
                    <p class="lead">
                      Une formation <strong>sérieuse</strong> et <strong>bienveillante</strong> pour comprendre nos règles,
                      protéger l'ambiance, et renforcer l'entraide.
                    </p>
                    <div class="chips">
                      <span class="chip">Mode sombre</span>
                      <span class="chip chip--red">Identité TENF</span>
                      <span class="chip">Interactions</span>
                    </div>
                    <div class="note">
                      <div class="note__icon">i</div>
                      <div class="note__text">
                        Les réponses ne s'affichent pas automatiquement : clique sur les boutons/cartes pour révéler.
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
            <article class="slide" data-title="Pourquoi TENF existe">
              <div class="slide__content">
                <h2 class="h2">Pourquoi cette communauté existe</h2>
                <p class="lead">
                  TENF existe pour créer un espace <strong>sûr</strong>, <strong>utile</strong> et <strong>humain</strong> :
                  entraide, progression, modération saine, et prévention des risques (Twitch/Discord).
                </p>
                <div class="grid-2">
                  <div class="panel">
                    <div class="panel__title">Objectif</div>
                    <p>
                      Aider les membres à streamer et interagir sans se mettre en danger : comprendre l'<strong>impact</strong>,
                      les règles, et les bonnes pratiques.
                    </p>
                    <button class="reveal" data-reveal="#r2a">Voir un rappel important</button>
                    <div class="reveal__box" id="r2a" hidden>
                      Twitch est une plateforme privée : créer un compte = accepter des règles (ToS) et leur application.
                    </div>
                  </div>
                  <div class="panel panel--soft">
                    <div class="panel__title">Ambiance recherchée</div>
                    <div class="cards">
                      <button class="flipcard" data-flip>
                        <div class="flipcard__front">Bienveillance</div>
                        <div class="flipcard__back">On aide, on oriente, on recadre sans humilier.</div>
                      </button>
                      <button class="flipcard" data-flip>
                        <div class="flipcard__front">Professionnalisme</div>
                        <div class="flipcard__back">Des règles claires, des décisions cohérentes, un cadre stable.</div>
                      </button>
                      <button class="flipcard" data-flip>
                        <div class="flipcard__front">Prévention</div>
                        <div class="flipcard__back">On anticipe les situations "à risque" avant qu'elles dégénèrent.</div>
                      </button>
                    </div>
                    <div class="hint">Cartes cliquables (révélation au clic)</div>
                  </div>
                </div>
              </div>
            </article>
            <article class="slide" data-title="Valeurs TENF">
              <div class="slide__content">
                <h2 class="h2">Les valeurs TENF</h2>
                <p class="lead">Clique sur une valeur pour afficher son explication.</p>
                <div class="value-grid">
                  <button class="value" data-reveal="#v1">
                    <span class="value__title">Respect</span>
                    <span class="value__meta">Base non négociable</span>
                  </button>
                  <div class="value__detail" id="v1" hidden>
                    Pas d'attaques sur l'identité, pas d'acharnement : on critique des idées, pas des personnes.
                  </div>
                  <button class="value" data-reveal="#v2">
                    <span class="value__title">Entraide</span>
                    <span class="value__meta">On avance ensemble</span>
                  </button>
                  <div class="value__detail" id="v2" hidden>
                    On partage des solutions concrètes, on oriente vers des ressources, on évite les jugements gratuits.
                  </div>
                  <button class="value" data-reveal="#v3">
                    <span class="value__title">Responsabilité</span>
                    <span class="value__meta">Streamer = cadre</span>
                  </button>
                  <div class="value__detail" id="v3" hidden>
                    Le streamer est responsable de sa chaîne et de son chat (modération, règles, décisions).
                  </div>
                  <button class="value" data-reveal="#v4">
                    <span class="value__title">Sécurité</span>
                    <span class="value__meta">Prévention</span>
                  </button>
                  <div class="value__detail" id="v4" hidden>
                    Protéger les données, éviter le doxxing, couper court aux comportements graves.
                  </div>
                </div>
                <div class="callout">
                  <div class="callout__title">Principe clé</div>
                  <p>
                    Twitch juge d'abord l'<strong>impact</strong>, pas l'intention : "c'était une blague" ne protège pas d'une sanction.
                  </p>
                </div>
              </div>
            </article>
            <article class="slide" data-title="Règles essentielles">
              <div class="slide__content">
                <h2 class="h2">Les règles essentielles</h2>
                <p class="lead">Clique sur une question pour afficher la réponse.</p>
                <div class="accordion" data-accordion>
                  <button class="acc__head">"Je peux dire ce que je veux sur Twitch ?"</button>
                  <div class="acc__panel" hidden>
                    Non : Twitch est une plateforme privée, soumise à ses ToS et guidelines.
                  </div>
                  <button class="acc__head">"Si personne ne report, je suis safe ?"</button>
                  <div class="acc__panel" hidden>
                    Faux : Twitch peut utiliser des outils automatiques, et des clips/VOD peuvent ressortir.
                  </div>
                  <button class="acc__head">"Un truc hors Twitch peut me sanctionner ?"</button>
                  <div class="acc__panel" hidden>
                    Oui, certains comportements graves hors plateforme peuvent entraîner des sanctions.
                  </div>
                </div>
                <div class="quizline">
                  <div class="quizline__q">Mini‑quiz : Twitch juge surtout…</div>
                  <div class="quizline__choices" data-quiz="impact">
                    <button class="choice" data-choice="A">A) L'intention</button>
                    <button class="choice" data-choice="B">B) L'impact</button>
                  </div>
                  <div class="quizline__result" hidden>
                    Réponse : <strong>B — l'impact</strong>.
                  </div>
                </div>
              </div>
            </article>
            <article class="slide" data-title="Encouragé vs Non">
              <div class="slide__content">
                <h2 class="h2">Ce qui est encouragé / ce qui ne l'est pas</h2>
                <p class="lead">Clique sur une carte pour révéler des exemples.</p>
                <div class="compare">
                  <div class="compare__col">
                    <div class="compare__title ok">Encouragé</div>
                    <button class="tile" data-reveal="#ok1">Modération active</button>
                    <div class="tile__detail" id="ok1" hidden>
                      Recadrer, timeout, ban si nécessaire — protéger l'ambiance.
                    </div>
                    <button class="tile" data-reveal="#ok2">Neutralité sur les dramas</button>
                    <div class="tile__detail" id="ok2" hidden>
                      Ne pas alimenter les clashs publics ; rester factuel et recentrer.
                    </div>
                  </div>
                  <div class="compare__col">
                    <div class="compare__title no">À éviter</div>
                    <button class="tile tile--danger" data-reveal="#no1">Harcèlement / haine</button>
                    <div class="tile__detail" id="no1" hidden>
                      Insultes répétées, attaques sur l'identité, moqueries de handicap : interdit.
                    </div>
                    <button class="tile tile--danger" data-reveal="#no2">DMCA / contenus protégés</button>
                    <div class="tile__detail" id="no2" hidden>
                      Musique commerciale / films/séries sans droits : risque de sanctions.
                    </div>
                  </div>
                </div>
              </div>
            </article>
            <article class="slide" data-title="Rôles & fonctionnement">
              <div class="slide__content">
                <h2 class="h2">Rôles & fonctionnement</h2>
                <p class="lead">Déplie chaque bloc pour comprendre le cadre.</p>
                <div class="stack" data-accordion>
                  <button class="acc__head">Le streamer</button>
                  <div class="acc__panel" hidden>
                    Responsable de la chaîne, des règles et des décisions. Les modérateurs sont un bouclier, mais la responsabilité finale reste au streamer.
                  </div>
                  <button class="acc__head">Les modérateurs</button>
                  <div class="acc__panel" hidden>
                    Appliquent le cadre : avertir, timeout, ban, escalade. Former l'équipe évite les décisions incohérentes.
                  </div>
                  <button class="acc__head">Les membres</button>
                  <div class="acc__panel" hidden>
                    Participent dans le respect : signaler, aider, éviter les attaques personnelles, protéger les infos.
                  </div>
                </div>
                <div class="note note--red">
                  <div class="note__icon">!</div>
                  <div class="note__text">
                    En cas de doute : <strong>s'abstenir</strong> (principe de prévention).
                  </div>
                </div>
              </div>
            </article>
            <article class="slide" data-title="Conclusion">
              <div class="slide__content">
                <h2 class="h2">Conclusion & message humain</h2>
                <p class="lead">
                  Merci d'avoir suivi cette formation. Le but n'est pas de faire peur :
                  c'est de donner des clés concrètes pour des streams plus sereins.
                </p>
                <div class="final">
                  <div class="final__card">
                    <div class="final__title">À retenir</div>
                    <ul>
                      <li>Impact &gt; intention.</li>
                      <li>Modération active et cohérente.</li>
                      <li>Droits d'auteur : DMCA, musique, contenus.</li>
                    </ul>
                    <button class="btn btn--primary" id="btnRestart" type="button">Recommencer</button>
                  </div>
                  <div class="final__card final__card--soft">
                    <div class="final__title">Mini‑quiz final</div>
                    <p>Les gros streamers ont-ils plus de droits ?</p>
                    <div class="quizline__choices" data-quiz="sameRules">
                      <button class="choice" data-choice="A">A) Oui</button>
                      <button class="choice" data-choice="B">B) Non</button>
                    </div>
                    <div class="quizline__result" hidden>
                      Réponse : <strong>B — les règles sont les mêmes pour tous</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>
          <nav class="nav" aria-label="Navigation des slides">
            <button class="btn btn--ghost" id="prevBtn" type="button">← Précédent</button>
            <div class="nav__meta"><span id="slideIndex">1</span>/<span id="slideTotal">7</span></div>
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
          sameRules: "B"
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
