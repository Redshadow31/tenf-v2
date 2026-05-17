# Audit des routes — Nettoyage prudent

> Date : 11 mai 2026  
> Auteur : nettoyage automatisé sous validation utilisateur  
> Objectif : retirer les routes manifestement legacy, doublons ou inutilisées, sans casser les pages publiques, l'espace membre, l'espace admin ni les API actives.

---

## 1. Routes supprimées (sans risque, après vérification)

| Route | Type | Justification | Référence externe |
|---|---|---|---|
| `/admin-secure` (`app/admin-secure/`) | Page | Système de login alternatif jamais consommé. Le cookie `admin_secure_session` n'est lu nulle part. Le middleware utilise uniquement le JWT NextAuth/Discord. Doublon dangereux d'un point de vue sécurité. | Aucune (uniquement self-link vers son API) |
| `/api/admin/login` (`app/api/admin/login/`) | API | Couplée à `/admin-secure`, sans usage par ailleurs. | Aucune |
| `/events` (`app/events/`) | Page | Contenait uniquement `redirect("/events2")`. Aucun lien interne ne pointe vers `/events`. Remplacé par un **redirect 301** côté Next.js (voir `next.config.js`) pour préserver d'éventuels backlinks externes / cache SEO. | Aucune dans `*.tsx`, uniquement docs et migrations |
| `/evaluation` (`app/evaluation/`) | Page | Placeholder ("Cette page sera bientôt disponible."). Aucun lien interne. Remplacé par un **redirect 301** vers `/member/dashboard`. | Aucune |
| `/fonctionnement-tenf2` (`app/fonctionnement-tenf2/`) | Dossier vide | Dossier vide laissé sans `page.tsx`. Remplacé par un **redirect 301** vers `/fonctionnement-tenf/decouvrir` par sécurité. | Aucune |

**Total : 5 routes / 2 sous-arborescences supprimées.**

---

## 2. Routes conservées (validées par l'utilisateur le 11/05/2026)

### 2.1 Doublons admin laissés en place

| Route | Statut | Raison |
|---|---|---|
| `/admin/dashboard` + `/admin/dashboard2` | **Conservés tous les deux** | `dashboard` est largement utilisé (sidebar admin, redirections, contrôle d'accès, breadcrumbs). `dashboard2` est lié depuis `app/admin/gestion-acces/dashboard/page.tsx` comme "Ouvrir le dashboard v2". À évaluer dans un second passage dédié à l'admin. |
| `/admin/raids` + `/admin/raids2` | **Conservés tous les deux** | `raids` (845 lignes) est référencé depuis `engagement/raids-test`. `raids2` (615 lignes) est lié depuis `engagement/historique-raids` ("Ouvrir suivi des raids (import manuel)"). Les deux sont fonctionnels et utilisés à des fins différentes. |
| `/admin/evaluation/v1`, `/v2`, `/v3` + `/admin/evaluations` + `/admin/evaluation-mensuelle` | **Tous conservés** | Demande explicite de l'utilisateur : *"en gardant tous les systèmes d'évaluation pour le moment"*. |
| `/admin/evenements-serveur` + `/admin/events` + `/admin/communaute/evenements` | Conservés | Trois systèmes d'événements en parallèle, à consolider dans une future itération. |

### 2.2 Doublons publics laissés en place

| Route | Statut | Raison |
|---|---|---|
| `/boutique` + `/boutique2` | **Conservés tous les deux** (l'utilisateur a choisi `only_empty`) | ⚠ Attention : ici c'est l'**inverse** de la convention "garder le 2". `/boutique` est la **version active** (linkée par le `Header`, par `/soutenir-tenf`, par `/boutique/[id]`). `/boutique2` est une **maquette d'essai** qui propose elle-même un lien *"Revenir à la boutique actuelle"* → `/boutique`. Recommandation pour plus tard : supprimer `/boutique2`, pas `/boutique`. |
| `/events2` | **Conservé (production active)** | Choix utilisateur : garder la version 2 et déprécier `/events`. Renommer plus tard `events2` → `events`. |

### 2.3 SEO actif — à ne pas toucher

| Route | Raison |
|---|---|
| `/communaute-entraide-streamer-twitch` | Landing SEO active avec FAQ JSON-LD. Référencée dans le sitemap (priorité 0.9). |
| Tout `/fonctionnement-tenf/*` | Hub pédagogique actif (7 sous-pages). À simplifier dans une future refonte UX. |
| Tout `/rejoindre/*`, `/guides/*`, `/integration` | Hub d'entrée actif (14 pages). À fusionner dans une future refonte UX. |

---

## 3. Redirects 301 ajoutés (`next.config.js`)

```js
{ source: '/events',               destination: '/events2',                       permanent: true },
{ source: '/admin-secure',         destination: '/auth/login',                    permanent: true },
{ source: '/evaluation',           destination: '/member/dashboard',              permanent: true },
{ source: '/fonctionnement-tenf2', destination: '/fonctionnement-tenf/decouvrir', permanent: true },
```

Objectif : préserver le SEO et les bookmarks externes éventuels pendant que Google met à jour son index.

---

## 4. Sitemap mis à jour

- Retrait de `/events` (legacy).
- `/events2` voit sa `changeFrequency` passer à `daily` et sa priorité ajustée à `0.8` (héritée de l'ancienne entrée `/events`).
- Toutes les autres entrées sont inchangées.

---

## 5. Hygiène fichiers

### 5.1 `.gitignore` enrichi
Ajout des règles :
```
*.log
debug-*.log
```

### 5.2 Fichier supprimé
- `debug-aba714.log` (5 618 octets) — log de debug local, non versionné par git mais présent dans l'arborescence.

### 5.3 Documents déplacés
26 fichiers `.md` qui traînaient à la racine du projet ont été déplacés vers **`docs/legacy/`** pour garder la racine propre :

```
AJOUTER_BOT_DISCORD.md
ANALYSE_CONFLITS.md
BOT_DISCORD_HORS_LIGNE.md
CONFIGURATION_BOT_RAIDS.md
CONFIGURATION_STATBOT.md
CONFIGURATION_TWITCH_EVENTSUB.md
DEBUG_DISCORD_OAUTH.md
DEPLOIEMENT_CHECKLIST.md
DEPLOIEMENT_NEXTAUTH.md
DESIGN_SYSTEM_TENF_V2.md
DOCUMENTATION_SPOTLIGHT_DATA.md
GUIDE_ACTIVATION.md
GUIDE_MIGRATION_V3.md
MIGRATION_NEXTAUTH.md
MIGRATION_NEXTAUTH_COMPLETE.md
MIGRATION_NEXTAUTH_RESUME.md
MIGRATION_NEXTAUTH_STATUS.md
MISE_A_JOUR_DOMAINE_NETLIFY.md
MISE_A_JOUR_NETLIFY.md
NETLIFY_BLOBS_SETUP.md
PROBLEME_PERSISTANCE_DONNEES.md
RESOLUTION_ERREUR_ETAT_INVALIDE.md
ROUTES_AUDIT.md          → renommé ROUTES_AUDIT_API_LEGACY.md
SECURITY_SECRETS.md
VARIABLES_ENV_NETLIFY.md
VERIFICATION_DISCORD_APP.md
```

L'ancien `ROUTES_AUDIT.md` (audit des routes API datant d'une autre phase) a été renommé `ROUTES_AUDIT_API_LEGACY.md` pour libérer le nom `ROUTES_AUDIT.md` (ce présent document).

---

## 6. Ce qui n'a PAS été touché

Conformément aux contraintes :

- ❌ **Aucune modification de l'espace membre** (`app/member/*`, `app/membres/*`)
- ❌ **Aucune modification des API critiques** : Discord, Twitch, EventSub, Auth/NextAuth, Supabase, Drizzle, raids, evaluations, lives, members
- ❌ **Aucune modification du design system** (Tailwind, CSS, composants UI)
- ❌ **Aucune modification du middleware** (sécurité admin/member intacte)
- ❌ **Aucune suppression côté admin** au-delà de `/admin-secure` (système de login mort)
- ❌ **Aucun système d'évaluation supprimé** (v1, v2, v3, mensuelle, evaluations) → demande explicite de l'utilisateur

---

## 7. Recommandations pour les prochaines passes de nettoyage

### Niveau 1 — Sans risque, à faire bientôt

1. **`/boutique2`** : supprimer, c'est une maquette morte (pas `/boutique` qui est la prod).
2. **Pages `/rejoindre/*` + `/guides/*` + `/integration`** : 14 pages éparpillées, à fusionner en un hub unique.
3. **Dossiers admin `/admin/dashboard2`, `/admin/raids2`** : décider lequel garder, mettre à jour les liens internes, supprimer l'autre.
4. **`/admin/migration`, `/admin/system-test`, `/admin/debug`** : outils internes, à protéger derrière un flag prod off ou à archiver.

### Niveau 2 — Refonte modérée

5. **3 systèmes d'événements** (`/admin/events`, `/admin/communaute/evenements`, `/admin/evenements-serveur`) → en consolider un seul.
6. **Système d'évaluations** : geler v1/v2, garder uniquement v3 quand la migration sera complète.
7. **5 systèmes de raids** (`raids`, `raids2`, `engagement/raids-sub`, `engagement/raids-test`, `engagement/historique-raids`) → consolider.

### Niveau 3 — Long terme

8. **Restructurer `lib/`** en sous-dossiers métier (100+ fichiers à la racine).
9. **Découper les pages > 500 lignes** (`/postuler` = 2004 lignes, `/membres` = 1192, `/lives` = 978, `/events2` = 772, `/integration` = 711, `/evenements-communautaires` = 1113).
10. **Sortir `/membres`, `/lives`, `/avis-tenf`, `/vip` du mode 100% client** pour récupérer le SEO.

---

## 8. Récapitulatif des fichiers modifiés dans cette passe

| Fichier | Action |
|---|---|
| `.gitignore` | Ajout de `*.log` et `debug-*.log` |
| `next.config.js` | Ajout de 4 redirects 301 |
| `app/sitemap.ts` | Suppression de l'entrée `/events`, mise à jour `/events2` |
| `app/admin-secure/page.tsx` | **Supprimé** |
| `app/admin-secure/` | **Supprimé** (dossier) |
| `app/api/admin/login/route.ts` | **Supprimé** |
| `app/api/admin/login/` | **Supprimé** (dossier) |
| `app/events/page.tsx` | **Supprimé** |
| `app/events/` | **Supprimé** (dossier) |
| `app/evaluation/page.tsx` | **Supprimé** |
| `app/evaluation/` | **Supprimé** (dossier) |
| `app/fonctionnement-tenf2/` | **Supprimé** (dossier vide) |
| `debug-aba714.log` | **Supprimé** |
| 26 × `*.md` à la racine | **Déplacés** dans `docs/legacy/` |
| `docs/ROUTES_AUDIT.md` | **Créé** (ce fichier) |

Aucune référence côté `*.tsx` cassée par ce nettoyage (vérifié par recherche exhaustive).
