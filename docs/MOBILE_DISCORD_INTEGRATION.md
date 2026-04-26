# Intégration mobile — connexion Discord (TENF-V2)

Ce document décrit comment brancher une app **Expo / React Native** sur le flux OAuth corrigé du site.

## Variables d’environnement (app mobile)

| Variable | Exemple | Rôle |
|----------|---------|------|
| `EXPO_PUBLIC_TENF_BASE_URL` | `https://tenf-community.com` | Origine du backend Next (sans slash final) |

## Schéma & deep link

1. Dans **app.json** / **app.config.ts** : `scheme: "tenfmobile"` (aligné avec `MOBILE_APP_SCHEME` côté Netlify si tu le changes).
2. L’URL de retour OAuth doit être **autorisée** par le site : `tenfmobile://auth`, `tenfmobile:///auth`, ou en dev Expo `exp://…/--/auth` (voir `lib/mobileHandoffRedirect.ts`).

## URL à ouvrir dans le navigateur in-app

**Recommandé** (cookie d’erreur + handoff) :

```txt
GET {EXPO_PUBLIC_TENF_BASE_URL}/api/auth/mobile/discord/start?redirect_uri={encodeURIComponent(redirectUri)}[&returnUrl=/chemin/relatif]
```

- `redirect_uri` : idem que la valeur passée à `openAuthSessionAsync` (voir ci-dessous).
- `returnUrl` (optionnel) : chemin interne site/app après login, ex. `/member/dashboard` (filtré côté serveur).

**Historique** (sans cookie d’erreur OAuth vers l’app) :

```txt
GET {BASE}/api/auth/signin/discord?callbackUrl={encodeURIComponent(BASE + "/auth/mobile-handoff?redirect_uri=" + encodeURIComponent(redirectUri) + "&returnUrl=...")}
```

## Exemple Expo (expo-web-browser)

```bash
npx expo install expo-web-browser expo-linking
```

```typescript
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

const base = process.env.EXPO_PUBLIC_TENF_BASE_URL!.replace(/\/$/, "");
// Même chaîne que pour openAuthSessionAsync (important pour le retour)
const redirectUri = Linking.createURL("auth");

const start = new URL(`${base}/api/auth/mobile/discord/start`);
start.searchParams.set("redirect_uri", redirectUri);
// start.searchParams.set("returnUrl", "/member/dashboard");

const result = await WebBrowser.openAuthSessionAsync(start.toString(), redirectUri);
if (result.type === "success" && result.url) {
  const u = new URL(result.url);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (err) throw new Error(u.searchParams.get("error_description") || err);
  if (!code) throw new Error("code manquant");
  const res = await fetch(`${base}/api/auth/mobile/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { accessToken, expiresIn, tokenType } = await res.json();
  // Stocker accessToken (JWT NextAuth) pour Authorization: Bearer …
}
```

## Cas typique : « ça marche sur le site » mais l’app affiche « connexion annulée »

Tu es **connecté dans le navigateur in-app** (tu vois l’espace membre sur `https://…`), puis tu reviens à l’app : elle affiche **échec / connexion annulée**.

**Pourquoi** : `openAuthSessionAsync` ne se termine en **succès** que si la **dernière** URL de la fenêtre correspond au `redirectUri` passé à Expo (ex. `tenfmobile://auth?code=…`). Si NextAuth termine sur une **page web** (`/member/dashboard`, etc.), la session est bien créée **dans ce navigateur**, mais **aucun deep link** n’est retourné à l’app → Expo considère souvent la session comme **annulée** à la fermeture.

**Cause la plus fréquente** : l’URL ouverte n’est **pas** le flux recommandé, ou le `callbackUrl` Discord pointe encore vers **`/member/dashboard`** au lieu de passer par **`/auth/mobile-handoff`**.

**À faire côté app** :

1. Ouvre **uniquement**  
   `{BASE}/api/auth/mobile/discord/start?redirect_uri=…`  
   (ce endpoint redirige déjà vers Discord avec `callbackUrl=/auth/mobile-handoff`).
2. N’enchaîne **pas** dans le même onglet un lien « Se connecter » du **site classique** qui utiliserait un autre `callbackUrl` (ex. dashboard) : tu garderais la session web mais tu perdrais le retour vers l’app.
3. Pour ouvrir le **dashboard membre après** login, utilise le paramètre optionnel **`returnUrl=/member/dashboard`** sur `/start` : il sera renvoyé **sur le deep link** (`…?code=…&returnUrl=…`) pour que **l’app** affiche la bonne section avec le jeton obtenu via `/exchange`, pas le site dans le navigateur in-app.

**Secours côté serveur (TENF-V2)** : si un cookie mobile `tenf_mo_handoff` est encore présent et que tu arrives sur **`/member/dashboard`** avec une session Discord valide, le **middleware** te renvoie vers **`/auth/mobile-handoff`** pour tenter d’émettre le `code` et fermer le flux vers l’app. Ce filet ne s’applique pas si l’app n’a **jamais** appelé `/start` (pas de cookie).

## Dépannage (captures « Connexion annulée » / page web « Erreur Discord »)

| Symptôme | Cause fréquente | Action |
|----------|-----------------|--------|
| App : « Connexion annulée ou échouée » | `openAuthSessionAsync` reçoit `dismiss` / pas de retour sur le même `redirectUri` que celui envoyé au serveur | Utiliser **exactement** `Linking.createURL("auth")` (ou équivalent) pour **les deux** : query `redirect_uri` vers `/start` **et** 2e argument de `openAuthSessionAsync`. |
| Session OK **dans le navigateur** mais app « annulé » | Dernier redirect = page **HTTPS** membre, pas `tenfmobile://…` | Voir section ci-dessus : **`/api/auth/mobile/discord/start`** + ne pas mélanger avec un login web au `callbackUrl` dashboard. |
| Web : « Erreur lors de la connexion Discord » (`error=discord`) | Échec OAuth (config Discord, `NEXTAUTH_URL`, secret, utilisateur annule) | Vérifier redirect Discord = `https://<domaine>/api/auth/callback/discord` ; `NEXTAUTH_URL` sans slash final = origine du site. |
| Erreur web alors que l’app devrait reprendre la main | Ancienne URL sans `/api/auth/mobile/discord/start` → pas de cookie `tenf_mo_handoff` | Migrer l’app vers **`/api/auth/mobile/discord/start`** ; le middleware renvoie aussi vers le deep link si tu arrives sur `/auth/login?error=…` **avec** ce cookie. |

## Contrat `POST /api/auth/mobile/exchange`

- Corps : `{ "code": "<code_one_time>" }`
- Réponse 200 : `{ "accessToken": "<jwt>", "expiresIn": 604800, "tokenType": "Bearer" }`
- Erreurs : JSON `{ "error": "…" }`, statut 400 en général.

## Discord Developer Portal

Le redirect **Discord → site** reste uniquement HTTPS, par ex.  
`https://<ton-domaine>/api/auth/callback/discord`  
(NextAuth). Les `tenfmobile://` / `exp://` sont gérés **après** le callback NextAuth, par `/auth/mobile-handoff`.
