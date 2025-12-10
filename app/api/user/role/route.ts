import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllMemberData } from '@/lib/memberData';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ hasAdminAccess: false, role: null });
    }

    const memberData = getAllMemberData();
    const member = memberData.find(m => m.discordId === userId);

    if (!member) {
      return NextResponse.json({ hasAdminAccess: false, role: null });
    }

    const role = member.role;
    // Admin, Admin Adjoint, Mentor, ou Staff (Junior)
    const allowedRoles = ["Admin", "Admin Adjoint", "Mentor", "Staff"];
    const hasAdminAccess = allowedRoles.includes(role);

    return NextResponse.json({ 
      hasAdminAccess,
      role,
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ hasAdminAccess: false, role: null });
  }
}

