# 📚 Repositories Pattern

Ce dossier contient les repositories pour accéder aux données de manière abstraite.

## Architecture

Le pattern Repository permet de :
- ✅ Séparer la logique d'accès aux données
- ✅ Faciliter les tests (mocking)
- ✅ Changer de source de données facilement
- ✅ Centraliser la logique de requêtes

## Structure

```
lib/repositories/
├── MemberRepository.ts      # Repository pour les membres
├── EventRepository.ts       # Repository pour les événements
├── SpotlightRepository.ts   # Repository pour les spotlights
├── EvaluationRepository.ts  # Repository pour les évaluations
├── VipRepository.ts         # Repository pour les VIPs
└── README.md                # Ce fichier
```

## Utilisation

### Import centralisé

```typescript
import { 
  memberRepository, 
  eventRepository, 
  spotlightRepository,
  evaluationRepository,
  vipRepository 
} from '@/lib/repositories';
```

### Exemple : MemberRepository

```typescript
// Récupérer tous les membres actifs
const members = await memberRepository.findActive(50, 0);

// Récupérer un membre par login Twitch
const member = await memberRepository.findByTwitchLogin('nexou31');

// Récupérer un membre par ID Discord
const memberByDiscord = await memberRepository.findByDiscordId('123456789');

// Récupérer les membres VIP
const vips = await memberRepository.findVip();

// Récupérer les membres par rôle
const admins = await memberRepository.findByRole('Admin');

// Créer un nouveau membre
const newMember = await memberRepository.create({
  twitchLogin: 'nouveau_membre',
  displayName: 'Nouveau Membre',
  twitchUrl: 'https://twitch.tv/nouveau_membre',
  role: 'Affilié',
});

// Mettre à jour un membre
const updated = await memberRepository.update('nexou31', {
  isVip: true,
  description: 'Membre VIP',
});

// Compter les membres actifs
const count = await memberRepository.countActive();
```

### Exemple : EventRepository

```typescript
// Récupérer tous les événements
const allEvents = await eventRepository.findAll();

// Récupérer les événements publiés
const publishedEvents = await eventRepository.findPublished();

// Récupérer les événements à venir
const upcomingEvents = await eventRepository.findUpcoming();

// Récupérer un événement par ID
const event = await eventRepository.findById('event-123');

// Créer un événement
const newEvent = await eventRepository.create({
  title: 'Nouvel événement',
  description: 'Description...',
  date: new Date('2026-02-15'),
  category: 'Soirée Film',
  isPublished: true,
  createdBy: 'discord-id-123',
});

// Récupérer les inscriptions
const registrations = await eventRepository.getRegistrations('event-123');

// Ajouter une inscription
await eventRepository.addRegistration({
  eventId: 'event-123',
  twitchLogin: 'nexou31',
  displayName: 'NeXou31',
});
```

### Exemple : SpotlightRepository

```typescript
// Récupérer le spotlight actif
const activeSpotlight = await spotlightRepository.findActive();

// Récupérer tous les spotlights
const allSpotlights = await spotlightRepository.findAll();

// Récupérer les présences d'un spotlight
const presences = await spotlightRepository.getPresences('spotlight-123');

// Récupérer l'évaluation d'un spotlight
const evaluation = await spotlightRepository.getEvaluation('spotlight-123');
```

## Cache

Les repositories peuvent être utilisés avec le cache Redis :

```typescript
import { getCached } from '@/lib/cache/redis';
import { memberRepository } from '@/lib/repositories/MemberRepository';

const members = await getCached(
  'members:active',
  () => memberRepository.findActive(50, 0),
  300 // Cache 5 minutes
);
```

## Tests

Pour tester avec des mocks :

```typescript
// Dans vos tests
jest.mock('@/lib/repositories/MemberRepository', () => ({
  memberRepository: {
    findActive: jest.fn().mockResolvedValue([...]),
  },
}));
```
