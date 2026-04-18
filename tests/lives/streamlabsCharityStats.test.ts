import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRaisedCentsVsMajorGoal,
  withDisplayGoal,
} from "@/lib/lives/streamlabsCharityStats";

test("normalizeRaisedCentsVsMajorGoal : centimes vs objectif 100 k€ (brut > objectif)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(107_125, 100_000), 1071.25);
});

test("normalizeRaisedCentsVsMajorGoal : centimes vs objectif 1 M€ (brut < objectif)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(107_125, 1_000_000), 1071.25);
});

test("normalizeRaisedCentsVsMajorGoal : ne pas convertir un montant euros coherent (50125 € / 60 k€)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(50_125, 60_000), 50_125);
});

test("normalizeRaisedCentsVsMajorGoal : montant entier euros > objectif mais pas des centimes", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(120_000, 100_000), 120_000);
});

test("withDisplayGoal : palier 10 k€ corrige 107125 quand l objectif API est 200 k€", () => {
  const out = withDisplayGoal({ raised: 107_125, currency: "EUR", apiGoal: 200_000 }, 10_000);
  assert.equal(out.raised, 1071.25);
  assert.equal(out.displayGoal, 10_000);
});

test("withDisplayGoal : ne pas toucher 60000 € avec palier 10 k€", () => {
  const out = withDisplayGoal({ raised: 60_000, currency: "EUR", apiGoal: 200_000 }, 10_000);
  assert.equal(out.raised, 60_000);
});
