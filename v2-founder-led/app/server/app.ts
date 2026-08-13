import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import type { Door, ExistingEquipment, Placement, RequirementPatch } from "../shared/types.js";
import { CatalogueRepository } from "./catalogue/repository.js";
import { MaraOrchestrator } from "./conversation/orchestrator.js";
import { checkCompatibility } from "./domain/compatibility.js";
import { validatePlacements } from "./domain/geometry.js";
import { generateLayout } from "./domain/layout.js";
import { calculateQuote } from "./domain/quote.js";
import { addBestMatchingProduct, buildRecommendation } from "./domain/recommendation.js";
import { searchCatalogue } from "./domain/search.js";
import { applyRequirementPatches, PlanStore } from "./domain/state.js";

export interface AppOptions {
  catalogue?: CatalogueRepository;
  apiKey?: string;
  model?: string;
  origin?: string;
}

const requirementPatchSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("journeyType"), value: z.enum(["new_space", "upgrade"]) }),
  z.object({ field: z.enum(["room.widthMm", "room.lengthMm", "room.heightMm", "room.flooringBuildUpMm"]), value: z.number().int().nonnegative() }),
  z.object({ field: z.literal("room.doorConfirmed"), value: z.boolean() }),
  z.object({ field: z.enum(["goals", "priorities"]), value: z.array(z.string()).max(12) }),
  z.object({ field: z.literal("originalGoalText"), value: z.string().max(1000) }),
  z.object({ field: z.literal("experience"), value: z.enum(["beginner", "some_experience", "experienced"]) }),
  z.object({ field: z.enum(["trainingDaysPerWeek", "intendedUsers", "budgetCents"]), value: z.number().int().positive() }),
  z.object({ field: z.literal("mountingPermission"), value: z.boolean() }),
  z.object({ field: z.literal("noiseImpactPreference"), value: z.enum(["low", "normal", "not_sure"]) }),
]);

function conflictOrThrow(error: unknown, res: express.Response) {
  if (error instanceof Error && error.message === "STATE_CONFLICT") {
    res.status(409).json({ code: "STATE_CONFLICT", message: "Your plan changed while this action was being checked.", state: (error as Error & { current: unknown }).current });
    return;
  }
  throw error;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const catalogue = options.catalogue ?? new CatalogueRepository({
    sheetId: process.env.GOOGLE_SHEET_ID,
    refreshSeconds: Number(process.env.CATALOGUE_REFRESH_SECONDS ?? 60),
    maxStaleMinutes: Number(process.env.CATALOGUE_MAX_STALE_MINUTES ?? 30),
  });
  const plans = new PlanStore();
  const mara = new MaraOrchestrator(plans, catalogue, options.apiKey ?? process.env.OPENAI_API_KEY, options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-sol");

  app.disable("x-powered-by");
  app.use(cors({ origin: options.origin ?? process.env.APP_ORIGIN?.split(",") ?? false, credentials: false, methods: ["GET", "POST", "PATCH"] }));
  app.use(express.json({ limit: "64kb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  const requests = new Map<string, { count: number; reset: number }>();
  app.use("/api", (req, res, next) => {
    const key = req.ip ?? "unknown";
    const current = requests.get(key);
    const time = Date.now();
    if (!current || current.reset < time) requests.set(key, { count: 1, reset: time + 60_000 });
    else if (current.count >= 90) return res.status(429).json({ code: "RATE_LIMITED", message: "Please wait a moment before trying again." });
    else current.count += 1;
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ ok: true, catalogue: catalogue.getSnapshot().freshness, languageServiceConfigured: Boolean(options.apiKey ?? process.env.OPENAI_API_KEY) }));

  app.post("/api/plans", async (_req, res) => {
    const state = plans.create(await catalogue.refresh());
    res.status(201).json({ state, messages: mara.getHistory(state.planId) });
  });

  app.get("/api/plans/:planId", (req, res) => res.json({ state: plans.get(req.params.planId), messages: mara.getHistory(req.params.planId) }));

  app.patch("/api/plans/:planId/requirements", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), patches: z.array(requirementPatchSchema).min(1).max(20) }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => applyRequirementPatches(current, body.patches as RequirementPatch[], "control"));
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/doors", (req, res) => {
    const body = z.object({
      expectedVersion: z.number().int().nonnegative(),
      door: z.object({ doorId: z.string().default(() => randomUUID()), wall: z.enum(["north", "east", "south", "west"]), offsetMm: z.number().int().nonnegative(), widthMm: z.number().int().positive(), swing: z.enum(["inward_left", "inward_right", "outward"]) }),
    }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => {
        const next = structuredClone(current);
        next.requirements.doors.push(body.door as Door);
        next.requirements.room.doorConfirmed = { value: true, unit: null, status: "confirmed", source: "control", lastChangedAt: new Date().toISOString(), lastChangedBy: "customer" };
        next.requirementsVersion += 1; next.eventVersion += 1; next.status = "needs_review"; next.recommendation.status = next.recommendation.status === "empty" ? "empty" : "stale"; next.quote.status = next.quote.status === "empty" ? "empty" : "stale";
        return next;
      });
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/existing-equipment", (req, res) => {
    const catalogueItem = z.object({ identityKind: z.enum(["northstar", "governed_reference"]), variantId: z.string(), name: z.string().optional() });
    const manualItem = z.object({ identityKind: z.literal("manual"), name: z.string().min(2).max(100), widthMm: z.number().int().positive(), lengthMm: z.number().int().positive(), heightMm: z.number().int().positive() });
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), equipment: z.union([catalogueItem, manualItem]) }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => {
        const next = structuredClone(current);
        const equipment: ExistingEquipment = body.equipment.identityKind === "manual"
          ? { id: randomUUID(), identityKind: "manual", name: body.equipment.name, widthMm: body.equipment.widthMm, lengthMm: body.equipment.lengthMm, heightMm: body.equipment.heightMm, evidenceStatus: "footprint_only" }
          : { id: randomUUID(), identityKind: body.equipment.identityKind, variantId: body.equipment.variantId, evidenceStatus: "verified" };
        next.existingEquipment = [equipment];
        next.requirementsVersion += 1; next.eventVersion += 1; next.status = "collecting";
        next.blockers = next.blockers.filter((blocker) => blocker !== "existingEquipment");
        return next;
      });
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/chat", async (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), message: z.string().trim().min(1).max(2000) }).parse(req.body);
    try { res.json(await mara.chat(req.params.planId, body.message, body.expectedVersion)); }
    catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/recommend", async (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative() }).parse(req.body);
    try {
      const snapshot = await catalogue.refresh();
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => buildRecommendation(current, snapshot));
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });


  app.post("/api/plans/:planId/items/recommended", async (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), query: z.string().trim().min(2).max(200) }).parse(req.body);
    const current = plans.get(req.params.planId);
    if (current.eventVersion !== body.expectedVersion) return res.status(409).json({ code: "STATE_CONFLICT", message: "Your plan changed while this item was being checked.", state: current });
    const snapshot = await catalogue.refresh();
    const result = addBestMatchingProduct(current, snapshot, body.query);
    if (!result.ok) {
      const status = result.code === "PRODUCT_NOT_FOUND" ? 404 : result.code === "BUDGET_EXCEEDED" ? 409 : 422;
      return res.status(status).json({ ...result, state: current });
    }
    if (result.alreadySelected) return res.json(result);
    const state = plans.replace(req.params.planId, result.state, body.expectedVersion);
    res.json({ ...result, state });
  });
  app.post("/api/plans/:planId/budget-consent", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), maximumOverrunCents: z.number().int().positive() }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => {
        const next = structuredClone(current);
        next.budgetConsent = { overrunAllowed: true, maximumAuthorisedOverrunCents: body.maximumOverrunCents, consentedAt: new Date().toISOString() };
        next.eventVersion += 1;
        return next;
      });
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/placements/:placementId", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), xMm: z.number().int().optional(), zMm: z.number().int().optional(), rotationDeg: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(), locked: z.boolean().optional() }).parse(req.body);
    const current = plans.get(req.params.planId);
    if (current.eventVersion !== body.expectedVersion) return res.status(409).json({ code: "STATE_CONFLICT", message: "Your plan changed while this position was being checked.", state: current });
    const proposed = current.placements.map((placement) => placement.placementId === req.params.placementId ? { ...placement, ...body, expectedVersion: undefined } as Placement : placement);
    const validated = validatePlacements(current, catalogue.getSnapshot(), proposed);
    const attempted = validated.find((placement) => placement.placementId === req.params.placementId);
    if (!attempted || attempted.validationStatus === "invalid") return res.status(422).json({ code: "INVALID_PLACEMENT", message: "That position does not pass the current room checks.", state: current, attempted });
    const state = plans.replace(req.params.planId, { ...current, placements: validated, eventVersion: current.eventVersion + 1, status: "current" }, body.expectedVersion);
    res.json({ state });
  });

  app.post("/api/plans/:planId/placements/:placementId/remove", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative() }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => {
        const next = structuredClone(current);
        const placement = next.placements.find((item) => item.placementId === req.params.placementId);
        next.placements = next.placements.filter((item) => item.placementId !== req.params.placementId);
        if (placement) next.selectedItems = next.selectedItems.filter((item) => item !== placement.variantId);
        next.quote = calculateQuote(next, catalogue.getSnapshot(), next.selectedItems);
        next.eventVersion += 1;
        return next;
      });
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/layout/regenerate", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), seed: z.number().int().default(42) }).parse(req.body);
    try {
      const state = plans.mutate(req.params.planId, body.expectedVersion, (current) => {
        const next = structuredClone(current);
        const result = generateLayout(next, catalogue.getSnapshot(), next.selectedItems, body.seed);
        next.placements = result.placements; next.status = result.status === "feasible" ? "current" : "needs_review"; next.eventVersion += 1;
        next.quote = result.status === "feasible" ? calculateQuote(next, catalogue.getSnapshot(), next.selectedItems) : { ...next.quote, status: "stale" };
        return next;
      });
      res.json({ state });
    } catch (error) { conflictOrThrow(error, res); }
  });

  app.post("/api/plans/:planId/undo", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative() }).parse(req.body);
    try { res.json({ state: plans.undo(req.params.planId, body.expectedVersion) }); } catch (error) { conflictOrThrow(error, res); }
  });
  app.post("/api/plans/:planId/redo", (req, res) => {
    const body = z.object({ expectedVersion: z.number().int().nonnegative() }).parse(req.body);
    try { res.json({ state: plans.redo(req.params.planId, body.expectedVersion) }); } catch (error) { conflictOrThrow(error, res); }
  });

  app.get("/api/catalogue", async (req, res) => {
    const snapshot = await catalogue.refresh();
    const categories = typeof req.query.category === "string" ? [req.query.category as never] : undefined;
    const results = req.query.q ? searchCatalogue(snapshot, { text: String(req.query.q), categories }) : snapshot.variants.filter((item) => item.active);
    res.json({ snapshotId: snapshot.snapshotId, sourceKind: snapshot.sourceKind, freshness: snapshot.freshness, observedAt: snapshot.observedAt, variants: snapshot.freshness === "unavailable" ? [] : results, diagnostics: snapshot.diagnostics });
  });
  app.post("/api/catalogue/refresh", async (_req, res) => res.json(await catalogue.refresh(true)));
  app.post("/api/compatibility", (req, res) => {
    const body = z.object({ hostVariantId: z.string(), attachmentVariantId: z.string(), selectedItems: z.array(z.string()).default([]) }).parse(req.body);
    const host: ExistingEquipment = { id: body.hostVariantId, identityKind: "northstar", variantId: body.hostVariantId, evidenceStatus: "verified" };
    res.json(checkCompatibility(catalogue.getSnapshot(), host, body.attachmentVariantId, body.selectedItems));
  });

  const serverDir = dirname(fileURLToPath(import.meta.url));
  const dist = resolve(serverDir, "../dist");
  if (existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: "1h" }));
    app.get("/{*splat}", (_req, res) => res.sendFile(resolve(dist, "index.html")));
  }

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const referenceId = randomUUID().slice(0, 8);
    if (error instanceof z.ZodError) return res.status(400).json({ code: "INVALID_REQUEST", message: "Please review the values and try again.", referenceId });
    if (error instanceof Error && error.message === "PLAN_NOT_FOUND") return res.status(404).json({ code: "PLAN_NOT_FOUND", message: "This anonymous plan is no longer available. Start a new plan.", referenceId });
    res.status(500).json({ code: "UNEXPECTED_ERROR", message: "That action could not be completed. Your current plan has been kept.", referenceId });
  };
  app.use(errorHandler);

  return { app, catalogue, plans, mara };
}
