import {
  handleGetLoginLogsRealtime,
  loginLogsRealtimeRouteDeps,
} from "@/lib/services/adminLoginLogsRouteHandlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  return handleGetLoginLogsRealtime(request, loginLogsRealtimeRouteDeps);
}
