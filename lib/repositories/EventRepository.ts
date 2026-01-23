// Repository pour les événements - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';

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
   * Récupère tous les événements
   */
  async findAll(): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToEvent);
  }

  /**
   * Récupère un événement par son ID
   */
  async findById(id: string): Promise<Event | null> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToEvent(data) : null;
  }

  /**
   * Récupère les événements publiés
   */
  async findPublished(): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToEvent);
  }

  /**
   * Récupère les événements à venir
   */
  async findUpcoming(): Promise<Event[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('date', now)
      .order('date', { ascending: true });

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

    return this.mapToEvent(data);
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

    return this.mapToEvent(data);
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
  }

  /**
   * Récupère les inscriptions à un événement
   */
  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToRegistration);
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
    return {
      id: row.id,
      eventId: row.event_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      notes: row.notes || undefined,
      registeredAt: new Date(row.registered_at),
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
