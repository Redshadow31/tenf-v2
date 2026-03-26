# Guide Debutant - Transformer TENF-V2 en Application Mobile avec Capacitor

Ce guide t'explique pas a pas comment garder ton site Next.js et le publier en application mobile Android et iOS avec Capacitor.

---

## 0) Ce que tu vas obtenir

A la fin, tu auras :

- une app Android installable (APK/AAB)
- une app iOS installable (avec Xcode sur Mac)
- une seule base de code web (ton projet actuel)

Important : Capacitor n'est pas une re-ecriture React Native. C'est ton site charge dans un conteneur natif.

---

## 1) Prerequis

## 1.1 Prerequis generaux

- Node.js 20+ et npm 10+ (deja OK dans ton projet)
- Projet Next.js qui build sans erreur
- Git (recommande)

## 1.2 Pour Android

- Android Studio installe
- JDK 17
- Emulateur Android ou telephone Android

## 1.3 Pour iOS (obligatoire sur Mac)

- Mac + Xcode installe
- Compte Apple Developer (pour publier)
- CocoaPods installe

---

## 2) Choisir la strategie de rendu (guide detaille debutant)

Capacitor ne "compile" pas ton site : il copie un dossier de fichiers web (`webDir`) dans l'app Android/iOS, ou bien il affiche une URL distante dans une WebView. La question est donc : **quel contenu tu mets dans ce dossier, ou quelle URL tu affiches ?**

### 2.1 Vocabulaire (a lire une fois)

| Terme | En une phrase |
|-------|----------------|
| **Fichiers statiques** | HTML, JS, CSS, images : le navigateur les telecharge et les affiche. Pas de programme Node qui tourne sur le telephone pour generer la page. |
| **SSR (Server-Side Rendering)** | Le serveur (Netlify, ton VPS, etc.) genere la page HTML **au moment de la requete**. Next.js peut faire ca. |
| **Routes API Next.js** | Fichiers dans `app/api/...` ou `pages/api/...` : du code qui s'execute **sur le serveur** (base de donnees, secrets, etc.). |
| **Middleware** | Fichier `middleware.ts` : s'execute sur le serveur avant la page (redirections, protection de routes). |
| **Export statique** | Commande `next build` qui produit un dossier `out/` avec uniquement du statique. Pas de serveur Next integre dans ce dossier. |

Si tu es debutant : pense **"option A = tout dans le telephone, sans serveur Next"** et **"option B = le telephone ouvre ton site comme dans Chrome, mais dans une app"**.

---

### 2.2 Option A : Export statique (`out/`)

**Ce que ca fait concretement (resume)**

1. Tu lances `npm run build` avec `output: "export"` dans `next.config.js`.
2. Next.js genere un dossier `out/` a la racine du projet.
3. Ce dossier contient des fichiers que tu peux ouvrir comme un site statique (pas besoin de `next start`).
4. Tu configures Capacitor avec `webDir: "out"`, puis `npx cap sync` : ces fichiers sont copies dans le projet Android/iOS.

**Guide detaille etape par etape (debutant)**

*Fais ca sur une branche Git ou une copie du projet si tu veux eviter de casser ta config actuelle.*

**Etape 1 — Activer l'export dans `next.config.js`**

- Ouvre le fichier `next.config.js` a la racine du projet (pas dans `app/`).
- Ton fichier contient deja plein d'options (`images`, `redirects`, etc.). Il faut **fusionner** avec ce qui existe, pas tout remplacer par un petit exemple vide.
- Dans l'objet `nextConfig`, ajoute (ou complete) au minimum :

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    // garde tes "domains" existants si tu en as, et ajoute :
    unoptimized: true,
  },
  // ... le reste de ton fichier (redirects, etc.)
};

module.exports = nextConfig;
```

- **Pourquoi `images.unoptimized: true` ?** Avec `output: "export"`, le serveur d'optimisation d'images Next ne tourne pas dans le dossier `out/`. Sans `unoptimized`, le build peut echouer ou les images ne s'affichent pas correctement.
- **Attention** : certaines options Next (middleware cote build, certaines routes dynamiques, API routes) peuvent faire **echouer** l'export ou exiger des changements dans le code. Si le build plante, lis le message d'erreur dans le terminal : il indique souvent la page ou la regle qui bloque.

**Etape 2 — Lancer le build**

- Dans un terminal, a la racine du projet :

```bash
npm run build
```

- Attends la fin. En cas de succes, la fin du log indique souvent quelque chose comme "Exporting" ou mentionne le dossier de sortie.
- **Si erreur** : copie le message complet ; souvent il faut retirer ou adapter une fonctionnalite incompatible avec l'export statique, ou passer a l'option B (site heberge).

**Etape 3 — Verifier le dossier `out/`**

- Apres un build reussi, regarde a la racine du projet : tu dois voir un dossier nomme **`out`** (au meme niveau que `package.json`, `app/`, `public/`).
- Dedans tu trouves typiquement :
  - des fichiers `.html` (pages),
  - un dossier `_next/` (JS et CSS compiles),
  - souvent des copies de fichiers depuis `public/` (images, favicon, etc.).
- **Test rapide sans telephone** : tu peux servir ce dossier avec un petit serveur statique pour verifier que le site s'affiche. Exemple avec `npx` (si disponible) :

```bash
npx serve out
```

Puis ouvre l'URL affichee dans le navigateur. Si la page est blanche ou les routes cassent, note le probleme avant d'aller sur Capacitor.

**Etape 4 — Lier ce dossier a Capacitor**

- Quand Capacitor est installe (voir section 3 du guide), le fichier `capacitor.config.ts` (ou `.json`) doit indiquer ou sont les fichiers web :

```ts
webDir: "out",
```

- **Ne mets pas** `webDir: "public"` : `public` n'est pas le build compile ; c'est `out` apres `npm run build` avec export.

**Etape 5 — Copier les fichiers vers Android / iOS**

- A chaque fois que tu refais un build web :

```bash
npm run build
npx cap sync
```

- `cap sync` copie le contenu de `out/` dans les projets natifs (`android/`, `ios/`) pour que l'app affiche la derniere version.

**Rappel** : pour TENF-V2, si l'etape 2 echoue ou que login / API ne marchent pas en statique, l'option B (URL de ton site en ligne) est souvent la bonne voie sans tout recoder.

**Avantages**

- L'app fonctionne **meme sans connexion** pour tout ce qui a ete mis en cache (selon ce que tu caches).
- Pas besoin que ton serveur Netlify soit joignable pour afficher les pages deja embarquees.
- Souvent plus simple a debugger cote "fichiers locaux".

**Limites (important)**

- **Pas de SSR** : pas de generation HTML par le serveur Next au moment du clic. Les pages sont pre-generees au build (ou rendues cote client uniquement selon la config).
- **Pas de routes API Next.js** dans l'app : les fichiers `app/api/...` ne tournent pas sur le telephone. Si ton site appelle `/api/...` sur le meme domaine, en mode export pur il n'y a **pas** de serveur Next pour repondre. Il faudrait soit deplacer les APIs ailleurs (Supabase, autre backend), soit ne pas utiliser l'export pur pour ces parties.
- **Middleware**, **redirects** dynamiques cote serveur, certaines fonctionnalites Next avancees : souvent **incompatibles** ou a adapter avec l'export statique.

**Comment savoir si l'option A est possible pour TON projet**

Pose-toi ces questions :

1. Est-ce que j'ai des dossiers `app/api` ou `pages/api` que le front appelle en `fetch('/api/...')` ? Si oui, en export statique il faut que ces appels pointent vers **un backend deja en ligne** (URL absolue), pas vers le meme build statique.
2. Est-ce que je depend de `middleware.ts` pour proteger des pages ? L'export statique ne l'execute pas dans l'app locale comme sur Netlify.
3. Le build avec `output: "export"` reussit-il sans erreur ? C'est le test le plus fiable : si `npm run build` echoue apres avoir active l'export, il faudra corriger ou choisir l'option B.

**Cas TENF-V2** : un projet avec auth (NextAuth), base de donnees, routes API et middleware ressemble souvent a un site **qui a besoin d'un serveur** ou d'APIs hebergees. Pour beaucoup de fonctionnalites, **l'option B est plus realiste sans tout refactoriser**. L'option A reste possible si tu acceptes de ne packager qu'une partie du site, ou si tout le "dynamique" passe deja par des URLs externes (Supabase, etc.) et que le build export passe.

---

### 2.3 Option B : Site heberge + WebView (URL de production)

**Ce que ca fait concretement**

1. Ton site reste deploye comme aujourd'hui (ex. Netlify sur `https://tenf-community.com`).
2. Dans `capacitor.config.ts`, tu configures `server.url` avec cette URL HTTPS.
3. L'app mobile ouvre cette adresse dans une WebView : c'est **le meme site** que dans le navigateur, avec le serveur Next/Netlify derriere.

**Avantages**

- Tu gardes **SSR**, **API routes**, **middleware**, **NextAuth** : tout ce qui fonctionne sur le web fonctionne dans l'app, car c'est le meme backend.
- Tu n'as pas a convertir tout le projet en export statique.

**Limites**

- **Connexion Internet** necessaire pour la plupart des parcours (comme un site classique).
- Il faut verifier **cookies**, **sessions**, **CORS**, **redirections OAuth** (Discord, Twitch, etc.) : parfois un reglage dans NextAuth ou les fournisseurs OAuth est necessaire pour que la connexion depuis l'app soit acceptee.
- Les mises a jour du site sont **immediatement** visibles dans l'app (pas besoin de republier l'app pour un correctif de texte), ce qui est un plus.

**Reglage typique (exemple)**

```ts
// capacitor.config.ts - exemple option B
server: {
  url: "https://tenf-community.com",
  cleartext: false,
},
```

En developpement, tu peux pointer vers ton PC avec `http://IP_LOCALE:3000` et `cleartext: true` (voir section 11 du guide).

---

### 2.4 Tableau comparatif rapide

| Critere | Option A (export `out/`) | Option B (URL hebergee) |
|---------|--------------------------|-------------------------|
| Besoin de serveur Next dans l'app | Non | Oui (sur le web) |
| API `/api/...` Next dans le telephone | Non | Oui (via le site) |
| Offline | Partiel possible | Limite au cache navigateur |
| Complexite pour TENF-type | Souvent elevee | Souvent plus simple |

---

### 2.5 Quelle option choisir ? (decision simple)

1. Lance un test (sur une branche Git) : ajoute `output: "export"` + `images.unoptimized: true`, puis `npm run build`.
2. **Si le build reussit** et que tu confirmes que toutes tes fonctions critiques passent par des services en ligne deja configures : tu peux tenter l'**option A**.
3. **Si le build echoue** ou que login / admin / API sont indispensables sans refonte : prends l'**option B** en pointant vers ton domaine de production (ou un sous-domaine de staging).

Ensuite seulement, passe a la section 3 (installation Capacitor) en ayant deja note ton choix (A ou B) et la valeur de `webDir` ou `server.url`.

---

## 3) Installer Capacitor dans ton projet

Depuis la racine du projet :

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

Lors de `cap init`, reponds par exemple :

- App name : `TENF New Family`
- App ID : `com.tenf.newfamily`
- Web Dir : `out` (si export statique) ou ton dossier web cible

---

## 4) Configurer Next.js pour l'export statique (si option A)

Dans `next.config.js`, ajoute (ou adapte) :

```js
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

Puis build :

```bash
npm run build
```

Tu dois obtenir un dossier `out/`.

---

## 5) Verifier et ajuster `capacitor.config.ts`

Cree ou modifie `capacitor.config.ts` :

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tenf.newfamily",
  appName: "TENF New Family",
  webDir: "out",
  bundledWebRuntime: false,
};

export default config;
```

Si tu utilises l'option B (site heberge), tu peux mettre :

```ts
server: {
  url: "https://ton-domaine.com",
  cleartext: false,
},
```

---

## 6) Ajouter les plateformes natives

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

Note : `ios` ne sert que sur Mac.

---

## 7) Synchroniser le code web vers Android/iOS

A chaque changement web important :

```bash
npm run build
npx cap sync
```

`cap sync` copie ton build web dans les projets natifs et met a jour les plugins.

---

## 8) Lancer sur Android

```bash
npx cap open android
```

Ensuite dans Android Studio :

1. Attendre la sync Gradle
2. Choisir un emulateur/appareil
3. Cliquer sur Run

---

## 9) Lancer sur iOS (Mac seulement)

```bash
npx cap open ios
```

Ensuite dans Xcode :

1. Ouvrir le target de l'app
2. Aller dans `Signing & Capabilities`
3. Selectionner ton Team Apple
4. Lancer sur simulateur/appareil

---

## 10) Workflow quotidien (simple)

Quand tu modifies ton site :

1. `npm run build`
2. `npx cap sync`
3. `npx cap open android` ou `npx cap open ios`
4. Rebuild depuis Android Studio/Xcode

---

## 11) Mode developpement mobile (facultatif)

Tu peux connecter l'app a ton serveur Next local pour voir les changements rapidement.

Dans `capacitor.config.ts` :

```ts
server: {
  url: "http://192.168.1.42:3000",
  cleartext: true,
},
```

Puis :

```bash
npx cap sync
```

Important :
- le PC et le mobile doivent etre sur le meme Wi-Fi
- retirer `server.url` avant la release production

---

## 12) Ajouter des fonctions natives (camera, push, etc.)

Exemple camera :

```bash
npm install @capacitor/camera
npx cap sync
```

Puis dans ton code :

```ts
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri,
  source: CameraSource.Prompt,
});
```

---

## 13) Publication Android (Play Store)

1. Ouvrir Android Studio
2. Build `Generate Signed Bundle / APK`
3. Generer un `AAB`
4. Uploader sur Google Play Console
5. Completer fiche store + politique de confidentialite

---

## 14) Publication iOS (App Store)

1. Ouvrir Xcode
2. `Product > Archive`
3. Envoyer vers App Store Connect
4. Completer metadata et captures
5. Soumettre a review Apple

---

## 15) Problemes frequents et solutions

### Erreur : page blanche dans l'app

- verifier `webDir` dans `capacitor.config.ts`
- relancer `npm run build` puis `npx cap sync`

### Erreur : assets non trouves

- verifier les chemins absolus (`/images/...`) dans Next
- verifier le contenu du dossier `out/`

### Erreur auth/cookies

- verifier domaine HTTPS de production
- verifier configuration NextAuth (`NEXTAUTH_URL`, callbacks)
- tester en mode heberge si l'export statique bloque ton flux

### Erreur plugin natif non detecte

- `npm install <plugin>`
- `npx cap sync`
- relancer Android Studio/Xcode

---

## 16) Checklist finale

- [ ] Le site build sans erreur (`npm run build`)
- [ ] `capacitor.config.ts` est correct (`appId`, `appName`, `webDir`)
- [ ] Android ajoute et lance
- [ ] iOS ajoute et lance (sur Mac)
- [ ] Les icones/splash sont definis
- [ ] Les parcours critiques (login, navigation, formulaires) sont testes
- [ ] Build de release genere (AAB/Archive)

---

## 17) Commandes utiles (resume)

```bash
# Installation
npm install @capacitor/core @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios

# Build et sync
npm run build
npx cap sync

# Ouvrir plateformes
npx cap open android
npx cap open ios
```

---

## 18) Conseil pratique pour TENF-V2

Commence par Android d'abord (plus simple), valide le login et les pages principales, puis passe a iOS.

Si tu veux, je peux aussi te preparer un deuxieme fichier "checklist pre-publication" adapte a ton projet TENF-V2 (auth, variables d'environnement, tests de navigation, etc.).
