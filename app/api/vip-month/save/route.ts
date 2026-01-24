import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORE_NAME = 'tenf-vip-month';

interface VipMonthData {
  month: string; // YYYY-MM
  vipLogins: string[]; // Liste des logins Twitch VIP pour ce mois
  savedAt: string; // ISO timestamp
  savedBy: string; // Discord ID de l'admin
}

function isNetlify(): boolean {
  try {
    // Tester si getStore est disponible (dynamique import)
    return !!process.env.NETLIFY || !!process.env.NETLIFY_DEV || typeof window === 'undefined';
  } catch {
    return false;
  }
}

async function getVipMonthStore() {
  try {
    if (isNetlify()) {
      const { getStore } = await import('@netlify/blobs');
      return getStore(STORE_NAME);
    }
  } catch (error) {
    console.warn('[VIP Month] Blobs non disponible, utilisation du système de fichiers:', error);
  }
  return null;
}

/**
 * POST - Sauvegarde les VIP du mois dans un blob spécial
 * Body: { month: string, vipLogins: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, "write")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { month, vipLogins } = body;

    if (!month || !Array.isArray(vipLogins)) {
      return NextResponse.json(
        { error: "month (string) et vipLogins (array) sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const vipMonthData: VipMonthData = {
      month,
      vipLogins: vipLogins.map((login: string) => login.toLowerCase()),
      savedAt: new Date().toISOString(),
      savedBy: admin.discordId,
    };

    try {
      const store = await getVipMonthStore();
      if (store) {
        await store.set(`${month}.json`, JSON.stringify(vipMonthData, null, 2));
      } else {
        // Développement local
        const dataDir = path.join(process.cwd(), 'data', 'vip-month');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const filePath = path.join(dataDir, `${month}.json`);
        fs.writeFileSync(filePath, JSON.stringify(vipMonthData, null, 2), 'utf-8');
      }

      return NextResponse.json({
        success: true,
        message: `VIP du mois ${month} enregistrés avec succès`,
        count: vipLogins.length,
        month,
      });
    } catch (error) {
      console.error(`[VIP Month Save] Erreur sauvegarde pour ${month}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('[API VIP Month Save] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère les VIP du mois depuis le blob
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.id, "read")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    try {
      let vipMonthData: VipMonthData | null = null;

      const store = await getVipMonthStore();
      if (store) {
        const data = await store.get(`${month}.json`, { type: 'json' }).catch(() => null);
        vipMonthData = data as VipMonthData | null;
      } else {
        // Développement local
        const dataDir = path.join(process.cwd(), 'data', 'vip-month');
        const filePath = path.join(dataDir, `${month}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          vipMonthData = JSON.parse(content);
        }
      }

      if (!vipMonthData) {
        return NextResponse.json({
          month,
          vipLogins: [],
          savedAt: null,
        });
      }

      return NextResponse.json(vipMonthData);
    } catch (error) {
      console.error(`[VIP Month GET] Erreur récupération pour ${month}:`, error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erreur serveur' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API VIP Month GET] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

