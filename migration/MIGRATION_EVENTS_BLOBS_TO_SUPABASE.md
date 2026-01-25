# 🔄 Migration des Événements depuis Netlify Blobs vers Supabase

## ⚠️ Problème Identifié

Les événements et inscriptions étaient stockés dans **Netlify Blobs** (`tenf-events` store) mais n'ont **jamais été migrés** vers Supabase lors de la migration des routes.

**Conséquence** : Les événements et inscriptions créés avant la migration sont toujours dans Blobs et ne sont pas visibles dans Supabase, ce qui explique pourquoi les pages `/admin/events/presence` et `/admin/events/liste` sont vides.

## ✅ Solution

Un script de migration a été créé pour transférer automatiquement :
1. **Événements** : Depuis `tenf-events/events.json` → Table `events` dans Supabase
2. **Inscriptions** : Depuis `tenf-events/registrations/{eventId}.json` → Table `event_registrations` dans Supabase

## 🚀 Comment Utiliser

### Prérequis

1. Variables d'environnement configurées dans `.env.local` :
   ```env
   NETLIFY_SITE_ID=votre_site_id
   NETLIFY_AUTH_TOKEN=votre_token
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   ```

2. Accès à Netlify Blobs (les variables ci-dessus)

### Exécution

```bash
npm run migration:migrate-events
```

Ou directement :

```bash
tsx migration/migrate-events-blobs-to-supabase.ts
```

## 📋 Ce que fait le Script

1. **Charge les événements** depuis Netlify Blobs
2. **Vérifie** si chaque événement existe déjà dans Supabase (évite les doublons)
3. **Insère** les événements manquants dans Supabase
4. **Charge les inscriptions** pour chaque événement depuis Blobs
5. **Vérifie** si chaque inscription existe déjà dans Supabase
6. **Insère** les inscriptions manquantes dans Supabase
7. **Affiche un résumé** de la migration

## ✅ Résultat Attendu

Après la migration, vous devriez voir :
- ✅ Tous les événements dans Supabase (table `events`)
- ✅ Toutes les inscriptions dans Supabase (table `event_registrations`)
- ✅ Les pages `/admin/events/presence` et `/admin/events/liste` affichent les données

## 🔍 Vérification

Après la migration, vous pouvez vérifier :

1. **Dans Supabase Dashboard** :
   - Table `events` : Devrait contenir tous vos événements
   - Table `event_registrations` : Devrait contenir toutes les inscriptions

2. **Sur le site** :
   - `/admin/events/liste` : Devrait afficher tous les événements
   - `/admin/events/presence` : Devrait afficher les événements avec leurs inscriptions

## ⚠️ Notes Importantes

- Le script **ne supprime pas** les données dans Blobs (elles restent en sécurité)
- Le script **évite les doublons** : si un événement/inscription existe déjà, il est ignoré
- Le script peut être **réexécuté** plusieurs fois sans problème (idempotent)

## 🐛 Dépannage

### Erreur : "Netlify Blobs not configured"
- Vérifiez que `NETLIFY_SITE_ID` et `NETLIFY_AUTH_TOKEN` sont dans `.env.local`
- Ces variables doivent être configurées pour accéder à Netlify Blobs

### Erreur : "Failed to connect to Supabase"
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont corrects
- Vérifiez votre connexion internet

### Aucun événement trouvé dans Blobs
- Cela signifie que soit :
  - Les événements n'ont jamais été créés dans Blobs
  - Les événements ont déjà été supprimés
  - Le store Blobs est vide

## 📝 Prochaines Étapes

Après la migration réussie :

1. ✅ Vérifier que les données sont bien dans Supabase
2. ✅ Tester les pages admin pour confirmer l'affichage
3. ⚠️ **Optionnel** : Supprimer les données dans Blobs une fois que tout fonctionne (mais gardez-les en backup pendant quelques jours)

---

**Date de création** : 2025-01-25  
**Script** : `migration/migrate-events-blobs-to-supabase.ts`
