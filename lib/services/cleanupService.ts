import { purgeConnectionLogs } from "@/lib/connectionLogs";

const DAY_MS = 24 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __tenfConnectionCleanupStarted: boolean | undefined;
}

export async function cleanupOldConnectionLogs(): Promise<void> {
  await purgeConnectionLogs(true);
}

export function ensureConnectionLogsCleanupScheduler(): void {
  if (typeof globalThis === "undefined") return;
  if (globalThis.__tenfConnectionCleanupStarted) return;
  globalThis.__tenfConnectionCleanupStarted = true;

  const timer = setInterval(() => {
    cleanupOldConnectionLogs().catch((error) => {
      console.error("[cleanupService] cleanupOldConnectionLogs error:", error);
    });
  }, DAY_MS);
  if (typeof (timer as NodeJS.Timeout).unref === "function") {
    (timer as NodeJS.Timeout).unref();
  }
}
