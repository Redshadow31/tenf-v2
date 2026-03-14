"use client";

import { useMemo, useState } from "react";
import type { UpaEventContent, UpaEventEditorialSection } from "@/lib/upaEvent/types";

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

function sectionMatches(key: string, expressions: RegExp[]): boolean {
  return expressions.some((expr) => expr.test(key));
}

function getSectionVariantClass(section: UpaEventEditorialSection): string {
  if (section.variant === "highlight") return "upa-card-highlight";
  if (section.variant === "soft") return "upa-card-soft";
  return "";
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
  const faq = useMemo(
    () => [...content.faq].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.faq]
  );
  const officialLinks = useMemo(
    () => [...content.officialLinks].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.officialLinks]
  );
  const partnerCommunities = useMemo(
    () => [...content.partnerCommunities].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.partnerCommunities]
  );
  const activeEditorialSections = useMemo(
    () => [...content.editorialSections].filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [content.editorialSections]
  );

  const discoverSections = useMemo(
    () =>
      activeEditorialSections.filter((section) =>
        sectionMatches(section.key.toLowerCase(), [/organisation/, /mission/, /propos/, /avenir/, /upa/])
      ),
    [activeEditorialSections]
  );
  const eventSections = useMemo(
    () =>
      activeEditorialSections.filter(
        (section) =>
          !sectionMatches(section.key.toLowerCase(), [/organisation/, /mission/, /propos/, /avenir/, /upa/])
      ),
    [activeEditorialSections]
  );

  const fallbackEventCards = [
    {
      title: "Lives caritatifs",
      content: "Des lives engages pour sensibiliser, mobiliser et agir autour de la cause soutenue.",
    },
    {
      title: "Moments communautaires",
      content: "Des temps forts collectifs pour rassembler streamers, moderateurs et viewers.",
    },
    {
      title: "Sensibilisation",
      content: "Une prise de parole claire sur la cause pour informer les communautes.",
    },
    {
      title: "Mise en lumiere de la cause",
      content: "Valoriser l'association soutenue et amplifier son impact durant l'evenement.",
    },
  ];

  const eventCards = eventSections.length
    ? eventSections.slice(0, 4).map((section) => ({ title: section.title, content: section.content }))
    : fallbackEventCards;

  const totalParticipants = Math.max(content.socialProof.totalRegistered || 0, 0);
  const totalParticipantsLabel =
    totalParticipants > 0 ? `${totalParticipants} participants` : "Participants en cours de confirmation";
  const dateRange = formatDateRange(content.general.startDate, content.general.endDate);
  const countdownLabel = getCountdownLabel(content.general.startDate);

  const hasDiscover = discoverSections.length > 0;
  const hasTimeline = content.displaySettings.showTimeline && timeline.length > 0;
  const hasFaq = content.displaySettings.showFaq && faq.length > 0;
  const hasStaff = content.displaySettings.showStaff && staff.length > 0;

  function renderDiscoverTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">Unis pour l'Avenir (UPA)</h3>
        <div className="upa-grid upa-grid-2">
          {(hasDiscover ? discoverSections : activeEditorialSections.slice(0, 4)).map((section) => (
            <article key={section.id} className={`upa-card ${getSectionVariantClass(section)}`}>
              <h4>{section.title}</h4>
              {section.subtitle ? <p className="upa-card-subtitle">{section.subtitle}</p> : null}
              <p>{section.content}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderEventTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">A quoi ressemblera l'evenement</h3>
        <div className="upa-grid upa-grid-4">
          {eventCards.map((card, index) => (
            <article key={`${card.title}-${index}`} className="upa-card upa-card-soft">
              <h4>{card.title}</h4>
              <p>{card.content}</p>
            </article>
          ))}
        </div>

        {content.displaySettings.showPartnerCommunities && (
          <div className="upa-subsection">
            <h4>Communautes partenaires</h4>
            {partnerCommunities.length === 0 ? (
              <p className="upa-empty-text">Les communautes partenaires seront bientot ajoutees.</p>
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
          </div>
        )}
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
          <span>Moderateurs UPA</span>
        </div>

        {moderators.length === 0 ? (
          <p className="upa-empty-text">Les moderateurs UPA seront ajoutes ici.</p>
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
      </div>
    );
  }

  function renderFaqTab() {
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">Questions frequentes</h3>
        {!hasFaq ? (
          <p className="upa-empty-text">La FAQ sera disponible prochainement.</p>
        ) : (
          <div className="upa-faq-list">
            {faq.map((item) => {
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
        )}
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

      <section className="upa-section">
        <div className="upa-container">
          <div className="upa-live-status">
            <span className="upa-live-dot" />
            <div>
              <strong>{content.statusMessages.statusLabel || "Inscriptions ouvertes"}</strong>
              <p>{content.statusMessages.statusMessage || "Les inscriptions continuent."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="upa-section">
        <div className="upa-container">
          <h2 className="upa-section-title">Participer facilement</h2>
          <div className="upa-grid upa-grid-2">
            <article className="upa-card upa-participation-card">
              <h3>Je participe en tant que streamer</h3>
              <p>Anime un ou plusieurs lives pendant la periode de l'evenement et mobilise ta communaute.</p>
              <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                {content.cta.streamerButtonText || "Participer comme streamer"}
              </a>
            </article>
            <article className="upa-card upa-participation-card">
              <h3>Je deviens moderateur volontaire</h3>
              <p>Contribue au bon deroulement des lives, sur Twitch et Discord, dans un cadre bienveillant.</p>
              <div className="upa-participation-actions">
                <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                  Modérateur Twitch
                </a>
                <a
                  href={MODERATOR_DISCORD_FORM_URL}
                  className="upa-btn upa-btn-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Modérateur Discord
                </a>
              </div>
            </article>
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
