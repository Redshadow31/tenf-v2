# 🔐 Sécurité des Secrets - TENF V2

## ⚠️ IMPORTANT : Ne jamais commiter de secrets réels

**Cette documentation est SANS secrets réels. Tous les exemples utilisent des placeholders.**

---

## 📋 Liste des variables d'environnement nécessaires

### Variables OBLIGATOIRES pour l'application

| Variable | Description | Où la configurer |
|----------|-------------|------------------|
| `DISCORD_CLIENT_ID` | ID de l'application Discord OAuth2 | Netlify → Site settings → Environment variables |
| `DISCORD_CLIENT_SECRET` | Secret de l'application Discord OAuth2 | Netlify → Site settings → Environment variables |
| `DISCORD_REDIRECT_URI` | URL de callback OAuth2 (ex: `https://votre-site.netlify.app/api/auth/discord/callback`) | Netlify → Site settings → Environment variables |
| `NEXTAUTH_SECRET` | Secret pour signer les tokens NextAuth (générez un secret aléatoire sécurisé) | Netlify → Site settings → Environment variables |
| `NEXTAUTH_URL` | URL de base de l'application (ex: `https://votre-site.netlify.app`) | Netlify → Site settings → Environment variables |
| `TWITCH_CLIENT_ID` | ID de l'application Twitch | Netlify → Site settings → Environment variables |
| `TWITCH_CLIENT_SECRET` | Secret de l'application Twitch | Netlify → Site settings → Environment variables |

### Variables OPTIONNELLES mais recommandées

| Variable | Description | Où la configurer |
|----------|-------------|------------------|
| `DISCORD_BOT_TOKEN` | Token du bot Discord (pour récupérer les membres VIP) | Netlify → Site settings → Environment variables |
| `STATBOT_API_KEY` | Clé API Statbot (pour les statistiques Discord) | Netlify → Site settings → Environment variables |
| `STATBOT_SERVER_ID` | ID du serveur Discord pour Statbot | Netlify → Site settings → Environment variables |
| `TWITCH_APP_CLIENT_ID` | Client ID pour Twitch EventSub (optionnel) | Netlify → Site settings → Environment variables |
| `TWITCH_EVENTSUB_SECRET` | Secret pour vérifier les signatures des webhooks EventSub | Netlify → Site settings → Environment variables |
| `NETLIFY_AUTH_TOKEN` | Token d'authentification Netlify (pour Netlify Blobs) | Netlify → Site settings → Environment variables |
| `NETLIFY_SITE_ID` | ID du site Netlify (pour Netlify Blobs) | Netlify → Site settings → Environment variables |

---

## 🔧 Configuration sur Netlify

### Étape 1 : Accéder aux variables d'environnement

1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Sélectionnez votre site
3. Allez dans **Site settings** → **Environment variables**

### Étape 2 : Ajouter les variables

Ajoutez chaque variable avec sa valeur réelle (NE COPIEZ PAS les exemples ci-dessous) :

```
DISCORD_CLIENT_ID=VOTRE_DISCORD_CLIENT_ID_ICI
DISCORD_CLIENT_SECRET=VOTRE_DISCORD_CLIENT_SECRET_ICI
DISCORD_REDIRECT_URI=https://votre-site.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://votre-site.netlify.app
NEXTAUTH_SECRET=VOTRE_NEXTAUTH_SECRET_ICI
NEXTAUTH_URL=https://votre-site.netlify.app
TWITCH_CLIENT_ID=VOTRE_TWITCH_CLIENT_ID_ICI
TWITCH_CLIENT_SECRET=VOTRE_TWITCH_CLIENT_SECRET_ICI
DISCORD_BOT_TOKEN=VOTRE_DISCORD_BOT_TOKEN_ICI
STATBOT_API_KEY=VOTRE_STATBOT_API_KEY_ICI
STATBOT_SERVER_ID=VOTRE_STATBOT_SERVER_ID_ICI
```

**⚠️ IMPORTANT** :
- Remplacez `VOTRE_*_ICI` par vos vraies valeurs
- Ne mettez pas d'espaces autour du `=`
- Ne mettez pas de guillemets autour des valeurs
- Ne partagez JAMAIS ces valeurs publiquement

---

## 🔧 Configuration locale (.env.local)

Pour le développement local, créez un fichier `.env.local` à la racine du projet :

```env
DISCORD_CLIENT_ID=VOTRE_DISCORD_CLIENT_ID_ICI
DISCORD_CLIENT_SECRET=VOTRE_DISCORD_CLIENT_SECRET_ICI
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=VOTRE_NEXTAUTH_SECRET_ICI
NEXTAUTH_URL=http://localhost:3000
TWITCH_CLIENT_ID=VOTRE_TWITCH_CLIENT_ID_ICI
TWITCH_CLIENT_SECRET=VOTRE_TWITCH_CLIENT_SECRET_ICI
DISCORD_BOT_TOKEN=VOTRE_DISCORD_BOT_TOKEN_ICI
```

**⚠️ IMPORTANT** :
- Le fichier `.env.local` est dans `.gitignore` et ne doit JAMAIS être commité
- Utilisez des valeurs différentes pour le développement et la production
- Ne partagez JAMAIS ce fichier

---

## 🔐 Génération de secrets sécurisés

### NEXTAUTH_SECRET

Générez un secret aléatoire sécurisé :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Ou utilisez un générateur en ligne : https://generate-secret.vercel.app/32

---

## ✅ Vérification de sécurité

### Vérifications à effectuer régulièrement :

1. ✅ **Aucun secret dans le code source**
   - Vérifiez qu'aucun secret n'est hardcodé dans les fichiers `.ts`, `.tsx`, `.js`, `.jsx`
   - Tous les secrets doivent utiliser `process.env.*`

2. ✅ **Aucun secret dans les fichiers .md**
   - Vérifiez qu'aucun secret réel n'apparaît dans la documentation
   - Tous les exemples doivent utiliser des placeholders

3. ✅ **Fichier .env.local dans .gitignore**
   - Vérifiez que `.env.local` est bien dans `.gitignore`
   - Vérifiez que `.env` est aussi dans `.gitignore`

4. ✅ **Pas de logs de secrets**
   - Vérifiez qu'aucun `console.log()` n'expose de secrets
   - Les logs doivent uniquement afficher des messages d'erreur génériques

5. ✅ **Variables d'environnement configurées sur Netlify**
   - Vérifiez que toutes les variables nécessaires sont configurées
   - Vérifiez que les valeurs sont correctes et à jour

---

## 🚨 Que faire si un secret est compromis ?

### Si un secret est exposé (dans Git, logs, etc.) :

1. **IMMÉDIATEMENT** : Révocation du secret compromis
   - **Discord** : Discord Developer Portal → Réinitialiser le secret/token
   - **Twitch** : Twitch Developer Console → Réinitialiser le secret
   - **Netlify** : Régénérer le token d'authentification

2. **Mettre à jour** les variables d'environnement sur Netlify avec les nouvelles valeurs

3. **Redéployer** le site sur Netlify

4. **Vérifier** qu'aucun accès non autorisé n'a eu lieu

---

## 📝 Notes importantes

1. **Rotation des secrets** : Changez régulièrement vos secrets (tous les 6 mois minimum)

2. **Séparation dev/prod** : Utilisez des secrets différents pour le développement et la production

3. **Accès limité** : Ne donnez accès aux secrets qu'aux personnes qui en ont vraiment besoin

4. **Documentation** : Ne documentez JAMAIS de secrets réels, uniquement des placeholders

5. **Git** : Vérifiez l'historique Git pour voir si des secrets ont été commités par erreur

---

## 🔍 Outils de vérification

### Vérifier si des secrets ont été commités dans Git :

```bash
# Rechercher des patterns de secrets dans l'historique Git
git log --all --full-history -S "TWITCH_CLIENT_SECRET" -- "*.md"
git log --all --full-history -S "DISCORD_CLIENT_SECRET" -- "*.md"
git log --all --full-history -S "DISCORD_BOT_TOKEN" -- "*.md"
```

### Scanner le projet pour des secrets potentiels :

```bash
# Rechercher des chaînes longues (potentiels secrets)
grep -r "[a-zA-Z0-9]{30,}" --include="*.ts" --include="*.tsx" --include="*.md"
```

---

## ✅ Checklist de sécurité

Avant chaque commit :

- [ ] Aucun secret hardcodé dans le code
- [ ] Aucun secret dans les fichiers .md
- [ ] `.env.local` est dans `.gitignore`
- [ ] Tous les secrets utilisent `process.env.*`
- [ ] Aucun `console.log()` n'expose de secrets
- [ ] Documentation mise à jour avec placeholders uniquement

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Twitch Developer Console](https://dev.twitch.tv/console)

---

**Dernière mise à jour** : Audit de sécurité complet - Tous les secrets ont été purgés de la documentation
