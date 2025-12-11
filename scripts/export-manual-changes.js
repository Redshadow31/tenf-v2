/**
 * Script pour exporter les modifications manuelles dans le code
 * Génère un fichier JSON avec tous les membres qui ont été modifiés manuellement
 * Ce fichier peut être utilisé pour préserver les modifications lors des synchronisations
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier de données membres
const DATA_DIR = path.join(process.cwd(), 'data');
const MEMBERS_DATA_FILE = path.join(DATA_DIR, 'members.json');
const EXPORT_FILE = path.join(DATA_DIR, 'manual-changes-export.json');

// Pour Netlify Blobs (si nécessaire)
const { getStore } = require('@netlify/blobs');

function isNetlify() {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.VERCEL === undefined
  );
}

async function loadMemberData() {
  if (isNetlify()) {
    try {
      const store = getStore('tenf-members');
      const data = await store.get('members-data', { type: 'text' });
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis Netlify Blobs:', error);
    }
    return {};
  } else {
    // Charger depuis le fichier local
    if (fs.existsSync(MEMBERS_DATA_FILE)) {
      const fileContent = fs.readFileSync(MEMBERS_DATA_FILE, 'utf-8');
      return JSON.parse(fileContent);
    }
  }
  return {};
}

async function exportManualChanges() {
  try {
    console.log('📦 Export des modifications manuelles...');
    
    const memberData = await loadMemberData();
    
    // Filtrer les membres avec des modifications manuelles
    const manualChanges = {};
    let count = 0;
    
    for (const [login, member] of Object.entries(memberData)) {
      // Vérifier si le membre a des modifications manuelles
      const hasManualChanges = 
        member.roleManuallySet === true ||
        member.description ||
        member.customBio ||
        member.siteUsername ||
        member.listId !== undefined;
      
      if (hasManualChanges) {
        manualChanges[login] = {
          twitchLogin: member.twitchLogin,
          displayName: member.displayName,
          discordId: member.discordId,
          discordUsername: member.discordUsername,
          role: member.role,
          roleManuallySet: member.roleManuallySet,
          siteUsername: member.siteUsername,
          description: member.description,
          customBio: member.customBio,
          listId: member.listId,
          isVip: member.isVip,
          badges: member.badges,
          updatedAt: member.updatedAt,
          updatedBy: member.updatedBy,
        };
        count++;
      }
    }
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Sauvegarder l'export
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalManualChanges: count,
      members: manualChanges,
    };
    
    fs.writeFileSync(
      EXPORT_FILE,
      JSON.stringify(exportData, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Export terminé: ${count} membre(s) avec modifications manuelles`);
    console.log(`📄 Fichier sauvegardé: ${EXPORT_FILE}`);
    
    // Afficher un résumé
    console.log('\n📊 Résumé des modifications:');
    const byRole = {};
    for (const member of Object.values(manualChanges)) {
      byRole[member.role] = (byRole[member.role] || 0) + 1;
    }
    for (const [role, count] of Object.entries(byRole)) {
      console.log(`  - ${role}: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  exportManualChanges();
}

module.exports = { exportManualChanges };

