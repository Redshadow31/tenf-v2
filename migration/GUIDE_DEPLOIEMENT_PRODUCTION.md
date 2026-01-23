# 🚀 Guide de Déploiement en Production - Migration V2 → V3

## 📋 Prérequis

Avant de déployer, assurez-vous d'avoir :
- ✅ Code commité et pushé vers Git
- ✅ Compte Supabase avec projet créé
- ✅ Compte Netlify avec accès au site
- ✅ Toutes les clés API Supabase

## 🔑 Étape 1 : Variables d'Environnement Netlify

### Variables Requises

Ajoutez ces variables dans **Netlify Dashboard → Site settings → Environment variables** :

#### Supabase (Obligatoires)
```
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anon]
SUPABASE_SERVICE_ROLE_KEY=[votre-clé-service-role]
DATABASE_URL=postgresql://postgres.[projet]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

#### NextAuth (Si utilisé)
```
NEXTAUTH_URL=https://[votre-site].netlify.app
NEXTAUTH_SECRET=[votre-secret]
```

#### Autres (Si nécessaire)
```
NETLIFY_SITE_ID=[votre-site-id]  # Pour les routes legacy qui utilisent encore Blobs
NETLIFY_AUTH_TOKEN=[votre-token] # Pour les routes legacy qui utilisent encore Blobs
```

### Comment Obtenir les Valeurs

#### 1. NEXT_PUBLIC_SUPABASE_URL
- Aller sur https://supabase.com/dashboard
- Sélectionner votre projet
- Aller dans **Settings → API**
- Copier **Project URL**

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- Dans **Settings → API**
- Copier **anon public** key

#### 3. SUPABASE_SERVICE_ROLE_KEY
- Dans **Settings → API**
- Copier **service_role** key (⚠️ SECRET, ne jamais exposer côté client)

#### 4. DATABASE_URL
- Dans **Settings → Database**
- Section **Connection string**
- Utiliser le format **Connection pooling** (port 6543)
- Format : `postgresql://postgres.[projet]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

## 📤 Étape 2 : Push vers Git

```bash
# Vérifier que tout est commité
git status

# Push vers le dépôt distant
git push origin main
```

## 🚀 Étape 3 : Déploiement Netlify

### Option A : Déploiement Automatique (Recommandé)

Si votre site est connecté à Git :
1. Le push déclenchera automatiquement un déploiement
2. Vérifier dans **Netlify Dashboard → Deploys**

### Option B : Déploiement Manuel

1. Aller sur **Netlify Dashboard**
2. Sélectionner votre site
3. Cliquer sur **Deploys → Trigger deploy → Deploy site**

## ✅ Étape 4 : Vérification Post-Déploiement

### 1. Vérifier les Variables d'Environnement

Dans **Netlify Dashboard → Site settings → Environment variables** :
- ✅ Toutes les variables Supabase sont présentes
- ✅ Les valeurs sont correctes (pas d'espaces, pas de guillemets)

### 2. Vérifier les Logs de Déploiement

Dans **Netlify Dashboard → Deploys → [dernier déploiement] → Build logs** :
- ✅ Build réussi
- ✅ Aucune erreur liée à Supabase
- ✅ Les dépendances sont installées

### 3. Tester les Routes Migrées

Tester chaque route migrée :

```bash
# Test 1: Route publique des membres
curl https://[votre-site].netlify.app/api/members/public

# Test 2: Route VIP
curl https://[votre-site].netlify.app/api/vip-members

# Test 3: Route événements
curl https://[votre-site].netlify.app/api/events

# Test 4: Route admin (nécessite authentification)
# Tester via l'interface admin du site
```

### 4. Vérifier les Erreurs

Dans **Netlify Dashboard → Functions → Logs** :
- ✅ Aucune erreur de connexion Supabase
- ✅ Aucune erreur "Missing environment variables"

## 🔍 Étape 5 : Tests de Validation

### Test 1 : Route Publique des Membres
```
GET https://[votre-site].netlify.app/api/members/public
```
**Attendu** : Liste de membres avec avatars, badges VIP, etc.

### Test 2 : Route VIP
```
GET https://[votre-site].netlify.app/api/vip-members
```
**Attendu** : Liste des membres VIP avec badges

### Test 3 : Route Événements
```
GET https://[votre-site].netlify.app/api/events
```
**Attendu** : Liste des événements publiés

### Test 4 : Route Admin (via interface)
- Se connecter à l'interface admin
- Tester la création/modification d'un membre
- Vérifier que les données sont sauvegardées dans Supabase

## 🐛 Dépannage

### Erreur : "Missing Supabase environment variables"

**Solution** :
1. Vérifier que toutes les variables sont dans Netlify
2. Vérifier qu'elles commencent bien par `NEXT_PUBLIC_` pour les variables publiques
3. Redéployer après avoir ajouté les variables

### Erreur : "Invalid API key"

**Solution** :
1. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est la clé **service_role** (pas anon)
2. Vérifier qu'il n'y a pas d'espaces avant/après la clé
3. Régénérer la clé si nécessaire dans Supabase Dashboard

### Erreur : "Connection refused" ou "Tenant or user not found"

**Solution** :
1. Vérifier le format de `DATABASE_URL`
2. Utiliser le format **Connection pooling** (port 6543)
3. Vérifier que le mot de passe est correct

### Erreur : "Table does not exist"

**Solution** :
1. Vérifier que les migrations SQL ont été appliquées dans Supabase
2. Aller dans **Supabase Dashboard → SQL Editor**
3. Vérifier que les tables existent

### Les données ne s'affichent pas

**Solution** :
1. Vérifier que les données ont été importées dans Supabase
2. Aller dans **Supabase Dashboard → Table Editor**
3. Vérifier que les tables contiennent des données

## 📊 Checklist de Déploiement

### Avant le Déploiement
- [ ] Code commité et pushé
- [ ] Variables d'environnement préparées
- [ ] Migrations SQL appliquées dans Supabase
- [ ] Données importées dans Supabase

### Pendant le Déploiement
- [ ] Variables d'environnement ajoutées dans Netlify
- [ ] Déploiement déclenché
- [ ] Build réussi

### Après le Déploiement
- [ ] Routes publiques testées
- [ ] Routes admin testées
- [ ] Aucune erreur dans les logs
- [ ] Données affichées correctement
- [ ] Performance acceptable

## 🎯 Prochaines Étapes

Une fois le déploiement validé :

1. **Monitoring** : Surveiller les logs et performances
2. **Migration des routes secondaires** : Migrer les autres routes si nécessaire
3. **Nettoyage** : Supprimer le code legacy après validation complète

## 📝 Notes Importantes

- ⚠️ **Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client**
- ✅ Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- ✅ Les autres variables sont uniquement côté serveur
- 🔒 La clé service_role bypasse RLS, utiliser avec précaution

## 🆘 Support

En cas de problème :
1. Vérifier les logs Netlify
2. Vérifier les logs Supabase
3. Consulter la documentation : `migration/GUIDE_MIGRATION_V3.md`
4. Vérifier les tests : `migration/test-all-routes.ts`
