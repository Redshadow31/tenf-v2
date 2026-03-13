import { NextRequest } from "next/server";
import {
  handleGetLoginLogsMembersDaily,
  loginLogsMembersDailyRouteDeps,
} from "@/lib/services/adminLoginLogsRouteHandlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return handleGetLoginLogsMembersDaily(request, loginLogsMembersDailyRouteDeps);
}
