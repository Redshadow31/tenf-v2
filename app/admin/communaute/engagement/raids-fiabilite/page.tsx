import Link from "next/link";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Heart,
  Info,
  Radio,
  ShieldAlert,
  Users,
} from "lucide-react";

const BASE = "/admin/communaute/engagement";

const HREF = {
  hub: BASE,
  eventsub: `${BASE}/raids-eventsub`,
  signalements: `${BASE}/signalements-raids`,
  historique: `${BASE}/historique-raids`,
  pointsDiscord: `${BASE}/points-discord`,
  follow: `${BASE}/follow`,
  membres: "/admin/membres",
} as const;

const panel =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20";
const quickBtn =
  "inline-flex min-h-[2.75rem] flex-wrap items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/30 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-900/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080f] sm:px-4 sm:text-sm";

export default function RaidsFiabiliteLandingPage() {
  return (
    <div className="min-h-screen bg-[#07080f] px-3 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-[1480px]">
        <Link
          href={HREF.hub}
          className="inline-flex items-center gap-2 text-xs font-medium text-violet-200/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080f]"
        >
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Hub engagement
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-10 md:space-y-12">
            {/* 1 — Header compact */}
            <header className={`${panel} p-5 sm:p-6`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
                Communauté · Engagement · Staff
              </p>
              <h1 className="mt-2 text-[clamp(1.45rem,1.15rem+1.1vw,2rem)] font-semibold tracking-tight text-white">
                Fiabilité des raids
            </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Comprendre, vérifier et corriger les données raids TENF sans casser la confiance entre membres.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                Ce pilier relie les raids détectés automatiquement, les retours membres et l’historique consolidé.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                EventSub, signalements et historique ne racontent pas toujours la même chose. Cette page aide le staff à savoir où
                regarder et dans quel ordre.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={HREF.eventsub} className={quickBtn}>
                  Ouvrir EventSub
                  <Radio className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link href={HREF.signalements} className={quickBtn}>
                  Voir les signalements
                  <ShieldAlert className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link href={HREF.historique} className={quickBtn}>
                  Consulter l’historique
                  <Archive className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
          </div>
        </header>

            {/* 2 — Pourquoi ce pilier existe */}
            <section className={`${panel} p-5 sm:p-6`} aria-labelledby="why-heading">
              <h2 id="why-heading" className="text-base font-semibold text-zinc-100">
                Pourquoi ce pilier existe
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/90" aria-hidden />
                  <span>
                    <strong className="font-medium text-zinc-200">Les raids sont au cœur de l’entraide TENF.</strong> Ils
                    matérialisent un geste concret entre créateurs.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
                  <span>
                    <strong className="font-medium text-zinc-200">Les données automatiques peuvent avoir des écarts.</strong>{" "}
                    Retard, doublon, cible ambiguë ou déclaration manquante : c’est normal qu’on doive recouper.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90" aria-hidden />
                  <span>
                    <strong className="font-medium text-zinc-200">Le staff corrige avec prudence, transparence et traçabilité.</strong>{" "}
                    Chaque correction peut impacter la reconnaissance d’un membre ou des récompenses : on prend le temps.
                  </span>
                </li>
              </ul>
              <p className="mt-5 rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-400">
                Un raid oublié, mal attribué ou dupliqué peut fausser l’engagement d’un membre, les points Discord ou la lecture
                globale de l’entraide. Cette zone sert à <strong className="text-zinc-200">vérifier les données</strong> avant de tirer
                des conclusions.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Les raids sont une preuve concrète d’entraide dans TENF. Mais entre les données Twitch, les déclarations membres,
                les oublis, les doublons et les corrections, une lecture trop rapide peut créer des injustices. Le pilier Raids
                Fiabilité sert à garder une donnée propre, vérifiable et compréhensible.
              </p>
            </section>

            {/* 3 — Les 3 sources de vérité */}
            <section aria-labelledby="sources-heading">
              <h2 id="sources-heading" className="text-base font-semibold text-zinc-100">
                Les 3 sources de vérité
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Chaque outil répond à une question différente. Les utiliser dans le bon ordre évite les erreurs et rassure le staff.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className={`${panel} flex min-w-0 flex-col p-5`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-950/30 text-sky-200" aria-hidden>
                    <Radio className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">EventSub — ce que Twitch détecte</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    Source automatique. Utile pour repérer les raids captés par Twitch, suivre la synchronisation et identifier les
                    écarts techniques.{" "}
                    <span className="text-zinc-500">
                      EventSub correspond à la remontée automatique côté Twitch : c’est la première source à consulter pour comprendre
                      ce qui a été détecté techniquement.
                    </span>
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-600">Quand l’ouvrir</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Dès qu’un cas “ne colle pas” ou pour vérifier si Twitch a bien vu le raid avant de traiter un signalement.
                  </p>
                  <Link
                    href={HREF.eventsub}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-200 underline-offset-2 hover:text-sky-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    aria-label="Ouvrir la page EventSub — source automatique Twitch"
                  >
                    Ouvrir EventSub
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>

                <article className={`${panel} flex min-w-0 flex-col p-5`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-950/25 text-amber-200" aria-hidden>
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">Signalements — ce que les membres remontent</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    Source humaine. Utile quand un raid n’apparaît pas, semble mal lié ou demande une vérification par le staff.{" "}
                    <span className="text-zinc-500">
                      Les signalements permettent aux membres ou au staff de remonter un écart : raid manquant, attribution douteuse,
                      doublon ou situation à vérifier.
                    </span>
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-600">Quand l’ouvrir</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Après un coup d’œil EventSub, pour traiter ce que la communauté voit et ne retrouve pas dans les chiffres.
                  </p>
                  <Link
                    href={HREF.signalements}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200 underline-offset-2 hover:text-amber-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    aria-label="Traiter les signalements raids membres"
                  >
                    Traiter les signalements
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>

                <article className={`${panel} flex min-w-0 flex-col p-5`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-950/25 text-violet-200" aria-hidden>
                    <Archive className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">Historique — la vision complète</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    Vue de contrôle. Utile pour comparer les volumes, repérer les doublons, analyser un mois et corriger les anomalies.{" "}
                    <span className="text-zinc-500">
                      L’historique consolide les données pour le mois sélectionné : c’est l’endroit idéal pour les tendances et les
                      corrections structurées.
                    </span>
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-600">Quand l’ouvrir</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Pour auditer un mois, avant une communication aux membres ou après plusieurs corrections ponctuelles.
                  </p>
                  <Link
                    href={HREF.historique}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-200 underline-offset-2 hover:text-violet-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    aria-label="Voir l’historique consolidé des raids"
                  >
                    Voir l’historique
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </div>
            </section>

            {/* 4 — Parcours recommandé */}
            <section className={`${panel} p-5 sm:p-6`} aria-labelledby="parcours-heading">
              <h2 id="parcours-heading" className="text-base font-semibold text-zinc-100">
                Parcours recommandé
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ordre de travail conseillé — à adapter selon l’urgence du dossier.
              </p>
              <ol className="mt-5 space-y-5 text-sm leading-relaxed text-zinc-400">
                <li className="flex flex-wrap gap-3 border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-950/40 text-xs font-bold text-violet-200">
                    1
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-200">Vérifier EventSub</h3>
                    <p className="mt-1">
                      Commence par la source automatique pour voir ce que Twitch a réellement remonté sur le raid concerné.
                    </p>
                  </div>
                </li>
                <li className="flex flex-wrap gap-3 border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/30 text-xs font-bold text-amber-200">
                    2
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-200">Comparer avec les signalements</h3>
                    <p className="mt-1">
                      Regarde les déclarations membres pour repérer les écarts humains, les oublis ou les cas ambigus.
                    </p>
                  </div>
                </li>
                <li className="flex flex-wrap gap-3 border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-950/40 text-xs font-bold text-violet-200">
                    3
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-200">Consolider dans l’historique</h3>
                    <p className="mt-1">
                      Utilise l’historique pour contrôler les volumes, les doublons et la cohérence sur le mois.
                    </p>
                  </div>
                </li>
                <li className="flex flex-wrap gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-xs font-bold text-emerald-200">
                    4
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-200">Passer aux Points Discord</h3>
                    <p className="mt-1">
                      Une fois les données raids fiables, les points peuvent être validés plus sereinement. Les points Discord doivent
                      s’appuyer sur des données raids fiables : avant d’attribuer ou de corriger des points, vérifie que le raid est bien
                      identifié.
                    </p>
                    <Link
                      href={HREF.pointsDiscord}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-200 underline-offset-2 hover:text-emerald-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                      aria-label="Ouvrir la page Points Discord"
                    >
                      Ouvrir Points Discord
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              </ol>
            </section>

            {/* 5 — Règles de prudence staff */}
            <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:p-6" aria-labelledby="prudence-heading">
              <div className="flex flex-wrap items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                <div className="min-w-0">
                  <h2 id="prudence-heading" className="text-base font-semibold text-amber-100">
                    Règles de prudence staff
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-amber-100/85">
                    Une donnée raid n’est pas qu’un chiffre. Elle peut toucher à la reconnaissance d’un membre, à son engagement et à
                    ses récompenses. En cas de doute, privilégie la vérification plutôt que la correction rapide.
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-amber-50/90 marker:text-amber-400/80">
                    <li>Ne supprime jamais un raid sans vérifier la source (auto, déclaration, historique).</li>
                    <li>Compare EventSub, déclaration membre et historique si le cas est sensible.</li>
                    <li>Une correction peut impacter les points Discord : recoupe avant d’agir.</li>
                    <li>Les actions destructrices doivent rester exceptionnelles et confirmées.</li>
                    <li>En cas de doute, note le contexte ou demande un deuxième avis.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6 — Impact communauté */}
            <section aria-labelledby="impact-heading">
              <h2 id="impact-heading" className="text-base font-semibold text-zinc-100">
                Pourquoi c’est important pour les créateurs TENF
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-500">
                Derrière chaque ligne, il y a une personne qui stream et s’investit dans l’entraide.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <article className={`${panel} p-4`}>
                  <div className="flex items-center gap-2 text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    <h3 className="text-sm font-semibold text-white">Reconnaissance juste</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Éviter qu’un membre perde la trace de son entraide à cause d’un chiffre erroné ou incomplet.
                  </p>
                </article>
                <article className={`${panel} p-4`}>
                  <div className="flex items-center gap-2 text-sky-200">
                    <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                    <h3 className="text-sm font-semibold text-white">Points cohérents</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Éviter d’attribuer trop ou trop peu en s’appuyant sur des raids mal identifiés.
                  </p>
                </article>
                <article className={`${panel} p-4`}>
                  <div className="flex items-center gap-2 text-violet-200">
                    <Heart className="h-4 w-4 shrink-0" aria-hidden />
                    <h3 className="text-sm font-semibold text-white">Confiance</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Garder une lecture transparente et compréhensible pour le staff comme pour les membres.
                  </p>
                </article>
              </div>
            </section>

            {/* 7 — Liens associés */}
            <section className={`${panel} p-5 sm:p-6`} aria-labelledby="associes-heading">
              <h2 id="associes-heading" className="text-base font-semibold text-zinc-100">
                Liens associés
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ressources utiles autour du pilier raids — chaque lien précise quand t’en servir.
              </p>
              <ul className="mt-4 divide-y divide-white/[0.06] text-sm">
                <li className="flex flex-col gap-1 py-4 first:pt-0">
                  <Link
                    href={HREF.pointsDiscord}
                    className="font-semibold text-emerald-200 underline-offset-2 hover:text-emerald-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Points Discord
                  </Link>
                  <span className="text-zinc-500">À utiliser après validation des raids, quand les preuves sont alignées.</span>
                </li>
                <li className="flex flex-col gap-1 py-4">
                  <Link
                    href={HREF.follow}
                    className="font-semibold text-sky-200 underline-offset-2 hover:text-sky-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Follow — réseau Twitch
                  </Link>
                  <span className="text-zinc-500">À utiliser pour comprendre le réseau de follow et le pilotage associé.</span>
                </li>
                <li className="flex flex-col gap-1 py-4">
                  <Link
                    href={HREF.membres}
                    className="inline-flex items-center gap-2 font-semibold text-violet-200 underline-offset-2 hover:text-violet-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <Users className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    Membres (gestion)
                  </Link>
                  <span className="text-zinc-500">À utiliser pour vérifier une fiche, un pseudo ou le statut d’un membre.</span>
                </li>
                <li className="flex flex-col gap-1 py-4 last:pb-0">
                  <Link
                    href={HREF.hub}
                    className="font-semibold text-zinc-200 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Hub Engagement
                  </Link>
                  <span className="text-zinc-500">Vue d’ensemble des outils d’engagement (follow, feuilles, etc.).</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Panneau latéral — desktop sticky */}
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="Résumé et raccourcis">
            <div className={`${panel} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">À retenir</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                <strong className="text-white">Raid fiable</strong> = source cohérente + membre identifié + absence de doublon.
              </p>
            </div>
            <div className={`${panel} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Les 3 outils</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href={HREF.eventsub} className="text-sky-200/90 underline-offset-2 hover:underline">
                    EventSub
                  </Link>
                  <span className="block text-xs text-zinc-500">Automatique Twitch</span>
                </li>
                <li>
                  <Link href={HREF.signalements} className="text-amber-200/90 underline-offset-2 hover:underline">
                    Signalements
                  </Link>
                  <span className="block text-xs text-zinc-500">Retours membres</span>
                </li>
                <li>
                  <Link href={HREF.historique} className="text-violet-200/90 underline-offset-2 hover:underline">
                    Historique
                  </Link>
                  <span className="block text-xs text-zinc-500">Contrôle mensuel</span>
                </li>
              </ul>
            </div>
            <div className={`${panel} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Checklist rapide</p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-emerald-400/90" aria-hidden>
                    ✓
                  </span>
                  <span>EventSub consulté pour le cas</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400/90" aria-hidden>
                    ✓
                  </span>
                  <span>Signalements / déclarations relus si besoin</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400/90" aria-hidden>
                    ✓
                  </span>
                  <span>Historique ouvert si doute sur le mois</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400/90" aria-hidden>
                    ✓
                  </span>
                  <span>Points Discord vérifiés en dernier</span>
                </li>
              </ul>
            </div>
            <div className={`${panel} border-rose-500/20 bg-rose-950/15 p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-200/90">Risque</p>
              <p className="mt-2 text-xs leading-relaxed text-rose-100/85">
                Supprimer ou fusionner sans recoupe peut pénaliser un membre. Les écrans sensibles demandent une confirmation explicite
                — garde ce réflexe.
              </p>
            </div>
            <div className={`${panel} p-4`}>
              <Link
                href={HREF.pointsDiscord}
                className="inline-flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Points Discord
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
