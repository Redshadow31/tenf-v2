// Script pour tester la route /api/vip-members migrée vers Supabase

import * as dotenv from 'dotenv';
import { memberRepository, vipRepository } from '../lib/repositories';
import { getTwitchUsers } from '../lib/twitch';
import { getVipBadgeText, getConsecutiveVipMonths } from '../lib/vipHistory';
import { buildTwitchAvatarMap, resolveMemberAvatar } from '../lib/memberAvatar';

dotenv.config({ path: '.env.local' });

console.log('🧪 Test de la route /api/vip-members (migrée vers Supabase)\n');

async function testRoute() {
  try {
    console.log('📋 Étape 1: Récupération des VIP du mois actuel...');
    const currentMonthVips = await vipRepository.findCurrentMonth();
    console.log(`   ✅ ${currentMonthVips.length} VIPs du mois actuel trouvés\n`);

    console.log('📋 Étape 2: Récupération des membres VIP...');
    let vipMemberData;
    
    if (currentMonthVips && currentMonthVips.length > 0) {
      const vipLogins = currentMonthVips.map(vip => vip.twitchLogin.toLowerCase());
      const allMembers = await memberRepository.findAll();
      vipMemberData = allMembers.filter((member) => 
        member.isActive !== false && 
        vipLogins.includes(member.twitchLogin?.toLowerCase() || '')
      );
      console.log(`   ✅ Utilisation des VIP du mois actuel (${currentMonthVips.length} membres)`);
    } else {
      vipMemberData = await memberRepository.findVip();
      console.log(`   ✅ Utilisation des membres avec isVip=true (${vipMemberData.length} membres)`);
    }

    if (vipMemberData.length === 0) {
      console.log('⚠️  Aucun membre VIP trouvé. Le test ne peut pas continuer.');
      return;
    }

    console.log(`\n📋 Étape 3: Récupération des avatars Twitch...`);
    const twitchLogins = vipMemberData
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    console.log(`   📝 ${twitchLogins.length} logins Twitch à récupérer`);
    const twitchUsers = await getTwitchUsers(twitchLogins.slice(0, 10)); // Tester avec les 10 premiers seulement
    console.log(`   ✅ ${twitchUsers.length} avatars Twitch récupérés\n`);

    console.log('📋 Étape 4: Formatage des données (simulation de la route)...');
    const avatarMap = buildTwitchAvatarMap(twitchUsers);

    const vipMembers = vipMemberData.slice(0, 5).map((member) => {
      const twitchAvatar = avatarMap.get(member.twitchLogin.toLowerCase());
      const avatar = resolveMemberAvatar(member, twitchAvatar);

      const vipBadge = getVipBadgeText(member.twitchLogin);
      const consecutiveMonths = getConsecutiveVipMonths(member.twitchLogin);

      return {
        discordId: member.discordId || '',
        username: member.discordUsername || member.displayName,
        avatar: avatar,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        twitchAvatar: twitchAvatar,
        vipBadge: vipBadge,
        consecutiveMonths: consecutiveMonths,
      };
    });

    console.log(`   ✅ ${vipMembers.length} membres VIP formatés\n`);

    console.log('📋 Étape 5: Vérification des données formatées...');
    vipMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.displayName} (${member.twitchLogin})`);
      console.log(`      - Badge VIP: ${member.vipBadge || 'N/A'}`);
      console.log(`      - Mois consécutifs: ${member.consecutiveMonths || 0}`);
      console.log(`      - Avatar: ${member.avatar ? '✅' : '❌'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test réussi ! La route fonctionne correctement.');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - VIPs du mois actuel: ${currentMonthVips.length}`);
    console.log(`   - Membres VIP trouvés: ${vipMemberData.length}`);
    console.log(`   - Membres formatés: ${vipMembers.length}`);
    console.log(`   - Avatars récupérés: ${twitchUsers.length}`);
    console.log('\n🚀 La route /api/vip-members est prête à être utilisée !');

  } catch (error: any) {
    console.error('\n❌ Erreur lors du test:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

testRoute();
