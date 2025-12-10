# Design System TENF-V2

Ce document décrit le style et le design de TENF-V2 pour permettre leur réplication sur d'autres sites.

## 🎨 Palette de Couleurs

### Couleurs Principales

```css
/* Couleurs de base définies dans globals.css */
--color-bg: #0e0e10;           /* Fond principal (noir très foncé) */
--color-text: #e5e5e5;         /* Texte principal (gris clair) */
--color-primary: #9146ff;      /* Couleur primaire (violet Twitch) */
--color-primary-dark: #5a32b4; /* Couleur primaire foncée (violet sombre) */
--color-card: #1a1a1d;         /* Fond des cartes (gris très foncé) */
--radius-base: 8px;            /* Rayon de bordure par défaut */
```

### Utilisation des Couleurs

- **Fond de page** : `#0e0e10` (noir très foncé, style gaming/streaming)
- **Cartes/Conteneurs** : `#1a1a1d` avec bordure `rgba(255, 255, 255, 0.05)` ou `border-gray-700`
- **Texte principal** : `#e5e5e5` ou `text-white`
- **Texte secondaire** : `text-gray-300` ou `text-gray-400`
- **Accent/Call-to-action** : `#9146ff` (violet Twitch)
- **Hover sur accent** : `#5a32b4` (violet foncé)

### Couleurs pour Badges/Rôles

- **Staff** : `bg-[#9146ff] text-white`
- **Développement** : `bg-[#5a32b4] text-white`
- **Affilié/Créateur Junior** : `bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30`
- **Mentor/Admin** : `bg-gray-700 text-white`
- **VIP** : `bg-[#9146ff] text-white` avec badge circulaire

## 📐 Typographie

### Police de Caractères

```css
font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
```

- **Police principale** : Inter (moderne, lisible)
- **Fallback** : Segoe UI, system-ui, -apple-system, sans-serif

### Hiérarchie Typographique

```css
/* Titres */
h1 {
  font-size: clamp(2rem, 2.5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}

h2 {
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

h3 {
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
}
```

- **Titres** : Font-weight 700 (bold), responsive avec `clamp()`
- **Texte normal** : Font-weight 400-500
- **Texte accentué** : Font-weight 600-700 (semibold/bold)

## 🎭 Composants de Style

### Cartes (Cards)

```css
.card {
  background-color: var(--color-card);        /* #1a1a1d */
  border-radius: var(--radius-base);         /* 8px */
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  padding: 1.25rem;
}
```

**Classes Tailwind équivalentes :**
```html
<div class="card bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
```

**Caractéristiques :**
- Fond sombre (`#1a1a1d`)
- Bordure subtile (blanc à 5% d'opacité ou `border-gray-700`)
- Ombre portée douce (`shadow-lg`)
- Border-radius de 8px (`rounded-lg`)
- Padding généreux (1.25rem à 1.5rem)

### Boutons

#### Bouton Principal (CTA)

```html
<button class="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a32b4]">
  Action
</button>
```

**Caractéristiques :**
- Fond violet (`#9146ff`)
- Texte blanc, font-semibold
- Hover : fond violet foncé (`#5a32b4`)
- Transition douce sur les couleurs
- Border-radius : `rounded-lg` (8px)

#### Bouton Secondaire

```html
<button class="rounded-lg bg-[#1a1a1d] text-white border border-gray-700 hover:border-[#9146ff]/50 px-4 py-2 text-sm font-medium transition-all">
  Action
</button>
```

#### Bouton Actif (Filtres)

```html
<button class="rounded-lg bg-[#9146ff] text-white px-4 py-2 text-sm font-medium">
  Filtre actif
</button>
```

### Header/Navigation

```html
<header class="sticky top-0 z-50 border-b border-white/5 bg-[#0e0e10]/95 backdrop-blur">
```

**Caractéristiques :**
- Position sticky en haut
- Fond semi-transparent avec backdrop-blur (effet glassmorphism)
- Bordure inférieure subtile (`border-white/5`)
- Z-index élevé (50) pour rester au-dessus

**Liens de navigation :**
```html
<Link class="relative transition-colors hover:text-[#9146ff] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#9146ff] after:transition-all hover:after:w-full">
  Lien
</Link>
```

- Hover : changement de couleur vers violet
- Animation de soulignement qui s'étend de gauche à droite

### Modales

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
  <div class="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[#1a1a1d] border border-gray-700 p-8">
    <!-- Contenu -->
  </div>
</div>
```

**Caractéristiques :**
- Overlay sombre semi-transparent (`bg-black/80`)
- Carte centrée avec max-width
- Scroll vertical si contenu trop long
- Padding généreux (p-8)

### Sidebar (Admin)

```html
<aside class="flex h-screen flex-col bg-[#1a1a1d] px-6 py-8">
```

**Caractéristiques :**
- Hauteur pleine écran
- Fond sombre (`#1a1a1d`)
- Navigation verticale avec liens actifs en violet

**Lien actif :**
```html
<Link class="rounded-lg px-3 py-2 text-sm font-medium bg-[#9146ff] text-white">
  Page active
</Link>
```

**Lien inactif :**
```html
<Link class="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">
  Page inactive
</Link>
```

## 🎨 Effets et Animations

### Transitions

```css
* {
  transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}
```

**Caractéristiques :**
- Transitions globales de 150ms
- Easing : `ease` (démarrage et fin doux)
- Propriétés animées : couleur, fond, bordure, ombre

### Hover Effects

**Cartes :**
```html
<div class="card transition-transform hover:scale-[1.02]">
```
- Légère mise à l'échelle au survol (102%)

**Boutons :**
- Changement de couleur de fond
- Changement de couleur de bordure (pour boutons secondaires)

### Loading Spinner

```html
<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
```
- Animation de rotation
- Bordure violette
- Cercle avec bordure partielle

## 📱 Layout et Espacement

### Container Principal

```html
<div class="mx-auto max-w-7xl px-6">
```
- Largeur maximale : `max-w-7xl` (1280px)
- Centré horizontalement
- Padding horizontal : `px-6` (1.5rem)

### Grilles

**Grille responsive :**
```html
<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
```
- Mobile : 1 colonne
- Desktop : 3 colonnes
- Espacement : `gap-6` (1.5rem)

**Grille de membres :**
```html
<div class="grid grid-cols-3 gap-4 lg:grid-cols-8">
```
- Mobile : 3 colonnes
- Desktop : 8 colonnes

### Espacement Vertical

- **Sections** : `space-y-16` (4rem entre sections)
- **Éléments dans section** : `space-y-6` ou `space-y-8`
- **Padding de page** : `p-4` à `p-6` ou `py-16` pour sections hero

## 🎯 Patterns de Design Spécifiques

### Badges VIP

```html
<div class="absolute -bottom-1 -right-1 rounded-full bg-[#9146ff] px-2 py-0.5 text-xs font-bold text-white">
  VIP
</div>
```
- Position absolue en bas à droite de l'avatar
- Forme circulaire (`rounded-full`)
- Fond violet, texte blanc, font-bold

### Avatars avec Fallback

```html
<div class="h-16 w-16 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-lg">
  {initial}
</div>
```
- Gradient violet si pas d'image
- Initiale du nom au centre
- Taille standard : 16x16 (64px) ou 32x32 (128px)

### Cartes de Statistiques

```html
<div class="card bg-[#1a1a1d] border border-gray-700 p-6 text-center">
  <p class="text-4xl font-bold text-white">{number}</p>
  <p class="mt-2 text-sm text-gray-400">{label}</p>
</div>
```
- Nombre en grand (text-4xl, font-bold)
- Label en petit (text-sm, text-gray-400)
- Centré verticalement et horizontalement

### Indicateur "EN DIRECT"

```html
<div class="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
  EN DIRECT
</div>
```
- Badge rouge vif (`bg-red-600`)
- Position absolue en haut à gauche
- Texte blanc, font-bold

## 🌈 Gradients Utilisés

### Gradient Violet (VIP, Avatars)

```html
<div class="bg-gradient-to-br from-[#9146ff] to-[#5a32b4]">
```
- Direction : bottom-right (`to-br`)
- Du violet clair au violet foncé

### Gradient de Fond (Thumbnails)

```html
<div class="bg-gradient-to-br from-[#9146ff]/20 to-[#5a32b4]/20">
```
- Même gradient mais avec opacité réduite (20%)

## 📐 Responsive Design

### Breakpoints Tailwind

- **sm** : 640px
- **md** : 768px
- **lg** : 1024px
- **xl** : 1280px

### Patterns Responsive

**Navigation :**
- Desktop : Navigation horizontale visible
- Mobile : Navigation cachée (`hidden md:flex`)

**Grilles :**
- Mobile : 1 colonne
- Tablet : 2-3 colonnes (`md:grid-cols-2` ou `md:grid-cols-3`)
- Desktop : 3-4 colonnes (`lg:grid-cols-4`)

**Texte :**
- Utilisation de `clamp()` pour tailles responsives
- Exemple : `font-size: clamp(2rem, 2.5vw, 2.5rem)`

## 🎨 Thème Global

### Ambiance

- **Style** : Dark mode gaming/streaming
- **Inspiration** : Twitch (violet #9146ff)
- **Esthétique** : Moderne, épuré, professionnel
- **Contraste** : Élevé pour la lisibilité

### Principes de Design

1. **Fond sombre** : Noir très foncé (#0e0e10) pour réduire la fatigue oculaire
2. **Cartes élevées** : Cartes sombres (#1a1a1d) avec ombres pour créer de la profondeur
3. **Accent violet** : Couleur Twitch pour les actions importantes
4. **Transitions douces** : Toutes les interactions sont animées (150ms)
5. **Espacement généreux** : Beaucoup d'air entre les éléments
6. **Typographie claire** : Police moderne (Inter) avec hiérarchie claire

## 📋 Checklist pour Appliquer le Design

### CSS Variables à Définir

```css
:root {
  --color-bg: #0e0e10;
  --color-text: #e5e5e5;
  --color-primary: #9146ff;
  --color-primary-dark: #5a32b4;
  --color-card: #1a1a1d;
  --radius-base: 8px;
}
```

### Classes Utilitaires à Créer

- `.card` : Style de carte standard
- Transitions globales sur les éléments interactifs

### Couleurs Tailwind à Configurer

Si vous utilisez Tailwind, ajoutez ces couleurs personnalisées :

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'tenf-bg': '#0e0e10',
      'tenf-card': '#1a1a1d',
      'tenf-primary': '#9146ff',
      'tenf-primary-dark': '#5a32b4',
    }
  }
}
```

### Police à Importer

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## 🎯 Exemples de Code Complets

### Carte de Membre

```html
<div class="card flex cursor-pointer flex-col items-center space-y-4 bg-[#1a1a1d] border border-gray-700 p-4 text-center transition-transform hover:scale-[1.02]">
  <div class="relative">
    <img src="avatar.jpg" alt="Nom" class="h-16 w-16 rounded-full object-cover" />
    <div class="absolute -bottom-1 -right-1 rounded-full bg-[#9146ff] px-2 py-0.5 text-xs font-bold text-white">
      VIP
    </div>
  </div>
  <h3 class="text-sm font-semibold text-white">Nom du Membre</h3>
  <span class="rounded-lg px-2 py-1 text-xs font-bold bg-[#9146ff] text-white">
    Staff
  </span>
</div>
```

### Section avec Titre et Lien "Voir plus"

```html
<section class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-3xl font-bold text-white">Titre de Section</h2>
    <Link href="/page" class="text-sm font-medium text-white hover:text-[#9146ff] transition-colors">
      Voir plus →
    </Link>
  </div>
  <!-- Contenu de la section -->
</section>
```

### Bouton CTA Principal

```html
<Link href="/action" class="rounded-lg bg-[#9146ff] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#5a32b4]">
  Rejoindre maintenant
</Link>
```

---

**Note** : Ce design system est optimisé pour une expérience utilisateur moderne dans un contexte gaming/streaming, avec un focus sur la lisibilité, les animations douces et l'esthétique professionnelle.

