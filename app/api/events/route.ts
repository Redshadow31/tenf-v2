import { NextRequest, NextResponse } from 'next/server';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';
import { logApi, logEvent } from '@/lib/logging/logger';
import { PARIS_TIMEZONE, parisLocalDateTimeToUtcIso, utcIsoToParisDateTimeLocalInput } from '@/lib/timezone';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";

// Activer le cache ISR de 60 secondes pour les requêtes publiques
// Les requêtes admin (POST, GET avec ?admin=true) ne sont pas mises en cache
export const revalidate = 60;

type PublicAnnouncement = {
  title: string;
  description: string;
  image?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isActive: boolean;
};

const FILM_CATEGORY_CANONICAL = "Soirée Film";
const DEFAULT_FILM_ANNOUNCEMENT: PublicAnnouncement = {
  title: "Soirée Film communautaire",
  description: "Connecte-toi avec un profil actif TENF pour découvrir la programmation complète des soirées film.",
  isActive: true,
};

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMovieNightCategory(value: string): boolean {
  const normalized = normalizeCategory(value || "");
  return normalized === "soiree film";
}

async function loadFilmPublicAnnouncement(): Promise<PublicAnnouncement> {
  try {
    const { data, error } = await supabaseAdmin
      .from("event_category_public_announcements")
      .select("title,description,image,cta_label,cta_url,is_active")
      .eq("category", FILM_CATEGORY_CANONICAL)
      .maybeSingle();

    if (error || !data || data.is_active === false) {
      return DEFAULT_FILM_ANNOUNCEMENT;
    }

    const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : DEFAULT_FILM_ANNOUNCEMENT.title;
    const description = typeof data.description === "string" ? data.description : "";
    const image = typeof data.image === "string" && data.image.trim() ? data.image.trim() : undefined;
    const ctaLabel = typeof data.cta_label === "string" && data.cta_label.trim() ? data.cta_label.trim() : undefined;
    const ctaUrl = typeof data.cta_url === "string" && data.cta_url.trim() ? data.cta_url.trim() : undefined;

    return {
      title,
      description,
      image,
      ctaLabel,
      ctaUrl,
      isActive: true,
    };
  } catch {
    return DEFAULT_FILM_ANNOUNCEMENT;
  }
}

async function loadEventsDirectFallback(adminMode: boolean): Promise<any[]> {
  const tryQuery = async (
    table: 'community_events' | 'events',
    orderColumn: 'starts_at' | 'date',
    publishedColumn?: 'is_published' | 'isPublished'
  ) => {
    let query = supabaseAdmin.from(table).select('*');
    if (!adminMode && publishedColumn) {
      query = query.eq(publishedColumn, true);
    }
    const { data, error } = await query.order(orderColumn, { ascending: true }).limit(1000);
    if (error) return null;
    return data || [];
  };

  return (
    (await tryQuery('community_events', 'starts_at', 'is_published')) ??
    (await tryQuery('community_events', 'date', 'is_published')) ??
    (await tryQuery('events', 'date', 'is_published')) ??
    (await tryQuery('events', 'date', 'isPublished')) ??
    (await tryQuery('events', 'starts_at', 'is_published')) ??
    (await tryQuery('events', 'starts_at', 'isPublished')) ??
    []
  );
}

/**
 * GET - Récupère tous les événements publiés (public) ou tous les événements (admin)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const adminOnly = searchParams.get('admin') === 'true';
    
    // Vérifier si c'est une requête admin
    let isAdmin = false;
    if (adminOnly) {
      const admin = await requireSectionAccess('/admin/events/planification');
      if (!admin) {
        logApi.route('GET', '/api/events', 403);
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      isAdmin = true;
    }

    let canViewFullFilmEvents = false;
    if (!isAdmin) {
      const session = await getServerSession(authOptions);
      const discordId = session?.user?.discordId;
      if (discordId) {
        try {
          const member = await memberRepository.findByDiscordId(discordId);
          canViewFullFilmEvents = member?.isActive === true;
        } catch {
          canViewFullFilmEvents = false;
        }
      }
    }
    
    // Récupérer les événements depuis Supabase
    let events: any[] = [];
    try {
      events = isAdmin
        ? await eventRepository.findAll()
        : await eventRepository.findPublished();
    } catch (repoError) {
      logApi.error('/api/events.repo_fallback', repoError instanceof Error ? repoError : new Error(String(repoError)));
      const directRows = await loadEventsDirectFallback(isAdmin);
      events = (directRows || []).map((row: any) => ({
        id: String(row.id),
        title: row.title || 'Sans titre',
        description: row.description || '',
        image: row.image || undefined,
        date: new Date(row.starts_at || row.date || row.created_at || new Date().toISOString()),
        category: row.category || 'Non classé',
        location: row.location || undefined,
        invitedMembers: row.invited_members || [],
        isPublished: row.is_published ?? row.isPublished ?? false,
        createdAt: new Date(row.created_at || new Date().toISOString()),
        createdBy: row.created_by || 'system',
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      }));
    }
    
    // Convertir les dates en ISO string pour compatibilité avec le frontend
    // en évitant qu'une date legacy invalide fasse tomber toute la route.
    const formattedEvents = events
      .map((event) => {
        try {
          const eventIso = event.date instanceof Date ? event.date.toISOString() : String(event.date);
          const createdIso = event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt);
          const updatedIso = event.updatedAt
            ? (event.updatedAt instanceof Date ? event.updatedAt.toISOString() : String(event.updatedAt))
            : undefined;
          return {
            ...event,
            date: eventIso,
            startAtUtc: eventIso,
            timezoneOrigin: PARIS_TIMEZONE,
            startAtParisLocal: utcIsoToParisDateTimeLocalInput(eventIso),
            createdAt: createdIso,
            updatedAt: updatedIso,
          };
        } catch {
          return null;
        }
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    const publicFilmAnnouncement =
      !isAdmin && !canViewFullFilmEvents ? await loadFilmPublicAnnouncement() : null;

    const audienceEvents =
      !isAdmin && !canViewFullFilmEvents
        ? formattedEvents.map((event) => {
            if (!isMovieNightCategory(String(event.category || ""))) return event;
            return {
              ...event,
              title: publicFilmAnnouncement?.title || DEFAULT_FILM_ANNOUNCEMENT.title,
              description: publicFilmAnnouncement?.description || DEFAULT_FILM_ANNOUNCEMENT.description,
              image: publicFilmAnnouncement?.image || undefined,
              location: undefined,
              ctaLabel: publicFilmAnnouncement?.ctaLabel || undefined,
              ctaUrl: publicFilmAnnouncement?.ctaUrl || undefined,
              isMaskedForAudience: true,
            };
          })
        : formattedEvents;
    
    // Trier par date (plus récent en premier)
    audienceEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const response = NextResponse.json({ events: audienceEvents });
    
    // Configurer les headers de cache ISR uniquement pour les requêtes publiques
    // Les requêtes admin ne sont pas mises en cache
    if (!isAdmin) {
      if (canViewFullFilmEvents) {
        response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      } else {
        response.headers.set(
          'Cache-Control',
          'public, s-maxage=60, stale-while-revalidate=300'
        );
      }
    } else {
      // Désactiver le cache pour les requêtes admin
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    
    const duration = Date.now() - startTime;
    logApi.route('GET', '/api/events', 200, duration, undefined, { isAdmin, count: audienceEvents.length, canViewFullFilmEvents });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/events', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée un nouvel événement (admin uniquement)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const admin = await requireSectionAccess('/admin/events/planification');
    if (!admin) {
      logApi.route('POST', '/api/events', 403);
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, description, image, date, startAtUtc, startAtParisLocal, category, location, invitedMembers, isPublished } = body;
    
    if (!title || (!date && !startAtUtc && !startAtParisLocal) || !category) {
      return NextResponse.json(
        { error: 'Titre, date et catégorie sont requis' },
        { status: 400 }
      );
    }
    
    const resolvedStartAtUtc =
      typeof startAtParisLocal === "string" && startAtParisLocal
        ? parisLocalDateTimeToUtcIso(startAtParisLocal)
        : (startAtUtc || date);

    if (!resolvedStartAtUtc) {
      return NextResponse.json(
        { error: 'Date/heure invalide (attendu: startAtParisLocal ou startAtUtc/date)' },
        { status: 400 }
      );
    }

    const newEvent = await eventRepository.create({
      title,
      description: description || '',
      image,
      date: new Date(resolvedStartAtUtc),
      category,
      location,
      invitedMembers: invitedMembers || [],
      isPublished: isPublished ?? false,
      createdBy: admin.discordId,
      createdAt: new Date(),
    });
    
    // Convertir les dates en ISO string pour compatibilité
    const formattedEvent = {
      ...newEvent,
      date: newEvent.date instanceof Date ? newEvent.date.toISOString() : newEvent.date,
      startAtUtc: newEvent.date instanceof Date ? newEvent.date.toISOString() : newEvent.date,
      timezoneOrigin: PARIS_TIMEZONE,
      startAtParisLocal: utcIsoToParisDateTimeLocalInput(newEvent.date instanceof Date ? newEvent.date.toISOString() : newEvent.date),
      createdAt: newEvent.createdAt instanceof Date ? newEvent.createdAt.toISOString() : newEvent.createdAt,
      updatedAt: newEvent.updatedAt ? (newEvent.updatedAt instanceof Date ? newEvent.updatedAt.toISOString() : newEvent.updatedAt) : undefined,
    };
    
    // Logger l'action avec before/after optimisés
    const { previousValue, newValue } = prepareAuditValues(undefined, formattedEvent);
    
    const duration = Date.now() - startTime;
    logEvent.create(newEvent.id, admin.id);
    logApi.route('POST', '/api/events', 200, duration, admin.id, { eventId: newEvent.id, title });
    
    await logAction({
      action: "event.create",
      resourceType: "event",
      resourceId: newEvent.id,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/events" },
    });
    
    return NextResponse.json({ event: formattedEvent, success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/events', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

