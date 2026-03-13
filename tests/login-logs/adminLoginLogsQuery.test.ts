import test from "node:test";
import assert from "node:assert/strict";
import { parseAdminLoginLogsFilters } from "@/lib/services/adminLoginLogsQuery";

test("parseAdminLoginLogsFilters borne page/limit et nettoie country", () => {
  const params = new URLSearchParams({
    page: "-5",
    limit: "9999",
    country: "fr",
  });
  const parsed = parseAdminLoginLogsFilters(params);
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 200);
  assert.equal(parsed.country, "FR");
});

test("parseAdminLoginLogsFilters invalide dates et type connexion", () => {
  const params = new URLSearchParams({
    startDate: "not-a-date",
    endDate: "2026-01-10T10:00:00.000Z",
    connectionType: "unknown",
  });
  const parsed = parseAdminLoginLogsFilters(params);
  assert.equal(parsed.startDate, undefined);
  assert.equal(parsed.endDate, "2026-01-10T10:00:00.000Z");
  assert.equal(parsed.connectionType, undefined);
});

test("parseAdminLoginLogsFilters inverse start/end si incohérent", () => {
  const params = new URLSearchParams({
    startDate: "2026-03-10T00:00:00.000Z",
    endDate: "2026-03-01T00:00:00.000Z",
  });
  const parsed = parseAdminLoginLogsFilters(params);
  assert.equal(parsed.startDate, "2026-03-01T00:00:00.000Z");
  assert.equal(parsed.endDate, "2026-03-01T00:00:00.000Z");
});
