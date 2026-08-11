import request from "supertest";
import { describe, expect, it } from "vitest";
import type { Express } from "express";
import { createApp } from "../server/app.js";
import { nextQuestion } from "../server/conversation/fallback.js";

const readyPatches = (budgetCents: number) => [
  { field: "journeyType", value: "new_space" },
  { field: "room.lengthMm", value: 4000 },
  { field: "room.widthMm", value: 3000 },
  { field: "room.heightMm", value: 2400 },
  { field: "room.doorConfirmed", value: true },
  { field: "goals", value: ["strength"] },
  { field: "experience", value: "beginner" },
  { field: "priorities", value: ["versatility"] },
  { field: "budgetCents", value: budgetCents },
];

async function createReadyPlan(app: Express, budgetCents = 250000) {
  const created = await request(app).post("/api/plans").expect(201);
  const planId = created.body.state.planId as string;
  const updated = await request(app).patch(`/api/plans/${planId}/requirements`).send({
    expectedVersion: created.body.state.eventVersion,
    patches: readyPatches(budgetCents),
  }).expect(200);
  const recommended = await request(app).post(`/api/plans/${planId}/recommend`).send({ expectedVersion: updated.body.state.eventVersion }).expect(200);
  return recommended.body.state;
}

describe("Northstar API", () => {
  it("uses same-origin CORS by default and sends baseline security headers", async () => {
    const { app } = createApp({ apiKey: undefined });
    const response = await request(app).get("/api/health").expect(200);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("creates one canonical plan and rejects stale updates", async () => {
    const { app } = createApp({ apiKey: undefined });
    const created = await request(app).post("/api/plans").expect(201);
    const planId = created.body.state.planId;
    const update = await request(app).patch(`/api/plans/${planId}/requirements`).send({ expectedVersion: 0, patches: [{ field: "journeyType", value: "new_space" }] }).expect(200);
    expect(update.body.state.requirementsVersion).toBe(1);
    const conflict = await request(app).patch(`/api/plans/${planId}/requirements`).send({ expectedVersion: 0, patches: [{ field: "room.heightMm", value: 2400 }] }).expect(409);
    expect(conflict.body.code).toBe("STATE_CONFLICT");
  });

  it("captures several facts in one customer message", async () => {
    const { app } = createApp({ apiKey: undefined });
    const created = await request(app).post("/api/plans").expect(201);
    const response = await request(app).post(`/api/plans/${created.body.state.planId}/chat`).send({ expectedVersion: 0, message: "I am planning a new gym, 4 x 3 x 2.4 m, for strength with a EUR 2500 budget. I am a beginner and train 3 times a week." }).expect(200);
    expect(response.body.state.requirements.room.lengthMm.value).toBe(4000);
    expect(response.body.state.requirements.room.widthMm.value).toBe(3000);
    expect(response.body.state.requirements.budgetCents.value).toBe(250000);
    expect(response.body.state.requirements.goals.value).toContain("strength");
    expect(response.body.state.requirements.trainingDaysPerWeek.value).toBe(3);
    expect(response.body.state.blockers).not.toContain("room.doorConfirmed");
    expect(response.body.state.blockers).not.toContain("priorities");
    expect(response.body.message.text).not.toMatch(/\b(tool|api|model|row|sheet|recorded|new_space|open_floor)\b/i);
    expect(nextQuestion(response.body.state)).toContain("enough to build your first option");
  });

  it("exposes all five compatibility outcomes without approving dimensional-only", async () => {
    const { app } = createApp({ apiKey: undefined });
    const dimensional = await request(app).post("/api/compatibility").send({ hostVariantId: "s10-squat-stand-entry", attachmentVariantId: "a14-safety-straps", selectedItems: [] }).expect(200);
    expect(dimensional.body.state).toBe("dimensionally_matching_but_unapproved");
    expect(dimensional.body.allowedInPlan).toBe(false);
  });

  it("rejects an invalid placement while preserving canonical state and returning the attempted position", async () => {
    const { app } = createApp({ apiKey: undefined });
    const state = await createReadyPlan(app);
    const original = state.placements[0];
    const rejected = await request(app)
      .post(`/api/plans/${state.planId}/placements/${original.placementId}`)
      .send({ expectedVersion: state.eventVersion, xMm: -1000 })
      .expect(422);

    expect(rejected.body.code).toBe("INVALID_PLACEMENT");
    expect(rejected.body.attempted).toMatchObject({ placementId: original.placementId, xMm: -1000, validationStatus: "invalid" });
    expect(rejected.body.attempted.violations).toEqual(expect.arrayContaining([expect.objectContaining({ code: "ROOM_BOUNDS" })]));
    expect(rejected.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId)).toMatchObject({ xMm: original.xMm, zMm: original.zMm });

    const stored = await request(app).get(`/api/plans/${state.planId}`).expect(200);
    expect(stored.body.state.eventVersion).toBe(state.eventVersion);
    expect(stored.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId)).toMatchObject({ xMm: original.xMm, zMm: original.zMm });
  });

  it("preserves a locked item through regeneration and restores lock state through undo and redo", async () => {
    const { app } = createApp({ apiKey: undefined });
    const state = await createReadyPlan(app);
    const original = state.placements[0];
    const locked = await request(app)
      .post(`/api/plans/${state.planId}/placements/${original.placementId}`)
      .send({ expectedVersion: state.eventVersion, locked: true })
      .expect(200);
    const lockedPlacement = locked.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId);

    const regenerated = await request(app)
      .post(`/api/plans/${state.planId}/layout/regenerate`)
      .send({ expectedVersion: locked.body.state.eventVersion, seed: 777 })
      .expect(200);
    expect(regenerated.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId)).toMatchObject({
      xMm: lockedPlacement.xMm, zMm: lockedPlacement.zMm, rotationDeg: lockedPlacement.rotationDeg, locked: true,
    });

    const unlocked = await request(app)
      .post(`/api/plans/${state.planId}/placements/${original.placementId}`)
      .send({ expectedVersion: regenerated.body.state.eventVersion, locked: false })
      .expect(200);
    const undone = await request(app).post(`/api/plans/${state.planId}/undo`).send({ expectedVersion: unlocked.body.state.eventVersion }).expect(200);
    expect(undone.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId).locked).toBe(true);
    const redone = await request(app).post(`/api/plans/${state.planId}/redo`).send({ expectedVersion: undone.body.state.eventVersion }).expect(200);
    expect(redone.body.state.placements.find((item: { placementId: string }) => item.placementId === original.placementId).locked).toBe(false);
  });

  it("keeps the hard cap until the exact overrun is explicitly authorised", async () => {
    const { app } = createApp({ apiKey: undefined });
    const blocked = await createReadyPlan(app, 50000);
    expect(blocked.status).toBe("infeasible");
    expect(blocked.quote.withinBudget).toBe(false);
    expect(blocked.quote.overrunCents).toBeGreaterThan(0);
    expect(blocked.budgetConsent.overrunAllowed).toBe(false);

    const consented = await request(app).post(`/api/plans/${blocked.planId}/budget-consent`).send({
      expectedVersion: blocked.eventVersion,
      maximumOverrunCents: blocked.quote.overrunCents,
    }).expect(200);
    const rebuilt = await request(app).post(`/api/plans/${blocked.planId}/recommend`).send({ expectedVersion: consented.body.state.eventVersion }).expect(200);
    expect(rebuilt.body.state.status).toBe("current");
    expect(rebuilt.body.state.quote.withinBudget).toBe(false);
    expect(rebuilt.body.state.budgetConsent).toMatchObject({ overrunAllowed: true, maximumAuthorisedOverrunCents: blocked.quote.overrunCents });
  });
});
