"use client";

import "./upa-event.css";

export default function UpaEventPage() {
  return (
    <div className="upa-page">
      {/* ========================== HERO ========================== */}
      <header className="upa-hero">
        <div className="upa-container">
          <div className="upa-hero-logos upa-animate">
            <img src="/Tenf.png" alt="Logo TENF" className="upa-hero-logo" />
            <span className="upa-hero-logos-x">&times;</span>
            <img src="/UPA Logo.png" alt="Logo UPA" className="upa-hero-logo" />
          </div>
          <div className="upa-hero-badge upa-animate upa-animate-delay-1">Partenariat TENF &times; UPA</div>
          <h1 className="upa-animate upa-animate-delay-2">UPA EVENT &ndash; Unis pour l&apos;Avenir</h1>
          <p className="upa-hero-subtitle upa-animate upa-animate-delay-3">Du 18 au 26 avril 2026</p>
          <div className="upa-hero-cause upa-animate upa-animate-delay-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Association soutenue : Lutte contre le cancer
          </div>
        </div>
      </header>

      {/* ========================== QUI EST UPA ? ========================== */}
      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Unis pour l&apos;Avenir (UPA)</h2>

          {/* Organisation */}
          <div className="upa-about-card" style={{ marginBottom: 28 }}>
            <h3 className="upa-about-heading">Organisation</h3>
            <p>
              <strong>Unis pour l&apos;Avenir (UPA)</strong> est une organisation caritative créée par le streamer Twitch :
              <strong> Symaog</strong> (Organisateur).
            </p>
          </div>

          {/* Notre mission */}
          <div className="upa-about-card" style={{ marginBottom: 28, borderLeftColor: "var(--upa-green)" }}>
            <h3 className="upa-about-heading">Notre mission</h3>
            <p>
              UPA a pour objectif de mettre en avant des causes solidaires à travers des événements caritatifs
              sur les réseaux sociaux. Grâce à la force des communautés en ligne et l&apos;énergie du streaming,
              nous souhaitons offrir une visibilité accrue aux associations partenaires et collecter des fonds
              pour leurs actions.
            </p>
          </div>

          {/* Ce que nous proposons */}
          <div className="upa-about-card" style={{ marginBottom: 28 }}>
            <h3 className="upa-about-heading">Ce que nous proposons</h3>
            <div className="upa-about-list">
              <div className="upa-about-list-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--upa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                <span>Organisation de lives caritatifs</span>
              </div>
              <div className="upa-about-list-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--upa-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                <span>Événements communautaires (tournois, défis, animations)</span>
              </div>
              <div className="upa-about-list-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--upa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <span>Campagnes de sensibilisation en ligne</span>
              </div>
              <div className="upa-about-list-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--upa-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span>Partenariats avec des associations reconnues</span>
              </div>
            </div>
          </div>

          {/* L'avenir se construit ensemble */}
          <div className="upa-about-card upa-about-cta-card" style={{ borderLeftColor: "var(--upa-green)" }}>
            <h3 className="upa-about-heading">L&apos;avenir se construit ensemble</h3>
            <p>
              Nous croyons en la force de l&apos;unité, de la solidarité et de la générosité.
              Chaque action, chaque partage, chaque don contribue à faire une réelle différence.
            </p>
            <a href="https://discord.com/invite/pngsSDRjA2" className="upa-btn upa-btn-blue" target="_blank" rel="noopener noreferrer" style={{ marginTop: 20 }}>
              Rejoins l&apos;aventure
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ========================== VALEURS ========================== */}
      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title" style={{ textAlign: "center" }}>Nos valeurs</h2>
          <p className="upa-section-desc" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            Trois piliers qui guident chaque action d&apos;UPA.
          </p>

          <div className="upa-values-grid">
            <div className="upa-value-card">
              <span className="upa-value-emoji" role="img" aria-label="Respect">&#x1F91D;</span>
              <h3>Respect</h3>
              <p>Chaque participant, chaque cause, chaque communauté mérite considération et écoute.</p>
            </div>
            <div className="upa-value-card">
              <span className="upa-value-emoji" role="img" aria-label="Bienveillance">&#x1F49A;</span>
              <h3>Bienveillance</h3>
              <p>Un environnement positif et encourageant où chacun peut contribuer à sa manière.</p>
            </div>
            <div className="upa-value-card">
              <span className="upa-value-emoji" role="img" aria-label="Solidarité">&#x1F4AA;</span>
              <h3>Solidarité</h3>
              <p>Ensemble, nous allons plus loin. L&apos;union fait la force au service des causes qui comptent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== PARTICIPER ========================== */}
      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title" style={{ textAlign: "center" }}>Participer à l&apos;événement</h2>
          <p className="upa-section-desc" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            Deux façons de s&apos;engager pour cette édition. Choisis ton rôle !
          </p>

          <div className="upa-participate-grid">
            {/* Carte Streamer */}
            <div className="upa-participate-card streamer">
              <div className="upa-participate-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3>Je participe en tant que streamer</h3>
              <p>
                Rejoins l&apos;événement en tant que streamer participant. Anime un ou plusieurs lives
                caritatifs pendant la période de l&apos;event et contribue à la collecte de fonds.
              </p>

              <div className="upa-warning upa-warning-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  <strong>Important :</strong> Tous les streamers participants s&apos;engagent à <strong>respecter UPA,
                  l&apos;association soutenue ainsi que l&apos;ensemble des règles d&apos;UPA et de sa modération</strong>.
                </span>
              </div>

              <a href="https://www.upa-event.fr/formulaire-streameur" className="upa-btn upa-btn-blue" target="_blank" rel="noopener noreferrer">
                S&apos;inscrire comme streamer
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>

            {/* Carte Modérateur */}
            <div className="upa-participate-card moderator">
              <div className="upa-participate-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Je deviens modérateur volontaire</h3>
              <p>
                Aide à encadrer les lives et assurer un espace bienveillant pour tous les participants
                et spectateurs de l&apos;événement.
              </p>

              <div className="upa-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  <strong>Important :</strong> Les modérateurs volontaires n&apos;ont <strong>pas le droit de live</strong> pendant
                  toute la durée de l&apos;event afin de se concentrer pleinement sur la modération.
                </span>
              </div>

              <div className="upa-btn-group">
                <a href="https://www.upa-event.fr/formulaire-mod%C3%A9rateurs-twitch" className="upa-btn upa-btn-green" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>
                  Modérateur Twitch
                </a>
                <a href="https://www.upa-event.fr/formulaire-moderateurs-discord" className="upa-btn upa-btn-green" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" /></svg>
                  Modérateur Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== LIENS OFFICIELS ========================== */}
      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title" style={{ textAlign: "center" }}>Liens officiels</h2>
          <p className="upa-section-desc" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            Retrouve UPA sur ses plateformes officielles.
          </p>

          <div className="upa-links-grid">
            <a href="https://www.upa-event.fr" className="upa-link-btn" target="_blank" rel="noopener noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Site UPA
            </a>

            <a href="https://discord.com/invite/pngsSDRjA2" className="upa-link-btn" target="_blank" rel="noopener noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
              </svg>
              Discord UPA
            </a>

            <a href="https://www.twitch.tv/upa_event" className="upa-link-btn" target="_blank" rel="noopener noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
              </svg>
              Chaîne officielle
            </a>

            <a href="https://upa-event.carrd.co" className="upa-link-btn" target="_blank" rel="noopener noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Leurs réseaux
            </a>
          </div>
        </div>
      </section>

      {/* ========================== RÔLE DE TENF ========================== */}
      <section className="upa-section">
        <div className="upa-container">
          <div className="upa-tenf-role">
            <div className="upa-tenf-role-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#004aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <h3>Rôle de TENF</h3>
              <p>
                TENF agit comme <strong>partenaire communautaire</strong> : relais d&apos;information, mobilisation
                de la communauté et apport de visibilité. <strong>UPA reste l&apos;organisateur officiel</strong> de
                l&apos;événement. TENF soutient et accompagne, mais toute l&apos;organisation et la direction de
                l&apos;événement sont assurées par l&apos;équipe UPA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== FOOTER ========================== */}
      <footer className="upa-footer">
        <div className="upa-container">
          <p>
            UPA EVENT 2026 — Partenariat{" "}
            <a href="/">TENF</a> &times; UPA
          </p>
        </div>
      </footer>
    </div>
  );
}
