# 📋 Plan de Migration des Routes Événements

## 📊 État Actuel

**Routes à migrer** : 6 routes  
**Priorité** : MOYENNE  
**Statut** : ⏳ En attente

---

## 🎯 Routes à Migrer

### 1. `/api/admin/events/presence` ⏳
- **Fonctionnalité** : Gestion des présences aux événements
- **Utilise actuellement** : `loadSectionAData`, `saveSectionAData` (Netlify Blobs)
- **À migrer vers** : `evaluationRepository` (table `evaluations.event_evaluations`)
- **Fichier** : `app/api/admin/events/presence/route.ts`
- **Complexité** : MOYENNE

### 2. `/api/admin/events/registrations` ⏳
- **Fonctionnalité** : Gestion des inscriptions aux événements
- **Utilise actuellement** : À vérifier
- **À migrer vers** : `eventRepository` (table `event_registrations`)
- **Fichier** : `app/api/admin/events/registrations/route.ts`
- **Complexité** : MOYENNE

### 3. `/api/events/[eventId]/register` ✅?
- **Fonctionnalité** : Inscription à un événement
- **Utilise actuellement** : À vérifier (probablement déjà migré)
- **Fichier** : `app/api/events/[eventId]/register/route.ts`
- **Complexité** : FAIBLE

### 4. `/api/events/[eventId]/unregister` ✅?
- **Fonctionnalité** : Désinscription d'un événement
- **Utilise actuellement** : À vérifier (probablement déjà migré)
- **Fichier** : `app/api/events/[eventId]/unregister/route.ts`
- **Complexité** : FAIBLE

### 5. `/api/admin/events/upload-image` ⏳
- **Fonctionnalité** : Upload d'image d'événement
- **Utilise actuellement** : Netlify Blobs (`tenf-events-images`)
- **À migrer vers** : Supabase Storage (bucket `events-images`)
- **Fichier** : `app/api/admin/events/upload-image/route.ts`
- **Complexité** : ÉLEVÉE (nécessite configuration Supabase Storage)

### 6. `/api/admin/events/images/[fileName]` ⏳
- **Fonctionnalité** : Récupération d'image d'événement
- **Utilise actuellement** : Netlify Blobs (`tenf-events-images`)
- **À migrer vers** : Supabase Storage (bucket `events-images`)
- **Fichier** : `app/api/admin/events/images/[fileName]/route.ts`
- **Complexité** : ÉLEVÉE (nécessite configuration Supabase Storage)

---

## 🔧 Modifications Nécessaires

### 1. EventRepository - Méthodes à ajouter

```typescript
// Méthodes pour les inscriptions
async getRegistrations(eventId: string): Promise<EventRegistration[]>
async register(eventId: string, memberId: string, data: Partial<EventRegistration>): Promise<EventRegistration>
async unregister(eventId: string, memberId: string): Promise<void>
async getRegistration(eventId: string, memberId: string): Promise<EventRegistration | null>

// Méthodes pour les présences
async getPresences(eventId: string): Promise<EventPresence[]>
async addPresence(eventId: string, memberId: string, data: Partial<EventPresence>): Promise<EventPresence>
async updatePresence(eventId: string, memberId: string, data: Partial<EventPresence>): Promise<EventPresence>
```

### 2. EvaluationRepository - Utilisation existante

Les présences aux événements sont déjà stockées dans `evaluations.event_evaluations` (JSONB array).
- Utiliser `evaluationRepository.findByMonth()` pour récupérer
- Utiliser `evaluationRepository.upsert()` pour mettre à jour

### 3. Supabase Storage - Configuration requise

Pour les images d'événements :
1. Créer un bucket `events-images` dans Supabase Storage
2. Configurer les permissions (public read, admin write)
3. Migrer les images existantes depuis Netlify Blobs

---

## 📝 Étapes de Migration

### Phase 1 : Routes de Base (Sans Storage)
1. ✅ Vérifier `/api/events/[eventId]/register` et `/unregister`
2. Migrer `/api/admin/events/presence`
3. Migrer `/api/admin/events/registrations`

### Phase 2 : Storage (Si nécessaire)
4. Configurer Supabase Storage bucket `events-images`
5. Migrer `/api/admin/events/upload-image`
6. Migrer `/api/admin/events/images/[fileName]`

---

## ✅ Checklist

- [ ] Vérifier l'état actuel de `/api/events/[eventId]/register`
- [ ] Vérifier l'état actuel de `/api/events/[eventId]/unregister`
- [ ] Analyser `/api/admin/events/presence`
- [ ] Analyser `/api/admin/events/registrations`
- [ ] Ajouter méthodes manquantes à `EventRepository`
- [ ] Migrer `/api/admin/events/presence`
- [ ] Migrer `/api/admin/events/registrations`
- [ ] Tester les routes migrées
- [ ] (Optionnel) Configurer Supabase Storage pour les images
- [ ] (Optionnel) Migrer les routes d'images

---

## 📚 Documentation Associée

- `lib/repositories/EventRepository.ts` : Repository pour les événements
- `lib/db/schema.ts` : Schéma des tables `events`, `event_registrations`
- `migration/AMELIORATIONS_V3.md` : Plan d'améliorations V3

---

**Prêt à commencer la migration ! 🚀**
