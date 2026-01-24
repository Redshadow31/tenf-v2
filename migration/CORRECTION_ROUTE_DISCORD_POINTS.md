# 🔧 Correction Route Discord Points

**Date** : $(date)  
**Problème** : Les points Discord sont à zéro dans `/admin/evaluation/d` alors qu'ils sont présents dans `/admin/evaluation/b/discord`

---

## 🔍 Problème Identifié

### Symptôme
- Page `/admin/evaluation/b/discord` : ✅ Affiche correctement les notes Discord (ex: 5/5, 3/5, etc.)
- Page `/admin/evaluation/d` : ❌ Affiche 0.00 pour tous les points Discord

### Cause
La route `/api/evaluations/discord/points` cherchait uniquement dans Supabase (`evaluationRepository.findByMonth()`), mais les données Discord sont stockées dans **Netlify Blobs** via `discordEngagementStorage`.

**Flux de données** :
1. Import messages/vocaux → Stockage dans Netlify Blobs (`discordEngagementStorage`)
2. Page Discord → Lit depuis Netlify Blobs ✅
3. Route `/api/evaluations/discord/points` → Cherchait uniquement dans Supabase ❌

---

## ✅ Solution Appliquée

### Modification de `/api/evaluations/discord/points`

**Avant** : Lecture uniquement depuis Supabase
```typescript
const evaluations = await evaluationRepository.findByMonth(monthKey);
// Cherchait discordEngagement dans les évaluations Supabase
```

**Après** : Lecture depuis Netlify Blobs en priorité, puis Supabase en fallback
```typescript
// PRIORITÉ 1: Charger depuis Netlify Blobs (source de vérité)
const engagementData = await getDiscordEngagementData(monthKey);

if (engagementData && engagementData.dataByMember) {
  // Parcourir les données depuis Netlify Blobs
  Object.entries(engagementData.dataByMember).forEach(([discordId, engagement]) => {
    const twitchLogin = discordIdToTwitchLogin.get(discordId);
    if (twitchLogin) {
      // Calculer la note finale
      const noteFinale = calculateNoteFinale(
        calculateNoteEcrit(engagement.nbMessages || 0),
        calculateNoteVocal(engagement.nbVocalMinutes || 0)
      );
      pointsMap[twitchLogin.toLowerCase()] = noteFinale;
    }
  });
}

// PRIORITÉ 2: Compléter avec Supabase (si données migrées)
const evaluations = await evaluationRepository.findByMonth(monthKey);
// ...
```

---

## 📊 Résultat

✅ **Les points Discord remontent maintenant correctement dans la synthèse !**

La route :
1. ✅ Lit depuis Netlify Blobs (où les données sont importées)
2. ✅ Convertit Discord ID → Twitch Login
3. ✅ Calcule les notes finales (écrit + vocal)
4. ✅ Retourne le format attendu par la page

---

## 🧪 Test

### Avant la correction
```json
// GET /api/evaluations/discord/points?month=2025-12
{
  "success": true,
  "points": {},  // ❌ Vide
  "month": "2025-12"
}
```

### Après la correction
```json
// GET /api/evaluations/discord/points?month=2025-12
{
  "success": true,
  "points": {
    "aaabaddon": 5,      // ✅ Note finale calculée
    "acemendosa": 0,     // ✅ Note finale calculée
    "aduken_tv": 0,      // ✅ Note finale calculée
    // ...
  },
  "month": "2025-12"
}
```

---

## 📝 Notes

- Les données Discord sont toujours stockées dans Netlify Blobs (pas encore migrées vers Supabase)
- La route utilise maintenant la même source de données que la page Discord
- Si les données sont migrées vers Supabase plus tard, la route les utilisera automatiquement en fallback

---

**Date de correction** : $(date)  
**Statut** : ✅ **CORRIGÉ**
