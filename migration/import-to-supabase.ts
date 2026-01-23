// Script pour importer les données exportées vers Supabase
// Utilise le client Supabase directement (plus fiable que la connection string PostgreSQL)

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Créer le client Supabase admin directement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes dans .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const exportDir = path.join(process.cwd(), 'migration', 'exported-data');

async function importMembers() {
  console.log('📥 Import des membres...');
  
  const membersFile = path.join(exportDir, 'members.json');
  if (!fs.existsSync(membersFile)) {
    console.log('⚠️  Fichier members.json non trouvé');
    return { imported: 0, errors: 0 };
  }

  const membersData = JSON.parse(fs.readFileSync(membersFile, 'utf-8'));
  const membersArray = Object.values(membersData) as any[];

  let imported = 0;
  let errors = 0;

  for (const member of membersArray) {
    try {
      // Ignorer les entrées de suppression
      if (member.deleted === true) continue;
      
      const memberRecord: any = {
        twitch_login: member.twitchLogin?.toLowerCase() || '',
        twitch_id: member.twitchId || null,
        twitch_url: member.twitchUrl || '',
        discord_id: member.discordId || null,
        discord_username: member.discordUsername || null,
        display_name: member.displayName || '',
        site_username: member.siteUsername || null,
        role: member.role || 'Affilié',
        is_vip: member.isVip || false,
        is_active: member.isActive !== false,
        badges: member.badges || [],
        list_id: member.listId || null,
        role_manually_set: member.roleManuallySet || false,
        twitch_status: member.twitchStatus || null,
        description: member.description || null,
        custom_bio: member.customBio || null,
        updated_by: member.updatedBy || null,
        integration_date: member.integrationDate || null,
        role_history: member.roleHistory || [],
        parrain: member.parrain || null,
        created_at: member.createdAt || new Date().toISOString(),
        updated_at: member.updatedAt || new Date().toISOString(),
      };

      if (!memberRecord.twitch_login) {
        console.log(`⚠️  Membre ignoré (pas de twitch_login)`);
        continue;
      }

      // Utiliser upsert pour insérer ou mettre à jour
      const { error } = await supabaseAdmin
        .from('members')
        .upsert(memberRecord, {
          onConflict: 'twitch_login',
        });

      if (error) {
        throw error;
      }

      imported++;
    } catch (error: any) {
      console.error(`❌ Erreur import membre ${member.twitchLogin || 'unknown'}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ ${imported} membres importés, ${errors} erreurs\n`);
  return { imported, errors };
}

async function importEvents() {
  console.log('📥 Import des événements...');
  
  const eventsFile = path.join(exportDir, 'events.json');
  if (!fs.existsSync(eventsFile)) {
    console.log('⚠️  Fichier events.json non trouvé');
    return { imported: 0, errors: 0 };
  }

  const eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf-8')) as any[];

  let imported = 0;
  let errors = 0;

  for (const event of eventsData) {
    try {
      const eventRecord: any = {
        id: event.id,
        title: event.title,
        description: event.description,
        image: event.image || null,
        date: event.date,
        category: event.category,
        location: event.location || null,
        invited_members: event.invitedMembers || [],
        is_published: event.isPublished !== false,
        created_by: event.createdBy,
        created_at: event.createdAt,
        updated_at: event.updatedAt || null,
      };

      const { error: eventError } = await supabaseAdmin
        .from('events')
        .upsert(eventRecord, { onConflict: 'id' });

      if (eventError) throw eventError;

      // Importer les inscriptions si elles existent
      if (event.registrations && Array.isArray(event.registrations)) {
        for (const reg of event.registrations) {
          try {
            const { error: regError } = await supabaseAdmin
              .from('event_registrations')
              .upsert({
                event_id: event.id,
                twitch_login: reg.twitchLogin,
                display_name: reg.displayName,
                discord_id: reg.discordId || null,
                discord_username: reg.discordUsername || null,
                notes: reg.notes || null,
                registered_at: reg.registeredAt,
              }, { onConflict: 'id' });

            if (regError) {
              console.error(`   ⚠️  Erreur import inscription: ${regError.message}`);
            }
          } catch (regError: any) {
            console.error(`   ⚠️  Erreur import inscription: ${regError.message}`);
          }
        }
      }

      imported++;
    } catch (error: any) {
      console.error(`❌ Erreur import événement ${event.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ ${imported} événements importés, ${errors} erreurs\n`);
  return { imported, errors };
}

async function importSpotlights() {
  console.log('📥 Import des spotlights...');
  
  const spotlightsFile = path.join(exportDir, 'spotlights.json');
  if (!fs.existsSync(spotlightsFile)) {
    console.log('⚠️  Fichier spotlights.json non trouvé');
    return { imported: 0, errors: 0 };
  }

  const spotlightData = JSON.parse(fs.readFileSync(spotlightsFile, 'utf-8')) as any;

  let imported = 0;
  let errors = 0;

  try {
    if (spotlightData && spotlightData.id) {
      const spotlightRecord: any = {
        id: spotlightData.id,
        streamer_twitch_login: spotlightData.streamerTwitchLogin,
        streamer_display_name: spotlightData.streamerDisplayName || null,
        started_at: spotlightData.startedAt,
        ends_at: spotlightData.endsAt,
        status: spotlightData.status || 'active',
        moderator_discord_id: spotlightData.moderatorDiscordId,
        moderator_username: spotlightData.moderatorUsername,
        created_at: spotlightData.createdAt,
        created_by: spotlightData.createdBy,
      };

      const { error: spotlightError } = await supabaseAdmin
        .from('spotlights')
        .upsert(spotlightRecord, { onConflict: 'id' });

      if (spotlightError) throw spotlightError;

      // Importer les présences
      if (spotlightData.presences && Array.isArray(spotlightData.presences)) {
        for (const presence of spotlightData.presences) {
          try {
            const { error: presenceError } = await supabaseAdmin
              .from('spotlight_presences')
              .upsert({
                spotlight_id: spotlightData.id,
                twitch_login: presence.twitchLogin,
                display_name: presence.displayName || null,
                added_at: presence.addedAt,
                added_by: presence.addedBy,
              }, { onConflict: 'id' });

            if (presenceError) {
              console.error(`   ⚠️  Erreur import présence: ${presenceError.message}`);
            }
          } catch (presenceError: any) {
            console.error(`   ⚠️  Erreur import présence: ${presenceError.message}`);
          }
        }
      }

      // Importer les évaluations
      if (spotlightData.evaluation) {
        try {
          const { error: evalError } = await supabaseAdmin
            .from('spotlight_evaluations')
            .upsert({
              spotlight_id: spotlightData.id,
              streamer_twitch_login: spotlightData.evaluation.streamerTwitchLogin,
              criteria: spotlightData.evaluation.criteria,
              total_score: spotlightData.evaluation.totalScore,
              max_score: spotlightData.evaluation.maxScore,
              moderator_comments: spotlightData.evaluation.moderatorComments || null,
              evaluated_at: spotlightData.evaluation.evaluatedAt,
              evaluated_by: spotlightData.evaluation.evaluatedBy,
              validated: spotlightData.validated || false,
              validated_at: spotlightData.validatedAt || null,
            }, { onConflict: 'id' });

          if (evalError) {
            console.error(`   ⚠️  Erreur import évaluation: ${evalError.message}`);
          }
        } catch (evalError: any) {
          console.error(`   ⚠️  Erreur import évaluation: ${evalError.message}`);
        }
      }

      imported++;
      console.log(`✅ Spotlight importé\n`);
    }
  } catch (error: any) {
    console.error('❌ Erreur import spotlight:', error.message);
    errors++;
  }

  return { imported, errors };
}

async function main() {
  console.log('🚀 Début de l\'import vers Supabase...\n');

  const results = {
    members: await importMembers(),
    events: await importEvents(),
    spotlights: await importSpotlights(),
  };

  console.log('='.repeat(60));
  console.log('📊 Résumé de l\'import :');
  console.log(`   - Membres: ${results.members.imported} importés, ${results.members.errors} erreurs`);
  console.log(`   - Événements: ${results.events.imported} importés, ${results.events.errors} erreurs`);
  console.log(`   - Spotlights: ${results.spotlights.imported} importés, ${results.spotlights.errors} erreurs`);
  console.log('='.repeat(60));

  const totalImported = results.members.imported + results.events.imported + results.spotlights.imported;
  const totalErrors = results.members.errors + results.events.errors + results.spotlights.errors;

  if (totalErrors === 0) {
    console.log('\n✅ Import terminé avec succès !');
  } else {
    console.log(`\n⚠️  Import terminé avec ${totalErrors} erreur(s)`);
  }

  console.log('\n🔍 Vérifiez les données dans Supabase Dashboard → Table Editor');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
