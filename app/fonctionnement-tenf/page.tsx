"use client";

import { useState } from "react";

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
  { id: "boutique-points", label: "Boutique des points" },
  { id: "spotlight", label: "Spotlight" },
  { id: "conseil", label: "Conseil" },
];

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

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Titre principal */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            Fonctionnement TENF
          </h1>
        </section>

        {/* Onglets */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center border-b" style={{ borderColor: 'var(--color-border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                style={{
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-8">
          {activeTab === "integration" && (
            <div className="space-y-8">
              {/* Section : Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
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
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      1. Inscription
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Remplis le formulaire d'intégration via le site : tes informations arrivent directement dans notre tableau de suivi. L'équipe d'accueil vérifie ta demande et te guide si quelque chose manque.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Réunion d'intégration
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Ta place se valide en participant à une réunion d'intégration. On t'explique TENF, on te montre où trouver les infos importantes, et tu peux poser toutes tes questions. La présence et l'échange sont essentiels.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Découvrir les autres & s'impliquer
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Fais connaissance avec la communauté : sois actif sur le serveur, participe aux événements et passe sur les lives des membres TENF. Plus tu échanges, plus l'entraide devient naturelle (et efficace).
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : Système d'évaluation */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Système d'Évaluation
                </h2>
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
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
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Membres Actifs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le cœur de TENF : ils participent à l'entraide, aux raids, aux events et font vivre les échanges au quotidien.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Créateur Junior (mineur)
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Jeunes créateurs : un cadre adapté et bienveillant, pour progresser et participer à la communauté en toute sécurité.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Communauté (mineur)
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Jeunes viewers / membres : accès à la vie du serveur et aux activités, avec un environnement encadré et respectueux.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Staff & Admins
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L'équipe qui organise, anime et veille au bon fonctionnement : accueil, événements, accompagnement et modération.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : Activités et Événements */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Activités et Événements
                </h2>
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF propose des rendez-vous réguliers pour se découvrir, progresser et créer des liens entre streamers et membres :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Spotlight</strong> : mises en avant régulières de membres et de contenus (live, clip, projet)</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Films communautaires</strong> : moments "watch party" en vocal pour partager un bon moment</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Jeux communautaires</strong> : soirées fun (Petit Bac, Fortnite, Gartic Phone, etc.)</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Sessions de mentorat (petits groupes encadrés)</strong> : suivi, retours, objectifs et progression ensemble</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Formations</strong> : ateliers pratiques autour du streaming (outils, organisation, bonnes pratiques)</li>
                  </ul>
                </div>
              </section>

              {/* Section : Ressources Disponibles */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Ressources Disponibles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Support Personnalisé
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Accès à un mentor dédié et à l'équipe pour toutes vos questions.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Outils et Automatisation
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Bots Discord, intégrations Twitch et outils pour faciliter votre streaming.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
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
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment puis-je rejoindre TENF ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Remplissez le formulaire d'intégration disponible sur la page "Intégration" de notre site.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Y a-t-il des critères pour rejoindre ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Nous accueillons tous les streamers motivés, quel que soit leur niveau. L'important est l'envie de progresser et de s'entraider.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment fonctionnent les évaluations ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les évaluations mensuelles permettent de faire un point sur votre progression, votre engagement et vos besoins. C'est un outil de suivi, pas de sanction.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Puis-je évoluer dans la hiérarchie ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Oui ! En fonction de votre implication, de votre progression et de votre volonté d'aider les autres, vous pouvez évoluer vers des rôles plus importants.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "reglement" && (
            <div className="space-y-8">
              {/* Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    Bienvenue sur Twitch Entraide New Family (TENF) 💙🐉<br /><br />
                    TENF est un espace d'entraide, de respect et de bienveillance.<br /><br />
                    Ce règlement regroupe les règles générales du serveur ainsi que les règles spécifiques des salons vocaux.<br /><br />
                    En restant sur le serveur, tu confirmes avoir lu et accepté ces règles.
                  </p>
                </div>
              </section>

              {/* Règlement général TENF */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  📜 Règlement général – TENF
                </h2>

                <div className="space-y-6">
                  {/* 1. Valeurs TENF */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      1. Valeurs TENF
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      TENF repose sur des valeurs fondamentales :
                    </p>
                    <ul className="leading-relaxed space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Entraide sincère</strong> : aide-toi, on t'aide. L'entraide doit être réciproque et désintéressée.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Respect des différences</strong> : chacun a son parcours, ses objectifs et ses limites. On respecte ça.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Communication saine</strong> : on échange avec bienveillance, on évite les conflits inutiles.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Confidentialité</strong> : ce qui se passe sur TENF reste sur TENF. Pas de screens, pas de partage externe sans autorisation.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Sanctions possibles</strong> : en cas de non-respect, avertissements, restrictions ou exclusion selon la gravité.</li>
                    </ul>
                  </div>

                  {/* 2. Respect & comportement */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Respect & comportement
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      On se respecte mutuellement. Pas de harcèlement, de discrimination, de propos haineux ou de comportements toxiques. On reste bienveillants et constructifs dans nos échanges.
                    </p>
                  </div>

                  {/* 3. Salons & usage */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Salons & usage
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Utilise les salons à bon escient : chaque salon a un rôle. Évite le spam, les messages répétitifs et les contenus hors-sujet. Respecte les règles spécifiques de chaque canal.
                    </p>
                  </div>

                  {/* 4. Confidentialité & confiance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      4. Confidentialité & confiance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les informations partagées sur TENF sont confidentielles. Pas de screens, pas de partage de conversations privées, pas de divulgation d'informations personnelles sans consentement. La confiance est essentielle.
                    </p>
                  </div>

                  {/* 5. Intégration & accès complet */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      5. Intégration & accès complet
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Pour avoir accès à tous les salons et fonctionnalités, participe à la réunion d'intégration. C'est obligatoire et ça permet de comprendre le fonctionnement de TENF.
                    </p>
                  </div>

                  {/* 6. Entraide & promotion */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      6. Entraide & promotion
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L'entraide est au cœur de TENF. Participe aux raids, aux événements, aux lives des membres. En retour, tu bénéficies aussi de la visibilité et du soutien de la communauté. L'entraide doit être réciproque.
                    </p>
                  </div>

                  {/* 7. Attitude attendue des créateurs */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      7. Attitude attendue des créateurs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En tant que créateur, on attend de toi une attitude constructive : participation active, respect des autres, ouverture aux retours et aux conseils. On progresse ensemble, pas seul.
                    </p>
                  </div>

                  {/* 8. Rôles, évaluations & décisions */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      8. Rôles, évaluations & décisions
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les rôles et évolutions sont décidés par l'équipe selon des critères transparents (engagement, participation, attitude). Les décisions sont prises dans l'intérêt de la communauté et peuvent être discutées avec respect.
                    </p>
                  </div>

                  {/* 9. Publicité & partenariats */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      9. Publicité & partenariats
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Pas de publicité non sollicitée, pas de promotion excessive de tes propres contenus en dehors des canaux prévus. Les partenariats et collaborations doivent être validés par l'équipe.
                    </p>
                  </div>

                  {/* 10. Sanctions */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      10. Sanctions
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En cas de non-respect du règlement : avertissement, restriction d'accès, ou exclusion selon la gravité. L'équipe se réserve le droit de modérer et de prendre les décisions nécessaires pour préserver l'esprit de TENF.
                    </p>
                  </div>

                  {/* Mot de l'équipe */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      💙 Mot de l'équipe
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      TENF existe pour créer un espace où chaque créateur peut progresser dans un environnement bienveillant. Ces règles ne sont pas là pour te contraindre, mais pour garantir que chacun puisse bénéficier de la même qualité d'entraide et de respect. Merci de les respecter et de contribuer à faire de TENF une vraie famille d'entraide.
                    </p>
                  </div>
                </div>
              </section>

              {/* Règlement des salons vocaux */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  🎧 Règlement des salons vocaux
                </h2>
                <div className="rounded-xl p-6 shadow-lg border mb-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Les salons vocaux sont des espaces d'échange privilégiés. Pour que tout le monde puisse en profiter, quelques règles simples :
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Respect & bienveillance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Respect & bienveillance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      On se respecte, on écoute, on ne coupe pas la parole. On reste bienveillants et constructifs. Pas de moqueries, pas de comportements toxiques.
                    </p>
                  </div>

                  {/* Live / jeu en cours = demande obligatoire */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Live / jeu en cours = demande obligatoire
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Si quelqu'un est en live ou en train de jouer, demande avant de rejoindre le vocal. Deux interdictions strictes :
                    </p>
                    <ul className="leading-relaxed space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Pas de join sans demander</strong> : respecte le travail en cours.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Pas de screens ou d'enregistrements</strong> : la confidentialité est essentielle.</li>
                    </ul>
                    <p className="leading-relaxed mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Ce qui se passe en vocal reste confidentiel. Pas de partage externe.
                    </p>
                  </div>

                  {/* Confidentialité & vie privée */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Confidentialité & vie privée
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les conversations vocales sont privées. Pas d'enregistrements, pas de screens, pas de partage de ce qui se dit en vocal. Respecte la vie privée de chacun.
                    </p>
                  </div>

                  {/* Écoute en mute */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Écoute en mute
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Si tu écoutes sans parler, reste en mute pour éviter les bruits de fond et les échos. Active ton micro quand tu veux intervenir.
                    </p>
                  </div>

                  {/* Politesse */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Politesse
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Salue en arrivant, dis au revoir en partant. C'est basique mais ça fait la différence. On reste polis et respectueux.
                    </p>
                  </div>

                  {/* Temps de parole & ambiance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Temps de parole & ambiance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Laisse la place aux autres, ne monopolise pas la conversation. On crée une ambiance agréable où chacun peut s'exprimer. Évite les débats houleux ou les sujets sensibles.
                    </p>
                  </div>

                  {/* Conflits */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Conflits
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Si un conflit survient, reste calme et constructif. Si ça dégénère, quitte le vocal et contacte un membre du staff en privé. On règle les problèmes avec respect.
                    </p>
                  </div>

                  {/* Autorité du staff */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Autorité du staff
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le staff a autorité pour modérer les vocaux. Si on te demande quelque chose (mute, changement de comportement, etc.), respecte la demande. Les décisions du staff sont prises pour le bien de tous.
                    </p>
                  </div>

                  {/* Sanctions vocal */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Sanctions vocal
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En cas de non-respect : avertissement, exclusion temporaire du vocal, ou restriction d'accès selon la gravité. Le staff peut prendre des mesures immédiates si nécessaire.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "systeme-points" && (
            <div className="space-y-8">
              {/* Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    Le système de points TENF récompense l'engagement réel, la présence humaine et l'entraide sincère sur le serveur Discord. Ici, chaque action compte — pas la performance, mais l'implication.
                  </p>
                </div>
              </section>

              {/* Comment gagner des points */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  🎯 Comment gagner des points ?
                </h2>

                <div className="space-y-6">
                  {/* Quête quotidienne */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🗓 Quête quotidienne
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        500 points / jour
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Utilise la commande /journalier une fois par jour dans le salon 🗓・bonus-journalier.
                    </p>
                  </div>

                  {/* Participation à la vie du serveur */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        💬 Participation à la vie du serveur
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        500 points tous les 3 niveaux
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Gagnés automatiquement grâce à ton activité : discussions textuelles, entraide, présence en vocal… (hors spam ou messages artificiels).
                    </p>
                  </div>

                  {/* Organisation de raids */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🤜🤛 Organisation de raids
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        500 points / raid
                      </span>
                    </div>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Organise un raid Twitch entre membres TENF.
                    </p>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Pour que le raid soit comptabilisé, le message doit être posté obligatoirement et uniquement dans #⚡・coordination-raid, sans aucun texte supplémentaire, sous le format exact suivant :
                    </p>
                    <div className="bg-[var(--color-surface)] rounded-lg p-4 my-3 border" style={{ borderColor: 'var(--color-border)' }}>
                      <code className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                        @membre1 a raid @membre2
                      </code>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Tout message qui ne respecte pas strictement ce format ne sera pas pris en compte.
                    </p>
                  </div>

                  {/* Parrainage de nouveaux membres */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🆕 Parrainage de nouveaux membres
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        300 points / parrainage validé
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Invite une personne qui partage les valeurs TENF et qui s'implique réellement dans la communauté.
                    </p>
                  </div>

                  {/* Suivi des réseaux TENF */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🔔 Suivi des réseaux TENF
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        500 points par réseau
                      </span>
                    </div>
                    <p className="leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Réseaux concernés : X (Twitter), TikTok, Instagram.
                    </p>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      📸 Preuve obligatoire à poster dans 📂・preuves-suivi.<br />
                      500 points attribués par réseau validé.
                    </p>
                  </div>

                  {/* Participation aux événements communautaires */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🎉 Participation aux événements communautaires
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        200 à 500 points
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Jeux communautaires, soirées fun, events spéciaux… Le montant dépend de l'implication et du type d'événement.
                    </p>
                  </div>
                </div>
              </section>

              {/* Bonus & avantages */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  🎁 Bonus & avantages
                </h2>

                <div className="space-y-6">
                  {/* Pack de démarrage */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🎒 Pack de démarrage
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        1000 points
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Attribués aux nouveaux streamers rejoignant TENF.
                    </p>
                  </div>

                  {/* Bonus d'anniversaire */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🎂 Bonus d'anniversaire
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        2000 points
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Parce que fêter ça ensemble, ça mérite un boost 🎉
                    </p>
                  </div>

                  {/* Multiplicateur de points x2 */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                        🔓 Multiplicateur de points x2
                      </h3>
                      <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                        À partir du niveau 21
                      </span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      1000 points tous les 3 niveaux au lieu de 500. Récompense la régularité, la fidélité et l'implication dans la durée.
                    </p>
                  </div>
                </div>
              </section>

              {/* Utiliser ses points */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  🏆 Utiliser ses points
                </h2>
                <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Les points permettent de débloquer différents avantages communautaires (rôles temporaires, bonus, accès spécifiques…).
                  </p>
                  <p className="leading-relaxed mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Les détails sont disponibles dans la boutique des points ou les salons dédiés.
                  </p>
                </div>
              </section>

              {/* L'esprit du système TENF */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  💙 L'esprit du système TENF
                </h2>
                <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF est avant tout : 🤝 de l'entraide, 💬 de l'échange, ❤️ du respect, 🚀 du soutien mutuel entre streamers.
                  </p>
                  <p className="leading-relaxed mt-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Les points récompensent l'humain avant la performance.
                  </p>
                </div>
              </section>
            </div>
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
      </div>
    </main>
  );
}

