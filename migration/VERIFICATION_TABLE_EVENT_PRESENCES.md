# ✅ Vérification de la Table `event_presences`

## 📋 Situation

La table `event_presences` existe déjà dans votre base de données Supabase. Cela signifie que :
- ✅ La migration a probablement déjà été appliquée
- ✅ Ou la table a été créée manuellement précédemment

## 🔍 Vérification

Pour vérifier que la table a la bonne structure, exécutez le script SQL suivant dans le SQL Editor de Supabase :

**Fichier** : `migration/verifier-table-event-presences.sql`

Ce script vérifie :
1. Si la table existe
2. Les colonnes et leurs types
3. Les contraintes (clés primaires, uniques, foreign keys)
4. Le nombre d'enregistrements

## ✅ Structure Attendue

La table `event_presences` doit avoir les colonnes suivantes :

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | NOT NULL | Clé primaire |
| `event_id` | text | NOT NULL | Référence à `events.id` |
| `twitch_login` | text | NOT NULL | Login Twitch |
| `display_name` | text | NOT NULL | Nom d'affichage |
| `discord_id` | text | NULL | ID Discord |
| `discord_username` | text | NULL | Username Discord |
| `is_registered` | boolean | NULL | Si le membre était inscrit |
| `present` | boolean | NOT NULL | Si le membre était présent |
| `note` | text | NULL | Note optionnelle |
| `validated_at` | timestamp | NULL | Date de validation |
| `validated_by` | text | NULL | ID Discord de l'admin |
| `added_manually` | boolean | NULL | Si ajouté manuellement |
| `created_at` | timestamp | NULL | Date de création |

**Contraintes attendues :**
- Clé primaire sur `id`
- Contrainte unique sur `(event_id, twitch_login)`
- Foreign key `event_id` → `events.id` ON DELETE CASCADE

## 🎯 Conclusion

Si la table existe déjà avec la bonne structure, **aucune action n'est nécessaire**. Les routes migrées devraient fonctionner correctement.

Si la structure est différente, vous pouvez :
1. Supprimer la table existante (si elle est vide) : `DROP TABLE IF EXISTS event_presences;`
2. Réappliquer la migration : `lib/db/migrations/0004_low_silver_surfer.sql`

---

**Note** : Le fait que la table existe déjà est une bonne nouvelle - cela signifie que l'infrastructure est en place ! 🎉
