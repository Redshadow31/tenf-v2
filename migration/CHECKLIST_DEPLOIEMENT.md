# ✅ Checklist de Déploiement en Production

## 🔑 Étape 1 : Variables d'Environnement Netlify

### Variables Supabase (OBLIGATOIRES)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://ggcpwaexhougomfnnsob.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_EXAMPLE_PLACEHOLDER`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_EXAMPLE_PLACEHOLDER` (SECRET)
- [ ] `DATABASE_URL` = `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` (SECRET)

### Variables Existantes (Vérifier qu'elles sont toujours là)
- [ ] `NEXTAUTH_URL` = `https://tenf-community.com`
- [ ] `NEXTAUTH_SECRET` = (votre secret)
- [ ] `DISCORD_CLIENT_ID` = (votre client ID)
- [ ] `DISCORD_CLIENT_SECRET` = (votre client secret)
- [ ] `TWITCH_CLIENT_ID` = (votre client ID)
- [ ] `TWITCH_CLIENT_SECRET` = (votre client secret)
- [ ] Autres variables existantes...

## 📤 Étape 2 : Push vers Git

```bash
# Vérifier le statut
git status

# Push (si pas déjà fait)
git push origin main
```

- [ ] Code pushé vers Git

## 🚀 Étape 3 : Déploiement Netlify

### Option A : Déploiement Automatique
- [ ] Vérifier que le déploiement automatique est déclenché après le push
- [ ] Attendre la fin du build

### Option B : Déploiement Manuel
- [ ] Aller dans Netlify Dashboard → Deploys
- [ ] Cliquer sur "Trigger deploy" → "Deploy site"
- [ ] Attendre la fin du build

## ✅ Étape 4 : Vérification Post-Déploiement

### Build
- [ ] Build réussi (pas d'erreur)
- [ ] Aucune erreur dans les logs de build
- [ ] Toutes les dépendances installées

### Variables d'Environnement
- [ ] Toutes les variables Supabase présentes
- [ ] Aucune variable manquante dans les logs
- [ ] Les valeurs sont correctes (pas d'espaces, pas de guillemets)

### Tests des Routes

#### Route Publique des Membres
```bash
curl https://tenf-community.com/api/members/public
```
- [ ] Retourne une liste de membres
- [ ] Les données sont correctes
- [ ] Pas d'erreur dans les logs

#### Route VIP
```bash
curl https://tenf-community.com/api/vip-members
```
- [ ] Retourne une liste de VIPs
- [ ] Les données sont correctes
- [ ] Pas d'erreur dans les logs

#### Route Événements
```bash
curl https://tenf-community.com/api/events
```
- [ ] Retourne une liste d'événements
- [ ] Les données sont correctes
- [ ] Pas d'erreur dans les logs

#### Route Admin (via interface)
- [ ] Se connecter à l'interface admin
- [ ] Tester la récupération des membres
- [ ] Tester la création d'un membre (si possible)
- [ ] Vérifier que les données sont sauvegardées dans Supabase

### Logs
- [ ] Aucune erreur "Missing Supabase environment variables"
- [ ] Aucune erreur "Invalid API key"
- [ ] Aucune erreur "Connection refused"
- [ ] Aucune erreur "Table does not exist"

## 🎯 Tests Fonctionnels

### Page Publique
- [ ] Page `/membres` affiche les membres
- [ ] Page `/vip` affiche les VIPs
- [ ] Page `/events` affiche les événements

### Interface Admin
- [ ] Connexion admin fonctionne
- [ ] Dashboard admin accessible
- [ ] Gestion des membres fonctionne
- [ ] Gestion des événements fonctionne
- [ ] Gestion des spotlights fonctionne

## 📊 Performance

- [ ] Temps de chargement acceptable
- [ ] Pas de timeout sur les routes
- [ ] Les requêtes Supabase sont rapides

## ✅ Validation Finale

- [ ] Toutes les routes migrées fonctionnent
- [ ] Les données sont correctes
- [ ] Aucune régression fonctionnelle
- [ ] Performance acceptable
- [ ] Prêt pour les utilisateurs

## 🐛 En Cas de Problème

### Erreur : "Missing Supabase environment variables"
1. Vérifier que toutes les variables sont dans Netlify
2. Vérifier qu'elles commencent bien par `NEXT_PUBLIC_` pour les publiques
3. Redéployer après avoir ajouté les variables

### Erreur : "Invalid API key"
1. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est la clé service_role
2. Vérifier qu'il n'y a pas d'espaces
3. Régénérer la clé si nécessaire

### Erreur : "Connection refused"
1. Vérifier le format de `DATABASE_URL`
2. Utiliser le format Connection pooling (port 6543)
3. Vérifier le mot de passe

### Erreur : "Table does not exist"
1. Vérifier que les migrations SQL ont été appliquées
2. Aller dans Supabase Dashboard → SQL Editor
3. Vérifier que les tables existent

## 📝 Notes

- ⚠️ Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- ✅ Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- 🔒 La clé service_role bypasse RLS, utiliser avec précaution

## 🆘 Support

En cas de problème :
1. Vérifier les logs Netlify
2. Vérifier les logs Supabase
3. Consulter `migration/GUIDE_DEPLOIEMENT_PRODUCTION.md`
4. Consulter `migration/GUIDE_MIGRATION_V3.md`
