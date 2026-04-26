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

## Contrat `POST /api/auth/mobile/exchange`

- Corps : `{ "code": "<code_one_time>" }`
- Réponse 200 : `{ "accessToken": "<jwt>", "expiresIn": 604800, "tokenType": "Bearer" }`
- Erreurs : JSON `{ "error": "…" }`, statut 400 en général.

## Discord Developer Portal

Le redirect **Discord → site** reste uniquement HTTPS, par ex.  
`https://<ton-domaine>/api/auth/callback/discord`  
(NextAuth). Les `tenfmobile://` / `exp://` sont gérés **après** le callback NextAuth, par `/auth/mobile-handoff`.
