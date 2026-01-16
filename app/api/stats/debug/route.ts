import { NextResponse } from 'next/server';
import { loadAdminDataFromStorage } from '@/lib/memberData';

/**
 * GET - Endpoint de debug pour inspecter les données du Blob
 * TEMPORAIRE - À supprimer après debug
 */
export async function GET() {
  try {
    const adminData = await loadAdminDataFromStorage();
    const allAdminMembers = Object.values(adminData);
    
    // Analyser les données
    const analysis = {
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
