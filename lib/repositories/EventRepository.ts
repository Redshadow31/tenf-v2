// Repository pour les événements - Utilise Supabase avec cache Redis
import { supabaseAdmin } from '../db/supabase';
import { cacheGet, cacheSet, cacheSetWithNamespace, cacheInvalidateNamespace, cacheKey, CACHE_TTL } from '../cache';
import { logDatabase, logCache } from '../logging/logger';

export interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: Date;
  category: string;
  location?: string;
  invitedMembers?: string[];
  isPublished: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  notes?: string;
  registeredAt: Date;
}

export class EventRepository {
  /**
   * Récupère tous les événements avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findAll(limit = 50, offset = 0): Promise<Event[]> {
    const cacheKeyStr = cacheKey('events', 'all', limit, offset);
    const startTime = Date.now();
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event[]>(cacheKeyStr);
    if (cached) {
      logCache.hit(cacheKeyStr);
      return cached;
    }
    logCache.miss(cacheKeyStr);

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logDatabase.error('SELECT', 'events', error);
      throw error;
    }

    const duration = Date.now() - startTime;
    logDatabase.query('SELECT', 'events', duration, { limit, offset, count: data?.length || 0 });

    const events = (data || []).map(this.mapToEvent);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('events', cacheKeyStr, events, CACHE_TTL.EVENTS_ALL);

    return events;
  }

  /**
   * Récupère un événement par son ID
   */
  async findById(id: string): Promise<Event | null> {
    const cacheKeyStr = cacheKey('events', 'id', id);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const event = data ? this.mapToEvent(data) : null;
    
    // Mettre en cache si trouvé
    if (event) {
      await cacheSetWithNamespace('events', cacheKeyStr, event, CACHE_TTL.EVENTS_PUBLISHED);
    }

    return event;
  }

  /**
   * Récupère les événements publiés avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 20)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findPublished(limit = 20, offset = 0): Promise<Event[]> {
    const cacheKeyStr = cacheKey('events', 'published', limit, offset);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event[]>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const events = (data || []).map(this.mapToEvent);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('events', cacheKeyStr, events, CACHE_TTL.EVENTS_PUBLISHED);

    return events;
  }

  /**
   * Récupère les événements à venir avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 10)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findUpcoming(limit = 10, offset = 0): Promise<Event[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('date', now)
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToEvent);
  }

  /**
   * Crée un nouvel événement
   */
  async create(event: Partial<Event>): Promise<Event> {
    const eventRecord = this.mapToDbFormat(event);

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(eventRecord)
      .select()
      .single();

    if (error) throw error;

    const newEvent = this.mapToEvent(data);
    
    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');

    return newEvent;
  }

  /**
   * Met à jour un événement
   */
  async update(id: string, updates: Partial<Event>): Promise<Event> {
    const updateRecord = this.mapToDbFormat(updates);
    updateRecord.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Event not found: ${id}`);

    const updatedEvent = this.mapToEvent(data);
    
    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');

    return updatedEvent;
  }

  /**
   * Supprime un événement
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');
  }

  /**
   * Récupère les inscriptions à un événement
   */
  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    // Récupérer toutes les inscriptions sans limite (ou avec une limite très élevée)
    // Supabase a une limite par défaut de 1000, donc on utilise une limite explicite élevée
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })
      .limit(10000); // Limite élevée pour récupérer toutes les inscriptions

    if (error) {
      console.error(`[EventRepository] Erreur récupération inscriptions pour événement ${eventId}:`, error);
      throw error;
    }

    const registrations = (data || []).map(this.mapToRegistration);
    console.log(`[EventRepository] Récupéré ${registrations.length} inscriptions pour événement ${eventId}`);
    
    return registrations;
  }

  /**
   * Récupère une inscription spécifique
   */
  async getRegistration(eventId: string, twitchLogin: string): Promise<EventRegistration | null> {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToRegistration(data) : null;
  }

  /**
   * Ajoute une inscription à un événement
   * Vérifie d'abord si l'inscription existe déjà
   */
  async addRegistration(registration: Partial<EventRegistration>): Promise<EventRegistration> {
    if (!registration.eventId || !registration.twitchLogin) {
      throw new Error('eventId et twitchLogin sont requis');
    }

    // Vérifier si l'inscription existe déjà
    const existing = await this.getRegistration(registration.eventId, registration.twitchLogin);
    if (existing) {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }

    const regRecord: any = {
      event_id: registration.eventId,
      twitch_login: registration.twitchLogin.toLowerCase(),
      display_name: registration.displayName,
      discord_id: registration.discordId || null,
      discord_username: registration.discordUsername || null,
      notes: registration.notes || null,
      registered_at: registration.registeredAt?.toISOString() || new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .insert(regRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToRegistration(data);
  }

  /**
   * Supprime une inscription
   */
  async removeRegistration(eventId: string, twitchLogin: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin);

    if (error) throw error;
  }

  private mapToEvent(row: any): Event {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      image: row.image || undefined,
      date: new Date(row.date),
      category: row.category,
      location: row.location || undefined,
      invitedMembers: row.invited_members || undefined,
      isPublished: row.is_published,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  private mapToRegistration(row: any): EventRegistration {
    // Gérer registered_at qui peut être une string ou un Date
    let registeredAt: Date;
    if (row.registered_at instanceof Date) {
      registeredAt = row.registered_at;
    } else if (typeof row.registered_at === 'string') {
      registeredAt = new Date(row.registered_at);
    } else {
      // Fallback si la date est invalide
      registeredAt = new Date();
    }

    return {
      id: row.id,
      eventId: row.event_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      notes: row.notes || undefined,
      registeredAt,
    };
  }

  /**
   * Récupère les présences pour un événement
   */
  async getPresences(eventId: string): Promise<any[]> {
    // Récupérer toutes les présences sans limite (ou avec une limite très élevée)
    // Supabase a une limite par défaut de 1000, donc on utilise une limite explicite élevée
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(10000); // Limite élevée pour récupérer toutes les présences

    if (error) {
      console.error(`[EventRepository] Erreur récupération présences pour événement ${eventId}:`, error);
      throw error;
    }

    const presences = (data || []).map(this.mapToPresence);
    console.log(`[EventRepository] Récupéré ${presences.length} présences pour événement ${eventId}`);
    
    return presences;
  }

  /**
   * Ajoute ou met à jour une présence
   */
  async upsertPresence(presence: {
    eventId: string;
    twitchLogin: string;
    displayName: string;
    discordId?: string;
    discordUsername?: string;
    isRegistered: boolean;
    present: boolean;
    note?: string;
    validatedBy: string;
    addedManually?: boolean;
  }): Promise<any> {
    const presenceRecord: any = {
      event_id: presence.eventId,
      twitch_login: presence.twitchLogin.toLowerCase(),
      display_name: presence.displayName,
      discord_id: presence.discordId || null,
      discord_username: presence.discordUsername || null,
      is_registered: presence.isRegistered,
      present: presence.present,
      note: presence.note || null,
      validated_at: new Date().toISOString(),
      validated_by: presence.validatedBy,
      added_manually: presence.addedManually || false,
    };

    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .upsert(presenceRecord, {
        onConflict: 'event_id,twitch_login',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToPresence(data);
  }

  /**
   * Met à jour la note d'une présence
   */
  async updatePresenceNote(eventId: string, twitchLogin: string, note: string | undefined, validatedBy: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .update({
        note: note || null,
        validated_at: new Date().toISOString(),
        validated_by: validatedBy,
      })
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase())
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  /**
   * Supprime une présence
   */
  async removePresence(eventId: string, twitchLogin: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('event_presences')
      .delete()
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase());

    if (error) throw error;

    return true;
  }

  private mapToPresence(row: any): any {
    return {
      id: row.id,
      eventId: row.event_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      isRegistered: row.is_registered,
      present: row.present,
      note: row.note || undefined,
      validatedAt: row.validated_at ? new Date(row.validated_at).toISOString() : undefined,
      validatedBy: row.validated_by || undefined,
      addedManually: row.added_manually,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  private mapToDbFormat(event: Partial<Event>): any {
    const record: any = {};

    if (event.id !== undefined) record.id = event.id;
    if (event.title !== undefined) record.title = event.title;
    if (event.description !== undefined) record.description = event.description;
    if (event.image !== undefined) record.image = event.image;
    if (event.date !== undefined) {
      record.date = event.date instanceof Date ? event.date.toISOString() : event.date;
    }
    if (event.category !== undefined) record.category = event.category;
    if (event.location !== undefined) record.location = event.location;
    if (event.invitedMembers !== undefined) record.invited_members = event.invitedMembers;
    if (event.isPublished !== undefined) record.is_published = event.isPublished;
    if (event.createdBy !== undefined) record.created_by = event.createdBy;
    if (event.createdAt !== undefined) {
      record.created_at = event.createdAt instanceof Date 
        ? event.createdAt.toISOString() 
        : event.createdAt;
    }

    return record;
  }
}

export const eventRepository = new EventRepository();
