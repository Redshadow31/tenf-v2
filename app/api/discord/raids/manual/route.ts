import { NextRequest, NextResponse } from 'next/server';
import { loadMonthlyRaids, saveMonthlyRaids, getMonthKey, getCurrentMonthKey } from '@/lib/raids';
import { memberRepository } from '@/lib/repositories';

/**
 * POST - Ajoute un raid manuellement
 * Body: { raiderTwitchLogin: string, targetTwitchLogin: string, month?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raiderTwitchLogin, targetTwitchLogin, month } = body;
    
    if (!raiderTwitchLogin || !targetTwitchLogin) {
      return NextResponse.json(
        { error: "raiderTwitchLogin et targetTwitchLogin sont requis" },
        { status: 400 }
      );
    }
    
    const allMembers = await memberRepository.findAll(1000, 0);
    // Trouver les membres
    const raider = allMembers.find(m => m.twitchLogin.toLowerCase() === raiderTwitchLogin.toLowerCase());
    const target = allMembers.find(m => m.twitchLogin.toLowerCase() === targetTwitchLogin.toLowerCase());
    
    if (!raider || !raider.discordId) {
      return NextResponse.json(
        { error: `Raider non trouvé: ${raiderTwitchLogin}` },
        { status: 404 }
      );
    }
    
    if (!target || !target.discordId) {
      return NextResponse.json(
        { error: `Cible non trouvée: ${targetTwitchLogin}` },
        { status: 404 }
      );
    }
    
    if (raider.discordId === target.discordId) {
      return NextResponse.json(
        { error: "Le raider et la cible ne peuvent pas être la même personne" },
        { status: 400 }
      );
    }
    
    // Déterminer le monthKey
    let monthKey: string | undefined;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        }
      }
    }
    
    if (!monthKey) {
      monthKey = getCurrentMonthKey();
    }
    
    // Charger les raids
    const raids = await loadMonthlyRaids(monthKey);
    
    // Initialiser les stats si nécessaire
    if (!raids[raider.discordId]) {
      raids[raider.discordId] = {
        done: 0,
        received: 0,
        targets: {},
        raids: [],
        receivedRaids: [],
      };
    }
    
    if (!raids[target.discordId]) {
      raids[target.discordId] = {
        done: 0,
        received: 0,
        targets: {},
        raids: [],
        receivedRaids: [],
      };
    }
    
    // S'assurer que les tableaux existent
    if (!raids[raider.discordId].raids) {
      raids[raider.discordId].raids = [];
    }
    if (!raids[target.discordId].receivedRaids) {
      raids[target.discordId].receivedRaids = [];
    }
    
    // Créer l'entrée de raid manuel
    const raidEntry = {
      targetDiscordId: target.discordId,
      timestamp: new Date().toISOString(),
      source: "manual" as const,
    };
    
    const receivedRaidEntry = {
      targetDiscordId: raider.discordId,
      timestamp: new Date().toISOString(),
      source: "manual" as const,
    };
    
    // Incrémenter les compteurs
    raids[raider.discordId].done++;
    raids[raider.discordId].targets[target.discordId] = (raids[raider.discordId].targets[target.discordId] || 0) + 1;
    raids[raider.discordId].raids.push(raidEntry);
    
    raids[target.discordId].received++;
    raids[target.discordId].receivedRaids.push(receivedRaidEntry);
    
    // Sauvegarder
    await saveMonthlyRaids(raids, monthKey);
    
    return NextResponse.json({
      success: true,
      message: "Raid ajouté avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du raid manuel:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un raid manuellement
 * Body: { raiderTwitchLogin: string, raidIndex: number, isReceived: boolean, month?: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { raiderTwitchLogin, raidIndex, isReceived, month } = body;
    
    if (!raiderTwitchLogin || raidIndex === undefined) {
      return NextResponse.json(
        { error: "raiderTwitchLogin et raidIndex sont requis" },
        { status: 400 }
      );
    }
    
    const allMembers = await memberRepository.findAll(1000, 0);
    const member = allMembers.find(m => m.twitchLogin.toLowerCase() === raiderTwitchLogin.toLowerCase());
    
    if (!member || !member.discordId) {
      return NextResponse.json(
        { error: `Membre non trouvé: ${raiderTwitchLogin}` },
        { status: 404 }
      );
    }
    
    // Déterminer le monthKey
    let monthKey: string | undefined;
    if (month) {
      const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        }
      }
    }
    
    if (!monthKey) {
      monthKey = getCurrentMonthKey();
    }
    
    // Charger les raids
    const raids = await loadMonthlyRaids(monthKey);
    const memberRaids = raids[member.discordId];
    
    if (!memberRaids) {
      return NextResponse.json(
        { error: "Aucun raid trouvé pour ce membre" },
        { status: 404 }
      );
    }
    
    // S'assurer que les tableaux existent
    if (!memberRaids.raids) {
      memberRaids.raids = [];
    }
    if (!memberRaids.receivedRaids) {
      memberRaids.receivedRaids = [];
    }
    
    if (isReceived) {
      // Supprimer un raid reçu
      if (raidIndex >= memberRaids.receivedRaids.length) {
        return NextResponse.json(
          { error: "Index de raid invalide" },
          { status: 400 }
        );
      }
      
      const raid = memberRaids.receivedRaids[raidIndex];
      const raiderDiscordId = raid.targetDiscordId;
      
      // Retirer de la liste
      memberRaids.receivedRaids.splice(raidIndex, 1);
      memberRaids.received--;
      
      // Décrémenter le compteur du raider
      if (raids[raiderDiscordId]) {
        raids[raiderDiscordId].done = Math.max(0, raids[raiderDiscordId].done - 1);
        if (raids[raiderDiscordId].targets[member.discordId]) {
          raids[raiderDiscordId].targets[member.discordId] = Math.max(0, raids[raiderDiscordId].targets[member.discordId] - 1);
          if (raids[raiderDiscordId].targets[member.discordId] === 0) {
            delete raids[raiderDiscordId].targets[member.discordId];
          }
        }
        // Retirer de la liste des raids du raider
        if (raids[raiderDiscordId].raids) {
          const index = raids[raiderDiscordId].raids.findIndex(r => r.targetDiscordId === member.discordId);
          if (index !== -1) {
            raids[raiderDiscordId].raids.splice(index, 1);
          }
        }
      }
    } else {
      // Supprimer un raid fait
      if (raidIndex >= memberRaids.raids.length) {
        return NextResponse.json(
          { error: "Index de raid invalide" },
          { status: 400 }
        );
      }
      
      const raid = memberRaids.raids[raidIndex];
      const targetDiscordId = raid.targetDiscordId;
      
      // Retirer de la liste
      memberRaids.raids.splice(raidIndex, 1);
      memberRaids.done = Math.max(0, memberRaids.done - 1);
      
      if (memberRaids.targets[targetDiscordId]) {
        memberRaids.targets[targetDiscordId] = Math.max(0, memberRaids.targets[targetDiscordId] - 1);
        if (memberRaids.targets[targetDiscordId] === 0) {
          delete memberRaids.targets[targetDiscordId];
        }
      }
      
      // Décrémenter le compteur de la cible
      if (raids[targetDiscordId]) {
        raids[targetDiscordId].received = Math.max(0, raids[targetDiscordId].received - 1);
        // Retirer de la liste des raids reçus de la cible
        if (raids[targetDiscordId].receivedRaids) {
          const index = raids[targetDiscordId].receivedRaids.findIndex(r => r.targetDiscordId === member.discordId);
          if (index !== -1) {
            raids[targetDiscordId].receivedRaids.splice(index, 1);
          }
        }
      }
    }
    
    // Sauvegarder
    await saveMonthlyRaids(raids, monthKey);
    
    return NextResponse.json({
      success: true,
      message: "Raid supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du raid:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

