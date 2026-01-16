import { NextResponse } from 'next/server';
import { loadAdminDataFromStorage, getBlobStore } from '@/lib/memberData';

/**
 * GET - Endpoint de debug pour inspecter les données du Blob
 * TEMPORAIRE - À supprimer après debug
 */
export async function GET() {
  try {
    // Tester directement le Blob avec la fonction helper
    let blobTest: any = {};
    try {
      const store = getBlobStore("tenf-admin-members");
      const data = await store.get("admin-members-data", { type: "text" });
      blobTest = {
        storeExists: !!store,
        dataExists: !!data,
        dataLength: data ? data.length : 0,
        dataPreview: data ? data.substring(0, 500) : null,
        envVars: {
          hasSiteID: !!(process.env.NETLIFY_SITE_ID || process.env.SITE_ID),
          hasToken: !!(process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN),
          isNetlify: !!(process.env.NETLIFY || process.env.NETLIFY_DEV),
        },
        error: null,
      };
    } catch (blobError: any) {
      blobTest = {
        storeExists: false,
        dataExists: false,
        error: blobError.message,
        stack: blobError.stack,
      };
    }

    const adminData = await loadAdminDataFromStorage();
    const allAdminMembers = Object.values(adminData);
    
    // Analyser les données
    const analysis = {
      blobTest,
      totalMembers: allAdminMembers.length,
      activeMembers: {
        true: allAdminMembers.filter(m => m.isActive === true).length,
        false: allAdminMembers.filter(m => m.isActive === false).length,
        undefined: allAdminMembers.filter(m => m.isActive === undefined).length,
        stringTrue: allAdminMembers.filter(m => (m as any).isActive === "true").length,
        numberOne: allAdminMembers.filter(m => (m as any).isActive === 1).length,
      },
      sampleMembers: allAdminMembers.slice(0, 20).map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        isActive: m.isActive,
        typeofIsActive: typeof m.isActive,
        role: m.role,
        deleted: (m as any).deleted,
      })),
      sampleActiveMembers: allAdminMembers
        .filter(m => m.isActive === true || (m as any).isActive === "true" || (m as any).isActive === 1)
        .slice(0, 10)
        .map(m => ({
          twitchLogin: m.twitchLogin,
          displayName: m.displayName,
          isActive: m.isActive,
          typeofIsActive: typeof m.isActive,
        })),
    };
    
    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('[Stats Debug] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load debug data', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
