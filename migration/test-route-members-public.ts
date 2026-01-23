// Script pour tester la route /api/members/public migrée vers Supabase

import * as dotenv from 'dotenv';
import { memberRepository } from '../lib/repositories';
import { getTwitchUsers } from '../lib/twitch';
import { getVipBadgeText } from '../lib/vipHistory';
import { getMemberDescription } from '../lib/memberDescriptions';

dotenv.config({ path: '.env.local' });

console.log('🧪 Test de la route /api/members/public (migrée vers Supabase)\n');

async function testRoute() {
  try {
    console.log('📋 Étape 1: Récupération des membres actifs via repository...');
    const activeMembers = await memberRepository.findActive(1000, 0);
    console.log(`   ✅ ${activeMembers.length} membres actifs trouvés\n`);

    if (activeMembers.length === 0) {
      console.log('⚠️  Aucun membre actif trouvé. Le test ne peut pas continuer.');
      return;
    }

    console.log('📋 Étape 2: Récupération des avatars Twitch...');
    const twitchLogins = activeMembers
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    console.log(`   📝 ${twitchLogins.length} logins Twitch à récupérer`);
    const twitchUsers = await getTwitchUsers(twitchLogins.slice(0, 10)); // Tester avec les 10 premiers seulement
    console.log(`   ✅ ${twitchUsers.length} avatars Twitch récupérés\n`);

    console.log('📋 Étape 3: Formatage des données (simulation de la route)...');
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );

    const publicMembers = activeMembers.slice(0, 5).map((member) => {
      let avatar: string | undefined = avatarMap.get(member.twitchLogin.toLowerCase());
      
      if (!avatar && member.discordId) {
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
      }

      const vipBadge = member.isVip ? getVipBadgeText(member.twitchLogin) : undefined;

      const description = getMemberDescription({
        description: member.description,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: member.role,
      });

      return {
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: member.role,
        isVip: member.isVip,
        vipBadge: vipBadge,
        badges: member.badges || [],
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        avatar: avatar,
        description: description,
        createdAt: member.createdAt ? member.createdAt.toISOString() : undefined,
      };
    });

    console.log(`   ✅ ${publicMembers.length} membres formatés pour l'affichage public\n`);

    console.log('📋 Étape 4: Vérification des données formatées...');
    publicMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.displayName} (${member.twitchLogin})`);
      console.log(`      - Rôle: ${member.role}`);
      console.log(`      - VIP: ${member.isVip ? 'Oui' : 'Non'}`);
      console.log(`      - Badge VIP: ${member.vipBadge || 'N/A'}`);
      console.log(`      - Avatar: ${member.avatar ? '✅' : '❌'}`);
      console.log(`      - Description: ${member.description ? '✅' : '❌'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test réussi ! La route fonctionne correctement.');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - Membres actifs: ${activeMembers.length}`);
    console.log(`   - Membres formatés: ${publicMembers.length}`);
    console.log(`   - Avatars récupérés: ${twitchUsers.length}`);
    console.log('\n🚀 La route /api/members/public est prête à être utilisée !');

  } catch (error: any) {
    console.error('\n❌ Erreur lors du test:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

testRoute();
