# Présentation — Parties publiques et espace membre (TENF V2)

Document à usage interne ou **support de présentation** : vue d’ensemble des zones **publiques**, de l’**espace membre** et des liens avec l’authentification.  
*(Les outils **administration** sous `/admin` et les redirections **staff modération** vers l’admin ne sont pas détaillés ici.)*

---

## 1. En deux phrases

**TENF New Family** est le site de la communauté d’entraide streamers : une partie **grand public** pour découvrir TENF, les créateurs et les événements, et un **espace membre** connecté avec Discord pour le profil, le planning, les raids, les objectifs, l’Academy, etc.

Techniquement : application **Next.js (App Router)**, session **NextAuth** avec **Discord**.

---

## 2. Comment l’accès est pensé

| Zone | URL typique | Accès |
|------|-------------|--------|
| **Public** | `/`, `/rejoindre/…`, `/membres`, etc. | Sans connexion |
| **Espace membre** | `/member/…`, certaines pages sous `/membres/…` | Connexion **Discord** ; les données perso viennent surtout des API `/api/members/me/…` (sinon message d’erreur / redirection côté UI) |
| **Administration** | `/admin/…` | Protégé par **middleware** (JWT) — hors périmètre de ce document |

Points utiles pour une présentation :

- Page de connexion : **`/auth/login`** (OAuth Discord ; redirection après login souvent vers **`/member/dashboard`**).
- **`/member`** redirige vers **`/member/dashboard`**.
- Ancienne URL **`/membres/dashboard`** redirige vers **`/member/dashboard`**.
- Le middleware traite notamment **`/admin`**, **`/auth/login`** et un cas mobile sur **`/member/dashboard`** ; le reste du périmètre membre repose sur **l’auth applicative** (API + composants).

---

## 3. Navigation publique principale (menu du site)

Le bandeau du site structure l’offre **grand public** (desktop + mobile). À titre indicatif :

- **Boutique** : `/boutique`
- **La communauté** : à propos, fonctionnement, témoignages, UPA Event, organisation du staff, organigramme interactif  
  (`/a-propos`, `/fonctionnement-tenf/decouvrir`, `/avis-tenf`, `/upa-event`, `/organisation-staff`, `/organisation-staff/organigramme`, …)
- **Découvrir les créateurs** : annuaire membres, clips, interviews, lives et calendrier des lives  
  (`/membres`, `/decouvrir-createurs`, `/interviews`, `/lives`, `/lives/calendrier`)
- **Événements** : calendrier / événements communautaires, New Family Aventura  
  (`/events2`, `/evenements-communautaires`, `/new-family-aventura` et sous-pages associées)
- **Rejoindre TENF** : intégration, guides public / espace membre, FAQ, soutien  
  (`/integration`, `/rejoindre/…`, `/soutenir-tenf`)

Autres entrées publiques présentes dans l’arborescence du projet : par exemple **`/boutique2`**, **`/soutien-nexou`**, **`/vip`** (et sous-pages clips / historique / interviews), **`/communaute-entraide-streamer-twitch`**, **`/postuler`** (formulaire + page merci).  
La route **`/events`** redirige vers **`/events2`**.

---

## 4. Contenus « institutionnels » et pédagogiques

### Fonctionnement TENF

Sous **`/fonctionnement-tenf`** : pages comme **Découvrir**, **Progression**, **Comment ça marche**, **FAQ**, **Communauté**, **Ressources**, ainsi que **parcours complet** (`/fonctionnement-tenf/parcours-complet`).  
Une partie utilise un sous-layout avec navigation dédiée (`(withNav)`).

### Rejoindre TENF — guides

- **Hub** : `/rejoindre`, FAQ générale `/rejoindre/faq`, guide d’intégration `/rejoindre/guide-integration`, réunion d’intégration `/rejoindre/reunion-integration`.
- **Guide public** (`/rejoindre/guide-public`) : présentation rapide, création de compte, liaison Twitch, FAQ publique, etc.
- **Guide espace membre** (`/rejoindre/guide-espace-membre`) : première connexion, tableau de bord expliqué, fonctionnalités principales, paramètres / sécurité, FAQ membre — ces pages sont **pédagogiques** et restent du **public** (elles décrivent l’espace membre sans le remplacer).

### Intégration

- **`/integration`** : page « calendrier » des sessions d’intégration (contenu orienté nouveaux membres, consultation publique).

---

## 5. Annuaire et vitrine des créateurs

- **`/membres`** : **annuaire public** des membres (données exposées via l’API publique des membres, fiches enrichies, modal de détail).
- **`/membres/[id]`** : **fiche membre** publique (profil côté site).
- **`/decouvrir-createurs`** : mise en avant de **clips** à découvrir.
- **`/interviews`** : interviews TENF.
- **`/lives`** et **`/lives/calendrier`** : lives et planification.

*(Certaines URLs legacy sous `/membres/` redirigent vers l’espace membre moderne — voir section 7.)*

---

## 6. Événements, VIP, Academy côté « site ouvert »

- **Événements** : **`/events2`** comme hub calendrier principal ; **`/evenements-communautaires`** ; parcours **New Family Aventura** avec FAQ et infos pratiques (`/new-family-aventura/…`).
- **VIP** : **`/vip`** et sous-routes (clips, historique, interviews).
- **Academy** : **`/academy`** avec pages **promotion** dynamiques (`/academy/promo/[id]/…`), **formulaires** (auto-évaluations, retours live, évaluation academy), **dashboard** et **accès** (`/academy/dashboard`, `/academy/access`). Selon le contexte, certaines actions peuvent nécessiter d’être connecté ou d’avoir un droit spécifique — à préciser lors d’une démo selon les règles métier actuelles.

---

## 7. Espace membre — périmètre et ergonomie

### Où ça vit

- **Préfixe principal** : **`/member/…`**
- Le layout grand public affiche la **barre latérale membre** (`UserSidebar`) lorsque l’URL commence par **`/member`** ou **`/membres`** (navigation dédiée + version mobile en tiroir).

### Cartographie fonctionnelle (sidebar)

Alignée sur la configuration de navigation membre du projet :

1. **Espace membre**  
   - Tableau de bord : `/member/dashboard`  
   - Postuler modérateur / soutien TENF : lien vers **`/postuler`**  
   - Planning TENF & notifications : `/member/evenements`, `/member/notifications`

2. **Mon profil**  
   - Profil, complétion : `/member/profil`, `/member/profil/completer` (+ éventuellement `/member/profil/modifier`)  
   - Planning de live personnel : `/member/planning`

3. **Participation TENF**  
   - **Raids** : historique, statistiques, déclaration : `/member/raids/historique`, `/member/raids/statistiques`, `/member/raids/declarer`  
   - **Événements** : planning, inscriptions, présences : `/member/evenements`, `/member/evenements/inscriptions`, `/member/evenements/presences`  
   - **Engagement** : score, « à découvrir », amis : `/member/engagement/score`, `/member/engagement/a-decouvrir`, `/member/engagement/amis`

4. **Objectifs et activité**  
   - Objectifs du mois, progression, activité du mois, historique : `/member/objectifs`, `/member/progression`, `/member/activite`, `/member/activite/historique`

5. **Academy et formations**  
   - Présentation Academy, candidature, parcours : `/member/academy`, `/member/academy/postuler`, `/member/academy/parcours`  
   - Catalogue et validations : `/member/formations`, `/member/formations/validees`

6. **Évaluation**  
   - `/member/evaluations`, `/member/evaluations/historique`

7. **Compte**  
   - `/member/parametres`

Les utilisateurs ayant des **droits admin** voient en plus une section **Administration** dans la même barre latérale (liens vers `/admin/…`).

### Parcours onboarding (à mentionner en présentation)

Le **dashboard membre** peut rediriger les profils incomplets ou en onboarding vers **`/member/profil/completer`** (profil Twitch / validation selon les règles métier).

### État de certaines pages

En implémentation actuelle du dépôt, certaines entrées membre peuvent afficher un **écran « bientôt disponible »** (par exemple évaluation ou parcours Academy membre selon les fichiers concernés). À vérifier en démo sur la branche déployée.

---

## 8. Routes `/membres/…` complémentaires

Outre l’**annuaire public** (`/membres`, `/membres/[id]`) :

- **`/membres/me`** → redirection vers la complétion de profil membre (`/member/profil/completer`).
- **`/membres/dashboard`** → redirection vers **`/member/dashboard`**.
- **`/membres/planning`**, **`/membres/formations-validees`** : pages liées au **planning** et aux **formations validées** (perçues comme prolongement de l’expérience membre, avec le même shell de navigation lorsque l’URL est sous `/membres`).

---

## 9. Idées de structure pour une présentation orale

1. **Problème / public cible** : visibilité de la communauté, recrutement, events.  
2. **Parcours visiteur** : accueil → découvrir créateurs / lives → rejoindre / intégration.  
3. **Parcours membre** : connexion Discord → dashboard → profil et planning → participation (raids, events, engagement).  
4. **Engagement long terme** : objectifs, Academy, formations, évaluations.  
5. **Rappel sécurité** : espace membre = **données personnelles** via APIs authentifiées ; admin = périmètre séparé protégé.

---

## 10. Références dans le code (pour maintenir ce document)

- Navigation publique du header : `components/Header.tsx`  
- Navigation latérale membre : `lib/navigation/memberSidebar.ts`  
- Layout client (sidebar membre, admin séparé) : `app/layout.client.tsx`  
- Protection admin : `middleware.ts`

*Document généré à partir de l’arborescence `app/` et de la navigation du projet — à ajuster si des routes sont ajoutées ou retirées.*
