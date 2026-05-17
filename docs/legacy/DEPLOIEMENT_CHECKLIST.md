# ✅ Checklist de déploiement NextAuth

## 🔐 Configuration Discord Developer Portal

- [ ] Aller sur https://discord.com/developers/applications
- [ ] Sélectionner votre application Discord
- [ ] Aller dans **OAuth2** → **General**
- [ ] Dans **Redirects**, ajouter :
  ```
  https://tenf-community.com/api/auth/callback/discord
  ```
- [ ] Vérifier les scopes : `identify`, `guilds`, `guilds.members.read`
- [ ] Copier le **Client ID** → Pour `DISCORD_CLIENT_ID`
- [ ] Copier le **Client Secret** → Pour `DISCORD_CLIENT_SECRET`

---

## 🌐 Configuration Netlify

### Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
**Copier cette valeur** → Pour `NEXTAUTH_SECRET`

### Variables d'environnement à configurer sur Netlify

Netlify Dashboard → **Site settings** → **Environment variables** :

| Variable | Valeur |
|----------|--------|
| `NEXTAUTH_URL` | `https://tenf-community.com` |
| `NEXTAUTH_SECRET` | `<secret généré ci-dessus>` |
| `DISCORD_CLIENT_ID` | `<votre_client_id_discord>` |
| `DISCORD_CLIENT_SECRET` | `<votre_client_secret_discord>` |
| `DISCORD_REDIRECT_URI` | `https://tenf-community.com/api/auth/callback/discord` |

---

## 📦 Déploiement

### 1. Vérifier que le code compile
```bash
npm run build
```

### 2. Committer et pousser
```bash
git add .
git commit -m "feat: Migration complète vers NextAuth avec sessions JWT signées"
git push origin main
```

### 3. Netlify déploie automatiquement
- Si le dépôt est connecté à Netlify, le déploiement se lance automatiquement
- Sinon, déclencher un déploiement manuel depuis le dashboard Netlify

---

## ✅ Tests post-déploiement

### Test 1 : Connexion Discord
- [ ] Aller sur : `https://tenf-community.com/auth/login`
- [ ] Cliquer sur **"Se connecter avec Discord"**
- [ ] Autoriser l'application
- [ ] **Résultat attendu** : Redirection vers la page d'accueil ou `/admin`

### Test 2 : Accès admin (non authentifié)
- [ ] Se déconnecter (ou navigation privée)
- [ ] Aller sur : `https://tenf-community.com/admin`
- [ ] **Résultat attendu** : Redirection vers `/api/auth/signin?callbackUrl=/admin`

### Test 3 : Accès admin (avec rôle admin)
- [ ] Se connecter avec un compte admin
- [ ] Aller sur : `https://tenf-community.com/admin`
- [ ] **Résultat attendu** : Accès autorisé à la page admin

### Test 4 : API admin (avec rôle admin)
- [ ] Se connecter avec un compte admin
- [ ] Aller sur : `https://tenf-community.com/api/admin/members`
- [ ] **Résultat attendu** : JSON avec la liste des membres (status 200)

### Test 5 : Route réservée aux founders
- [ ] Se connecter avec un compte FOUNDER
- [ ] Aller sur : `https://tenf-community.com/admin/gestion-acces`
- [ ] **Résultat attendu** : Accès autorisé

- [ ] Se connecter avec un compte ADMIN_ADJOINT (non-founder)
- [ ] Aller sur : `https://tenf-community.com/admin/gestion-acces`
- [ ] **Résultat attendu** : Redirection vers `/unauthorized`

---

## 🚨 Dépannage rapide

### Erreur : "Invalid callback URL"
→ Vérifier que `DISCORD_REDIRECT_URI` dans Netlify = URL dans Discord Developer Portal

### Erreur : "NEXTAUTH_SECRET is missing"
→ Vérifier que `NEXTAUTH_SECRET` est configuré dans Netlify (32+ caractères)

### Erreur : Session non persistante
→ Vérifier que `NEXTAUTH_URL` = `https://tenf-community.com` (sans trailing slash)

---

**Guide complet** : Voir `DEPLOIEMENT_NEXTAUTH.md`
