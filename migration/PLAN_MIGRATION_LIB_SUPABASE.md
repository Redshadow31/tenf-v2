# 🔄 Plan de Migration des Lib vers Supabase

**Date** : $(date)  
**Objectif** : Migrer certaines fonctions utilitaires vers Supabase (Edge Functions ou SQL Functions)

---

## 🎯 Pourquoi Migrer vers Supabase ?

### Avantages
- ⚡ **Performance** : Exécution plus proche de la base de données
- 🔒 **Sécurité** : Logique métier côté serveur (Supabase)
- 📊 **Scalabilité** : Edge Functions peuvent gérer plus de charge
- 🔄 **Réutilisabilité** : Fonctions SQL réutilisables dans plusieurs contextes
- 💰 **Coût** : Réduction des appels API Next.js

### Inconvénients
- 🔧 **Complexité** : Nécessite de gérer deux environnements (Next.js + Supabase)
- 🐛 **Debugging** : Plus difficile à déboguer
- 📝 **Documentation** : Nécessite une documentation supplémentaire

---

## 📋 Analyse des Lib Existantes

### 1. Fonctions de Calcul (Candidats pour SQL Functions)

#### `lib/computeRaidStats.ts`
**Fonction** : Calcule les statistiques de raids  
**Migration** : ✅ **SQL Function** (PostgreSQL)  
**Avantages** :
- Calcul directement dans la base de données
- Plus rapide pour de gros volumes
- Réutilisable dans plusieurs contextes

**Exemple de migration** :
```sql
CREATE OR REPLACE FUNCTION compute_raid_stats(
  p_month DATE,
  p_twitch_login TEXT
)
RETURNS TABLE (
  raids_faits INTEGER,
  raids_recus INTEGER,
  points INTEGER
) AS $$
BEGIN
  -- Logique de calcul des stats
  RETURN QUERY
  SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

#### `lib/evaluationBonusHelpers.ts`
**Fonction** : Calcule les bonus d'évaluation  
**Migration** : ✅ **SQL Function**  
**Avantages** : Calcul centralisé dans la DB

#### `lib/evaluationSynthesisHelpers.ts`
**Fonction** : Synthèse des évaluations  
**Migration** : ✅ **SQL Function**  
**Avantages** : Agrégations complexes optimisées

---

### 2. Fonctions de Validation (Candidats pour Edge Functions)

#### `lib/discordEngagement.ts`
**Fonction** : Calcule l'engagement Discord  
**Migration** : ⚠️ **Edge Function** (si besoin d'appels API externes)  
**Avantages** :
- Peut appeler l'API Discord directement
- Exécution asynchrone
- Pas de charge sur Next.js

#### `lib/twitchHelpers.ts`
**Fonction** : Helpers Twitch  
**Migration** : ⚠️ **Edge Function** (si besoin d'appels API Twitch)  
**Avantages** : Appels API externes isolés

---

### 3. Fonctions de Stockage (Déjà migrées vers Supabase)

#### `lib/memberData.ts`
**Statut** : ✅ **Déjà migré** vers `MemberRepository`  
**Stockage** : Supabase (PostgreSQL)

#### `lib/eventStorage.ts`
**Statut** : ✅ **Déjà migré** vers `EventRepository`  
**Stockage** : Supabase (PostgreSQL)

#### `lib/spotlightStorage.ts`
**Statut** : ✅ **Déjà migré** vers `SpotlightRepository`  
**Stockage** : Supabase (PostgreSQL)

#### `lib/evaluationStorage.ts`
**Statut** : ✅ **Déjà migré** vers `EvaluationRepository`  
**Stockage** : Supabase (PostgreSQL)

---

### 4. Fonctions Utilitaires (À garder dans Next.js)

#### `lib/utils.ts`
**Fonction** : Utilitaires généraux  
**Migration** : ❌ **Non recommandé**  
**Raison** : Fonctions simples, mieux dans Next.js

#### `lib/hash.ts`
**Fonction** : Hachage  
**Migration** : ❌ **Non recommandé**  
**Raison** : Fonction simple, pas besoin de migration

#### `lib/roleColors.ts`
**Fonction** : Couleurs des rôles  
**Migration** : ❌ **Non recommandé**  
**Raison** : Configuration UI, mieux côté client

---

## 🎯 Plan de Migration Recommandé

### Phase 1 : SQL Functions (Priorité HAUTE)

#### 1.1 Fonction de Calcul de Stats Raids
**Fichier** : `lib/computeRaidStats.ts`  
**Migration** : SQL Function `compute_raid_stats()`  
**Impact** : ⚡ Réduction de 50-70% du temps de calcul

**Exemple** :
```sql
CREATE OR REPLACE FUNCTION compute_raid_stats(
  p_month DATE,
  p_twitch_login TEXT DEFAULT NULL
)
RETURNS TABLE (
  twitch_login TEXT,
  raids_faits INTEGER,
  raids_recus INTEGER,
  total_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH raid_data AS (
    SELECT 
      raider_twitch_login,
      target_twitch_login,
      COUNT(*) as raid_count
    FROM raids
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_month)
    GROUP BY raider_twitch_login, target_twitch_login
  )
  SELECT 
    m.twitch_login,
    COALESCE(SUM(CASE WHEN rd.raider_twitch_login = m.twitch_login THEN rd.raid_count END), 0)::INTEGER as raids_faits,
    COALESCE(SUM(CASE WHEN rd.target_twitch_login = m.twitch_login THEN rd.raid_count END), 0)::INTEGER as raids_recus,
    -- Calcul des points selon la logique métier
    (COALESCE(SUM(CASE WHEN rd.raider_twitch_login = m.twitch_login THEN rd.raid_count END), 0) * 2 +
     COALESCE(SUM(CASE WHEN rd.target_twitch_login = m.twitch_login THEN rd.raid_count END), 0) * 1)::INTEGER as total_points
  FROM members m
  LEFT JOIN raid_data rd ON (
    rd.raider_twitch_login = m.twitch_login OR 
    rd.target_twitch_login = m.twitch_login
  )
  WHERE (p_twitch_login IS NULL OR m.twitch_login = p_twitch_login)
    AND m.is_active = true
  GROUP BY m.twitch_login;
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 Fonction de Calcul de Points d'Évaluation
**Fichier** : `lib/evaluationBonusHelpers.ts`  
**Migration** : SQL Function `compute_evaluation_bonus()`  
**Impact** : ⚡ Calcul plus rapide et centralisé

#### 1.3 Fonction de Synthèse d'Évaluation
**Fichier** : `lib/evaluationSynthesisHelpers.ts`  
**Migration** : SQL Function `compute_evaluation_synthesis()`  
**Impact** : ⚡ Agrégations optimisées

---

### Phase 2 : Edge Functions (Priorité MOYENNE)

#### 2.1 Edge Function pour Engagement Discord
**Fichier** : `lib/discordEngagement.ts`  
**Migration** : Supabase Edge Function  
**Avantages** :
- Appels API Discord isolés
- Exécution asynchrone
- Rate limiting natif

**Structure** :
```
supabase/
  functions/
    discord-engagement/
      index.ts
```

#### 2.2 Edge Function pour Twitch Helpers
**Fichier** : `lib/twitchHelpers.ts`  
**Migration** : Supabase Edge Function  
**Avantages** : Appels API Twitch isolés

---

### Phase 3 : Triggers SQL (Priorité BASSE)

#### 3.1 Trigger pour Mise à Jour Automatique
**Exemple** : Mettre à jour `updated_at` automatiquement
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 3.2 Trigger pour Calcul Automatique de Points
**Exemple** : Calculer les points automatiquement lors de l'insertion d'un raid
```sql
CREATE OR REPLACE FUNCTION calculate_raid_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Logique de calcul automatique
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Comparaison des Options

| Type | Avantages | Inconvénients | Cas d'usage |
|------|-----------|---------------|-------------|
| **SQL Functions** | ⚡ Très rapide<br>🔄 Réutilisable<br>📊 Optimisé DB | 🔧 Complexe à maintenir<br>🐛 Difficile à déboguer | Calculs complexes<br>Agrégations<br>Logique métier DB |
| **Edge Functions** | 🌐 Appels API externes<br>⚡ Exécution asynchrone<br>🔒 Isolation | 🔧 Nécessite déploiement séparé<br>📝 Documentation supplémentaire | Appels API Discord/Twitch<br>Tâches asynchrones |
| **Next.js API Routes** | 🐛 Facile à déboguer<br>📝 Documentation simple<br>🔄 Intégration facile | ⚡ Moins performant<br>💰 Coût serveur Next.js | Logique simple<br>Routes API publiques |

---

## 🎯 Recommandations par Priorité

### ✅ À Migrer (Impact Élevé)

1. **`computeRaidStats`** → SQL Function
   - Impact : ⚡⚡⚡ Très élevé
   - Complexité : Moyenne
   - Temps estimé : 2-3 heures

2. **`evaluationBonusHelpers`** → SQL Function
   - Impact : ⚡⚡ Élevé
   - Complexité : Moyenne
   - Temps estimé : 1-2 heures

3. **`evaluationSynthesisHelpers`** → SQL Function
   - Impact : ⚡⚡ Élevé
   - Complexité : Moyenne
   - Temps estimé : 1-2 heures

### ⚠️ À Évaluer (Impact Moyen)

4. **`discordEngagement`** → Edge Function
   - Impact : ⚡ Modéré
   - Complexité : Élevée
   - Temps estimé : 3-4 heures

5. **`twitchHelpers`** → Edge Function
   - Impact : ⚡ Modéré
   - Complexité : Élevée
   - Temps estimé : 2-3 heures

### ❌ À Garder dans Next.js

6. **`utils.ts`** → Garder dans Next.js
7. **`hash.ts`** → Garder dans Next.js
8. **`roleColors.ts`** → Garder dans Next.js

---

## 🔧 Étapes de Migration

### Pour SQL Functions

1. **Créer la fonction SQL** dans Supabase SQL Editor
2. **Tester** avec des données réelles
3. **Modifier le repository** pour utiliser la fonction SQL
4. **Tester** les routes API
5. **Supprimer** l'ancienne fonction TypeScript (optionnel)

### Pour Edge Functions

1. **Créer le projet Edge Function** dans Supabase
2. **Déployer** la fonction
3. **Modifier les routes API** pour appeler l'Edge Function
4. **Tester** les routes API
5. **Supprimer** l'ancienne fonction TypeScript (optionnel)

---

## 📝 Exemple Concret : Migration de `computeRaidStats`

### Avant (TypeScript)
```typescript
// lib/computeRaidStats.ts
export function computeRaidStats(raids: Raid[], members: Member[]): RaidStats {
  // Logique de calcul complexe
  // ...
}
```

### Après (SQL Function)
```sql
-- Dans Supabase SQL Editor
CREATE OR REPLACE FUNCTION compute_raid_stats(
  p_month DATE
)
RETURNS TABLE (
  twitch_login TEXT,
  raids_faits INTEGER,
  raids_recus INTEGER,
  total_points INTEGER
) AS $$
BEGIN
  -- Logique de calcul optimisée en SQL
  RETURN QUERY
  SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

### Utilisation dans le Repository
```typescript
// lib/repositories/EvaluationRepository.ts
async getRaidStats(month: string): Promise<RaidStats[]> {
  const { data, error } = await supabaseAdmin.rpc('compute_raid_stats', {
    p_month: `${month}-01`
  });
  
  if (error) throw error;
  return data;
}
```

---

## ⚡ Impact Attendu

### Performance
- ⚡ **50-70%** de réduction du temps de calcul pour les stats
- ⚡ **30-50%** de réduction de la charge sur Next.js
- ⚡ **Meilleure scalabilité** avec plus de données

### Coût
- 💰 **Réduction** des appels API Next.js
- 💰 **Optimisation** de l'utilisation de la base de données

---

## 🎯 Prochaines Étapes

1. ✅ **Analyser** les fonctions existantes (fait)
2. ⏳ **Créer** les SQL Functions pour les calculs
3. ⏳ **Tester** les fonctions SQL
4. ⏳ **Migrer** les routes API pour utiliser les fonctions SQL
5. ⏳ **Déployer** et monitorer

---

**Date de création** : $(date)  
**Statut** : ⏳ Prêt à être implémenté
