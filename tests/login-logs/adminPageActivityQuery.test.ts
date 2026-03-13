import test from "node:test";
import assert from "node:assert/strict";
import { parseAdminPageActivityFilters } from "@/lib/services/adminPageActivityQuery";

test("parseAdminPageActivityFilters applique les valeurs par defaut mensuelles", () => {
  const parsed = parseAdminPageActivityFilters(new URLSearchParams());
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 25);
  assert.equal(parsed.authState, "all");
  assert.ok(parsed.startDate);
  assert.ok(parsed.endDate);
});

test("parseAdminPageActivityFilters nettoie les filtres et bornes", () => {
  const parsed = parseAdminPageActivityFilters(
    new URLSearchParams({
      page: "-4",
      limit: "9999",
      zone: "admin",
      authState: "authenticated",
      eventType: "click",
      path: " /admin/audit-logs ",
      userSearch: " Nexou ",
    })
  );

  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 200);
  assert.equal(parsed.zone, "admin");
  assert.equal(parsed.authState, "authenticated");
  assert.equal(parsed.eventType, "click");
  assert.equal(parsed.path, "/admin/audit-logs");
  assert.equal(parsed.userSearch, "Nexou");
});
