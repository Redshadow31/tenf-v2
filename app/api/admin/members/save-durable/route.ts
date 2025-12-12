import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminDashboardAccess } from "@/lib/admin";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";
import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

/**
 * Détecte si on est sur Netlify
 */
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.VERCEL === undefined
  );
}

/**
 * POST - Sauvegarde les données des membres de façon durable
 * Utilise Netlify Blobs en production, système de fichiers en développement local
 * Accessible aux fondateurs, admins et admin adjoints
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Charger les données pour vérifier le rôle dans memberData
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const userMember = allMembers.find(m => m.discordId === admin.id);
    const userRole = userMember?.role;

    // Vérifier l'accès : Fondateurs, Admins, ou Admin Adjoint
    if (!hasAdminDashboardAccess(admin.id, userRole)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs, admins et admin adjoints." },
        { status: 403 }
      );
    }

    // Charger les données actuelles
    await loadMemberDataFromStorage();
    const memberData = getAllMemberData();

    // Convertir en format sérialisable
    const serializableData: Record<string, any> = {};
    for (const [key, member] of Object.entries(memberData)) {
      serializableData[key] = {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
      };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let backupLocation = "";
    let membersLocation = "";

    if (isNetlify()) {
      // Utiliser Netlify Blobs en production
      try {
        const store = getStore("tenf-members");
        const backupStore = getStore("tenf-members-backups");
        
        // Sauvegarder les données principales
        await store.set("members-data", JSON.stringify(serializableData, null, 2));
        membersLocation = "Netlify Blobs: tenf-members/members-data";
        
        // Créer une sauvegarde avec timestamp
        const backupKey = `members-backup-${timestamp}`;
        await backupStore.set(backupKey, JSON.stringify(serializableData, null, 2));
        backupLocation = `Netlify Blobs: tenf-members-backups/${backupKey}`;
      } catch (blobError: any) {
        console.error("[Save Durable] Erreur Netlify Blobs:", blobError);
        return NextResponse.json(
          { error: `Erreur lors de la sauvegarde dans Netlify Blobs: ${blobError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Utiliser le système de fichiers en développement local
      try {
        const DATA_DIR = path.join(process.cwd(), 'data');
        const BACKUP_DIR = path.join(DATA_DIR, 'backups');
        const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
        const BACKUP_FILE = path.join(BACKUP_DIR, `members-backup-${timestamp}.json`);

        // Créer les dossiers s'ils n'existent pas
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(BACKUP_DIR)) {
          fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Créer une sauvegarde
        if (Object.keys(serializableData).length > 0) {
          fs.writeFileSync(BACKUP_FILE, JSON.stringify(serializableData, null, 2), 'utf-8');
        }

        // Sauvegarder les données
        fs.writeFileSync(MEMBERS_FILE, JSON.stringify(serializableData, null, 2), 'utf-8');
        
        backupLocation = BACKUP_FILE;
        membersLocation = MEMBERS_FILE;
      } catch (fileError: any) {
        console.error("[Save Durable] Erreur système de fichiers:", fileError);
        return NextResponse.json(
          { error: `Erreur lors de la sauvegarde dans le système de fichiers: ${fileError.message}` },
          { status: 500 }
        );
      }
    }

    // Statistiques
    const stats = {
      total: Object.keys(serializableData).length,
      byRole: {} as Record<string, number>,
      withDiscord: 0,
      withManualChanges: 0,
      withDescription: 0,
    };

    for (const member of Object.values(serializableData)) {
      const m = member as any;
      stats.byRole[m.role] = (stats.byRole[m.role] || 0) + 1;
      if (m.discordId) stats.withDiscord++;
      if (m.roleManuallySet) stats.withManualChanges++;
      if (m.description) stats.withDescription++;
    }

    return NextResponse.json({
      success: true,
      message: `Données sauvegardées avec succès ${isNetlify() ? 'dans Netlify Blobs' : 'dans le système de fichiers'}`,
      stats,
      backupFile: backupLocation,
      membersFile: membersLocation,
      environment: isNetlify() ? "production" : "development",
    });
  } catch (error: any) {
    console.error("[Save Durable] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

