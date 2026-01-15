import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, pin } = await req.json();

    // Vérification du nom d'utilisateur
    if (username !== process.env.ADMIN_USERNAME) {
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    // Vérification du mot de passe
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      console.error("ADMIN_PASSWORD_HASH not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const passwordOk = bcrypt.compareSync(password, passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    // Vérification du PIN
    if (pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    // Auth OK → créer une session simple avec cookie
    const response = NextResponse.json({ success: true });
    
    // Créer un cookie de session admin sécurisé
    response.cookies.set("admin_secure_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


















