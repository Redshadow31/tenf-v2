# 🚀 Guide de déploiement NextAuth - Netlify

## ✅ Pré-déploiement : Vérifications

### 1. Vérifier que le code compile
```bash
npm run build
```

Si des erreurs apparaissent, les corriger avant de déployer.

### 2. Vérifier les variables d'environnement locales
Assurez-vous que votre `.env.local` (si vous en avez un) contient :
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret local>
DISCORD_CLIENT_ID=<votre_client_id>
DISCORD_CLIENT_SECRET=<votre_client_secret>
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord
```

---

## 🔐 Étape 1 : Configurer Discord Developer Portal

### 1.1 Aller sur Discord Developer Portal
1. Accéder à : https://discord.com/developers/applications
2. Sélectionner votre application Discord

### 1.2 Configurer les OAuth2 Redirects
1. Aller dans **OAuth2** → **General**
2. Dans **Redirects**, ajouter :
   ```
   https://teamnewfamily.netlify.app/api/auth/callback/discord
   ```
3. Si vous avez un environnement de test :
   ```
   http://localhost:3000/api/auth/callback/discord
   ```

### 1.3 Vérifier les scopes
Dans **OAuth2** → **URL Generator**, vérifier que les scopes sont :
- ✅ `identify`
- ✅ `guilds`
- ✅ `guilds.members.read`

### 1.4 Copier les identifiants
- **Client ID** : À copier pour `DISCORD_CLIENT_ID`
- **Client Secret** : À copier pour `DISCORD_CLIENT_SECRET` (cliquer sur "Reset Secret" si nécessaire)

---

## 🌐 Étape 2 : Configurer Netlify

### 2.1 Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
**Important** : Copier cette valeur, elle sera utilisée pour `NEXTAUTH_SECRET`.

### 2.2 Configurer les variables d'environnement sur Netlify

1. Aller sur Netlify Dashboard : https://app.netlify.com
2. Sélectionner votre site **TENF-V2**
3. Aller dans **Site settings** → **Environment variables**
4. Ajouter/modifier les variables suivantes :

| Variable | Valeur | Exemple |
|----------|--------|---------|
| `NEXTAUTH_URL` | URL de production | `https://teamnewfamily.netlify.app` |
| `NEXTAUTH_SECRET` | Secret généré (32+ caractères) | `votre_secret_généré_ici` |
| `DISCORD_CLIENT_ID` | Client ID Discord | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | Client Secret Discord | `votre_client_secret_discord` |
| `DISCORD_REDIRECT_URI` | URL callback NextAuth | `https://teamnewfamily.netlify.app/api/auth/callback/discord` |

**Note** : `DISCORD_REDIRECT_URI` doit correspondre **exactement** à l'URL dans Discord Developer Portal.

---

## 📦 Étape 3 : Déployer le code

### 3.1 Vérifier les changements
```bash
git status
```

### 3.2 Committer les changements
```bash
git add .
git commit -m "feat: Migration complète vers NextAuth avec sessions JWT signées

- Migration de toutes les 32 routes API admin vers NextAuth
- Remplacement des cookies non signés par sessions JWT signées
- Mise en place du système RBAC robuste (requireAdmin, requireRole, requirePermission)
- Sécurisation du middleware avec NextAuth JWT
- Migration de la page de login vers NextAuth
- Ajout du SessionProvider dans le layout client
- Documentation complète de la migration"
```

### 3.3 Pousser vers le dépôt
```bash
git push origin main
```

**Ou si vous utilisez une autre branche** :
```bash
git push origin <votre-branche>
```

### 3.4 Netlify déploie automatiquement
- Si le dépôt est connecté à Netlify, le déploiement se lance automatiquement
- Sinon, déclencher un déploiement manuel depuis le dashboard Netlify

---

## ✅ Étape 4 : Vérifications post-déploiement

### 4.1 Vérifier les logs de déploiement
1. Aller sur Netlify Dashboard → **Deploys**
2. Vérifier que le déploiement a réussi
3. Consulter les logs pour détecter d'éventuelles erreurs

### 4.2 Tests de connexion

#### Test 1 : Connexion Discord
1. Aller sur : `https://teamnewfamily.netlify.app/auth/login`
2. Cliquer sur **"Se connecter avec Discord"**
3. **Attendu** : Redirection vers Discord OAuth
4. Autoriser l'application
5. **Attendu** : Redirection vers la page d'accueil ou `/admin` si admin

#### Test 2 : Accès admin (non authentifié)
1. Se déconnecter (ou ouvrir en navigation privée)
2. Aller sur : `https://teamnewfamily.netlify.app/admin`
3. **Attendu** : Redirection vers `/api/auth/signin?callbackUrl=/admin`

#### Test 3 : Accès admin (authentifié sans rôle)
1. Se connecter avec un compte Discord qui n'a pas de rôle admin
2. Aller sur : `https://teamnewfamily.netlify.app/admin`
3. **Attendu** : Redirection vers `/api/auth/signin` ou page d'erreur (403)

#### Test 4 : Accès admin (avec rôle admin)
1. Se connecter avec un compte Discord ayant un rôle admin (FOUNDER, ADMIN_ADJOINT, etc.)
2. Aller sur : `https://teamnewfamily.netlify.app/admin`
3. **Attendu** : Accès autorisé à la page admin

#### Test 5 : API admin (avec rôle admin)
1. Se connecter avec un compte admin
2. Aller sur : `https://teamnewfamily.netlify.app/api/admin/members`
3. **Attendu** : JSON avec la liste des membres (status 200)

#### Test 6 : API admin (sans rôle admin)
1. Se connecter avec un compte non-admin
2. Aller sur : `https://teamnewfamily.netlify.app/api/admin/members`
3. **Attendu** : `{ error: "Non authentifié ou permissions insuffisantes" }` (status 401)

#### Test 7 : Route réservée aux founders
1. Se connecter avec un compte FOUNDER
2. Aller sur : `https://teamnewfamily.netlify.app/admin/gestion-acces`
3. **Attendu** : Accès autorisé

4. Se connecter avec un compte ADMIN_ADJOINT (non-founder)
5. Aller sur : `https://teamnewfamily.netlify.app/admin/gestion-acces`
6. **Attendu** : Redirection vers `/unauthorized`

---

## 🔍 Étape 5 : Dépannage

### Problème : "Invalid callback URL"
**Symptômes** : Erreur lors de la connexion Discord, message "Invalid redirect_uri"

**Solutions** :
1. Vérifier que `DISCORD_REDIRECT_URI` dans Netlify = `https://teamnewfamily.netlify.app/api/auth/callback/discord`
2. Vérifier que l'URL dans Discord Developer Portal est identique (même protocole, même domaine, même chemin)
3. Vérifier qu'il n'y a pas d'espace ou de caractère invisible
4. Vérifier que l'URL ne se termine pas par un slash `/`

### Problème : "NEXTAUTH_SECRET is missing"
**Symptômes** : Erreur 500 lors de la connexion, logs mentionnant "NEXTAUTH_SECRET"

**Solutions** :
1. Vérifier que `NEXTAUTH_SECRET` est configuré dans Netlify
2. Vérifier que le secret est suffisamment long (32+ caractères)
3. Régénérer le secret : `openssl rand -base64 32`
4. Redéployer après avoir ajouté/modifié la variable

### Problème : "Session non persistante"
**Symptômes** : L'utilisateur est déconnecté à chaque rafraîchissement de page

**Solutions** :
1. Vérifier que `NEXTAUTH_URL` est configuré et correspond à l'URL de production
2. Vérifier que les cookies NextAuth sont créés dans le navigateur (inspecter les cookies)
3. Vérifier que le domaine dans les cookies est correct

### Problème : "Redirection en boucle"
**Symptômes** : Redirection infinie entre `/admin` et `/api/auth/signin`

**Solutions** :
1. Vérifier que `NEXTAUTH_URL` ne se termine pas par un slash `/`
2. Vérifier que `NEXTAUTH_URL` correspond exactement à l'URL de production
3. Vérifier que le middleware fonctionne correctement
4. Vérifier les logs Netlify pour plus de détails

### Problème : "401 Unauthorized" sur toutes les routes admin
**Symptômes** : Même connecté avec un rôle admin, toutes les routes retournent 401

**Solutions** :
1. Vérifier que la session NextAuth est bien créée (inspecter les cookies)
2. Vérifier que `NEXTAUTH_SECRET` est correctement configuré
3. Vérifier que le rôle admin est bien récupéré dans le callback JWT
4. Consulter les logs Netlify pour voir les erreurs exactes

---

## 📝 Checklist de déploiement

### Avant le déploiement
- [ ] Code compilé avec succès (`npm run build`)
- [ ] Aucune erreur de lint
- [ ] Toutes les routes admin migrées (vérifié : 32 routes ✅)
- [ ] Discord Developer Portal configuré
- [ ] Variables d'environnement préparées

### Configuration Netlify
- [ ] `NEXTAUTH_URL` configuré = `https://teamnewfamily.netlify.app`
- [ ] `NEXTAUTH_SECRET` généré et configuré (32+ caractères)
- [ ] `DISCORD_CLIENT_ID` configuré
- [ ] `DISCORD_CLIENT_SECRET` configuré
- [ ] `DISCORD_REDIRECT_URI` configuré = `https://teamnewfamily.netlify.app/api/auth/callback/discord`

### Configuration Discord
- [ ] URL callback ajoutée dans Discord Developer Portal
- [ ] Scopes configurés : `identify`, `guilds`, `guilds.members.read`

### Déploiement
- [ ] Code commité et poussé vers le dépôt
- [ ] Déploiement Netlify réussi
- [ ] Aucune erreur dans les logs de déploiement

### Tests post-déploiement
- [ ] Test 1 : Connexion Discord ✅
- [ ] Test 2 : Accès admin (non authentifié) ✅
- [ ] Test 3 : Accès admin (sans rôle) ✅
- [ ] Test 4 : Accès admin (avec rôle) ✅
- [ ] Test 5 : API admin (avec rôle) ✅
- [ ] Test 6 : API admin (sans rôle) ✅
- [ ] Test 7 : Route réservée aux founders ✅

---

## 🎯 Commandes utiles

### Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Vérifier le build localement
```bash
npm run build
```

### Tester localement (si vous avez un .env.local)
```bash
npm run dev
```

### Vérifier les variables d'environnement sur Netlify
```bash
# Via l'interface Netlify Dashboard → Site settings → Environment variables
# Ou via Netlify CLI :
netlify env:list
```

---

## 📞 Support

Si des problèmes persistent après le déploiement :

1. **Consulter les logs Netlify** :
   - Netlify Dashboard → **Functions** → **Logs**
   - Ou via Netlify CLI : `netlify logs:functions`

2. **Vérifier les cookies** :
   - Ouvrir les outils de développement (F12)
   - Onglet **Application** → **Cookies**
   - Vérifier la présence des cookies NextAuth (`next-auth.session-token`)

3. **Vérifier la session NextAuth** :
   - Aller sur : `https://teamnewfamily.netlify.app/api/auth/session`
   - Devrait retourner la session actuelle si connecté

---

**Bonne chance avec le déploiement ! 🚀**
