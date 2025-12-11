/**
 * Script pour sauvegarder les données des membres de façon durable
 * Ce script peut être exécuté manuellement ou via une route API
 * 
 * Usage: node scripts/save-member-data.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier de sauvegarde
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
const BACKUP_FILE = path.join(BACKUP_DIR, `members-backup-${new Date().toISOString().split('T')[0]}.json`);

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Charger les données depuis le fichier actuel
let memberData = {};
if (fs.existsSync(MEMBERS_FILE)) {
  try {
    const fileContent = fs.readFileSync(MEMBERS_FILE, 'utf-8');
    memberData = JSON.parse(fileContent);
    console.log(`✅ Données chargées depuis ${MEMBERS_FILE}`);
    console.log(`   ${Object.keys(memberData).length} membres trouvés`);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${MEMBERS_FILE}:`, error.message);
    process.exit(1);
  }
} else {
  console.log(`⚠️  Fichier ${MEMBERS_FILE} n'existe pas encore`);
}

// Créer une sauvegarde avant toute modification
if (Object.keys(memberData).length > 0) {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(memberData, null, 2), 'utf-8');
    console.log(`✅ Sauvegarde créée: ${BACKUP_FILE}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la sauvegarde:`, error.message);
  }
}

// Filtrer et nettoyer les données
const cleanedData = {};
let validMembers = 0;
let invalidMembers = 0;

for (const [key, member] of Object.entries(memberData)) {
  // Vérifier que le membre a au moins un twitchLogin valide
  if (member.twitchLogin && typeof member.twitchLogin === 'string') {
    // Nettoyer les données
    const cleaned = {
      twitchLogin: member.twitchLogin,
      twitchUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
      discordId: member.discordId || undefined,
      discordUsername: member.discordUsername || undefined,
      displayName: member.displayName || member.twitchLogin,
      siteUsername: member.siteUsername || undefined,
      role: member.role || 'Affilié',
      isVip: member.isVip || false,
      isActive: member.isActive !== undefined ? member.isActive : true,
      badges: member.badges || undefined,
      listId: member.listId || undefined,
      roleManuallySet: member.roleManuallySet || false,
      description: member.description || undefined,
      customBio: member.customBio || undefined,
      createdAt: member.createdAt || new Date().toISOString(),
      updatedAt: member.updatedAt || new Date().toISOString(),
      updatedBy: member.updatedBy || undefined,
    };
    
    // Enlever les champs undefined pour réduire la taille
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    
    cleanedData[key] = cleaned;
    validMembers++;
  } else {
    invalidMembers++;
    console.warn(`⚠️  Membre invalide ignoré: ${key}`);
  }
}

// Sauvegarder les données nettoyées
try {
  fs.writeFileSync(MEMBERS_FILE, JSON.stringify(cleanedData, null, 2), 'utf-8');
  console.log(`✅ Données sauvegardées dans ${MEMBERS_FILE}`);
  console.log(`   ${validMembers} membres valides`);
  if (invalidMembers > 0) {
    console.log(`   ${invalidMembers} membres invalides ignorés`);
  }
} catch (error) {
  console.error(`❌ Erreur lors de la sauvegarde:`, error.message);
  process.exit(1);
}

// Statistiques
const stats = {
  total: validMembers,
  byRole: {},
  withDiscord: 0,
  withManualChanges: 0,
  withDescription: 0,
};

for (const member of Object.values(cleanedData)) {
  // Par rôle
  stats.byRole[member.role] = (stats.byRole[member.role] || 0) + 1;
  
  // Avec Discord
  if (member.discordId) {
    stats.withDiscord++;
  }
  
  // Modifications manuelles
  if (member.roleManuallySet) {
    stats.withManualChanges++;
  }
  
  // Avec description
  if (member.description) {
    stats.withDescription++;
  }
}

console.log('\n📊 Statistiques:');
console.log(JSON.stringify(stats, null, 2));

console.log('\n✅ Script terminé avec succès !');

