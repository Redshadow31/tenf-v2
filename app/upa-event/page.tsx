"use client";

import "./upa-event.css";

export default function UpaEventPage() {
  const streamerFormUrl = "https://www.upa-event.fr/formulaire-streameur";
  const moderatorTwitchFormUrl = "https://www.upa-event.fr/formulaire-mod%C3%A9rateurs-twitch";
  const moderatorDiscordFormUrl = "https://www.upa-event.fr/formulaire-moderateurs-discord";
  const upaSiteUrl = "https://www.upa-event.fr";
  const upaDiscordUrl = "https://discord.com/invite/pngsSDRjA2";
  const upaTwitchUrl = "https://www.twitch.tv/upa_event";
  const upaSocialsUrl = "https://upa-event.carrd.co";

  return (
    <div className="upa-page">
      <header className="upa-hero" id="haut">
        <div className="upa-container">
          <div className="upa-hero-logos upa-fade-up">
            <img src="/Tenf.png" alt="Logo TENF" className="upa-hero-logo" />
            <span className="upa-hero-logos-x">&times;</span>
            <img src="/UPA Logo.png" alt="Logo UPA" className="upa-hero-logo" />
          </div>
          <div className="upa-hero-badge upa-fade-up upa-delay-1">Partenariat TENF &times; UPA</div>
          <h1 className="upa-fade-up upa-delay-2">UPA EVENT &mdash; Unis pour l&apos;Avenir</h1>
          <p className="upa-hero-subtitle upa-fade-up upa-delay-3">Du 18 au 26 avril 2026</p>
          <div className="upa-hero-cause upa-fade-up upa-delay-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Association soutenue : Lutte contre le cancer
          </div>

          <p className="upa-hero-description upa-fade-up upa-delay-4">
            Pendant 9 jours, streamers, modérateurs et bénévoles unissent leurs communautés pour soutenir une cause
            majeure. Un événement caritatif humain, structuré et déjà en mouvement.
          </p>

          <div className="upa-hero-cta-row upa-fade-up upa-delay-4">
            <a href={streamerFormUrl} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
              Participer comme streamer
            </a>
            <a href={moderatorTwitchFormUrl} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
              Devenir modérateur volontaire
            </a>
          </div>

          <div className="upa-hero-social-proof upa-fade-up upa-delay-4">
            <strong>D&eacute;j&agrave; plus de 23 participants inscrits</strong>
            <span>La dynamique est lancée, rejoins le mouvement UPA.</span>
          </div>
        </div>
      </header>

      <section className="upa-proof-strip">
        <div className="upa-container">
          <div className="upa-proof-card">
            <h2>D&eacute;j&agrave; plus de 23 participants inscrits</h2>
            <p>
              La premi&egrave;re session rassemble d&eacute;j&agrave; plus de 23 profils engag&eacute;s. Plus la mobilisation grandit, plus l&apos;impact
              collectif peut faire la diff&eacute;rence.
            </p>
            <div className="upa-proof-stats">
              <div>
                <strong>9 jours</strong>
                <span>de mobilisation</span>
              </div>
              <div>
                <strong>1 cause</strong>
                <span>lutte contre le cancer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="upa-quick-journey">
        <div className="upa-container">
          <div className="upa-quick-journey-card">
            <h2>Participer est simple et rapide</h2>
            <div className="upa-quick-steps">
              <article>
                <span>1</span>
                <h3>Choisis ton rôle</h3>
                <p>Streamer ou modérateur volontaire, selon ton profil et ta disponibilité.</p>
              </article>
              <article>
                <span>2</span>
                <h3>Remplis le formulaire</h3>
                <p>Les boutons d&apos;inscription sont déjà prêts et accessibles immédiatement.</p>
              </article>
              <article>
                <span>3</span>
                <h3>Rejoins la mobilisation</h3>
                <p>Intègre une dynamique réelle déjà lancée avec 23 inscrits.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Unis pour l&apos;Avenir (UPA)</h2>
          <p className="upa-section-intro">
            Une organisation caritative portée par des créateurs et des bénévoles qui transforment l&apos;énergie des
            communautés en impact concret pour les associations.
          </p>
          <div className="upa-grid upa-grid-2">
            <article className="upa-card">
              <h3>Organisation</h3>
              <p>
                <strong>Unis pour l&apos;Avenir (UPA)</strong> est une organisation caritative créée par le streamer Twitch
                <strong> Symaog</strong>, organisateur de l&apos;événement.
              </p>
            </article>
            <article className="upa-card upa-card-highlight">
              <h3>Notre mission</h3>
              <p>
                Mettre en avant des causes solidaires via des événements caritatifs en ligne, offrir de la visibilité
                aux associations partenaires et mobiliser des fonds avec la force du live.
              </p>
            </article>
            <article className="upa-card">
              <h3>Ce que nous proposons</h3>
              <ul className="upa-list">
                <li>Lives caritatifs animés par la communauté</li>
                <li>Événements communautaires et défis solidaires</li>
                <li>Sensibilisation autour des causes soutenues</li>
                <li>Mise en lumière d&apos;associations reconnues</li>
              </ul>
            </article>
            <article className="upa-card upa-card-soft">
              <h3>L&apos;avenir se construit ensemble</h3>
              <p>
                Chaque participation, chaque live et chaque partage contribue à un même objectif : faire avancer une
                cause qui dépasse chacun d&apos;entre nous.
              </p>
              <a href={upaDiscordUrl} className="upa-link-inline" target="_blank" rel="noopener noreferrer">
                Rejoindre la communauté UPA
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section upa-section-muted">
        <div className="upa-container">
          <h2 className="upa-section-title">Ce que l&apos;év&eacute;nement propose</h2>
          <div className="upa-grid upa-grid-4">
            <article className="upa-feature-card">
              <h3>Lives caritatifs</h3>
              <p>Des sessions live pour collecter et sensibiliser en direct, avec un cadre clair et structuré.</p>
            </article>
            <article className="upa-feature-card">
              <h3>Événements communautaires</h3>
              <p>Défis, animations et rendez-vous communs pour créer une énergie collective pendant toute la période.</p>
            </article>
            <article className="upa-feature-card">
              <h3>Sensibilisation</h3>
              <p>Une prise de parole utile autour de la cause soutenue pour informer, mobiliser et agir.</p>
            </article>
            <article className="upa-feature-card">
              <h3>Mise en avant des associations</h3>
              <p>Visibilité concrète pour les acteurs de terrain et valorisation de leurs actions auprès du public.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Le staff organisateur</h2>
          <p className="upa-section-intro">
            Une équipe identifiée, impliquée et présente pour piloter l&apos;événement avec sérieux.
          </p>
          <div className="upa-grid upa-grid-3">
            <article className="upa-staff-card">
              <h3>Symaog</h3>
              <p className="upa-staff-role">Organisateur</p>
              <p>Porte la vision de l&apos;événement, coordonne les actions et garantit la cohérence globale.</p>
            </article>
            <article className="upa-staff-card">
              <h3>PoreeUnivers</h3>
              <p className="upa-staff-role">Coordination communautaire</p>
              <p>Accompagne la mobilisation des participants et facilite le lien entre les équipes.</p>
            </article>
            <article className="upa-staff-card">
              <h3>lacocotte91</h3>
              <p className="upa-staff-role">Support organisationnel</p>
              <p>Contribue au bon déroulement opérationnel et au suivi des besoins pendant l&apos;événement.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Pourquoi participer</h2>
          <p className="upa-section-intro">
            Participer, c&apos;est s&apos;engager dans un moment solidaire qui a du sens pour la communauté et pour la cause.
          </p>
          <div className="upa-grid upa-grid-2">
            <article className="upa-reason-card">
              <h3>Soutenir une cause essentielle</h3>
              <p>Chaque présence renforce la visibilité de la lutte contre le cancer et encourage la solidarité.</p>
            </article>
            <article className="upa-reason-card">
              <h3>Mobiliser sa communauté</h3>
              <p>Créer un rendez-vous positif avec son audience autour d&apos;un objectif concret et utile.</p>
            </article>
            <article className="upa-reason-card">
              <h3>Participer à un projet collectif</h3>
              <p>Contribuer à une initiative déjà lancée et portée par une équipe engagée.</p>
            </article>
            <article className="upa-reason-card">
              <h3>Vivre un moment solidaire</h3>
              <p>Faire partie d&apos;une dynamique humaine qui rassemble créateurs, bénévoles et spectateurs.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section upa-section-muted" id="participer">
        <div className="upa-container">
          <h2 className="upa-section-title">Participer à l&apos;&eacute;v&eacute;nement</h2>
          <p className="upa-section-intro">
            Deux parcours clairs, complémentaires et ouverts dès maintenant.
          </p>
          <div className="upa-grid upa-grid-2">
            <article className="upa-path-card streamer">
              <h3>Je participe en tant que streamer</h3>
              <p>
                Pour les créateurs qui veulent animer un ou plusieurs lives caritatifs pendant la période de l&apos;event
                et mobiliser leur communauté autour d&apos;une action utile.
              </p>
              <div className="upa-note">
                <p>
                  <strong>Important :</strong> Tous les streamers participants s&apos;engagent à <strong>respecter UPA,
                  l&apos;association soutenue ainsi que l&apos;ensemble des règles d&apos;UPA et de sa modération</strong>.
                </p>
              </div>
              <a href={streamerFormUrl} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                S&apos;inscrire comme streamer
              </a>
            </article>
            <article className="upa-path-card moderator">
              <h3>Je deviens modérateur volontaire</h3>
              <p>
                Pour les personnes qui souhaitent encadrer les lives, préserver un cadre bienveillant et soutenir le
                bon déroulement de l&apos;événement.
              </p>
              <div className="upa-note">
                <p>
                  <strong>Important :</strong> Les modérateurs volontaires n&apos;ont <strong>pas le droit de live</strong> pendant
                  toute la durée de l&apos;event afin de se concentrer pleinement sur la modération.
                </p>
              </div>
              <div className="upa-btn-group">
                <a href={moderatorTwitchFormUrl} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                  Modérateur Twitch
                </a>
                <a href={moderatorDiscordFormUrl} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                  Modérateur Discord
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Nos valeurs</h2>
          <div className="upa-grid upa-grid-3">
            <article className="upa-value-card">
              <h3>Respect</h3>
              <p>Chaque participant, chaque cause et chaque communauté mérite écoute et considération.</p>
            </article>
            <article className="upa-value-card">
              <h3>Bienveillance</h3>
              <p>Un cadre positif et sécurisant pour permettre à chacun de contribuer à sa manière.</p>
            </article>
            <article className="upa-value-card">
              <h3>Solidarité</h3>
              <p>La force du collectif au service d&apos;actions utiles et de causes qui comptent vraiment.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Une organisation claire et rassurante</h2>
          <div className="upa-grid upa-grid-2">
            <article className="upa-trust-card">
              <h3>Événement encadré</h3>
              <p>
                L&apos;événement est piloté par une équipe identifiée, avec un cadre de modération et des règles explicites.
              </p>
            </article>
            <article className="upa-trust-card">
              <h3>Cause clairement affirmée</h3>
              <p>
                La première session est dédiée à la lutte contre le cancer avec un message caritatif cohérent sur toute la page.
              </p>
            </article>
            <article className="upa-trust-card">
              <h3>FAQ rapide — faut-il être expert ?</h3>
              <p>
                Non. L&apos;objectif est de participer sérieusement, dans le respect du cadre UPA, avec ses moyens et sa communauté.
              </p>
            </article>
            <article className="upa-trust-card">
              <h3>FAQ rapide — comment aider sans streamer ?</h3>
              <p>
                Le parcours modérateur (Twitch/Discord) permet de contribuer activement au bon déroulement de l&apos;événement.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="upa-section upa-section-muted">
        <div className="upa-container">
          <h2 className="upa-section-title">Liens officiels et infos complémentaires</h2>
          <p className="upa-section-intro">
            Retrouve toutes les plateformes officielles pour suivre l&apos;événement et rejoindre la communauté.
          </p>
          <div className="upa-links-grid">
            <a href={upaSiteUrl} className="upa-link-card" target="_blank" rel="noopener noreferrer">Site UPA</a>
            <a href={upaDiscordUrl} className="upa-link-card" target="_blank" rel="noopener noreferrer">Discord UPA</a>
            <a href={upaTwitchUrl} className="upa-link-card" target="_blank" rel="noopener noreferrer">Chaîne Twitch</a>
            <a href={upaSocialsUrl} className="upa-link-card" target="_blank" rel="noopener noreferrer">Autres liens utiles</a>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <div className="upa-tenf-block">
            <h2>TENF, partenaire communautaire de l&apos;&eacute;v&eacute;nement</h2>
            <p>
              TENF soutient UPA dans la mobilisation des créateurs et des communautés. Ce partenariat renforce la
              portée de l&apos;événement et favorise une dynamique positive autour de la cause soutenue.
            </p>
            <p>
              UPA reste l&apos;organisateur officiel, TENF agit en relais communautaire pour amplifier l&apos;impact collectif.
            </p>
          </div>
        </div>
      </section>

      <section className="upa-section upa-section-final">
        <div className="upa-container">
          <div className="upa-final-cta">
            <h2>Rejoignez l&apos;&eacute;v&eacute;nement</h2>
            <p>
              23 inscrits sont déjà mobilisés. Chaque streamer et chaque modérateur volontaire peut faire une vraie
              différence pendant cette première session.
            </p>
            <p className="upa-final-support">
              Inscription ouverte maintenant - quelques minutes suffisent pour rejoindre la mobilisation.
            </p>
            <div className="upa-hero-cta-row">
              <a href={streamerFormUrl} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                Participer comme streamer
              </a>
              <a href={moderatorTwitchFormUrl} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
                Devenir modérateur volontaire
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
