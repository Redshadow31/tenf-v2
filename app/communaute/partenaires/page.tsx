import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getUpaEventConfig } from "@/lib/upaEvent/getUpaEventConfig";

export const dynamic = "force-dynamic";

const STREAMER_FORM_URL = "https://www.upa-event.fr/formulaire-streameur";
const MODERATOR_FORM_URL = "https://www.upa-event.fr/formulaire-mod%C3%A9rateurs-twitch";
const MODERATOR_DISCORD_FORM_URL = "https://www.upa-event.fr/formulaire-moderateurs-discord";
const OFFICIAL_SITE_URL = "https://www.upa-event.fr";

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

function getStatusLabel(status: string): string {
  if (status === "open") return "Inscriptions ouvertes";
  if (status === "soon") return "Inscriptions bientot";
  if (status === "closed") return "Inscriptions fermees";
  if (status === "ended") return "Evenement termine";
  return "Statut a confirmer";
}

function getStatusClass(status: string): string {
  if (status === "open") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  if (status === "soon") return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  if (status === "closed" || status === "ended") return "border-rose-400/40 bg-rose-500/10 text-rose-200";
  return "border-white/15 bg-white/[0.05] text-gray-200";
}

function getTimelineStatusLabel(status: string): string {
  if (status === "past") return "Passe";
  if (status === "current") return "En cours";
  if (status === "upcoming") return "A venir";
  return "Etape";
}

const fallbackFaq = [
  {
    question: "Qui peut participer en tant que streamer ?",
    answer:
      "Tout createur de contenu peut rejoindre la mobilisation, quel que soit son niveau d'audience.",
  },
  {
    question: "Dois-je streamer tous les jours ?",
    answer:
      "Non. La participation est flexible: meme un seul live peut contribuer a la cause.",
  },
  {
    question: "Comment rejoindre la moderation ?",
    answer:
      "Des formulaires distincts existent pour la moderation Twitch et Discord.",
  },
  {
    question: "Ou retrouver toutes les informations officielles ?",
    answer:
      "Sur le site UPA Event et sur la page complete de l'evenement dans TENF.",
  },
];

type StaffReferenceItem = {
  group: "organisateur" | "haut_staff" | "staff" | "soutien_staff";
  twitchLogin: string;
  role: string;
  description?: string;
};

const officialStaffReference: StaffReferenceItem[] = [
  {
    group: "organisateur",
    twitchLogin: "symaog",
    role: "Organisateur",
    description:
      "Pilote et coordinateur de l'evenement, il gere l'organisation globale d'UPA EVENT : preparation, coordination des equipes, gestion des partenariats et bon deroulement de l'evenement du debut a la fin.",
  },
  {
    group: "haut_staff",
    twitchLogin: "clarastonewall",
    role: "Responsable Animations",
    description:
      "Organise et supervise les animations et evenements afin de dynamiser la communaute et encourager la participation.",
  },
  {
    group: "haut_staff",
    twitchLogin: "PoreeUnivers",
    role: "Resp. Juridique et Streameurs",
    description:
      "Veille au respect des regles et a l'encadrement des participants. Il accompagne les streamers, repond a leurs questions et s'assure du bon deroulement de leur participation durant l'evenement.",
  },
  {
    group: "haut_staff",
    twitchLogin: "lacocotte91",
    role: "Responsable Staff",
    description:
      "Coordonne et encadre l'equipe de staff. Il organise les missions de chacun et veille au bon fonctionnement de la moderation et du support pendant toute la duree de l'evenement.",
  },
  {
    group: "staff",
    twitchLogin: "nexou31",
    role: "Graphiste",
    description:
      "Nexou31 est un createur de visuels et d'identites graphiques pour communiquer des idees de maniere claire et esthetique.",
  },
  {
    group: "staff",
    twitchLogin: "Rebelle_7DS",
    role: "Moderatrice Twitch",
    description:
      "Personne authentique et bienveillante, Rebelle est une maman passionnee de jeux video qui aime partager des moments simples, conviviaux et pleins de bonne humeur avec les autres.",
  },
  {
    group: "soutien_staff",
    twitchLogin: "red_shadow_31",
    role: "Soutien Staff",
    description: "",
  },
];

function groupLabel(group: StaffReferenceItem["group"]): string {
  if (group === "organisateur") return "ORGANISATEUR";
  if (group === "haut_staff") return "Haut STAFF";
  if (group === "staff") return "STAFF";
  return "SOUTIEN STAFF";
}

export default async function PartenairesPage() {
  const content = await getUpaEventConfig("upa-event");
  const activeStaff = [...content.staff].filter((item) => item.isActive).sort((a, b) => a.order - b.order);
  const activeTimeline = [...content.timeline].filter((item) => item.isActive).sort((a, b) => a.order - b.order);
  const activeFaq = [...content.faq].filter((item) => item.isActive).sort((a, b) => a.order - b.order).slice(0, 6);
  const officialLinks = [...content.officialLinks].filter((item) => item.isActive).sort((a, b) => a.order - b.order);
  const partnerCommunities = [...content.partnerCommunities]
    .filter((item) => item.isActive)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);
  const totalParticipants = Math.max(content.socialProof.totalRegistered || 0, 0);
  const eventDates = formatDateRange(content.general.startDate, content.general.endDate);
  const registrationStatusLabel = getStatusLabel(content.general.registrationStatus);
  const registrationStatusClass = getStatusClass(content.general.registrationStatus);
  const heroDescription =
    content.general.heroText?.trim() ||
    "Une mobilisation commune pour unir les communautes Twitch autour d'une cause solidaire.";
  const moodMessage = content.general.moodMessage?.trim();
  const panelClass = "rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))]";
  const cardClass = "rounded-xl border border-white/10 bg-black/20";
  const staffByGroup = {
    organisateur: officialStaffReference.filter((item) => item.group === "organisateur"),
    haut_staff: officialStaffReference.filter((item) => item.group === "haut_staff"),
    staff: officialStaffReference.filter((item) => item.group === "staff"),
    soutien_staff: officialStaffReference.filter((item) => item.group === "soutien_staff"),
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e1118] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#9146ff]/20 blur-[120px]" />
        <div className="absolute right-0 top-28 h-80 w-80 rounded-full bg-[#d4af37]/18 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#4cc9f0]/14 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-8">
        <section
          className="rounded-3xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(212,175,55,0.24)",
            background: "radial-gradient(circle at 10% 12%, rgba(212,175,55,0.22), rgba(24,24,31,0.94) 45%)",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
          }}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d38c]/35 bg-[#f0d38c]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#f0d38c]">
                <Sparkles size={13} />
                Partenariat officiel
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">TENF x UPA Event</h1>
              <p className="mt-3 max-w-3xl text-sm text-gray-200 md:text-base">{heroDescription}</p>
              <p className="mt-3 text-sm text-gray-300">
                {content.general.causeSupported || "Cause solidaire"} - {eventDates}
              </p>
              {moodMessage ? <p className="mt-2 text-sm text-[#f7ecd0]/80">{moodMessage}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={STREAMER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#201b12] transition hover:-translate-y-[1px]"
                  style={{ backgroundColor: "rgba(212,175,55,0.95)" }}
                >
                  Participer comme streamer
                  <ArrowUpRight size={14} />
                </a>
                <a
                  href={MODERATOR_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
                >
                  Moderateur Twitch
                </a>
                <a
                  href={MODERATOR_DISCORD_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
                >
                  Moderateur Discord
                </a>
                <Link
                  href="/upa-event"
                  className="inline-flex rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#f4db97] transition hover:-translate-y-[1px]"
                >
                  Voir la page complete UPA Event
                </Link>
              </div>
            </div>

            <aside className={`${panelClass} p-4`}>
              <div className="space-y-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.09em] ${registrationStatusClass}`}
                >
                  {registrationStatusLabel}
                </span>
                <div className={`${cardClass} p-3`}>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-gray-300">Participants</p>
                  <p className="mt-1 text-2xl font-semibold">{totalParticipants}</p>
                </div>
                <div className={`${cardClass} p-3`}>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-gray-300">Staff reference</p>
                  <p className="mt-1 text-2xl font-semibold">{activeStaff.length}</p>
                </div>
                <div className={`${cardClass} p-3`}>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-gray-300">Periode</p>
                  <p className="mt-1 text-sm font-semibold text-gray-100">{eventDates}</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className={`${panelClass} p-5`}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <HeartHandshake size={16} />
              Pourquoi ce partenariat
            </p>
            <p className="mt-2 text-sm text-gray-300">
              TENF et UPA Event partagent la meme vision: faire de la communaute un levier d&apos;impact concret.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              <li>- Solidarite active autour d&apos;une cause utile</li>
              <li>- Mobilisation des streamers, modos et viewers</li>
              <li>- Evenement encadre avec objectifs clairs</li>
            </ul>
          </article>
          <article className={`${panelClass} p-5`}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Users size={16} />
              Actions immediates
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-200">
              <li>- T&apos;inscrire comme streamer participant</li>
              <li>- Rejoindre l&apos;equipe de moderation volontaire</li>
              <li>- Relayer l&apos;evenement dans ta communaute</li>
              <li>- Suivre les updates sur la page UPA Event</li>
            </ul>
          </article>
          <article className={`${panelClass} p-5`}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck size={16} />
              Liens officiels
            </p>
            <div className="mt-3 space-y-2">
              <a
                href={OFFICIAL_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`block px-3 py-2 text-sm text-gray-200 transition hover:border-[#d4af37]/35 ${cardClass}`}
              >
                Site officiel UPA Event
              </a>
              {officialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block px-3 py-2 text-sm text-gray-200 transition hover:border-[#d4af37]/35 ${cardClass}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </article>
        </section>

        <section className={`${panelClass} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
              <CalendarDays size={18} />
              Timeline evenement
            </h2>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.09em] text-gray-300">
              {activeTimeline.length} etapes
            </span>
          </div>

          {activeTimeline.length === 0 ? (
            <p className="mt-2 text-sm text-gray-300">La timeline detaillee sera publiee prochainement.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {activeTimeline.map((item) => (
                <article key={item.id} className={`${cardClass} p-4`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.09em] text-[#d8b96b]">{item.dateLabel || "A definir"}</p>
                    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-gray-200">
                      {getTimelineStatusLabel(item.status)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {partnerCommunities.length > 0 ? (
          <section className={`${panelClass} p-5`}>
            <h2 className="text-xl font-semibold">Communautes partenaires</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {partnerCommunities.map((partner) => (
                <article key={partner.id} className={`${cardClass} p-4`}>
                  <h3 className="text-base font-semibold">{partner.name}</h3>
                  <p className="mt-2 text-sm text-gray-300">{partner.description || "Partenaire communautaire UPA Event."}</p>
                  {partner.url ? (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#d8b96b]"
                    >
                      Voir la communaute
                      <ArrowUpRight size={12} />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className={`${panelClass} p-5`}>
            <h2 className="text-xl font-semibold">Equipe UPA Event</h2>
            <p className="mt-2 text-sm text-gray-300">
              Descriptifs de reference fournis pour harmoniser la presentation sans erreur.
            </p>
            <div className="mt-4 space-y-4">
              {(Object.keys(staffByGroup) as Array<keyof typeof staffByGroup>).map((groupKey) => {
                const items = staffByGroup[groupKey];
                if (items.length === 0) return null;
                return (
                  <section key={groupKey} className={`${cardClass} p-4`}>
                    <h3 className="border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#d8b96b]">
                      {groupLabel(groupKey)}
                    </h3>
                    <div
                      className={`mt-3 grid grid-cols-1 gap-2.5 ${
                        groupKey === "organisateur" || groupKey === "soutien_staff" ? "sm:grid-cols-1" : "sm:grid-cols-2"
                      }`}
                    >
                      {items.map((item) => (
                        <article
                          key={`${groupKey}-${item.twitchLogin}-${item.role}`}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
                        >
                          <p className="text-sm font-semibold lowercase tracking-[0.01em] text-white">{item.twitchLogin}</p>
                          <p className="mt-0.5 text-sm font-medium text-gray-200">{item.role}</p>
                          {item.description ? (
                            <p className="mt-2 text-xs leading-[1.45] text-gray-300">{item.description}</p>
                          ) : (
                            <p className="mt-2 text-xs leading-[1.45] text-gray-400">Role de soutien sur l&apos;evenement UPA.</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section className={`${panelClass} p-5`}>
            <h2 className="text-xl font-semibold">FAQ rapide</h2>
            <div className="mt-4 space-y-3">
              {(activeFaq.length > 0 ? activeFaq : fallbackFaq).map((faq, index) => (
                <article key={"id" in faq ? faq.id : `fallback-${index}`} className={`${cardClass} p-4`}>
                  <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                  <p className="mt-2 text-sm text-gray-300">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-[#d4af37]/30 bg-[linear-gradient(145deg,rgba(40,33,17,0.88),rgba(26,23,18,0.88))] p-6 text-center md:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[#f0d38c]">Mobilisation commune</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Rejoins la dynamique TENF x UPA Event</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-[#f7ecd0]/90 md:text-base">
            On ne construit pas seulement un evenement: on construit un impact collectif, durable et humain.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <a
              href={STREAMER_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#d4af37] px-5 py-2 text-sm font-semibold text-[#201b12] transition hover:-translate-y-[1px]"
            >
              Je participe en streamer
            </a>
            <a
              href={MODERATOR_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#f0d38c]/45 bg-[#f0d38c]/10 px-5 py-2 text-sm font-semibold text-[#f8e3b2] transition hover:-translate-y-[1px]"
            >
              Je deviens moderateur
            </a>
            <Link
              href="/upa-event"
              className="rounded-full border border-white/25 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
            >
              Voir tous les details
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

