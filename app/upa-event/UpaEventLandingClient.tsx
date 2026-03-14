"use client";

import { useMemo, useState } from "react";
import type { UpaEventContent } from "@/lib/upaEvent/types";

type TabKey = "discover" | "event" | "staff" | "faq";

const STREAMER_FORM_URL = "https://www.upa-event.fr/formulaire-streameur";
const MODERATOR_FORM_URL = "https://www.upa-event.fr/formulaire-mod%C3%A9rateurs-twitch";
const MODERATOR_DISCORD_FORM_URL = "https://www.upa-event.fr/formulaire-moderateurs-discord";

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "discover", label: "Decouvrir UPA" },
  { key: "event", label: "L'evenement" },
  { key: "staff", label: "Staff" },
  { key: "faq", label: "FAQ" },
];

const FAQ_SECTIONS = [
  {
    id: "streamer",
    icon: "🎥",
    title: "Participer en tant que streamer",
    items: [
      {
        id: "faq-streamer-who",
        question: "Qui peut participer en tant que streamer ?",
        answer:
          "Tout createur de contenu peut participer a l'evenement, quel que soit son nombre de viewers ou son niveau d'experience sur Twitch. L'objectif est avant tout de rassembler des communautes autour d'une cause solidaire.",
      },
      {
        id: "faq-streamer-frequency",
        question: "Dois-je streamer tous les jours pendant l'evenement ?",
        answer:
          "Non. Chaque streamer participe selon ses disponibilites. Meme un seul live peut contribuer a soutenir la cause et a mobiliser sa communaute.",
      },
      {
        id: "faq-streamer-size",
        question: "Puis-je participer meme si je suis un petit streamer ?",
        answer:
          "Oui bien sur. L'evenement est justement concu pour rassembler des createurs de toutes tailles. Chaque communaute compte et chaque participation aide a amplifier l'impact de l'evenement.",
      },
      {
        id: "faq-streamer-announce",
        question: "Comment annoncer ma participation a ma communaute ?",
        answer:
          "Une fois inscrit, tu pourras annoncer ta participation pendant tes lives et sur tes reseaux. Le staff pourra egalement partager les createurs participants pour donner de la visibilite a l'evenement.",
      },
    ],
  },
  {
    id: "moderation",
    icon: "🛡️",
    title: "Moderation et staff",
    items: [
      {
        id: "faq-mod-role",
        question: "Quel est le role des moderateurs volontaires ?",
        answer:
          "Les moderateurs volontaires participent a l'encadrement de l'evenement. Ils aident a maintenir un environnement bienveillant sur Twitch et Discord et soutiennent les streamers participants.",
      },
      {
        id: "faq-mod-experience",
        question: "Dois-je etre moderateur experimente pour participer ?",
        answer:
          "Non. L'important est surtout d'etre motive et respectueux de l'esprit communautaire de l'evenement.",
      },
      {
        id: "faq-mod-time",
        question: "Combien de temps dois-je consacrer a la moderation ?",
        answer:
          "La participation reste flexible. Les moderateurs peuvent aider ponctuellement pendant certains lives ou evenements selon leurs disponibilites.",
      },
    ],
  },
  {
    id: "event",
    icon: "📅",
    title: "L'evenement",
    items: [
      {
        id: "faq-event-when",
        question: "Quand aura lieu l'evenement UPA ?",
        answer:
          "L'evenement se deroulera du 18 au 26 avril 2026. Pendant cette periode, les streamers participants diffuseront des lives pour mobiliser leurs communautes autour de la cause soutenue.",
      },
      {
        id: "faq-event-cause",
        question: "Quelle cause est soutenue ?",
        answer:
          "L'evenement met en avant une cause solidaire afin de sensibiliser les communautes et de soutenir les actions des associations partenaires.",
      },
      {
        id: "faq-event-content",
        question: "Dois-je modifier le contenu de mes streams ?",
        answer:
          "Non. Chaque streamer reste libre de son contenu. L'objectif est simplement de profiter de ses lives pour soutenir l'evenement et sensibiliser sa communaute.",
      },
    ],
  },
  {
    id: "community",
    icon: "🤝",
    title: "Communaute",
    items: [
      {
        id: "faq-community-not-streamer",
        question: "Puis-je participer meme si je ne suis pas streamer ?",
        answer:
          "Oui. Les membres de la communaute peuvent soutenir l'evenement en regardant les lives, en partageant l'evenement et en encourageant les createurs participants.",
      },
      {
        id: "faq-community-follow",
        question: "Comment suivre l'evenement ?",
        answer:
          "Les informations et les createurs participants seront partages pendant toute la duree de l'evenement afin de permettre a chacun de decouvrir les lives et de soutenir la cause.",
      },
    ],
  },
];

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates a confirmer";
  }
  const startLabel = start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const endLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `Du ${startLabel} au ${endLabel}`;
}

function getCountdownLabel(startDate: string): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "Date a confirmer";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = target.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `J-${days} avant le debut de l'evenement`;
  if (days === 0) return "Debut de l'evenement aujourd'hui";
  return "Evenement en cours ou deja lance";
}

export default function UpaEventLandingClient({ initialContent }: { initialContent: UpaEventContent }) {
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [mobileOpenTab, setMobileOpenTab] = useState<TabKey>("discover");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const content = initialContent;

  const timeline = useMemo(
    () => [...content.timeline].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.timeline]
  );
  const staff = useMemo(
    () => [...content.staff].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.staff]
  );
  const highStaff = useMemo(
    () => staff.filter((member) => member.staffType === "high_staff"),
    [staff]
  );
  const moderators = useMemo(
    () => staff.filter((member) => member.staffType !== "high_staff"),
    [staff]
  );
  const officialLinks = useMemo(
    () => [...content.officialLinks].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.officialLinks]
  );
  const partnerCommunities = useMemo(
    () => [...content.partnerCommunities].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.partnerCommunities]
  );
  const totalParticipants = Math.max(content.socialProof.totalRegistered || 0, 0);
  const totalParticipantsLabel =
    totalParticipants > 0 ? `${totalParticipants} participants` : "Participants en cours de confirmation";
  const dateRange = formatDateRange(content.general.startDate, content.general.endDate);
  const countdownLabel = getCountdownLabel(content.general.startDate);

  const hasTimeline = content.displaySettings.showTimeline && timeline.length > 0;
  const hasStaff = content.displaySettings.showStaff && staff.length > 0;

  function renderDiscoverTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">Unis pour l'Avenir (UPA)</h3>

        <div className="upa-grid upa-grid-2 upa-discover-main-grid">
          <article className="upa-card upa-card-highlight">
            <h4>Presentation de l'organisation</h4>
            <p>
              Unis pour l'Avenir (UPA) est une initiative caritative creee par le streamer Twitch <strong>Symaog</strong>.
            </p>
            <p>
              L'objectif est de mobiliser les communautes en ligne autour d'evenements streaming et d'actions collectives.
            </p>
            <p>
              UPA renforce la visibilite des associations partenaires et valorise les initiatives solidaires.
            </p>
          </article>

          <article className="upa-card">
            <h4>Notre mission</h4>
            <p>Rassembler les communautes autour d'actions positives et utiles.</p>
            <p>Associer la puissance du streaming, l'engagement des createurs et l'energie des viewers.</p>
            <p>Transformer chaque live en opportunite concrete de faire avancer la solidarite.</p>
          </article>
        </div>

        <div className="upa-subsection">
          <h4>Ce que nous proposons</h4>
          <div className="upa-grid upa-grid-2 upa-discover-proposals">
            <article className="upa-card upa-card-soft upa-discover-proposal-card">
              <h5><span aria-hidden="true">🎥</span> Organisation de lives caritatifs</h5>
              <p>Des formats engages pour mobiliser rapidement les communautes.</p>
            </article>
            <article className="upa-card upa-card-soft upa-discover-proposal-card">
              <h5><span aria-hidden="true">🤝</span> Evenements communautaires</h5>
              <p>Tournois, defis et animations pour creer une dynamique collective.</p>
            </article>
            <article className="upa-card upa-card-soft upa-discover-proposal-card">
              <h5><span aria-hidden="true">📣</span> Campagnes de sensibilisation en ligne</h5>
              <p>Des messages clairs pour informer, sensibiliser et engager.</p>
            </article>
            <article className="upa-card upa-card-soft upa-discover-proposal-card">
              <h5><span aria-hidden="true">🫶</span> Partenariats associatifs reconnus</h5>
              <p>Des collaborations utiles pour amplifier l'impact concret des actions.</p>
            </article>
          </div>
        </div>

        <div className="upa-subsection">
          <article className="upa-card">
            <h4>L'avenir se construit ensemble</h4>
            <p>UPA croit en la force de l'unite, de la solidarite et de la generosite.</p>
            <p>Chaque action, chaque partage et chaque don contribuent a une difference reelle.</p>
            <p>En reunissant les communautes, nous amplifions durablement l'impact des causes soutenues.</p>
          </article>
        </div>

        <div className="upa-subsection">
          <h4>Nos valeurs</h4>
          <div className="upa-grid upa-grid-2">
            <article className="upa-card upa-card-soft">
              <h5>Respect</h5>
              <p>Chaque personne est ecoutee et consideree avec dignite, quel que soit son parcours.</p>
            </article>
            <article className="upa-card upa-card-soft">
              <h5>Bienveillance</h5>
              <p>Nous cultivons un cadre sain, positif et humain pour avancer ensemble en confiance.</p>
            </article>
            <article className="upa-card upa-card-soft">
              <h5>Solidarite</h5>
              <p>Nos communautes se rassemblent autour d'une meme cause pour creer un impact concret.</p>
            </article>
            <article className="upa-card upa-card-soft">
              <h5>Entraide</h5>
              <p>Chaque participant peut compter sur l'equipe et la communaute pour progresser sereinement.</p>
            </article>
          </div>
        </div>

        <div className="upa-subsection">
          <article className="upa-card upa-discover-invite">
            <h4>Invitation a rejoindre l'aventure</h4>
            <p>Rejoignez l'aventure et participez a la construction d'un evenement solidaire.</p>
            <p>Ensemble, nous pouvons transformer la force des communautes en moteur d'entraide.</p>
          </article>
        </div>
      </div>
    );
  }

  function renderEventTab() {
    const eventCards = [
      {
        title: "Lives caritatifs",
        icon: "🎥",
        content:
          "Des createurs diffuseront des lives tout au long de l'evenement pour mobiliser leurs communautes et soutenir la cause.",
      },
      {
        title: "Moments communautaires",
        icon: "🤝",
        content:
          "Des temps forts collectifs permettront aux streamers, moderateurs et viewers de partager des moments ensemble.",
      },
      {
        title: "Sensibilisation",
        icon: "📣",
        content:
          "Les lives permettront aussi de mettre en lumiere la cause soutenue et d'informer les communautes.",
      },
      {
        title: "Mise en lumiere de la cause",
        icon: "🫶",
        content:
          "L'evenement vise a amplifier la visibilite de l'association soutenue grace a la mobilisation des communautes.",
      },
    ];

    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">A quoi ressemblera l'evenement</h3>
        <div className="upa-grid upa-grid-2 upa-event-cards-grid">
          {eventCards.map((card) => (
            <article key={card.title} className="upa-card upa-card-soft upa-event-card">
              <h4>
                <span aria-hidden="true">{card.icon}</span>
                {card.title}
              </h4>
              <p>{card.content}</p>
            </article>
          ))}
        </div>

        <div className="upa-subsection">
          <h4>Comment participer</h4>
          <div className="upa-grid upa-grid-2">
            <article className="upa-card upa-participation-card">
              <h4>Je participe en tant que streamer</h4>
              <p>
                Anime un ou plusieurs lives pendant la periode de l'evenement et mobilise ta communaute autour de la cause.
              </p>
              <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                {content.cta.streamerButtonText || "Participer comme streamer"}
              </a>
            </article>

            <article className="upa-card upa-participation-card">
              <h4>Je deviens moderateur volontaire</h4>
              <p>
                Contribue au bon deroulement des lives sur Twitch et Discord et participe a l'encadrement de l'evenement.
              </p>
              <div className="upa-participation-actions">
                <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                  Moderateur Twitch
                </a>
                <a
                  href={MODERATOR_DISCORD_FORM_URL}
                  className="upa-btn upa-btn-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Moderateur Discord
                </a>
              </div>
            </article>
          </div>
        </div>

        {content.displaySettings.showPartnerCommunities && (
          <div className="upa-subsection">
            <h4>Communautes partenaires</h4>
            {partnerCommunities.length === 0 ? (
              <p className="upa-empty-text">Les communautes partenaires seront bientot annoncees.</p>
            ) : (
              <div className="upa-grid upa-grid-3">
                {partnerCommunities.map((partner) => (
                  <article key={partner.id} className="upa-card">
                    {partner.logoUrl ? <img src={partner.logoUrl} alt={`Logo ${partner.name}`} className="upa-partner-logo" /> : null}
                    <h5>{partner.name}</h5>
                    <p>{partner.description}</p>
                    {partner.url ? (
                      <a className="upa-inline-link" href={partner.url} target="_blank" rel="noopener noreferrer">
                        Voir la communaute
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
            <p className="upa-empty-text">
              L'evenement rassemble plusieurs communautes de createurs et de viewers. De nouvelles communautes partenaires
              seront ajoutees progressivement.
            </p>
          </div>
        )}

        <div className="upa-subsection">
          <h4>Statut de l'evenement</h4>
          <div className="upa-live-status">
            <span className="upa-live-dot" />
            <div>
              <strong>{content.statusMessages.statusLabel || "Inscriptions ouvertes"}</strong>
              <p>{content.statusMessages.statusMessage || "L'evenement est actuellement en phase de preparation."}</p>
            </div>
          </div>
        </div>

        <div className="upa-subsection">
          <article className="upa-card upa-event-invite-card">
            <h4>Invitation</h4>
            <p>Chaque participation contribue a faire grandir l'evenement et a soutenir la cause.</p>
            <p>
              Que tu sois streamer, moderateur ou membre de la communaute, tu peux prendre part a cette aventure
              collective.
            </p>
          </article>
        </div>
      </div>
    );
  }

  function renderStaffTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">Haut staff UPA</h3>
        {!hasStaff || highStaff.length === 0 ? (
          <p className="upa-empty-text">Le haut staff sera bientot affiche.</p>
        ) : (
          <div className="upa-grid upa-grid-3">
            {highStaff.map((member) => (
              <article key={member.id} className="upa-card upa-staff-card">
                <div className="upa-staff-avatar-wrap">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="upa-staff-avatar" />
                  ) : (
                    <span className="upa-staff-avatar-fallback">{member.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <h4>{member.name}</h4>
                <p className="upa-staff-role">{member.role}</p>
                <p>{member.description}</p>
              </article>
            ))}
          </div>
        )}

        <div className="upa-staff-divider">
          <span>Staff UPA</span>
        </div>

        {moderators.length === 0 ? (
          <p className="upa-empty-text">Le staff UPA sera ajoute ici.</p>
        ) : (
          <div className="upa-grid upa-grid-3">
            {moderators.map((member) => (
              <article key={member.id} className="upa-card upa-staff-card">
                <div className="upa-staff-avatar-wrap">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="upa-staff-avatar" />
                  ) : (
                    <span className="upa-staff-avatar-fallback">{member.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <h4>{member.name}</h4>
                <p className="upa-staff-role">{member.role}</p>
                <p>{member.description}</p>
              </article>
            ))}
          </div>
        )}

        <div className="upa-subsection">
          <h4>Un staff engage pour l'evenement</h4>
          <p className="upa-empty-text">
            L'evenement UPA repose sur l'engagement d'une equipe de benevoles passionnes. Streamers, moderateurs et
            organisateurs travaillent ensemble pour assurer une experience positive et bienveillante.
          </p>
          <div className="upa-grid upa-grid-3 upa-staff-info-grid">
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">📅</span>
                Coordination de l'evenement
              </h5>
              <p>
                Le staff organise la preparation des lives, coordonne les participants et veille au bon deroulement de
                l'evenement.
              </p>
            </article>
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">🛡️</span>
                Encadrement des communautes
              </h5>
              <p>
                Les moderateurs accompagnent les streamers et veillent au respect d'un environnement sain sur Twitch et
                Discord.
              </p>
            </article>
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">🤲</span>
                Soutien aux participants
              </h5>
              <p>
                Le staff reste disponible pour repondre aux questions et accompagner les participants pendant toute la
                duree de l'evenement.
              </p>
            </article>
          </div>
        </div>

        <div className="upa-subsection">
          <article className="upa-card upa-staff-join-card">
            <h4>Envie de contribuer a l'evenement ?</h4>
            <p>
              Les moderateurs volontaires jouent un role essentiel dans la reussite de l'evenement. Ils participent a la
              gestion des lives, au soutien des streamers et a la coordination de la communaute.
            </p>
            <div className="upa-participation-actions">
              <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                Moderateur Twitch
              </a>
              <a
                href={MODERATOR_DISCORD_FORM_URL}
                className="upa-btn upa-btn-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                Moderateur Discord
              </a>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderFaqTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">Questions frequentes</h3>
        <div className="upa-faq-sections">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.id} className="upa-faq-theme">
              <h4 className="upa-faq-theme-title">
                <span aria-hidden="true">{section.icon}</span>
                {section.title}
              </h4>
              <div className="upa-faq-list">
                {section.items.map((item) => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <article key={item.id} className={`upa-faq-item ${isOpen ? "open" : ""}`}>
                      <button
                        className="upa-faq-trigger"
                        type="button"
                        onClick={() => setOpenFaqId((prev) => (prev === item.id ? null : item.id))}
                      >
                        <span>{item.question}</span>
                        <span>{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen ? <p className="upa-faq-answer">{item.answer}</p> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          <div className="upa-faq-help">
            <p>
              Besoin d'un accompagnement ? Le staff UPA reste disponible pour t'aider a rejoindre l'evenement sereinement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderTabContent(tab: TabKey) {
    if (tab === "discover") return renderDiscoverTab();
    if (tab === "event") return renderEventTab();
    if (tab === "staff") return renderStaffTab();
    return renderFaqTab();
  }

  return (
    <div className="upa-page">
      <header className="upa-hero">
        <div className="upa-container">
          <div className="upa-hero-logos">
            <img src="/Tenf.png" alt="Logo TENF" className="upa-hero-logo" />
            <span className="upa-hero-logos-sep">x</span>
            <img src="/UPA Logo.png" alt="Logo UPA" className="upa-hero-logo" />
          </div>

          <div className="upa-hero-badge">{content.general.partnershipBadge || "Partenariat TENF x UPA"}</div>
          <h1>{content.general.title || "UPA EVENT - Unis pour l'Avenir"}</h1>
          <p className="upa-hero-date">{dateRange}</p>
          <p className="upa-hero-countdown">{countdownLabel}</p>
          <p className="upa-hero-cause">Cause soutenue: {content.general.causeSupported || "Lutte contre le cancer"}</p>
          {content.general.slogan ? <p className="upa-hero-slogan">{content.general.slogan}</p> : null}
          <p className="upa-hero-text">{content.general.heroText}</p>

          <div className="upa-cta-row">
            <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
              {content.cta.streamerButtonText || "Participer comme streamer"}
            </a>
            <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
              {content.cta.moderatorButtonText || "Devenir moderateur volontaire"}
            </a>
          </div>

          {content.displaySettings.showSocialProof && content.socialProof.isVisible && (
            <div className="upa-social-proof upa-glow-anim">
              <strong>{content.socialProof.socialProofMessage || `Deja ${totalParticipantsLabel} inscrits`}</strong>
              <span>{totalParticipantsLabel} - {content.general.moodMessage || "La mobilisation est lancee."}</span>
            </div>
          )}
        </div>
      </header>

      {hasTimeline && (
        <section className="upa-section">
          <div className="upa-container">
            <h2 className="upa-section-title">Timeline evenement</h2>
            <div className="upa-timeline">
              {timeline.map((step) => (
                <article key={step.id} className={`upa-timeline-card ${step.status}`}>
                  <div className="upa-timeline-dot" />
                  <p className="upa-timeline-date">{step.dateLabel}</p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="upa-timeline-status">
                    {step.status === "past" ? "Passe" : step.status === "current" ? "Actuel" : "A venir"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="upa-section">
        <div className="upa-container">
          <div className="upa-tabs-desktop">
            {TAB_LABELS.map((tab) => (
              <button
                key={tab.key}
                className={`upa-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="upa-tabs-content-desktop">{renderTabContent(activeTab)}</div>

          <div className="upa-tabs-mobile">
            {TAB_LABELS.map((tab) => {
              const open = mobileOpenTab === tab.key;
              return (
                <div key={tab.key} className="upa-mobile-accordion-item">
                  <button
                    className="upa-mobile-accordion-trigger"
                    onClick={() => setMobileOpenTab((prev) => (prev === tab.key ? "discover" : tab.key))}
                  >
                    <span>{tab.label}</span>
                    <span>{open ? "−" : "+"}</span>
                  </button>
                  {open ? <div className="upa-mobile-accordion-content">{renderTabContent(tab.key)}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {officialLinks.length > 0 && (
        <section className="upa-section">
          <div className="upa-container">
            <h2 className="upa-section-title">Liens officiels</h2>
            <div className="upa-links-grid">
              {officialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="upa-link-card">
                  <strong>{link.label}</strong>
                  {link.description ? <span>{link.description}</span> : null}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.displaySettings.showFinalCta && (
        <section className="upa-section">
          <div className="upa-container">
            <div className="upa-final-cta">
              <h2>{content.cta.finalCtaTitle || "Rejoignez l'evenement"}</h2>
              <p>{content.cta.finalCtaText || "Chaque streamer, chaque moderateur, chaque viewer peut faire la difference."}</p>
              <p className="upa-final-emotion">
                {content.cta.finalEmotionText ||
                  "Chaque streamer, chaque moderateur, chaque viewer peut contribuer a faire la difference."}
              </p>
              <p className="upa-final-count">{totalParticipantsLabel} deja mobilises</p>
              <div className="upa-cta-row">
                <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                  {content.cta.streamerButtonText || "Participer comme streamer"}
                </a>
                <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
                  {content.cta.moderatorButtonText || "Devenir moderateur volontaire"}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
