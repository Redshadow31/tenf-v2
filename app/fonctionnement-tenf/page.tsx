"use client";

import { useState } from "react";
import { getRoleBadgeClassName } from "@/lib/roleBadgeSystem";
import styles from "./fonctionnement.module.css";

// Lien unique Discord pour tous les achats
const DISCORD_SHOP_URL = "https://discord.com/channels/535244857891880970/1278839967962894459";

// Structure des items de la boutique
interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "defis" | "promo" | "coaching" | "spotlight";
  cooldown?: string;
  limited?: string;
  popular?: boolean;
}

const shopItems: ShopItem[] = [
  // 🎲 Défis & fun en live
  {
    id: "defi-rigolo",
    title: "Défi rigolo à faire en live",
    description: "Le staff te propose un mini défi fun (voix bizarre, mot interdit, etc.).",
    price: 2.5,
    category: "defis",
  },
  // 📣 Promo & visibilité
  {
    id: "evenement-discord",
    title: "Création d'un événement Discord à ton nom hors live twitch (interdit)",
    description: "Soirée organisée autour de ton jeu ou ton univers (Fall Guys, Mario Kart...).",
    price: 3,
    category: "promo",
  },
  {
    id: "post-reseaux",
    title: "Post Réseaux Promo créateur",
    description: "Mise en avant de ta chaîne sur le compte officiel TENF (jours de live, lien, description).",
    price: 6,
    category: "promo",
    cooldown: "2 mois",
  },
  {
    id: "interview-post",
    title: "Interview + post créateur (salon / site / réseaux)",
    description: "Tu passes à l'honneur avec un post complet sur ton univers.",
    price: 10,
    category: "promo",
    cooldown: "3 mois",
  },
  // 🧰 Coaching & outils
  {
    id: "test-concept",
    title: "Test de concept de live (avec feedback)",
    description: "Le staff assiste à ton live original et te fait un retour : potentiel, ambiance, contenu à améliorer.",
    price: 6,
    category: "coaching",
  },
  {
    id: "coaching-identite",
    title: "Coaching privé : identité de chaîne",
    description: "20 min de réflexion guidée pour trouver ton positionnement, ton style, tes objectifs.",
    price: 7,
    category: "coaching",
  },
  {
    id: "mini-analyse",
    title: "Mini-analyse de chaîne (15 min vocal)",
    description: "Retour express sur ton profil Twitch (visuels, bio, présentation) avec conseils personnalisés.",
    price: 9,
    category: "coaching",
    cooldown: "3 mois",
    limited: "3 membres par semaine",
  },
  {
    id: "feedback-vod",
    title: "Feedback personnalisé sur un live (VOD)",
    description: "Analyse de ton replay (15 à 30 min) + retour écrit ou vocal détaillé.",
    price: 12,
    category: "coaching",
  },
  {
    id: "coaching-outils",
    title: "Coaching outils (Canva, Wizebot, OBS...)",
    description: "Formation privée de 30–45 min sur l'outil de ton choix. Partage d'écran possible.",
    price: 12,
    category: "coaching",
  },
  {
    id: "analyse-complete",
    title: "Analyse complète de chaîne (Pro Review)",
    description: "Analyse approfondie de ton profil, overlays, live, ambiance, contenu, différenciation + stratégie.",
    price: 25,
    category: "coaching",
    popular: true,
  },
  // 🌟 Spotlight & premium
  {
    id: "spotlight",
    title: "Spotlight New Family",
    description: "Spotlight New Family – Un moment pour briller ✨\n\nUne fois votre achat validé, ouvrez un ticket pour réserver la date et l'heure.\n\nLe Spotlight est une mise en avant d'une heure pour présenter ton univers, rencontrer la New Family et créer de vrais liens.\n\nLimité à 1 Spotlight par mois pour chaque créateur.",
    price: 30,
    category: "spotlight",
    limited: "1 par mois",
    popular: true,
  },
  {
    id: "pack-refonte",
    title: "Pack refonte complète de Chaîne",
    description: "Pack comprenant une refonte totale de ta chaîne créée par Nexou selon tes goûts comprenant :\n\n• Bannière Twitch et Image de Profil.\n• Panneaux de Bio (à propos).\n• Emotes (non animées).\n• Scènes et Overlays pour OBS / Streamlabs.\n• Transition personnalisée (Stinger).",
    price: 100,
    category: "spotlight",
    popular: true,
  },
];

const categories = [
  {
    id: "defis",
    name: "Défis & fun en live",
    icon: "🎲",
    description: "Des challenges ludiques pour animer tes lives",
  },
  {
    id: "promo",
    name: "Promo & visibilité",
    icon: "📣",
    description: "Boost ta visibilité sur TENF et les réseaux",
  },
  {
    id: "coaching",
    name: "Coaching & outils",
    icon: "🧰",
    description: "Accompagnement personnalisé pour progresser",
  },
  {
    id: "spotlight",
    name: "Spotlight & premium",
    icon: "🌟",
    description: "Services premium et mises en avant exclusives",
  },
];

type TabId = "integration" | "reglement" | "systeme-points" | "boutique-points" | "spotlight" | "conseil";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "integration", label: "Intégration" },
  { id: "reglement", label: "Règlement" },
  { id: "systeme-points", label: "Système de points" },
  { id: "boutique-points", label: "Boutique" },
  { id: "spotlight", label: "Spotlight" },
  { id: "conseil", label: "Conseils" },
];

const tabUiMeta: Record<TabId, { icon: string; subtitle: string }> = {
  integration: {
    icon: "✨",
    subtitle: "Onboarding progressif pour bien démarrer dans TENF.",
  },
  reglement: {
    icon: "📜",
    subtitle: "Cadre clair pour garder une ambiance saine et bienveillante.",
  },
  "systeme-points": {
    icon: "⭐",
    subtitle: "Ton implication se transforme en progression concrète.",
  },
  "boutique-points": {
    icon: "🛍️",
    subtitle: "Récompenses utiles, fun et orientées évolution de chaîne.",
  },
  spotlight: {
    icon: "🌟",
    subtitle: "Moments de visibilité communautaire et soutien collectif.",
  },
  conseil: {
    icon: "🎯",
    subtitle: "Conseils pratiques pour progresser avec régularité.",
  },
};

type TabGuidance = {
  tldr: string[];
  accordions: {
    key: "essentiel" | "bonnes-pratiques" | "details";
    title: string;
    text: string;
  }[];
  cta: {
    title: string;
    description: string;
    buttonLabel: string;
    targetTab: TabId;
  };
};

const tabGuidance: Record<TabId, TabGuidance> = {
  integration: {
    tldr: [
      "Respecte les étapes d’arrivée pour une intégration solide",
      "Participe aux échanges et aux événements communautaires",
      "Demande de l’aide: l’entraide est le cœur de TENF",
      "Évite les actions passives: l’implication fait la différence",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Remplis ton intégration, participe à la réunion, puis prends place dans la vie du serveur pour créer tes premiers liens.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Présente-toi clairement, pose des questions, rejoins les lives et les events pour avancer plus vite avec les autres membres.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les évaluations et l’évolution des rôles servent à suivre ta progression, pas à sanctionner. Le but est d’accompagner durablement.",
      },
    ],
    cta: {
      title: "Prêt à passer à l’étape suivante ?",
      description: "Découvre les règles clés pour garder un cadre sain et bienveillant.",
      buttonLabel: "Voir le règlement",
      targetTab: "reglement",
    },
  },
  reglement: {
    tldr: [
      "Respect et bienveillance en priorité",
      "Participation active sans spam ni comportements toxiques",
      "Cadre vocal et textuel clair pour tous",
      "Le staff protège la communauté quand nécessaire",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le règlement existe pour protéger la communauté. Respect, écoute et entraide sont non négociables.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Privilégie les échanges constructifs, évite les tensions publiques et contacte le staff en cas de besoin.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les règles couvrent les salons textuels, vocaux et comportements globaux. Le but est de préserver un espace sûr.",
      },
    ],
    cta: {
      title: "Tu veux transformer ton implication en progression ?",
      description: "Passe au système de points pour comprendre comment ton engagement est valorisé.",
      buttonLabel: "Voir le système de points",
      targetTab: "systeme-points",
    },
  },
  "systeme-points": {
    tldr: [
      "Les points valorisent l’implication, pas la compétition",
      "Quêtes, entraide, raids, événements: tout compte",
      "Des bonus réguliers renforcent la progression",
      "Pas de triche/spam: qualité > quantité",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le système de points récompense la présence utile et les actions qui font grandir la communauté.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Reste régulier, participe proprement, et privilégie les actions d’entraide concrètes plutôt que les actions artificielles.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Certaines actions demandent un format précis ou une preuve. Les règles détaillées sont listées dans les sections ci-dessous.",
      },
    ],
    cta: {
      title: "Tes points, tu les utilises comment ?",
      description: "Découvre la boutique pour convertir ton engagement en récompenses utiles ou fun.",
      buttonLabel: "Voir la boutique",
      targetTab: "boutique-points",
    },
  },
  "boutique-points": {
    tldr: [
      "Choisis une récompense adaptée à ton objectif",
      "Achat via Discord puis ticket obligatoire",
      "Cool-down et limites selon les items",
      "Communication claire = traitement plus rapide",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Après achat, ouvre un ticket avec les infos demandées. Sans ticket, la demande ne peut pas être traitée.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton pseudo, tes disponibilités et tes liens utiles dès le départ pour éviter les allers-retours.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Certaines récompenses ont des délais, quotas ou cooldown. Vérifie chaque carte avant de valider.",
      },
    ],
    cta: {
      title: "Envie d’aller plus loin dans la mise en avant ?",
      description: "Le Spotlight t’explique comment créer un vrai temps fort communautaire.",
      buttonLabel: "Comprendre le spotlight",
      targetTab: "spotlight",
    },
  },
  spotlight: {
    tldr: [
      "Le spotlight valorise un créateur dans un cadre communautaire",
      "Viewer ou streamer: chacun a un rôle utile",
      "Présence possible sans pression inutile",
      "Objectif: lien humain, découverte, soutien",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "Le spotlight est un moment collectif pour mettre en lumière un membre et renforcer la cohésion TENF.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton passage, communique clairement et adopte une posture d’entraide des deux côtés (viewer/streamer).",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les recommandations détaillent ce qui est attendu avant, pendant et après un spotlight pour une expérience réussie.",
      },
    ],
    cta: {
      title: "Tu veux optimiser ta présence globale ?",
      description: "Passe aux conseils pour consolider ton rythme, ta communication et ton bien-être.",
      buttonLabel: "Voir les conseils",
      targetTab: "conseil",
    },
  },
  conseil: {
    tldr: [
      "Construis une présence régulière et soutenable",
      "Soigne ton image et tes interactions",
      "Protège ton énergie mentale dans la durée",
      "Reste aligné avec les valeurs TENF",
    ],
    accordions: [
      {
        key: "essentiel",
        title: "Essentiel",
        text: "La régularité et la cohérence priment sur l’intensité ponctuelle. Garde un rythme que tu peux tenir.",
      },
      {
        key: "bonnes-pratiques",
        title: "Bonnes pratiques",
        text: "Prépare ton contenu, anticipe ta communication et reste bienveillant sur toutes les plateformes.",
      },
      {
        key: "details",
        title: "Détails",
        text: "Les sections listent des conseils concrets sur image, positionnement, réseau et équilibre personnel.",
      },
    ],
    cta: {
      title: "Prêt pour ton prochain cap TENF ?",
      description: "Reviens à l’intégration pour valider les bases et relancer ton parcours communautaire.",
      buttonLabel: "Revenir à l’intégration",
      targetTab: "integration",
    },
  },
};

function BoutiquePointsContent() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const filteredItems = selectedCategory
    ? shopItems.filter((item) => item.category === selectedCategory)
    : shopItems;

  const ticketExample = `Récompense achetée : [Nom de la récompense]
Pseudo Twitch : [Ton pseudo]
Disponibilités : [Tes dispos si planification nécessaire]
Détails utiles : [Lien VOD si feedback, etc.]`;

  const copyTicketExample = () => {
    navigator.clipboard.writeText(ticketExample);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const scrollToRewards = () => {
    const element = document.getElementById("recompenses");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTicket = () => {
    const element = document.getElementById("rappel-ticket");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
          🛍️ Boutique des points TENF
        </h1>
        <p className="text-xl md:text-2xl" style={{ color: 'var(--color-text-secondary)' }}>
          Dépense tes points pour du fun en live, de la visibilité et du coaching.
        </p>
        <div className="rounded-lg border p-4 max-w-2xl mx-auto" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
          <p className="text-white font-semibold">
            🛒 Les achats se font sur Discord (salon 🛒・boutique-des-streamers).
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={scrollToRewards}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Voir les récompenses
          </button>
          <a
            href={DISCORD_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 inline-block"
            style={{ backgroundColor: 'var(--color-primary-dark)' }}
          >
            Accéder à la boutique Discord
          </a>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE ? */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--color-text)' }}>
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 border text-center shop-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>1. Choisis une récompense</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Parcours les catégories et sélectionne ce qui t'intéresse</p>
          </div>
          <div className="rounded-xl p-6 border text-center shop-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>2. Clique sur "🛒 Acheter sur Discord"</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Tu seras redirigé vers le salon Discord de la boutique</p>
          </div>
          <div className="rounded-xl p-6 border text-center shop-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-4xl mb-3">📩</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>3. Ouvre un ticket après achat</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Obligatoire pour traiter ta demande</p>
          </div>
        </div>

        {/* Exemple de ticket */}
        <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Exemple de ticket :</h3>
          <div className="bg-[var(--color-surface)] rounded-lg p-4 border relative" style={{ borderColor: 'var(--color-border)' }}>
            <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{ticketExample}</pre>
            <button
              onClick={copyTicketExample}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ backgroundColor: copiedTicket ? '#10b981' : 'var(--color-primary)' }}
            >
              {copiedTicket ? '✓ Copié !' : '📋 Copier'}
            </button>
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section id="recompenses" className="space-y-6">
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--color-text)' }}>
          Catégories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl p-6 border text-center transition-all shop-category ${
              selectedCategory === null ? 'shop-category-active' : ''
            }`}
            style={{
              backgroundColor: selectedCategory === null ? 'var(--color-primary)' : 'var(--color-card)',
              borderColor: selectedCategory === null ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          >
            <div className="text-3xl mb-2">✨</div>
            <h3 className={`font-semibold mb-1 ${selectedCategory === null ? 'text-white' : ''}`} style={selectedCategory === null ? {} : { color: 'var(--color-text)' }}>
              Toutes
            </h3>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl p-6 border text-center transition-all shop-category ${
                selectedCategory === cat.id ? 'shop-category-active' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-card)',
                borderColor: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className={`font-semibold mb-1 ${selectedCategory === cat.id ? 'text-white' : ''}`} style={selectedCategory === cat.id ? {} : { color: 'var(--color-text)' }}>
                {cat.name}
              </h3>
              <p className={`text-sm ${selectedCategory === cat.id ? 'text-white/90' : ''}`} style={selectedCategory === cat.id ? {} : { color: 'var(--color-text-secondary)' }}>
                {cat.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* CARTES ITEMS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--color-text)' }}>
          Récompenses disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-6 border shop-item relative"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              {item.popular && (
                <span className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  ⭐ Populaire
                </span>
              )}
              <h3 className="text-lg font-semibold mb-3 pr-16" style={{ color: 'var(--color-text)' }}>
                {item.title}
              </h3>
              <p className="text-sm mb-4 whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                {item.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.cooldown && (
                  <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', color: 'var(--color-primary)' }}>
                    Cooldown: {item.cooldown}
                  </span>
                )}
                {item.limited && (
                  <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', color: 'var(--color-primary)' }}>
                    Limité: {item.limited}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {item.price}k
                </span>
                <a
                  href={DISCORD_SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  🛒 Acheter sur Discord
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ENCADRÉ RAPPEL TICKET */}
      <section id="rappel-ticket" className="shop-ticket-reminder">
        <div className="rounded-xl p-6 border shadow-lg" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
          <h3 className="text-xl font-bold mb-3 text-white">
            ✅ Après chaque achat : ouvre un ticket
          </h3>
          <p className="text-white/90 mb-4">
            <strong>Sans ticket = pas de traitement.</strong>
          </p>
          <p className="text-white/90 mb-4">
            Dans ton ticket, indique :
          </p>
          <ul className="list-disc list-inside text-white/90 mb-4 space-y-1">
            <li>La récompense achetée</li>
            <li>Ton pseudo Twitch</li>
            <li>Tes disponibilités (si planification nécessaire)</li>
            <li>Les détails utiles (lien VOD si feedback, etc.)</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <a
              href={DISCORD_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 inline-block"
              style={{ backgroundColor: 'var(--color-primary-dark)' }}
            >
              Ouvrir la boutique Discord
            </a>
            <button
              onClick={scrollToTicket}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 border-2 border-white"
            >
              Voir la procédure ticket
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--color-text)' }}>
          Questions fréquentes
        </h2>
        {[
          {
            q: "Je viens d'acheter, je fais quoi ?",
            a: "Ouvre un ticket sur Discord en indiquant la récompense achetée, ton pseudo Twitch, tes disponibilités si nécessaire, et tout autre détail utile. Sans ticket, on ne peut pas traiter ta demande.",
          },
          {
            q: "C'est quoi un cooldown ?",
            a: "Un cooldown est un délai d'attente avant de pouvoir racheter la même récompense. Par exemple, si un item a un cooldown de 2 mois, tu devras attendre 2 mois avant de le racheter.",
          },
          {
            q: "Combien de temps pour traiter ?",
            a: "Le temps de traitement varie selon la récompense. Pour les services simples, comptes quelques jours. Pour les services premium comme le Spotlight, cela peut prendre plus de temps pour planifier. On te tiendra informé via ton ticket !",
          },
          {
            q: "Puis-je annuler ?",
            a: "Si tu as déjà effectué l'achat, contacte le staff via ticket pour discuter. Selon l'avancement du traitement, on pourra voir ensemble la meilleure solution. La communication est la clé !",
          },
        ].map((faq, index) => (
          <div
            key={index}
            className="rounded-xl border overflow-hidden shop-faq"
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between transition-all"
              style={{ backgroundColor: expandedFaq === index ? 'var(--color-surface)' : 'transparent' }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {faq.q}
              </h3>
              <span className="text-xl" style={{ color: 'var(--color-primary)' }}>
                {expandedFaq === index ? '−' : '+'}
              </span>
            </button>
            {expandedFaq === index && (
              <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function SpotlightContent() {
  const [activeSubTab, setActiveSubTab] = useState<"viewer" | "streamer">("viewer");

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
          🌟 Spotlight New Family
        </h1>
        <p className="text-xl md:text-2xl" style={{ color: 'var(--color-text-secondary)' }}>
          Un moment pour briller… ensemble
        </p>
      </section>

      {/* Sous-onglets */}
      <div className="flex flex-wrap gap-4 justify-center border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setActiveSubTab("viewer")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg spotlight-subtab"
          style={{
            color: activeSubTab === "viewer" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "viewer" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "viewer" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          👀 Je suis viewer sur un Spotlight
        </button>
        <button
          onClick={() => setActiveSubTab("streamer")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg spotlight-subtab"
          style={{
            color: activeSubTab === "streamer" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "streamer" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "streamer" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          🎤 Je suis le streamer mis en avant
        </button>
      </div>

      {/* Contenu sous-onglet Viewer */}
      {activeSubTab === "viewer" && (
        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Le Spotlight est un moment communautaire important où un membre de la New Family est mis à l'honneur. 
              C'est l'occasion de créer du lien, de soutenir quelqu'un, et de faire grandir l'entraide. 
              <strong style={{ color: 'var(--color-text)' }}> Personne ne peut être présent tout le temps</strong>, 
              et c'est normal. On valorise la présence quand elle est possible, sans pression ni culpabilité.
            </p>
          </section>

          {/* Pourquoi ta présence compte */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              💜 Pourquoi ta présence compte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Soutien d'un membre</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Ta présence, même silencieuse, montre que tu es là pour le streamer. C'est un geste simple mais précieux.</p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Renforcer l'entraide</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Chaque viewer contribue à créer une ambiance bienveillante et à faire vivre l'esprit New Family.</p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Créer des liens humains</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Le Spotlight est l'occasion de découvrir des personnes, de créer des connexions durables, parfois même des amitiés.</p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Faire vivre le Spotlight</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Ton engagement, même minime, participe à la réussite de ce moment unique pour le streamer.</p>
              </div>
            </div>
          </section>

          {/* Prioriser quand tu es disponible */}
          <section className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
              ⭐ Prioriser quand tu es disponible
            </h2>
            <ul className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span><strong style={{ color: 'var(--color-text)' }}>Si tu peux venir</strong> → viens faire un coucou, même pour 5 minutes. Ta présence compte, même courte.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💚</span>
                <span><strong style={{ color: 'var(--color-text)' }}>Si tu ne peux pas</strong> → aucune pression. La vie continue, et c'est parfaitement normal.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💜</span>
                <span><strong style={{ color: 'var(--color-text)' }}>L'intention compte plus</strong> que la présence systématique. On préfère ta présence sincère que ton absence par obligation.</span>
              </li>
            </ul>
          </section>

          {/* Lurker = déjà aider */}
          <section className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              👁️ Lurker = déjà aider
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Le lurk compte autant que les messages.</strong> 
              Ta présence silencieuse apporte déjà beaucoup :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Stats</strong> : chaque viewer compte pour les statistiques Twitch</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Soutien moral</strong> : savoir qu'il y a des gens qui regardent, même en silence, c'est rassurant</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Présence silencieuse</strong> : créer une ambiance communautaire sans avoir besoin de parler</li>
            </ul>
            <p className="leading-relaxed text-lg mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Déculpabilise-toi si tu es discret.</strong> 
              Tu participes déjà, même sans écrire dans le chat.
            </p>
          </section>

          {/* Être actif sans se forcer */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              💬 Être actif sans se forcer
            </h2>
            <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Si tu as envie de participer activement, voici quelques idées simples et naturelles :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">👋</span>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Dire bonjour</strong>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Un simple "salut" ou "bon Spotlight" peut faire la différence.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💬</span>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Répondre à une question</strong>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Si le streamer pose une question, n'hésite pas à partager ton avis.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">❓</span>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Poser une question simple</strong>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Sur le jeu, le stream, ou même juste "comment ça va ?".</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">✨</span>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Rester naturel</strong>
                    <p style={{ color: 'var(--color-text-secondary)' }}>L'important c'est d'être toi-même, pas de jouer un rôle.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ce qu'on évite */}
          <section className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ef4444' }}>
              🌱 Ce qu'on évite
            </h2>
            <ul className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Comparaisons</strong> : éviter de comparer ce Spotlight avec d'autres ou avec tes propres stats</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Ambiance négative</strong> : garder les critiques constructives pour après, pendant le Spotlight on soutient</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Jugement</strong> : chacun a son style, son rythme, sa personnalité. On respecte ça.</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Passage éclair sans interaction</strong> : si tu restes moins de 30 secondes sans rien dire, mieux vaut peut-être revenir plus tard</li>
            </ul>
          </section>
        </div>
      )}

      {/* Contenu sous-onglet Streamer */}
      {activeSubTab === "streamer" && (
        <div className="space-y-8">
          {/* Ce qu'est vraiment un Spotlight */}
          <section className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Ce qu'est vraiment un Spotlight
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Le Spotlight New Family n'est <strong style={{ color: 'var(--color-text)' }}>pas un examen</strong>, 
              pas une course aux stats, pas un test de performance. 
              C'est une <strong style={{ color: 'var(--color-primary)' }}>opportunité humaine et durable</strong> pour :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Présenter ton univers et qui tu es vraiment</li>
              <li>• Rencontrer de nouvelles personnes de la communauté</li>
              <li>• Créer des connexions qui dureront au-delà de cette heure</li>
              <li>• Bénéficier du soutien de la New Family de manière structurée et bienveillante</li>
            </ul>
          </section>

          {/* Une heure guidée */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              🕒 Une heure guidée (structure rassurante)
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Voici un déroulé souple pour t'aider à structurer ton Spotlight. Ce n'est pas strict, c'est un guide :
            </p>
            <div className="space-y-3">
              <div className="rounded-xl p-5 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start">
                  <span className="text-2xl mr-4">👋</span>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>0–5 min : Accueil & présentation</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Dire bonjour, présenter rapidement qui tu es, ce que tu fais, et remercier la communauté.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start">
                  <span className="text-2xl mr-4">💬</span>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>5–15 min : Échange</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Répondre aux questions, échanger avec les viewers, créer du lien.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start">
                  <span className="text-2xl mr-4">🎮</span>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>15–30 min : Ton univers</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Montrer ce que tu aimes, jouer, créer, partager ta passion et ton style.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start">
                  <span className="text-2xl mr-4">💜</span>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>30–45 min : Moment sincère</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Parler de tes objectifs, tes difficultés, tes réussites. C'est le moment de partager humainement.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start">
                  <span className="text-2xl mr-4">🙏</span>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>45–60 min : Remerciements & clôture</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Remercier tous ceux qui sont venus, faire un raid vers un autre membre TENF, et clôturer sur une note positive.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Règles simples et protectrices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              🔒 Règles simples et protectrices
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Duo / co-live</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  À éviter pendant la première heure. Le Spotlight est centré sur <strong style={{ color: 'var(--color-text)' }}>toi</strong>. 
                  Après la première heure, liberté totale pour faire ce que tu veux.
                </p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Pas de multistream</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Pendant ton Spotlight, tu diffuses uniquement sur Twitch. C'est important pour que la communauté puisse te soutenir correctement et que l'heure soit vraiment centrée sur toi.
                </p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Réservation minimum 7 jours avant</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Cela permet de bien communiquer sur ton Spotlight, d'organiser la communauté, et de te préparer sereinement.
                </p>
              </div>
              <div className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Réciprocité bienveillante</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  On encourage à venir aux Spotlights des autres membres quand c'est possible. L'entraide fonctionne dans les deux sens, 
                  et c'est en soutenant les autres qu'on se fait soutenir. <strong style={{ color: 'var(--color-text)' }}>Pas d'obligation</strong>, 
                  juste de la bienveillance.
                </p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Format 1 heure</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Le Spotlight dure environ 1 heure. C'est le temps idéal pour présenter ton univers sans être trop long ni trop court.
                </p>
              </div>
              <div className="rounded-xl p-6 border spotlight-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Raid TENF en fin de Spotlight</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  En fin de Spotlight, on encourage à raider un autre membre TENF. C'est un geste d'entraide qui continue l'esprit du Spotlight.
                </p>
              </div>
            </div>
          </section>

          {/* Ce qu'on souhaite éviter */}
          <section className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ef4444' }}>
              🧡 Ce qu'on souhaite éviter
            </h2>
            <ul className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Live sans présentation</strong> : prendre quelques minutes au début pour te présenter et expliquer ce qui t'a amené ici</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Silence prolongé</strong> : interagir avec le chat, même si les messages sont rares</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Absence d'interaction</strong> : répondre aux questions, poser des questions aux viewers</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Attente uniquement des stats</strong> : le Spotlight n'est pas un concours de vues, c'est un moment humain</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Ne jamais participer aux Spotlights des autres</strong> : l'entraide est réciproque, soutenir les autres fait partie de l'esprit New Family</li>
            </ul>
          </section>

          {/* Accompagnement bienveillant */}
          <section className="rounded-xl p-6 border spotlight-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              🤝 Accompagnement bienveillant
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              L'équipe est là pour t'accompagner avant, pendant et après ton Spotlight :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Rappels en privé</strong> : si quelque chose n'est pas clair, on te rappelle les règles avec bienveillance</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Aide et explication</strong> : on est là pour répondre à tes questions et t'aider à réussir ton Spotlight</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Sanctions rares et jamais immédiates</strong> : on privilégie toujours le dialogue et l'accompagnement avant toute mesure</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              L'objectif c'est que tu passes un bon moment et que la communauté aussi. 
              On est tous dans le même bateau pour faire grandir l'entraide.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function ReglementContent() {
  const [activeSubTab, setActiveSubTab] = useState<"general" | "vocaux">("general");

  return (
    <div className="space-y-8">
      {/* Sous-onglets */}
      <div className="flex flex-wrap gap-4 justify-center border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setActiveSubTab("general")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg reglement-subtab"
          style={{
            color: activeSubTab === "general" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "general" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "general" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          📜 Règlement général TENF
        </button>
        <button
          onClick={() => setActiveSubTab("vocaux")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg reglement-subtab"
          style={{
            color: activeSubTab === "vocaux" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "vocaux" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "vocaux" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          🎧 Règlement des salons vocaux
        </button>
      </div>

      {/* Contenu sous-onglet Règlement général */}
      {activeSubTab === "general" && (
        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              📜 Règlement général – Twitch Entraide New Family
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Bienvenue sur Twitch Entraide New Family (TENF) 💙🐉<br />
              Ce serveur est un espace d&apos;entraide, de respect et de bienveillance.
            </p>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              En rejoignant le serveur, vous acceptez les règles suivantes.
            </p>
          </section>

          {/* 1. Valeurs de la New Family */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              1️⃣ Valeurs de la New Family
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              La New Family repose sur :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>🤝 l&apos;entraide sincère (pas le donnant-donnant forcé)</li>
              <li>🧠 le respect des différences (rythmes, niveaux, personnalités)</li>
              <li>💬 une communication saine et humaine</li>
              <li>🔒 la confiance et la confidentialité</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Tout comportement allant à l&apos;encontre de ces valeurs pourra être sanctionné.
            </p>
          </section>

          {/* 2. Respect & comportement général */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              2️⃣ Respect & comportement général
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Le respect de tous les membres est obligatoire (membres, staff, invités).
            </p>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Sont interdits :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• propos discriminatoires (racisme, sexisme, homophobie, transphobie, etc.)</li>
              <li>• moqueries, humiliations, attaques personnelles</li>
              <li>• harcèlement, pression morale, chantage affectif</li>
              <li>• comportements toxiques ou passifs-agressifs répétés</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Les désaccords sont autorisés dans le calme et le respect.
            </p>
          </section>

          {/* 3. Salons & usage approprié */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              3️⃣ Salons & usage approprié
            </h3>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Chaque salon a un thème précis : merci de le respecter.</li>
              <li>• Le flood, le spam et les hors-sujets répétés ne sont pas tolérés.</li>
              <li>• Les débats sensibles peuvent être stoppés par le staff si nécessaire.</li>
            </ul>
          </section>

          {/* 4. Confidentialité & confiance */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              4️⃣ Confidentialité & confiance
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Ce qui se dit sur TENF reste sur TENF.
            </p>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Il est strictement interdit :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• de partager des messages privés sans accord</li>
              <li>• de sortir des propos de leur contexte</li>
              <li>• d&apos;utiliser le serveur pour nuire à d&apos;autres communautés</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Toute atteinte à la confidentialité est prise très au sérieux.
            </p>
          </section>

          {/* 5. Intégration & fonctionnement */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              5️⃣ Intégration & fonctionnement
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              L&apos;accès complet à l&apos;entraide et à la promotion nécessite :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• la lecture du règlement</li>
              <li>• la participation à une réunion d&apos;intégration</li>
            </ul>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Certaines fonctionnalités sont volontairement limitées avant intégration.<br />
              Ce n&apos;est pas une punition, mais un cadre.
            </p>
          </section>

          {/* 6. Entraide & promotion */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              6️⃣ Entraide & promotion
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              L&apos;entraide sur TENF est humaine, pas automatique.<br />
              Les follows, vues et participations doivent être authentiques.
            </p>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Sont interdits :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• les demandes insistantes de follows, vues ou subs</li>
              <li>• la consommation de l&apos;entraide sans jamais y participer</li>
              <li>• le contournement du système (pressions, comparaisons, multi-comptes)</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              L&apos;implication est évaluée dans la durée, pas sur un coup d&apos;éclat.
            </p>
          </section>

          {/* 7. Attitude attendue des créateurs */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              7️⃣ Attitude attendue des créateurs
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Être créateur sur TENF implique :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• le respect du cadre</li>
              <li>• une régularité minimale</li>
              <li>• une participation honnête à l&apos;entraide</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Un désengagement prolongé ou un comportement nuisible peut entraîner un changement de rôle (ex : Communauté).
            </p>
          </section>

          {/* 8. Rôles, évaluations & décisions du staff */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              8️⃣ Rôles, évaluations & décisions du staff
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Les rôles (Créateur, Communauté, VIP, etc.) sont attribués selon des critères définis par le staff.<br />
              Les évaluations servent à améliorer l&apos;entraide : elles sont internes, non publiques et non comparables.
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Les décisions du staff doivent être respectées.
            </p>
          </section>

          {/* 9. Publicité & partenariats */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              9️⃣ Publicité & partenariats
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Toute publicité, lien externe ou partenariat doit respecter les salons prévus à cet effet.<br />
              La promotion sauvage ou non autorisée est interdite.
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              TENF n&apos;est pas un serveur de publicité, mais une communauté d&apos;entraide.
            </p>
          </section>

          {/* 10. Sanctions */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              🔟 Sanctions
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Selon la gravité ou la répétition :
            </p>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• rappel à l&apos;ordre</li>
              <li>• avertissement</li>
              <li>• restriction de salons ou de rôles</li>
              <li>• exclusion temporaire ou définitive</li>
            </ul>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Le staff se réserve le droit d&apos;agir pour préserver l&apos;équilibre du serveur.
            </p>
          </section>

          {/* Mot de l'équipe */}
          <section className="rounded-xl p-6 border reglement-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              💙 Mot de l&apos;équipe
            </h3>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              La New Family est un lieu de confiance, d&apos;échange et d&apos;évolution.<br />
              Si tu es ici pour construire et avancer avec les autres : tu es au bon endroit 🐉
            </p>
            <p className="leading-relaxed font-semibold" style={{ color: 'var(--color-text)' }}>
              📌 En restant sur le serveur, tu confirmes avoir lu et accepté ce règlement.
            </p>
          </section>
        </div>
      )}

      {/* Contenu sous-onglet Règlement des salons vocaux */}
      {activeSubTab === "vocaux" && (
        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              🎧 Règlement des salons vocaux
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Twitch Entraide New Family</strong>
            </p>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Les salons vocaux sont des espaces de <strong style={{ color: 'var(--color-text)' }}>convivialité, d&apos;échange et de respect</strong>. 
              Afin de préserver une ambiance saine et sécurisante pour tous, les règles suivantes doivent être respectées.
            </p>
          </section>

          {/* 1. Respect & bienveillance */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              1️⃣ Respect & bienveillance
            </h3>
            <ul className="space-y-3 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Le respect de chaque personne est obligatoire.</li>
              <li>• Sont strictement interdits :
                <ul className="ml-6 mt-2 space-y-1">
                  <li>• moqueries, attaques personnelles, jugements,</li>
                  <li>• propos discriminatoires (racisme, sexisme, homophobie, transphobie, validisme, etc.),</li>
                  <li>• comportements oppressants, harcèlement ou pression morale.</li>
                </ul>
              </li>
              <li>• Les débats sont autorisés <strong style={{ color: 'var(--color-text)' }}>uniquement s&apos;ils restent calmes et respectueux</strong>.</li>
            </ul>
          </section>

          {/* 2. Présence en vocal pendant un live */}
          <section className="rounded-xl p-6 border reglement-warning" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#ef4444' }}>
              2️⃣ Présence en vocal pendant un live ou une session de jeu
            </h3>
            <ul className="space-y-3 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• ❌ <strong style={{ color: 'var(--color-text)' }}>Il est interdit de rejoindre un vocal général du serveur lorsque vous êtes en live</strong>, sauf accord clair des personnes présentes.</li>
              <li>• ❌ Il est également <strong style={{ color: 'var(--color-text)' }}>interdit de rejoindre un vocal lorsque vous jouez avec d&apos;autres personnes</strong>, sans les prévenir au préalable.</li>
              <li>• ⚠️ Les discussions sur le serveur <strong style={{ color: 'var(--color-text)' }}>doivent rester privées</strong> : être en live expose involontairement les échanges.</li>
              <li>• En cas de doute : <strong style={{ color: 'var(--color-text)' }}>demandez avant d&apos;entrer</strong>.</li>
            </ul>
            <p className="leading-relaxed font-semibold" style={{ color: 'var(--color-text)' }}>
              ➡️ Le non-respect de ce point est considéré comme une <strong style={{ color: '#ef4444' }}>atteinte à la confidentialité</strong>.
            </p>
          </section>

          {/* 3. Confidentialité & vie privée */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              3️⃣ Confidentialité & vie privée
            </h3>
            <ul className="space-y-3 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Ce qui est dit en vocal <strong style={{ color: 'var(--color-text)' }}>reste dans le vocal</strong>.</li>
              <li>• Il est strictement interdit :
                <ul className="ml-6 mt-2 space-y-1">
                  <li>• d&apos;enregistrer un salon vocal sans l&apos;accord explicite de toutes les personnes présentes,</li>
                  <li>• de rediffuser, rapporter ou exploiter des propos entendus en vocal (stream, clip, discussion externe).</li>
                </ul>
              </li>
              <li>• Toute violation pourra entraîner des sanctions immédiates.</li>
            </ul>
          </section>

          {/* 4. Écoute en vocal */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              4️⃣ Écoute en vocal (micro coupé)
            </h3>
            <ul className="space-y-3 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Il est <strong style={{ color: 'var(--color-text)' }}>autorisé d&apos;être en vocal en restant mute</strong> pour écouter.</li>
              <li>• Toutefois :
                <ul className="ml-6 mt-2 space-y-1">
                  <li>• cela doit rester <strong style={{ color: 'var(--color-text)' }}>occasionnel et respectueux</strong>,</li>
                  <li>• si une personne demande qui est présent, merci de vous signaler.</li>
                </ul>
              </li>
              <li>• Rester silencieux de manière prolongée sans interaction peut amener le staff à demander des explications.</li>
            </ul>
          </section>

          {/* 5. Politesse & savoir-vivre */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              5️⃣ Politesse & savoir-vivre
            </h3>
            <ul className="space-y-2 ml-6 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Dire <strong style={{ color: 'var(--color-text)' }}>bonjour</strong> en arrivant en vocal est obligatoire.</li>
              <li>• Dire <strong style={{ color: 'var(--color-text)' }}>au revoir</strong> avant de quitter est également obligatoire.</li>
              <li>• Les déconnexions sans prévenir, répétées ou systématiques ne sont <strong style={{ color: 'var(--color-text)' }}>pas tolérées</strong>.</li>
            </ul>
            <p className="leading-relaxed font-semibold" style={{ color: 'var(--color-text)' }}>
              ➡️ C&apos;est une règle de respect élémentaire envers les personnes présentes.
            </p>
          </section>

          {/* 6. Temps de parole & ambiance */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              6️⃣ Temps de parole & ambiance
            </h3>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Merci de ne pas couper la parole et de laisser chacun s&apos;exprimer.</li>
              <li>• Évitez de monopoliser le vocal.</li>
              <li>• Les vocaux ne sont <strong style={{ color: 'var(--color-text)' }}>pas des cercles fermés</strong> : l&apos;inclusivité est essentielle.</li>
              <li>• Toute ambiance lourde, toxique ou excluante pourra être interrompue par le staff.</li>
            </ul>
          </section>

          {/* 7. Gestion des conflits */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              7️⃣ Gestion des conflits
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              En cas de malaise ou de désaccord :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• restez calmes,</li>
              <li>• évitez les règlements de compte en public,</li>
              <li>• contactez un membre du staff si nécessaire.</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              Le staff peut intervenir à tout moment pour préserver le climat du vocal.
            </p>
          </section>

          {/* 8. Autorité du staff */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              8️⃣ Autorité du staff
            </h3>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Les décisions du staff en vocal doivent être respectées.<br />
              Refus d&apos;obtempérer, provocation ou contestation agressive = sanction.
            </p>
          </section>

          {/* 9. Sanctions */}
          <section className="rounded-xl p-6 border reglement-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              9️⃣ Sanctions
            </h3>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Selon la gravité ou la répétition :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• rappel à l&apos;ordre,</li>
              <li>• mute vocal temporaire ou définitif,</li>
              <li>• avertissement officiel,</li>
              <li>• sanction serveur (jusqu&apos;au bannissement).</li>
            </ul>
          </section>

          {/* Objectif des vocaux */}
          <section className="rounded-xl p-6 border reglement-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              💙 Objectif des vocaux New Family
            </h3>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Créer un espace <strong style={{ color: 'var(--color-text)' }}>safe, respectueux et humain</strong>, 
              où chacun peut parler librement sans crainte d&apos;être exposé, jugé ou mis mal à l&apos;aise.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function SystemePointsContent() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>⭐ Système de points TENF</h1>
        <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Un système pensé pour encourager l&apos;entraide, pas la compétition</p>
        <div className="rounded-xl p-6 border systeme-points-intro" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Le système de points TENF récompense l&apos;engagement réel, la présence humaine et l&apos;entraide sincère sur le serveur Discord. Ici, chaque action compte — pas la performance, mais l&apos;implication.
          </p>
        </div>
      </section>

      {/* Comment gagner des points */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text)' }}>🎯 Comment gagner des points ?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quête quotidienne */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                🗓 Quête quotidienne
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                500 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Utilise la commande /journalier une fois par jour dans le salon 🗓・bonus-journalier.
            </p>
          </div>

          {/* Participation à la vie du serveur */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                💬 Participation à la vie du serveur
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                500 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Tous les 3 niveaux
            </p>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Gagnés automatiquement grâce à ton activité : discussions textuelles, entraide, présence en vocal… (hors spam ou messages artificiels).
            </p>
          </div>

          {/* Organisation de raids */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                🤜🤛 Organisation de raids
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                500 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Organise un raid Twitch entre membres TENF.
            </p>
            <div className="rounded-lg p-4 mb-3 systeme-points-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>📋 Format obligatoire :</p>
              <p className="leading-relaxed text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Pour que le raid soit comptabilisé, le message doit être posté obligatoirement et uniquement dans #⚡・coordination-raid, sans aucun texte supplémentaire, sous le format exact suivant :
              </p>
              <div className="bg-[var(--color-surface)] rounded-lg p-4 border" style={{ borderColor: 'var(--color-border)' }}>
                <code className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                  @membre1 a raid @membre2
                </code>
              </div>
              <p className="leading-relaxed text-xs mt-3 italic" style={{ color: 'var(--color-text-secondary)' }}>
                Tout message qui ne respecte pas strictement ce format ne sera pas pris en compte.
              </p>
            </div>
          </div>

          {/* Parrainage de nouveaux membres */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                🆕 Parrainage de nouveaux membres
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                300 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Invite une personne qui partage les valeurs TENF et qui s&apos;implique réellement dans la communauté.
            </p>
          </div>

          {/* Suivi des réseaux TENF */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                🔔 Suivi des réseaux TENF
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                500 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Réseaux concernés : X (Twitter), TikTok, Instagram.
            </p>
            <div className="rounded-lg p-3 mt-3 systeme-points-reminder" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)' }}>
              <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                📸 <strong style={{ color: 'var(--color-text)' }}>Preuve obligatoire</strong> à poster dans 📂・preuves-suivi.<br />
                500 points attribués par réseau validé.
              </p>
            </div>
          </div>

          {/* Participation aux événements communautaires */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                🎉 Participation aux événements communautaires
              </h3>
              <span className="text-2xl font-bold whitespace-nowrap ml-4" style={{ color: 'var(--color-primary)' }}>
                200-500 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Jeux communautaires, soirées fun, events spéciaux… Le montant dépend de l&apos;implication et du type d&apos;événement.
            </p>
          </div>
        </div>
      </section>

      {/* Bonus & avantages */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text)' }}>🎁 Bonus & avantages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pack de démarrage */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">🎒</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Pack de démarrage
              </h3>
              <span className="text-3xl font-bold block" style={{ color: 'var(--color-primary)' }}>
                1000 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Attribués aux nouveaux streamers rejoignant TENF.
            </p>
          </div>

          {/* Bonus d'anniversaire */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">🎂</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Bonus d&apos;anniversaire
              </h3>
              <span className="text-3xl font-bold block" style={{ color: 'var(--color-primary)' }}>
                2000 pts
              </span>
            </div>
            <p className="leading-relaxed text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Parce que fêter ça ensemble, ça mérite un boost 🎉
            </p>
          </div>

          {/* Multiplicateur de points x2 */}
          <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">🔓</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Multiplicateur x2
              </h3>
              <span className="text-lg font-bold block mb-2" style={{ color: 'var(--color-primary)' }}>
                Niveau 21+
              </span>
              <span className="text-2xl font-bold block" style={{ color: 'var(--color-primary)' }}>
                1000 pts / 3 niveaux
              </span>
            </div>
            <p className="leading-relaxed text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              1000 points tous les 3 niveaux au lieu de 500. Récompense la régularité, la fidélité et l&apos;implication dans la durée.
            </p>
          </div>
        </div>
      </section>

      {/* Utiliser ses points */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text)' }}>🏆 Utiliser ses points</h2>
        <div className="rounded-xl p-6 border systeme-points-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Les points permettent de débloquer différents avantages communautaires (rôles temporaires, bonus, accès spécifiques…).
          </p>
          <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Les détails sont disponibles dans la boutique des points ou les salons dédiés.
          </p>
        </div>
      </section>

      {/* L'esprit du système TENF */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text)' }}>💙 L&apos;esprit du système TENF</h2>
        <div className="rounded-xl p-8 border systeme-points-spirit" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
          <p className="leading-relaxed text-xl mb-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            TENF est avant tout : 🤝 de l&apos;entraide, 💬 de l&apos;échange, ❤️ du respect, 🚀 du soutien mutuel entre streamers.
          </p>
          <p className="leading-relaxed text-2xl font-bold text-center" style={{ color: 'var(--color-primary)' }}>
            Les points récompensent l&apos;humain avant la performance.
          </p>
        </div>
      </section>
    </div>
  );
}

function ConseilContent() {
  const [activeSubTab, setActiveSubTab] = useState<"tenf" | "twitch" | "reseaux">("tenf");

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
          🧠 Conseils New Family
        </h1>
        <p className="text-xl md:text-2xl" style={{ color: 'var(--color-text-secondary)' }}>
          Grandir, streamer et interagir sainement
        </p>
      </section>

      {/* Sous-onglets */}
      <div className="flex flex-wrap gap-4 justify-center border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setActiveSubTab("tenf")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg conseil-subtab"
          style={{
            color: activeSubTab === "tenf" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "tenf" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "tenf" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          💜 Conseils TENF
        </button>
        <button
          onClick={() => setActiveSubTab("twitch")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg conseil-subtab"
          style={{
            color: activeSubTab === "twitch" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "twitch" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "twitch" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          🎮 Conseils Twitch
        </button>
        <button
          onClick={() => setActiveSubTab("reseaux")}
          className="px-6 py-3 text-base font-medium transition-all rounded-lg conseil-subtab"
          style={{
            color: activeSubTab === "reseaux" ? 'white' : 'var(--color-text-secondary)',
            backgroundColor: activeSubTab === "reseaux" ? 'var(--color-primary)' : 'transparent',
            border: activeSubTab === "reseaux" ? 'none' : `1px solid var(--color-border)`,
          }}
        >
          📱 Comportement sur les réseaux
        </button>
      </div>

      {/* Contenu sous-onglet TENF */}
      {activeSubTab === "tenf" && (
        <div className="space-y-6">
          {/* L'esprit entraide TENF */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              💜 L'esprit entraide TENF
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              À la New Family, l'entraide n'est pas un concept abstrait. C'est quelque chose qu'on vit au quotidien :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Participer aux raids, aux événements, aux lives des membres</li>
              <li>• Répondre aux questions, partager des connaissances</li>
              <li>• Encourager, soutenir, motiver</li>
              <li>• Être présent, même silencieusement (le lurk compte)</li>
              <li>• Créer des connexions durables, pas des interactions ponctuelles</li>
            </ul>
            <p className="leading-relaxed text-lg mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>L'entraide fonctionne dans les deux sens.</strong> 
              On donne autant qu'on reçoit, et c'est ça qui fait la richesse de la communauté.
            </p>
          </section>

          {/* Donner avant de demander */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              ⭐ Donner avant de demander
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Avant de demander de l'aide ou du soutien, pose-toi la question : <strong style={{ color: 'var(--color-text)' }}>"Qu'est-ce que j'ai donné récemment à la communauté ?"</strong>
            </p>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Cela ne veut pas dire qu'il faut être parfait ou toujours présent. Cela signifie simplement :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Participer aux lives des autres quand tu peux</li>
              <li>• Aider quand tu as les connaissances</li>
              <li>• Être présent et bienveillant dans les interactions</li>
              <li>• Soutenir les événements et les projets communautaires</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>L'entraide devient naturelle</strong> quand on commence par donner, sans attendre de retour immédiat.
            </p>
          </section>

          {/* Présence sincère */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              💚 Présence sincère (lurk compris)
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Ta présence, même silencieuse, compte.</strong> 
              Le lurk n'est pas une absence, c'est une forme d'engagement :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Stats</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Chaque viewer compte pour les statistiques Twitch</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">💜</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Soutien moral</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Savoir qu'il y a des gens qui regardent, c'est rassurant</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">🤫</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Présence silencieuse</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Tu participes à l'ambiance communautaire</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">✨</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Naturel</strong>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Sois toi-même, sans te forcer à interagir</p>
                </div>
              </div>
            </div>
          </section>

          {/* Partage de live sans spam */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              📢 Partage de live sans spam
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Partager ton live dans les canaux appropriés, c'est bien. Mais attention à ne pas tomber dans le spam :
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-xl mr-3">✅</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>À faire</strong>
                  <ul className="mt-1 space-y-1 ml-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Utiliser les salons dédiés (ex: #🔴・live-en-cours)</li>
                    <li>• Partager 1 à 2 fois maximum par live</li>
                    <li>• Mentionner ce que tu fais de spécial dans ton live</li>
                    <li>• Répondre aux messages si quelqu'un interagit</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-xl mr-3">❌</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>À éviter</strong>
                  <ul className="mt-1 space-y-1 ml-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Poster ton lien toutes les 10 minutes</li>
                    <li>• Spammer dans plusieurs salons en même temps</li>
                    <li>• Ne jamais répondre aux messages</li>
                    <li>• Partager uniquement pour partager, sans interaction</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Feedback constructif */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              💬 Feedback constructif
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Quand tu donnes un retour à quelqu'un (conseil, critique, suggestion), pense à :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Être bienveillant</strong> : formuler de manière positive et constructive</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Proposer des solutions</strong> : ne pas seulement pointer les problèmes</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Respecter le rythme</strong> : chacun avance à sa vitesse</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Choisir le bon moment</strong> : en privé plutôt qu'en public si c'est sensible</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Un feedback constructif aide à progresser.</strong> 
              Un feedback destructeur décourage et crée de la distance.
            </p>
          </section>

          {/* Régularité > présence parfaite */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              ⏱️ Régularité &gt; présence parfaite
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              On ne te demande pas d'être présent tout le temps, partout, tout de suite. Ce qui compte, c'est :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>✅ Régularité</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Être présent régulièrement, même si c'est quelques fois par semaine, c'est mieux qu'une présence intensive puis une disparition.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>💜 Sincérité</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Une présence sincère et naturelle vaut mieux qu'une présence forcée juste pour "faire le nombre".
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🌱 Progression</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  On valorise l'évolution dans le temps, pas la perfection immédiate. Chacun progresse à son rythme.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🤝 Qualité</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Mieux vaut quelques interactions de qualité que beaucoup d'interactions superficielles.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Contenu sous-onglet Twitch */}
      {activeSubTab === "twitch" && (
        <div className="space-y-6">
          {/* Conseils en live */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              🎮 Conseils en live
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>👋 Présentation</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Prends quelques secondes pour dire bonjour quand quelqu'un arrive. Un simple "Salut [pseudo] !" fait toute la différence.
                </p>
              </div>
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>💬 Interaction</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Réponds aux messages, pose des questions, engage la conversation. Même si le chat est calme, montre que tu es là.
                </p>
              </div>
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>✨ Ambiance</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Crée une atmosphère positive. Sois authentique, montre ta personnalité, et n'aie pas peur d'être toi-même.
                </p>
              </div>
            </div>
          </section>

          {/* Gestion des stats */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              📊 Gestion des stats
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Les statistiques Twitch peuvent être un outil utile, mais attention à ne pas en devenir obsédé :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Les stats fluctuent</strong> : c'est normal, ne panique pas</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Focus sur le contenu</strong> : concentre-toi sur ce que tu fais, pas sur les chiffres</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Patience</strong> : la croissance prend du temps, c'est normal</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Qualité &gt; quantité</strong> : mieux vaut 5 viewers engagés que 50 passifs</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Ne laisse pas les stats définir ta valeur.</strong> 
              Tu es bien plus qu'un chiffre sur un écran.
            </p>
          </section>

          {/* Hors live */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              📅 Hors live
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>🗓️ Planning</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Annonce tes horaires de stream pour que ta communauté puisse te rejoindre. Utilise le système de planning Twitch.
                </p>
              </div>
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>⏸️ Pauses</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Communique si tu prends une pause. Un message simple suffit : "Pause de [durée] pour [raison]". La transparence est appréciée.
                </p>
              </div>
              <div className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>📢 Annonces</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Partage tes événements, tes projets, tes nouveautés. Garde ta communauté informée de ce qui se passe.
                </p>
              </div>
            </div>
          </section>

          {/* Sécurité & IRL */}
          <section className="rounded-xl p-6 border conseil-warning" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ef4444' }}>
              🔒 Sécurité & IRL / déplacements
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Ta sécurité avant tout :</strong>
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Ne partage jamais ton adresse</strong> en live ou en public</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Attention aux déplacements</strong> : ne révèle pas tes trajets en temps réel</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Limite les informations personnelles</strong> : prénom, ville, lieu de travail… sois prudent</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Rencontres IRL</strong> : toujours en public, toujours avec précaution, jamais seul(e) si possible</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Écoute ton instinct</strong> : si quelque chose te met mal à l'aise, arrête</li>
            </ul>
            <p className="leading-relaxed mt-4 font-semibold" style={{ color: 'var(--color-text)' }}>
              Ta sécurité personnelle est plus importante que n'importe quel contenu ou engagement communautaire.
            </p>
          </section>

          {/* Rester humain et cohérent */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              💜 Rester humain et cohérent
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Twitch, c'est un média, mais derrière chaque stream, il y a une personne :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Sois authentique</strong> : n'invente pas une personnalité qui n'est pas toi</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Accepte tes imperfections</strong> : les erreurs font partie de l'apprentissage</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Reste cohérent</strong> : avec tes valeurs, ton style, ta personnalité</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Prends soin de toi</strong> : le streaming ne doit pas prendre le pas sur ta santé mentale</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Communique</strong> : si tu passes un moment difficile, tu peux en parler (sans tout révéler)</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Rester humain, c'est rester vrai.</strong> 
              Et c'est ça qui crée les vraies connexions.
            </p>
          </section>
        </div>
      )}

      {/* Contenu sous-onglet Réseaux */}
      {activeSubTab === "reseaux" && (
        <div className="space-y-6">
          {/* Risques des réseaux */}
          <section className="rounded-xl p-6 border conseil-warning" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ef4444' }}>
              ⚠️ Risques des réseaux
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Les réseaux sociaux sont des outils puissants, mais ils comportent des risques :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Harcèlement et cyberbullying</strong> : malheureusement fréquent</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Exposition excessive</strong> : risque de partager trop d'informations personnelles</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Comparaison malsaine</strong> : se comparer constamment aux autres</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Perte de vie privée</strong> : frontière floue entre public et privé</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Burnout</strong> : pression constante de devoir être actif et présent</li>
            </ul>
            <p className="leading-relaxed mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Connaître les risques permet de mieux se protéger.</strong>
            </p>
          </section>

          {/* Éviter les dramas */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              🚫 Éviter les dramas
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Les dramas, c'est rarement constructif. Voici comment les éviter :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🤐 Ne pas réagir à chaud</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Si quelque chose te met en colère, attends 24h avant de publier. La colère passe, les posts restent.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>💬 Résoudre en privé</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Si tu as un conflit avec quelqu'un, parle-lui en privé avant de tout étaler sur les réseaux.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🧹 Ne pas alimenter</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Si un drama éclate ailleurs, ne le partage pas, ne le commente pas. Laisse couler.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🛡️ Se protéger</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Bloque, mute, ignore. Tu n'as pas à subir la négativité des autres.
                </p>
              </div>
            </div>
          </section>

          {/* Pièges classiques */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              🪤 Pièges classiques
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Attention à ces pièges fréquents sur les réseaux :
            </p>
            <ul className="space-y-3 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>
                • <strong style={{ color: 'var(--color-text)' }}>Le follow-for-follow</strong> : 
                gagner des followers en masse ne crée pas une vraie communauté. Mieux vaut moins mais mieux.
              </li>
              <li>
                • <strong style={{ color: 'var(--color-text)' }}>La course aux vues</strong> : 
                se comparer constamment aux autres crée de la frustration. Focus sur ton propre chemin.
              </li>
              <li>
                • <strong style={{ color: 'var(--color-text)' }}>Le fake engagement</strong> : 
                acheter des follows, utiliser des bots… ça se voit et ça ne mène à rien de durable.
              </li>
              <li>
                • <strong style={{ color: 'var(--color-text)' }}>L'over-sharing</strong> : 
                tout partager, tout le temps. Garde une part de vie privée, c'est sain.
              </li>
              <li>
                • <strong style={{ color: 'var(--color-text)' }}>La réactivité excessive</strong> : 
                répondre à tous les commentaires négatifs, à tous les haters… ça consume ton énergie pour rien.
              </li>
            </ul>
          </section>

          {/* Réputation & image */}
          <section className="rounded-xl p-6 border conseil-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              🎭 Réputation & image
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Ce que tu postes sur les réseaux peut avoir un impact sur ta réputation :
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>📸 Pense avant de poster</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Une fois publié, c'est difficile à retirer complètement. Assure-toi que ce que tu partages te correspond vraiment.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🔍 Cohérence</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Sois cohérent avec tes valeurs et ton image. Si tu changes d'avis sur quelque chose, c'est ok, mais explique-le.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>💼 Impact professionnel</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Souviens-toi que des employeurs, partenaires ou sponsors potentiels peuvent voir ce que tu publies.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>🧹 Nettoyage régulier</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Fais un tour de tes anciens posts de temps en temps. Supprime ou archive ce qui ne te correspond plus.
                </p>
              </div>
            </div>
          </section>

          {/* Protection mentale */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              🛡️ Protection mentale
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Ta santé mentale est primordiale. Voici comment te protéger :
            </p>
            <ul className="space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Limite ton temps</strong> : ne passe pas ta vie sur les réseaux</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Désactive les notifications</strong> : pour éviter d'être constamment sollicité(e)</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Fais des pauses</strong> : parfois, décrocher complètement fait du bien</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Filtre les contenus</strong> : ne suis que ce qui t'apporte du positif</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Ignore les haters</strong> : ne leur donne pas ton énergie</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Cherche de l'aide</strong> : si les réseaux impactent ta santé mentale, parle-en à quelqu'un</li>
            </ul>
            <p className="leading-relaxed mt-4 font-semibold" style={{ color: 'var(--color-text)' }}>
              Ta santé mentale passe avant tout engagement en ligne. N'aie pas peur de prendre du recul.
            </p>
          </section>

          {/* Règle d'or TENF */}
          <section className="rounded-xl p-6 border conseil-tip" style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', borderColor: 'var(--color-primary)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              💜 Règle d'or TENF
            </h2>
            <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Sur les réseaux comme dans la vie, la règle d'or de la New Family reste la même :
            </p>
            <div className="bg-[var(--color-surface)] rounded-lg p-6 border-2 border-[var(--color-primary)] text-center" style={{ borderColor: 'var(--color-primary)' }}>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                "Traitons les autres comme nous voudrions être traités"
              </p>
              <p className="text-lg mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                Bienveillance, respect, entraide. Que tu sois sur Twitch, Discord, Twitter, ou ailleurs, 
                cette règle simple crée un environnement sain pour tout le monde.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>("integration");
  const [expandedGuide, setExpandedGuide] = useState<string>("essentiel");
  const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const currentStep = activeTabIndex + 1;
  const isLastStep = currentStep === tabs.length;
  const nextTabId = isLastStep ? tabs[0].id : tabs[currentStep].id;
  const currentGuide = tabGuidance[activeTab];
  const currentTabMeta = tabUiMeta[activeTab];

  return (
    <main id="top-fonctionnement" className={`min-h-screen ${styles.fonctionnementPage}`} style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* HERO INTRO */}
        <section className={`mb-10 rounded-2xl border p-6 md:p-8 about-glow about-fade-up ${styles.fonctionnementHero}`} style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-4xl space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
              Comment fonctionne TENF
            </h1>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Cette page est le guide du fonctionnement de la communauté TENF: tu y retrouves les repères essentiels pour t&apos;intégrer, participer, progresser et profiter pleinement de l&apos;entraide.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.fonctionnementBadge}`} style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>
                🤝 Entraide
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.fonctionnementBadge}`} style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>
                🚀 Progression
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.fonctionnementBadge}`} style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>
                🎉 Événements
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveTab("integration");
                  setExpandedGuide("essentiel");
                  document.getElementById("tenf-onglets")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Commencer par l&apos;intégration
              </button>
              <button
                onClick={() => {
                  setActiveTab("systeme-points");
                  setExpandedGuide("essentiel");
                  document.getElementById("tenf-onglets")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Voir le système de points
              </button>
            </div>
          </div>
        </section>

        {/* Onglets + progression */}
        <div id="tenf-onglets" className="mb-8 about-fade-up">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              Étape {currentStep}/{tabs.length}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Parcours communautaire TENF
            </p>
          </div>
          <div className="mb-5 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(currentStep / tabs.length) * 100}%`,
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-5 py-2.5 text-sm font-medium transition-all rounded-full border ${styles.fonctionnementTabPill} ${
                  activeTab === tab.id ? styles.active : ""
                }`}
                style={{
                  color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                  borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  boxShadow: activeTab === tab.id ? '0 8px 24px rgba(145, 70, 255, 0.28)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.borderColor = 'rgba(145, 70, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>{tabUiMeta[tab.id].icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-8">
          <section className="mb-6 rounded-xl border p-4 md:p-5 about-fade-up about-glow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--color-primary)' }}>
                  {currentTabMeta.icon} Cap actuel
                </p>
                <h2 className="text-lg md:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {tabs[activeTabIndex]?.label || "Parcours TENF"}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {currentTabMeta.subtitle}
                </p>
              </div>
            </div>
          </section>

          {/* TL;DR */}
          <section className="mb-8 rounded-xl border p-5 md:p-6 about-glow" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              À retenir
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentGuide.tldr.map((item) => (
                <p key={item} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.startsWith("Évite") || item.startsWith("Pas") ? "❌ " : "✔ "}
                  {item}
                </p>
              ))}
            </div>
          </section>

          {/* Accordéons guide */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentGuide.accordions.map((accordion) => {
              const borderColor = accordion.key === "details" ? "rgba(239,68,68,0.3)" : "var(--color-border)";
              const bgColor = accordion.key === "bonnes-pratiques"
                ? "rgba(145, 70, 255, 0.1)"
                : accordion.key === "details"
                  ? "rgba(239,68,68,0.08)"
                  : "var(--color-card)";

              if (activeTab === "integration") {
                return (
                  <article
                    key={accordion.key}
                    className="rounded-xl border transition-all duration-200 about-glow p-4"
                    style={{ borderColor, backgroundColor: bgColor }}
                  >
                    <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{accordion.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {accordion.text}
                    </p>
                  </article>
                );
              }

              const isOpen = expandedGuide === accordion.key;
              return (
                <article
                  key={accordion.key}
                  className="rounded-xl border transition-all duration-200 about-glow"
                  style={{ borderColor, backgroundColor: bgColor }}
                >
                  <button
                    onClick={() => setExpandedGuide(isOpen ? "" : accordion.key)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{accordion.title}</span>
                    <span style={{ color: 'var(--color-primary)' }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {accordion.text}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <div key={activeTab} className="about-fade-up">
          {activeTab === "integration" && (
            <div className="space-y-8">
              {/* Section : Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    Bienvenue dans TENF ✨ Ici, on t'accompagne de tes premiers pas jusqu'à ton intégration complète. Tu vas découvrir nos étapes d'arrivée, notre fonctionnement, et surtout comment profiter au maximum de l'entraide, des events et de la vie de la communauté.
                  </p>
                </div>
              </section>

              {/* Section : Processus d'intégration */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Processus d'Intégration
                </h2>
                <div className="space-y-6">
                  <div className="rounded-xl p-6 shadow-lg border integration-card transition-transform duration-300 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      1. Inscription
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Commence par te connecter avec ton compte Discord sur le site. Une fois connecté, tu peux créer ou compléter ton espace membre pour finaliser ton profil et faciliter ton intégration dans la communauté.
                    </p>
                    <a
                      href="/api/auth/discord/login?callbackUrl=/integration"
                      className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Créer mon espace membre
                    </a>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card transition-transform duration-300 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Réunion d'intégration
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les réunions d&apos;intégration sont organisées régulièrement. Tu peux consulter le calendrier et t&apos;inscrire directement sur la page{" "}
                      <a
                        href="https://tenf-community.com/integration"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        d&apos;intégration
                      </a>
                      . C&apos;est le meilleur point de départ pour comprendre le fonctionnement TENF, poser tes questions et avancer sereinement.
                    </p>
                    <a
                      href="https://tenf-community.com/integration"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Voir les prochaines réunions d&apos;intégration
                    </a>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card transition-transform duration-300 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Découvrir les autres & s'impliquer
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Découvre les autres membres et commence à t&apos;impliquer dans la vie de TENF : échange sur le serveur, participe aux événements, passe sur les lives et prends le temps de suivre les créateurs actifs du système d&apos;entraide. C&apos;est souvent comme ça que la porte s&apos;ouvre vraiment : en créant des liens, en découvrant les univers des autres et en rendant l&apos;entraide plus naturelle au quotidien.
                    </p>
                    <a
                      href="/lives"
                      className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Découvrir les autres
                    </a>
                  </div>
                </div>
              </section>

              {/* Section : Système d'évaluation */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Système d'Évaluation
                </h2>
                <div className="rounded-xl p-8 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF fonctionne avec un système d'évaluation transparent qui permet de suivre votre progression :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Évaluations mensuelles</strong> : Bilan régulier de votre progression et de votre engagement</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Critères transparents</strong> : Vous savez exactement ce qui est évalué et pourquoi</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Feedback constructif</strong> : Retours personnalisés pour vous aider à progresser</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Évolution des rôles</strong> : Possibilité d'évoluer dans la hiérarchie selon votre implication</li>
                  </ul>
                </div>
              </section>

              {/* Section : Rôles et Hiérarchie */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Rôles et Hiérarchie
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Membres Actifs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Cette catégorie représente les créateurs actifs qui font vivre l&apos;entraide au quotidien.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={getRoleBadgeClassName("Affilié")}>Créateurs affiliés</span>
                      <span className={getRoleBadgeClassName("Développement")}>Créateurs en développement</span>
                      <span className={getRoleBadgeClassName("Soutien TENF")}>Soutien TENF</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Mineurs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Membres mineurs de la communauté, avec un cadre adapté, bienveillant et sécurisé.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={getRoleBadgeClassName("Créateur Junior")}>Créateurs Juniors</span>
                      <span className={getRoleBadgeClassName("Les P'tits Jeunes")}>Les P&apos;tits Jeunes</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Communauté
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Viewers et membres de la communauté : accès à la vie du serveur et aux activités, avec un environnement encadré et respectueux.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={getRoleBadgeClassName("Communauté")}>Communauté</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Staff & Admins
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L'équipe qui organise, anime et veille au bon fonctionnement : accueil, événements, accompagnement et modération.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={getRoleBadgeClassName("Admin Fondateurs")}>Admin Fondateurs</span>
                      <span className={getRoleBadgeClassName("Admin Coordinateur")}>Admin Coordinateur</span>
                      <span className={getRoleBadgeClassName("Modérateur")}>Modérateurs</span>
                      <span className={getRoleBadgeClassName("Modérateur en formation")}>Modérateur en Formation</span>
                      <span className={getRoleBadgeClassName("Modérateur en pause")}>Modérateur en Pause</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section : Activités et Événements */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Activités et Événements
                </h2>
                <div className="rounded-xl p-8 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF propose des rendez-vous réguliers pensés pour créer du lien, gagner en visibilité et progresser ensemble dans une vraie dynamique d&apos;entraide :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Spotlight</strong> : un temps fort pour mettre un créateur en lumière et mobiliser la communauté autour de son univers</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Films communautaires</strong> : des moments partagés en vocal pour renforcer les liens entre membres hors live</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Jeux communautaires</strong> : des sessions conviviales pour se découvrir autrement et faire vivre l&apos;entraide dans l&apos;action</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Sessions de mentorat (petits groupes encadrés)</strong> : échanges guidés, retours concrets et progression collective</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Formations</strong> : ateliers pratiques pour mieux structurer ses lives, ses outils et son évolution de créateur</li>
                  </ul>
                </div>
              </section>

              {/* Section : Ressources Disponibles */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Ressources Disponibles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Support Personnalisé
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L&apos;équipe de staff reste disponible pour accompagner la communauté, répondre aux questions, aider à mieux comprendre le fonctionnement de TENF et orienter les membres lorsqu&apos;ils en ont besoin.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Outils et Automatisation
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      TENF met à disposition plusieurs ressources utiles pour la vie communautaire : le serveur Discord, les automatisations pratiques et le site TENF, qui centralise les informations, les parcours et différents outils utiles à l&apos;intégration.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Communauté Active
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Réseau de streamers prêts à s'entraider et à collaborer.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : FAQ */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Questions Fréquentes
                </h2>
                <div className="space-y-4">
                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment puis-je rejoindre TENF ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Commence par te connecter avec ton compte Discord, puis complète ton intégration via la page dédiée du site.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Dois-je obligatoirement passer par la réunion d&apos;intégration ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Oui, la réunion d&apos;intégration fait partie du parcours prévu pour bien comprendre le fonctionnement de TENF et démarrer dans de bonnes conditions.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment créer mon espace membre ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Une fois connecté via Discord sur le site, ton profil peut être reconnu automatiquement. Si tu es nouveau, le formulaire adapté s&apos;affichera pour créer ton espace membre.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment découvrir les membres actifs de TENF ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Tu peux passer par la page Live, les événements communautaires et les échanges sur le serveur pour découvrir les créateurs actifs du système d&apos;entraide.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment savoir où participer en premier ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le plus simple est de commencer par une réunion d&apos;intégration, puis de rejoindre un live, un événement communautaire ou un échange textuel qui te correspond.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Le staff peut-il m&apos;aider si je suis perdu ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Oui, l&apos;équipe de staff est là pour orienter, répondre aux questions et t&apos;aider à mieux comprendre comment trouver ta place dans la communauté.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      À quoi sert le site TENF dans mon intégration ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le site centralise plusieurs informations utiles : intégration, calendrier, ressources, événements et outils pratiques pour mieux t&apos;impliquer dans la communauté.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Est-ce que je dois suivre les autres membres ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Ce n&apos;est pas une obligation imposée, mais découvrir et suivre les membres actifs aide fortement à créer du lien et à rendre l&apos;entraide plus naturelle.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border integration-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment commencer à m&apos;impliquer sans me sentir perdu ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Avance étape par étape : réunion d&apos;intégration, premiers échanges sur le serveur, puis découverte des lives et des événements. L&apos;important est de garder un rythme simple et régulier.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "reglement" && (
            <ReglementContent />
          )}

          {activeTab === "systeme-points" && (
            <SystemePointsContent />
          )}

          {activeTab === "boutique-points" && (
            <BoutiquePointsContent />
          )}

          {activeTab === "spotlight" && (
            <SpotlightContent />
          )}

          {activeTab === "conseil" && (
            <ConseilContent />
          )}
          </div>

          {/* CTA contextuel onglet */}
          <section className="mt-10 rounded-xl border p-6 about-glow about-fade-up" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {currentGuide.cta.title}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {currentGuide.cta.description}
            </p>
            <button
              onClick={() => {
                setActiveTab(currentGuide.cta.targetTab);
                setExpandedGuide("essentiel");
                document.getElementById("tenf-onglets")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {currentGuide.cta.buttonLabel}
            </button>
          </section>

          {/* Navigation utilitaire */}
          <section className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveTab(nextTabId);
                setExpandedGuide("essentiel");
                document.getElementById("tenf-onglets")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Continuer
            </button>
            <button
              onClick={() => document.getElementById("top-fonctionnement")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Retour en haut
            </button>
            <a
              href="https://discord.gg/WnpazgcZHk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Ouvrir Discord
            </a>
          </section>
        </div>

        {/* CTA final */}
          <section className="mt-12 rounded-2xl border p-8 text-center about-glow about-fade-up" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Prêt à rejoindre la dynamique TENF ?
          </h2>
          <p className="text-sm md:text-base mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Rejoins une communauté active qui avance sur l&apos;entraide, la progression et des actions concrètes.
          </p>
          <a
            href="https://discord.gg/WnpazgcZHk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Rejoindre Discord
          </a>
        </section>
      </div>
    </main>
  );
}

