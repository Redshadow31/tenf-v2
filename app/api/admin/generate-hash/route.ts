import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * Route temporaire pour générer un hash bcrypt
 * À supprimer après utilisation pour des raisons de sécurité
 */
export async function GET() {
  const password = "SuceNexou2020"; // remplace localement

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    return NextResponse.json({
      success: true,
      password: password,
      hash: hash,
      message: "Hash généré avec succès",
    });
  } catch (error) {
    console.error("Error generating hash:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération du hash",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

















