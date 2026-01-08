# Documentation - Données Spotlight Enregistrées

## 📦 Stockage des données

Les données de spotlight sont stockées dans **deux endroits différents** selon leur statut :

### 1️⃣ Stockage Temporaire (Pendant le Spotlight Actif)

**Store Netlify Blobs : `tenf-spotlights`**

#### `active.json`
```typescript
{
  id: string;                          // ID unique (ex: "spotlight-1735689600000")
  streamerTwitchLogin: string;         // Login Twitch du streamer (ex: "nexou31")
  streamerDisplayName?: string;        // Nom d'affichage du streamer
  startedAt: string;                   // Date de début (ISO timestamp)
  endsAt: string;                      // Date de fin (ISO timestamp, startedAt + 2h)
  status: 'active' | 'completed' | 'cancelled';
  moderatorDiscordId: string;          // ID Discord du modérateur
  moderatorUsername: string;           // Pseudo du modérateur
  createdAt: string;                   // Date de création (ISO timestamp)
  createdBy: string;                   // ID Discord du créateur
}
```

#### `{spotlightId}/presences.json`
Liste des membres présents :
```typescript
Array<{
  twitchLogin: string;                 // Login Twitch du membre
  displayName?: string;                // Nom d'affichage
  addedAt: string;                     // Date d'ajout (ISO timestamp)
  addedBy: string;                     // ID Discord de la personne qui a ajouté
}>
```

#### `{spotlightId}/evaluation.json`
Évaluation qualitative du streamer :
```typescript
{
  spotlightId: string;                 // ID du spotlight
  streamerTwitchLogin: string;         // Login Twitch du streamer
  criteria: Array<{                    // 6 critères d'évaluation
    id: string;                        // ID du critère
    label: string;                     // Libellé (ex: "Qualité du contenu")
    maxValue: number;                  // Note max (ex: 20)
    value: number;                     // Note donnée (0 à maxValue)
  }>;
  totalScore: number;                  // Score total
  maxScore: number;                    // Score maximum possible
  moderatorComments: string;           // Commentaires du modérateur
  evaluatedAt: string;                 // Date d'évaluation (ISO timestamp)
  evaluatedBy: string;                 // ID Discord de l'évaluateur
}
```

---

### 2️⃣ Stockage Permanent (Section A - Évaluations Mensuelles)

**Store Netlify Blobs : `tenf-evaluations`**  
**Fichier : `{YYYY-MM}/section-a.json`**

Quand un spotlight est finalisé (via "Ajouter au rapport mensuel"), toutes les données sont consolidées et sauvegardées dans Section A :

```typescript
{
  month: "2025-12",                    // Mois (format YYYY-MM)
  spotlights: [
    {
      id: string;                      // ID unique du spotlight
      date: string;                    // Date au format ISO (YYYY-MM-DD)
      streamerTwitchLogin: string;     // Login Twitch du streamer
      moderatorDiscordId: string;      // ID Discord du modérateur
      moderatorUsername: string;       // Pseudo du modérateur
      
      // Liste de TOUS les membres actifs (présents ET absents)
      members: Array<{
        twitchLogin: string;           // Login Twitch
        present: boolean;              // true = présent, false = absent
        note?: number;                 // Note individuelle (ajoutée lors de l'évaluation mensuelle)
        comment?: string;              // Commentaire individuel (ajouté lors de l'évaluation mensuelle)
      }>;
      
      validated: true;                 // Toujours true quand finalisé
      validatedAt: string;             // Date de validation (ISO timestamp)
      createdAt: string;               // Date de création originale
      createdBy: string;               // ID Discord du créateur
    }
  ],
  events: [],                          // Événements (si applicable)
  raidPoints: {},                      // Points de raid (calculés séparément)
  spotlightBonus: {},                  // Bonus spotlight (si applicable)
  lastUpdated: string                  // Dernière mise à jour (ISO timestamp)
}
```

---

## 📊 Structure complète des données

### Données sauvegardées pour chaque spotlight finalisé :

1. **Identité du spotlight**
   - ID unique
   - Date
   - Mois (déterminé automatiquement depuis `startedAt`)

2. **Streamer**
   - Login Twitch
   - Nom d'affichage (si disponible)

3. **Modérateur**
   - ID Discord
   - Pseudo Discord

4. **Présences**
   - Liste complète de TOUS les membres actifs
   - Pour chaque membre : `present: true/false`
   - Permet de calculer le taux d'engagement

5. **Évaluations individuelles** (ajoutées plus tard lors de l'évaluation mensuelle)
   - Note par membre (optionnelle)
   - Commentaire par membre (optionnel)

6. **Métadonnées**
   - Dates de création, validation
   - Créateur, validateur

---

## 🔄 Flux de données

### 1. Lancement du Spotlight
→ Données sauvegardées dans `tenf-spotlights/active.json`

### 2. Ajout des présences (pendant le spotlight)
→ Données sauvegardées dans `tenf-spotlights/{spotlightId}/presences.json`

### 3. Évaluation du streamer
→ Données sauvegardées dans `tenf-spotlights/{spotlightId}/evaluation.json`

### 4. Finalisation ("Ajouter au rapport mensuel")
→ **Toutes les données sont consolidées et sauvegardées dans `tenf-evaluations/{YYYY-MM}/section-a.json`**
→ Le spotlight actif est marqué comme `completed`

---

## 📍 Localisation des données

- **Spotlights actifs** : `tenf-spotlights/active.json` + `tenf-spotlights/{id}/*`
- **Spotlights finalisés** : `tenf-evaluations/{YYYY-MM}/section-a.json`
- **Mois déterminé par** : La date de début (`startedAt`) du spotlight

---

## ✅ Utilisation des données

Les données de Section A sont utilisées pour :

1. **Page Présence** (`/admin/spotlight/presence`)
   - Calcul du nombre de présences par membre
   - Taux de participation
   - Liste des membres présents/absents

2. **Page Évaluation** (`/admin/spotlight/evaluation`)
   - Liste des spotlights du mois
   - Évaluations des streamers
   - Résumé des présences et taux d'engagement

3. **Page Données Individuelles** (`/admin/spotlight/membres`)
   - Historique par membre
   - Impact sur l'évaluation mensuelle

4. **Évaluations Mensuelles**
   - Calcul des points Section A
   - Statistiques globales






