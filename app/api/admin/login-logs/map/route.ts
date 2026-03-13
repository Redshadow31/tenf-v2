import { NextRequest } from "next/server";
import {
  handleGetLoginLogsMap,
  loginLogsMapRouteDeps,
} from "@/lib/services/adminLoginLogsRouteHandlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return handleGetLoginLogsMap(request, loginLogsMapRouteDeps);
}
