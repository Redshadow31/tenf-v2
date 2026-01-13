import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BLOB_STORE = "tenf-discours-content";
const BLOB_KEY = "discours-content";

function isNetlify(): boolean {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  return false;
}

async function loadFromBlob(): Promise<Record<string, any> | null> {
  try {
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Erreur lors du chargement depuis Blob:", error);
  }
  return null;
}

async function saveToBlob(data: Record<string, any>): Promise<void> {
  try {
    const store = getStore(BLOB_STORE);
    await store.set(BLOB_KEY, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans Blob:", error);
  }
}

function loadFromFile(): Record<string, any> | null {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "discours-content.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Erreur lors du chargement depuis fichier:", error);
  }
  return null;
}

function saveToFile(data: Record<string, any>): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, "discours-content.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans fichier:", error);
  }
}

/**
 * GET - Récupère le contenu du guide
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partie = searchParams.get("partie");

    let content: Record<string, any> | null = null;

    if (isNetlify()) {
      content = await loadFromBlob();
    } else {
      content = loadFromFile();
    }

    if (!content) {
      return NextResponse.json({ content: null });
    }

    if (partie) {
      return NextResponse.json({ content: content[partie] || null });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching discours content:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarde le contenu modifié d'une partie
 */
export async function POST(request: NextRequest) {
  try {
    const { getCurrentAdmin } = await import("@/lib/adminAuth");
    const { hasAdminDashboardAccessAsync } = await import("@/lib/adminAccessCheck");
    
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!(await hasAdminDashboardAccessAsync(admin.id))) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { partie, slideId, field, value } = body;

    if (!partie || !slideId || !field || value === undefined) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    let content: Record<string, any> = {};

    // Charger le contenu existant
    if (isNetlify()) {
      const existing = await loadFromBlob();
      if (existing) {
        content = existing;
      }
    } else {
      const existing = loadFromFile();
      if (existing) {
        content = existing;
      }
    }

    // Initialiser la structure si nécessaire
    if (!content[partie]) {
      content[partie] = {};
    }
    if (!content[partie][slideId]) {
      content[partie][slideId] = {};
    }

    // Mettre à jour le champ
    content[partie][slideId][field] = value;
    content[partie][slideId].updatedAt = new Date().toISOString();
    content[partie][slideId].updatedBy = admin.id;

    // Sauvegarder
    if (isNetlify()) {
      await saveToBlob(content);
    } else {
      saveToFile(content);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving discours content:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

