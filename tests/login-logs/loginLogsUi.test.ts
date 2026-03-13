import test from "node:test";
import assert from "node:assert/strict";
import { buildRealtimeQuery, periodToDateRange } from "@/lib/ui/loginLogsUi";

test("periodToDateRange retourne une fenêtre valide", () => {
  const range = periodToDateRange("7d");
  assert.ok(new Date(range.startDate).getTime() < new Date(range.endDate).getTime());
});

test("buildRealtimeQuery filtre uniquement les champs fournis", () => {
  const query = buildRealtimeQuery({
    connectionType: "discord",
    country: "FR",
    userSearch: "nexou",
  });
  const params = new URLSearchParams(query);
  assert.equal(params.get("connectionType"), "discord");
  assert.equal(params.get("country"), "FR");
  assert.equal(params.get("userSearch"), "nexou");
});
