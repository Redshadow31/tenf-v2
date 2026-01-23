// Script pour exporter les données depuis Netlify Blobs
// Nécessite NETLIFY_SITE_ID et NETLIFY_AUTH_TOKEN dans .env.local

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const siteID = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;

if (!siteID || !token) {
  console.error('❌ Variables NETLIFY_SITE_ID et NETLIFY_AUTH_TOKEN requises');
  console.error('   Ajoutez-les dans .env.local pour exporter les données');
  process.exit(1);
}

const stores = {
  members: { name: 'tenf-admin-members', key: 'admin-members-data' },
  botMembers: { name: 'tenf-bot-members', key: 'bot-members-data' },
  events: { name: 'tenf-events', key: 'events.json' },
  spotlights: { name: 'tenf-spotlights', key: 'active.json' },
  vipHistory: { name: 'tenf-vip-history', key: 'vip-history.json' },
};

async function exportData() {
  const exportDir = path.join(process.cwd(), 'migration', 'exported-data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('📦 Export des données depuis Netlify Blobs...\n');

  let exported = 0;
  let errors = 0;

  // Export Members
  try {
    const membersStore = getStore({ name: stores.members.name, siteID, token });
    const membersData = await membersStore.get(stores.members.key, { type: 'text' });
    if (membersData) {
      fs.writeFileSync(path.join(exportDir, 'members.json'), membersData, 'utf-8');
      console.log('✅ Members exportés');
      exported++;
    } else {
      console.log('⚠️  Members: aucune donnée trouvée');
    }
  } catch (error: any) {
    console.error('❌ Erreur export members:', error.message);
    errors++;
  }

  // Export Bot Members
  try {
    const botStore = getStore({ name: stores.botMembers.name, siteID, token });
    const botData = await botStore.get(stores.botMembers.key, { type: 'text' });
    if (botData) {
      fs.writeFileSync(path.join(exportDir, 'bot-members.json'), botData, 'utf-8');
      console.log('✅ Bot members exportés');
      exported++;
    } else {
      console.log('⚠️  Bot members: aucune donnée trouvée');
    }
  } catch (error: any) {
    console.error('❌ Erreur export bot members:', error.message);
    errors++;
  }

  // Export Events
  try {
    const eventsStore = getStore({ name: stores.events.name, siteID, token });
    const eventsData = await eventsStore.get(stores.events.key, { type: 'text' });
    if (eventsData) {
      fs.writeFileSync(path.join(exportDir, 'events.json'), eventsData, 'utf-8');
      console.log('✅ Events exportés');
      exported++;
    } else {
      console.log('⚠️  Events: aucune donnée trouvée');
    }
  } catch (error: any) {
    console.error('❌ Erreur export events:', error.message);
    errors++;
  }

  // Export Spotlights
  try {
    const spotlightStore = getStore({ name: stores.spotlights.name, siteID, token });
    const spotlightData = await spotlightStore.get(stores.spotlights.key, { type: 'text' });
    if (spotlightData) {
      fs.writeFileSync(path.join(exportDir, 'spotlights.json'), spotlightData, 'utf-8');
      console.log('✅ Spotlights exportés');
      exported++;
    } else {
      console.log('⚠️  Spotlights: aucune donnée trouvée');
    }
  } catch (error: any) {
    console.error('❌ Erreur export spotlights:', error.message);
    errors++;
  }

  // Export VIP History
  try {
    const vipStore = getStore({ name: stores.vipHistory.name, siteID, token });
    const vipData = await vipStore.get(stores.vipHistory.key, { type: 'text' });
    if (vipData) {
      fs.writeFileSync(path.join(exportDir, 'vip-history.json'), vipData, 'utf-8');
      console.log('✅ VIP History exporté');
      exported++;
    } else {
      console.log('⚠️  VIP History: aucune donnée trouvée');
    }
  } catch (error: any) {
    console.error('❌ Erreur export VIP history:', error.message);
    errors++;
  }

  console.log(`\n✅ Export terminé : ${exported} fichier(s) exporté(s), ${errors} erreur(s)`);
  console.log(`📁 Données dans : ${exportDir}`);
}

exportData().catch(console.error);
