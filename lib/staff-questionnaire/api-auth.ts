import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, type AuthenticatedAdmin } from "@/lib/requireAdmin";
import {
  canAccessStaffQuestionnaire,
  canEditQuestionnaireAnalysis,
  canExportStaffQuestionnaire,
  canManageStaffQuestionnaireAdmin,
} from "./permissions";

export async function requireModeratorQuestionnaireAuth(): Promise<
  AuthenticatedAdmin | NextResponse
> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canAccessStaffQuestionnaire(admin)) {
    return NextResponse.json({ error: "Accès réservé au staff modération" }, { status: 403 });
  }
  return admin;
}

export async function requireQuestionnaireAdminAuth(): Promise<AuthenticatedAdmin | NextResponse> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageStaffQuestionnaireAdmin(admin)) {
    return NextResponse.json({ error: "Accès réservé aux référents formation" }, { status: 403 });
  }
  return admin;
}

export async function requireQuestionnaireAnalysisAuth(): Promise<
  AuthenticatedAdmin | NextResponse
> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canEditQuestionnaireAnalysis(admin)) {
    return NextResponse.json({ error: "Droits insuffisants pour modifier l'analyse" }, { status: 403 });
  }
  return admin;
}

export async function requireQuestionnaireExportAuth(): Promise<
  AuthenticatedAdmin | NextResponse
> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canExportStaffQuestionnaire(admin)) {
    return NextResponse.json({ error: "Export non autorisé" }, { status: 403 });
  }
  return admin;
}

export function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
