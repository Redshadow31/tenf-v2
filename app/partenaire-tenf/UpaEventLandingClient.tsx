"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Compass,
  ExternalLink,
  HeartHandshake,
  LayoutDashboard,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import fnStyles from "@/app/fonctionnement-tenf/fonctionnement.module.css";
import type { UpaEventContent } from "@/lib/upaEvent/types";

type TabKey = "discover" | "event" | "staff" | "faq";

const STREAMER_FORM_URL = "https://www.upa-event.fr/formulaire-streameur";
const MODERATOR_FORM_URL = "https://www.upa-event.fr/formulaire-mod%C3%A9rateurs-twitch";
const MODERATOR_DISCORD_FORM_URL = "https://www.upa-event.fr/formulaire-moderateurs-discord";
/** Site public quand l’édition affichée est terminée (pas les formulaires d’inscription). */
const UPA_PUBLIC_SITE = "https://www.upa-event.fr";

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "discover", label: "Découvrir UPA" },
  { key: "event", label: "L'événement" },
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

/** FAQ au passé lorsque `registrationStatus === "ended"`. */
const FAQ_SECTIONS_ENDED = [
  {
    id: "streamer",
    icon: "🎥",
    title: "Streamer à cette édition",
    items: [
      {
        id: "faq-streamer-who",
        question: "Qui pouvait participer en tant que streamer ?",
        answer:
          "Tout créateur pouvait prendre part au dispositif, quelle que soit la taille de sa chaîne. L’objectif était de rassembler des communautés autour d’une cause solidaire.",
      },
      {
        id: "faq-streamer-frequency",
        question: "Fallait-il streamer chaque jour ?",
        answer:
          "Non. Chaque streamer a pu participer selon ses disponibilités — même un seul live a pu contribuer à la mobilisation.",
      },
      {
        id: "faq-streamer-size",
        question: "Les petites chaînes étaient-elles les bienvenues ?",
        answer:
          "Oui. L’événement visait justement à inclure des créateurs de toutes tailles ; chaque communauté a compté.",
      },
      {
        id: "faq-streamer-announce",
        question: "Comment la participation était-elle annoncée ?",
        answer:
          "Les participant·es pouvaient en parler sur leurs lives et réseaux ; le staff et les communautés ont aussi relayé l’événement.",
      },
    ],
  },
  {
    id: "moderation",
    icon: "🛡️",
    title: "Modération et staff",
    items: [
      {
        id: "faq-mod-role",
        question: "Quel était le rôle des modérateur·ices volontaires ?",
        answer:
          "Iels ont aidé à encadrer la période sur Twitch et Discord, avec bienveillance, au profit des streamers mobilisés.",
      },
      {
        id: "faq-mod-experience",
        question: "Fallait-il être très expérimenté·e ?",
        answer:
          "Non — la motivation et le respect de l’esprit communautaire comptaient plus que l’expérience.",
      },
      {
        id: "faq-mod-time",
        question: "Le temps à consacrer à la modération ?",
        answer:
          "Flexible : aide ponctuelle sur certains lives ou créneaux, selon les disponibilités de chacun·e.",
      },
    ],
  },
  {
    id: "event",
    icon: "📅",
    title: "L'événement (rétrospective)",
    items: [
      {
        id: "faq-event-when",
        question: "Quand avait lieu cette édition UPA × TENF ?",
        answer:
          "Elle s’est déroulée du 18 au 26 avril 2026. Pendant cette fenêtre, les streamers mobilisés ont animé des lives pour soutenir la cause.",
      },
      {
        id: "faq-event-cause",
        question: "Quelle cause était soutenue ?",
        answer:
          "Une cause solidaire mise en avant avec les associations partenaires — sensibilisation et collecte au service du terrain.",
      },
      {
        id: "faq-event-content",
        question: "Les streamers devaient-ils changer leur contenu ?",
        answer:
          "Non. Chacun·e restait libre de son format ; l’idée était d’utiliser son temps de parole pour la solidarité.",
      },
    ],
  },
  {
    id: "community",
    icon: "🤝",
    title: "Communauté",
    items: [
      {
        id: "faq-community-not-streamer",
        question: "Les non-streamers pouvaient-ils participer ?",
        answer:
          "Oui : suivre les lives, partager et encourager les créateurs ont été des façons essentielles de faire vivre l’événement.",
      },
      {
        id: "faq-community-follow",
        question: "Et pour une prochaine fois ?",
        answer:
          "Les annonces des prochaines campagnes UPA sont faites sur le site officiel et les canaux habituels — restez attentifs·ives aux nouvelles éditions.",
      },
    ],
  },
];

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates à confirmer";
  }
  const startLabel = start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const endLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `Du ${startLabel} au ${endLabel}`;
}

function getCountdownLabel(startDate: string): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "Date à confirmer";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = target.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `J-${days} avant le début de l'événement`;
  if (days === 0) return "Début de l'événement aujourd'hui";
  return "Événement en cours ou déjà lancé";
}

function renderInlineFormatting(text: string): ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**") && segment.length >= 4) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>;
    }
    return segment;
  });
}

function EditorialBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  return (
    <>
      {blocks.map((block, i) => (
        <p key={i} className="upa-editorial-p">
          {renderInlineFormatting(block.trim())}
        </p>
      ))}
    </>
  );
}

export default function UpaEventLandingClient({ initialContent }: { initialContent: UpaEventContent }) {
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [mobileOpenTab, setMobileOpenTab] = useState<TabKey>("discover");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [audience, setAudience] = useState<"public" | "membre">("public");
  const [activeJumpId, setActiveJumpId] = useState("upa-hero");

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
  const editorialSections = useMemo(
    () =>
      [...content.editorialSections]
        .filter((item) => item.isActive && (item.content.trim().length > 0 || item.title.trim().length > 0))
        .sort((a, b) => a.order - b.order),
    [content.editorialSections]
  );
  const totalParticipants = Math.max(content.socialProof.totalRegistered || 0, 0);
  const eventEnded = content.general.registrationStatus === "ended";
  const totalParticipantsLabel =
    totalParticipants > 0
      ? `${totalParticipants} participant${totalParticipants > 1 ? "s" : ""}`
      : eventEnded
        ? "Mobilisation terminée"
        : "Participants en cours de confirmation";
  const dateRange = formatDateRange(content.general.startDate, content.general.endDate);
  const countdownLabel =
    content.general.registrationStatus === "ended" ? "Événement terminé" : getCountdownLabel(content.general.startDate);

  const hasTimeline = content.displaySettings.showTimeline && timeline.length > 0;
  const hasStaff = content.displaySettings.showStaff && staff.length > 0;
  const showEditorial =
    (content.displaySettings?.showEditorialSections ?? true) && editorialSections.length > 0;

  const jumpSections = useMemo(() => {
    const items: { id: string; label: string }[] = [{ id: "upa-hero", label: "UPA × TENF" }];
    if (showEditorial) items.push({ id: "upa-editorial", label: "Bilan" });
    if (hasTimeline) items.push({ id: "upa-timeline", label: "Timeline" });
    items.push({ id: "upa-infos", label: "Découvrir" });
    if (officialLinks.length > 0) items.push({ id: "upa-liens", label: "Liens" });
    if (content.displaySettings.showFinalCta) {
      items.push({ id: "upa-cta", label: eventEnded ? "Merci" : "Participer" });
    }
    return items;
  }, [
    showEditorial,
    hasTimeline,
    officialLinks.length,
    content.displaySettings.showFinalCta,
    eventEnded,
  ]);

  useEffect(() => {
    const nodes = jumpSections.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveJumpId(visible.target.id);
      },
      { root: null, rootMargin: "-36% 0px -42% 0px", threshold: [0, 0.1, 0.25, 0.45] },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [jumpSections]);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderDiscoverTab() {
    if (eventEnded) {
      return (
        <div className="upa-tab-panel">
          <h3 className="upa-tab-title">Unis pour l&apos;Avenir (UPA)</h3>
          <div className="upa-grid upa-grid-2 upa-discover-main-grid">
            <article className="upa-card upa-card-highlight">
              <h4>Présentation</h4>
              <p>
                <strong>Unis pour l&apos;Avenir (UPA)</strong> est une initiative caritative créée par le streamer Twitch{" "}
                <strong>Symaog</strong>. Elle organise des opérations en ligne pour soutenir des associations et sensibiliser les communautés.
              </p>
              <p>
                La première édition commune avec <strong>TENF</strong> ({dateRange}) est <strong>terminée</strong> : elle montre comment
                streamers, bénévoles et viewers peuvent se mobiliser ensemble autour d&apos;une cause.
              </p>
            </article>
            <article className="upa-card">
              <h4>Ce qui a été proposé sur cette édition</h4>
              <p>Lives caritatifs, temps communautaires, sensibilisation et visibilité pour la cause soutenue.</p>
              <p>
                Les chiffres, remerciements et perspectives sont rédigés dans la section <strong>Bilan de l&apos;événement</strong> plus haut sur
                cette page.
              </p>
            </article>
          </div>
          <div className="upa-subsection">
            <h4>Nos valeurs</h4>
            <div className="upa-grid upa-grid-2">
              <article className="upa-card upa-card-soft">
                <h5>Respect</h5>
                <p>Chaque personne est écoutée et considérée avec dignité, quel que soit son parcours.</p>
              </article>
              <article className="upa-card upa-card-soft">
                <h5>Bienveillance</h5>
                <p>Un cadre sain et humain pour avancer ensemble en confiance.</p>
              </article>
              <article className="upa-card upa-card-soft">
                <h5>Solidarité</h5>
                <p>Les communautés se rassemblent autour d&apos;une cause pour un impact concret.</p>
              </article>
              <article className="upa-card upa-card-soft">
                <h5>Entraide</h5>
                <p>Participants, équipes et viewers portent collectivement la dynamique solidaire.</p>
              </article>
            </div>
          </div>
          <div className="upa-subsection">
            <article className="upa-card upa-discover-invite">
              <h4>Merci — et la suite</h4>
              <p>Merci aux équipes UPA, au staff TENF et à toutes les communautés mobilisées pour cette première édition commune.</p>
              <p>
                Pour suivre les prochaines campagnes UPA :{" "}
                <a className="upa-inline-link" href={UPA_PUBLIC_SITE} target="_blank" rel="noopener noreferrer">
                  upa-event.fr
                </a>
              </p>
            </article>
          </div>
        </div>
      );
    }

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
    if (eventEnded) {
      const eventCardsPast = [
        {
          title: "Lives caritatifs",
          icon: "🎥",
          content:
            "Des créateurs ont animé des lives pendant la fenêtre de l’événement pour mobiliser leurs communautés et soutenir la cause.",
        },
        {
          title: "Moments communautaires",
          icon: "🤝",
          content:
            "Des temps forts collectifs ont réuni streamers, modérateurs et viewers autour de la solidarité.",
        },
        {
          title: "Sensibilisation",
          icon: "📣",
          content:
            "Les chaînes ont mis en lumière la cause soutenue et informé les communautés tout au long des neuf jours.",
        },
        {
          title: "Visibilité associative",
          icon: "🫶",
          content:
            "La mobilisation en ligne a amplifié la visibilité de l’association partenaire et des actions sur le terrain.",
        },
      ];

      return (
        <div className="upa-tab-panel">
          <h3 className="upa-tab-title">À quoi a ressemblé l&apos;événement</h3>
          <div className="upa-grid upa-grid-2 upa-event-cards-grid">
            {eventCardsPast.map((card) => (
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
            <h4>Après cette édition</h4>
            <div className="upa-grid upa-grid-2">
              <article className="upa-card upa-participation-card">
                <h4>Site officiel UPA</h4>
                <p>Les inscriptions à cette édition commune sont closes. Retrouvez les actualités et les prochaines campagnes sur le site UPA.</p>
                <a href={UPA_PUBLIC_SITE} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                  {content.cta.streamerButtonText || "upa-event.fr"}
                </a>
              </article>
              <article className="upa-card upa-participation-card">
                <h4>Bilan TENF × UPA</h4>
                <p>Le récit détaillé, les remerciements et les résultats sont dans la section bilan en haut de page.</p>
                <a href="#upa-editorial" className="upa-btn upa-btn-accent">
                  Voir le bilan
                </a>
              </article>
            </div>
          </div>

          {content.displaySettings.showPartnerCommunities && (
            <div className="upa-subsection">
              <h4>Communautés partenaires</h4>
              {partnerCommunities.length === 0 ? (
                <p className="upa-empty-text">Les communautés partenaires de cette édition peuvent être listées par l’équipe dans l’admin.</p>
              ) : (
                <div className="upa-grid upa-grid-3">
                  {partnerCommunities.map((partner) => (
                    <article key={partner.id} className="upa-card">
                      {partner.logoUrl ? <img src={partner.logoUrl} alt={`Logo ${partner.name}`} className="upa-partner-logo" /> : null}
                      <h5>{partner.name}</h5>
                      <p>{partner.description}</p>
                      {partner.url ? (
                        <a className="upa-inline-link" href={partner.url} target="_blank" rel="noopener noreferrer">
                          Voir la communauté
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
              <p className="upa-empty-text">Merci aux communautés et structures qui ont soutenu cette édition.</p>
            </div>
          )}

          <div className="upa-subsection">
            <h4>Statut</h4>
            <div className="upa-live-status">
              <span className="upa-live-dot" />
              <div>
                <strong>{content.statusMessages.statusLabel || "Événement terminé"}</strong>
                <p>{content.statusMessages.statusMessage || "Merci pour cette édition TENF × UPA."}</p>
              </div>
            </div>
          </div>

          <div className="upa-subsection">
            <article className="upa-card upa-event-invite-card">
              <h4>Merci</h4>
              <p>
                Chaque live partagé, chaque message de soutien et chaque don ont compté. La suite se construit avec UPA et les temps forts TENF
                (cinéma communautaire, Spotlight, soirées…).
              </p>
            </article>
          </div>
        </div>
      );
    }

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
          <h4>{eventEnded ? "Un staff engagé sur cette édition" : "Un staff engagé pour l'événement"}</h4>
          <p className="upa-empty-text">
            {eventEnded
              ? "Cette édition a reposé sur des bénévoles, organisateurs et modérateurs mobilisés pour un déroulement sain et bienveillant."
              : "L'événement UPA repose sur l'engagement d'une équipe de bénévoles passionnés. Streamers, modérateurs et organisateurs travaillent ensemble pour assurer une expérience positive et bienveillante."}
          </p>
          <div className="upa-grid upa-grid-3 upa-staff-info-grid">
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">📅</span>
                Coordination de l&apos;événement
              </h5>
              <p>
                {eventEnded
                  ? "Le staff a préparé les lives, coordonné les participant·es et veillé au bon déroulement sur la période."
                  : "Le staff organise la préparation des lives, coordonne les participants et veille au bon déroulement de l'événement."}
              </p>
            </article>
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">🛡️</span>
                Encadrement des communautés
              </h5>
              <p>
                {eventEnded
                  ? "Les modérateur·ices ont accompagné les streamers et aidé à garder un cadre sain sur Twitch et Discord."
                  : "Les modérateurs accompagnent les streamers et veillent au respect d'un environnement sain sur Twitch et Discord."}
              </p>
            </article>
            <article className="upa-card upa-card-soft upa-staff-info-card">
              <h5>
                <span aria-hidden="true">🤲</span>
                Soutien aux participants
              </h5>
              <p>
                {eventEnded
                  ? "Pendant l’édition, le staff est resté disponible pour répondre aux questions et accompagner les participant·es."
                  : "Le staff reste disponible pour répondre aux questions et accompagner les participants pendant toute la durée de l'événement."}
              </p>
            </article>
          </div>
        </div>

        <div className="upa-subsection">
          <article className="upa-card upa-staff-join-card">
            <h4>{eventEnded ? "Prochaine édition ou bénévolat" : "Envie de contribuer à l'événement ?"}</h4>
            <p>
              {eventEnded
                ? "Cette édition est close. Pour vous porter candidat·e à une prochaine campagne UPA ou au bénévolat, suivez les annonces sur le site officiel."
                : "Les modérateurs volontaires jouent un rôle essentiel dans la réussite de l'événement : gestion des lives, soutien aux streamers et coordination avec la communauté."}
            </p>
            <div className="upa-participation-actions">
              {eventEnded ? (
                <a href={UPA_PUBLIC_SITE} className="upa-btn upa-btn-accent" target="_blank" rel="noopener noreferrer">
                  upa-event.fr
                </a>
              ) : (
                <>
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
                </>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderFaqTab() {
    const faqSections = eventEnded ? FAQ_SECTIONS_ENDED : FAQ_SECTIONS;
    return (
      <div className="upa-tab-panel">
        <h3 className="upa-tab-title">{eventEnded ? "Questions fréquentes (rétrospective)" : "Questions fréquentes"}</h3>
        <div className="upa-faq-sections">
          {faqSections.map((section) => (
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
              {eventEnded
                ? "Pour une prochaine édition ou une question organisationnelle, passe par le site UPA ou les annonces TENF sur Discord."
                : "Besoin d'un accompagnement ? Le staff UPA reste disponible pour t'aider à rejoindre l'événement sereinement."}
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
    <div className={fnStyles.fonctionnementPage}>
      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className={`text-sm font-medium ${fnStyles.fnFlowLink}`} style={{ color: "var(--color-text-secondary)" }}>
            ← Accueil TENF
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/fonctionnement-tenf/decouvrir" className={fnStyles.fnBtnGhost}>
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              Fonctionnement
            </Link>
            <Link href="/events2" className={fnStyles.fnBtnGhost}>
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              Événements
            </Link>
            <Link href="/lives" className={fnStyles.fnBtnGhost}>
              <Radio className="h-4 w-4 shrink-0" aria-hidden />
              Lives
            </Link>
            <Link href="/avis-tenf" className={fnStyles.fnBtnGhost}>
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              Témoignages
            </Link>
          </div>
        </div>

        <nav className={`${fnStyles.fnDiscoverJumpNav} mb-6`} aria-label="Sections Partenaire TENF">
          <div className="flex min-w-min gap-1.5 px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {jumpSections.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`${fnStyles.fnDiscoverJumpLink} ${activeJumpId === id ? fnStyles.fnDiscoverJumpLinkActive : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="upa-page upa-page--harmonized">
          <div className="upa-audience-row">
            <button
              type="button"
              className={`upa-audience-btn ${audience === "public" ? "active" : ""}`}
              onClick={() => setAudience("public")}
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              Grand public
            </button>
            <button
              type="button"
              className={`upa-audience-btn ${audience === "membre" ? "active" : ""}`}
              onClick={() => setAudience("membre")}
            >
              <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
              Membre TENF
            </button>
          </div>
          <p className="upa-audience-hint">
            {audience === "public"
              ? eventEnded
                ? "Tu tombes sur cette page après coup : le bilan et la FAQ au passé expliquent ce qu’a été l’édition ; les prochaines actions UPA sont sur upa-event.fr."
                : "Tu découvres le partenariat caritatif : dates, FAQ et formulaires UPA sont accessibles sans être membre Discord."
              : eventEnded
                ? "Membre TENF : cette page sert d’archive pour l’édition terminée ; la vie du serveur continue sur Discord et /events2."
                : "Tu es dans TENF : utilise aussi le calendrier /events2 et Discord pour les annonces staff ; cette page centralise UPA × TENF."}
          </p>

          <header id="upa-hero" className="upa-hero scroll-mt-28">
            <div className="upa-container">
              <div className="upa-hero-logos">
                <img src="/Tenf.png" alt="Logo TENF" className="upa-hero-logo" />
                <span className="upa-hero-logos-sep">×</span>
                <img src="/UPA Logo.png" alt="Logo UPA" className="upa-hero-logo" />
              </div>

              <div className="upa-hero-badge">{content.general.partnershipBadge || "Partenariat TENF × UPA"}</div>
              <h1>{content.general.title || "UPA EVENT — Unis pour l'Avenir"}</h1>
              <p className="upa-hero-date">{dateRange}</p>
              <p className="upa-hero-countdown">{countdownLabel}</p>
              <p className="upa-hero-cause">Cause soutenue : {content.general.causeSupported || "Lutte contre le cancer"}</p>
              {content.general.slogan ? <p className="upa-hero-slogan">{content.general.slogan}</p> : null}
              <p className="upa-hero-text">{content.general.heroText}</p>

              <div className="upa-cta-row">
                {eventEnded ? (
                  <>
                    <a href={UPA_PUBLIC_SITE} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                      {content.cta.streamerButtonText || "Site officiel UPA"}
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    </a>
                    <a href="#upa-editorial" className="upa-btn upa-btn-secondary">
                      Lire le bilan
                    </a>
                    {audience === "membre" ? (
                      <Link href="/member/dashboard" className="upa-btn upa-btn-member">
                        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                        Espace membre
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                      {content.cta.streamerButtonText || "Participer comme streamer"}
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    </a>
                    <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
                      {content.cta.moderatorButtonText || "Devenir modérateur volontaire"}
                    </a>
                    {audience === "membre" ? (
                      <Link href="/member/dashboard" className="upa-btn upa-btn-member">
                        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                        Espace membre
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      </Link>
                    ) : null}
                  </>
                )}
              </div>

              {content.displaySettings.showSocialProof && content.socialProof.isVisible && (
                <div className="upa-social-proof upa-glow-anim">
                  <strong>
                    {content.socialProof.socialProofMessage ||
                      (eventEnded ? `${totalParticipantsLabel} sur cette édition` : `Déjà ${totalParticipantsLabel} inscrits`)}
                  </strong>
                  <span>
                    {totalParticipantsLabel} —{" "}
                    {content.general.moodMessage ||
                      (eventEnded ? "Merci pour cette première édition commune." : "La mobilisation est lancée.")}
                  </span>
                </div>
              )}
            </div>
          </header>

      {showEditorial && (
        <section id="upa-editorial" className="upa-section upa-editorial-section scroll-mt-28" aria-labelledby="upa-editorial-heading">
          <div className="upa-container">
            <h2 id="upa-editorial-heading" className="upa-section-title">
              Bilan de l&apos;événement
            </h2>
            <p className="upa-editorial-partner-note">
              Tour d&apos;horizon après la première édition commune <strong>TENF</strong> et{" "}
              <strong>Unis pour l&apos;Avenir (UPA)</strong> — merci aux équipes, bénévoles et communautés impliquées.
            </p>
            <div className="upa-editorial-stack">
              {editorialSections.map((section) => (
                <article
                  key={section.id}
                  className={`upa-editorial-card upa-editorial-variant-${section.variant}`}
                >
                  {section.title ? <h3 className="upa-editorial-card-title">{section.title}</h3> : null}
                  {section.subtitle ? <p className="upa-editorial-card-subtitle">{section.subtitle}</p> : null}
                  {section.content.trim() ? <EditorialBody text={section.content} /> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasTimeline && (
        <section id="upa-timeline" className="upa-section scroll-mt-28">
          <div className="upa-container">
            <h2 className="upa-section-title">{eventEnded ? "Timeline (édition passée)" : "Timeline événement"}</h2>
            <div className="upa-timeline">
              {timeline.map((step) => (
                <article key={step.id} className={`upa-timeline-card ${step.status}`}>
                  <div className="upa-timeline-dot" />
                  <p className="upa-timeline-date">{step.dateLabel}</p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="upa-timeline-status">
                    {step.status === "past" ? "Passé" : step.status === "current" ? "En cours" : "À venir"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="upa-infos" className="upa-section scroll-mt-28">
        <div className="upa-container">
          <div className="upa-tabs-intro">
            <h2 className="upa-section-title">Contenu détaillé</h2>
            <p className="upa-tabs-intro-text">
              {eventEnded
                ? "Archive : présentation UPA, ce qu’a été l’événement, équipe et FAQ au passé — pour comprendre ou se projeter sur une prochaine édition."
                : "Quatre volets pour tout comprendre : présentation UPA, déroulé de l'événement, équipe et questions fréquentes."}
            </p>
          </div>
          <div className="upa-tabs-desktop">
            {TAB_LABELS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`upa-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="upa-tabs-content-desktop">
            <div key={activeTab} className="animate-fadeIn">
              {renderTabContent(activeTab)}
            </div>
          </div>

          <div className="upa-tabs-mobile">
            {TAB_LABELS.map((tab) => {
              const open = mobileOpenTab === tab.key;
              return (
                <div key={tab.key} className="upa-mobile-accordion-item">
                  <button
                    type="button"
                    className="upa-mobile-accordion-trigger"
                    onClick={() => setMobileOpenTab((prev) => (prev === tab.key ? "discover" : tab.key))}
                  >
                    <span>{tab.label}</span>
                    <span>{open ? "−" : "+"}</span>
                  </button>
                  {open ? (
                    <div className="upa-mobile-accordion-content">
                      <div key={tab.key} className="animate-fadeIn">
                        {renderTabContent(tab.key)}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {officialLinks.length > 0 && (
        <section id="upa-liens" className="upa-section scroll-mt-28">
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
        <section id="upa-cta" className="upa-section scroll-mt-28">
          <div className="upa-container">
            <div className="upa-final-cta">
              <h2>
                {content.cta.finalCtaTitle ||
                  (eventEnded ? "Merci pour cette édition TENF × UPA" : "Rejoignez l'événement")}
              </h2>
              <p>
                {content.cta.finalCtaText ||
                  (eventEnded
                    ? "Cette édition est terminée ; le bilan détaillé est dans la section dédiée. Les prochaines campagnes UPA seront annoncées sur le site officiel."
                    : "Chaque streamer, chaque modérateur, chaque viewer peut faire la différence.")}
              </p>
              <p className="upa-final-emotion">
                {content.cta.finalEmotionText ||
                  (eventEnded
                    ? "Merci aux communautés, aux équipes UPA et au staff TENF."
                    : "Chaque streamer, chaque modérateur, chaque viewer peut contribuer à faire la différence.")}
              </p>
              <p className="upa-final-count">
                {eventEnded ? `${totalParticipantsLabel} — édition terminée` : `${totalParticipantsLabel} déjà mobilisés`}
              </p>
              <div className="upa-cta-row">
                {eventEnded ? (
                  <>
                    <a href={UPA_PUBLIC_SITE} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                      {content.cta.streamerButtonText || "Site officiel UPA"}
                    </a>
                    <a href="#upa-editorial" className="upa-btn upa-btn-secondary">
                      Retour au bilan
                    </a>
                  </>
                ) : (
                  <>
                    <a href={STREAMER_FORM_URL} className="upa-btn upa-btn-primary" target="_blank" rel="noopener noreferrer">
                      {content.cta.streamerButtonText || "Participer comme streamer"}
                    </a>
                    <a href={MODERATOR_FORM_URL} className="upa-btn upa-btn-secondary" target="_blank" rel="noopener noreferrer">
                      {content.cta.moderatorButtonText || "Devenir modérateur volontaire"}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
        </div>
      </div>
    </div>
  );
}
