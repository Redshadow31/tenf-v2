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

test("normalizeRaisedCentsVsMajorGoal : convertit 162403 avec objectif 1 M€", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(162_403, 1_000_000), 1624.03);
});

test("normalizeRaisedCentsVsMajorGoal : ne pas convertir un montant euros coherent (50125 € / 60 k€)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(50_125, 60_000), 50_125);
});

test("normalizeRaisedCentsVsMajorGoal : montant entier euros > objectif mais pas des centimes", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(120_000, 100_000), 120_000);
});

test("normalizeRaisedCentsVsMajorGoal : 271903 centimes vs objectif 100 k€ (brut > 1,12× objectif)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(271_903, 100_000), 2719.03);
});

test("normalizeRaisedCentsVsMajorGoal : ne pas convertir 250000 € réels / 100 k€ (multiple rond)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(250_000, 100_000), 250_000);
});

test("normalizeRaisedCentsVsMajorGoal : 271900 centimes (cents .00) vs 100 k€", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(271_900, 100_000), 2719);
});

test("normalizeRaisedCentsVsMajorGoal : 272503 centimes vs objectif API 10 k€ (palier Streamlabs)", () => {
  assert.equal(normalizeRaisedCentsVsMajorGoal(272_503, 10_000), 2725.03);
});

test("withDisplayGoal : 272503 centimes quand objectif campagne et palier sont 10 k€", () => {
  const out = withDisplayGoal({ raised: 272_503, currency: "EUR", apiGoal: 10_000 }, 10_000);
  assert.equal(out.raised, 2725.03);
  assert.equal(out.displayGoal, 10_000);
});

test("withDisplayGoal : palier 10 k€ corrige 107125 quand l objectif API est 200 k€", () => {
  const out = withDisplayGoal({ raised: 107_125, currency: "EUR", apiGoal: 200_000 }, 10_000);
  assert.equal(out.raised, 1071.25);
  assert.equal(out.displayGoal, 10_000);
});

test("withDisplayGoal : corrige aussi les montants en centimes finissant par 00", () => {
  const out = withDisplayGoal({ raised: 107_100, currency: "EUR", apiGoal: 200_000 }, 10_000);
  assert.equal(out.raised, 1071);
});

test("withDisplayGoal : corrige 162403 avec palier 10 k€", () => {
  const out = withDisplayGoal({ raised: 162_403, currency: "EUR", apiGoal: 1_000_000 }, 10_000);
  assert.equal(out.raised, 1624.03);
});

test("withDisplayGoal : ne pas toucher 60000 € avec palier 10 k€", () => {
  const out = withDisplayGoal({ raised: 60_000, currency: "EUR", apiGoal: 200_000 }, 10_000);
  assert.equal(out.raised, 60_000);
});
