import type { CatalogueBundle, Category, RackInterface, Variant } from "../../shared/types.js";

const observedAt = "2026-08-11T12:00:00.000Z";
const validUntil = "2027-08-11T12:00:00.000Z";
const source = {
  sourceTitle: "Northstar governed prototype specification",
  sourceUrl: "/catalogue-evidence.html",
  sourceCheckedAt: "2026-08-11",
} as const;

type VariantInput = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  family: string;
  config: string;
  description: string;
  price: number | null;
  width: number;
  length: number;
  height: number;
  operatingWidth?: number | null;
  operatingLength?: number | null;
  operatingHeight?: number | null;
  tags: string[];
  anchoring?: Variant["anchoringMode"];
  stock?: Variant["stockState"];
  quantity?: number | null;
  delivery?: number | null;
  skills?: Variant["skillLevels"];
  generation?: string | null;
  rackInterface?: RackInterface | null;
  loadKg?: number | null;
  loadType?: string | null;
  gauge?: number | null;
  evidence?: Variant["evidenceStatus"];
  priority?: number;
};

function variant(input: VariantInput): Variant {
  return {
    variantId: input.id,
    productId: input.id.replace(/-(entry|standard|pro|compact|premium|starter|heavy)$/, ""),
    sku: input.sku,
    name: input.name,
    category: input.category,
    familyId: input.family,
    configuration: input.config,
    description: input.description,
    active: true,
    priceCents: input.price,
    stockState: input.stock ?? "in_stock",
    stockQuantity: input.quantity ?? 12,
    deliveryPriceCents: input.delivery === undefined ? 4500 : input.delivery,
    observedAt,
    validUntil,
    geometry: {
      widthMm: input.width,
      lengthMm: input.length,
      heightMm: input.height,
      operatingWidthMm: input.operatingWidth ?? input.width,
      operatingLengthMm: input.operatingLength ?? input.length,
      operatingHeightMm: input.operatingHeight ?? input.height,
      geometryVersion: "geo-2026-08",
    },
    anchoringMode: input.anchoring ?? "none",
    tags: input.tags,
    skillLevels: input.skills ?? ["beginner", "some_experience", "experienced"],
    priorityWeight: input.priority ?? 5,
    generation: input.generation ?? null,
    rackInterface: input.rackInterface ?? null,
    declaredLoadKg: input.loadKg ?? null,
    declaredLoadType: input.loadType ?? null,
    steelGaugeMm: input.gauge ?? null,
    evidenceStatus: input.evidence ?? "verified",
    ...source,
  };
}

const host75Gen2 = (generation = "G2"): RackInterface => ({
  role: "host",
  ecosystem: "northstar-75",
  uprightActualMm: 75,
  holeDiameterMm: 17,
  hardwareClass: "M16",
  pinDiameterMm: 16,
  spacingPattern: "50-mm",
  mountingFaces: ["front", "rear", "side", "crossmember", "base"],
  requiredDepthMm: 600,
  generation,
});

const attachment75 = (generation = "G2"): RackInterface => ({
  role: "attachment",
  ecosystem: "northstar-75",
  uprightActualMm: 75,
  holeDiameterMm: 17,
  hardwareClass: "M16",
  pinDiameterMm: 16,
  spacingPattern: "50-mm",
  mountingFaces: ["front", "side"],
  requiredDepthMm: null,
  generation,
});

const variants: Variant[] = [
  variant({ id: "s10-squat-stand-entry", sku: "NS-S10", name: "S10 Open Squat Stand", category: "rack", family: "s-series", config: "Entry open stand", description: "Compact barbell station that preserves open floor space.", price: 54900, width: 1220, length: 1080, height: 2050, operatingWidth: 2200, operatingLength: 2200, tags: ["barbell_strength", "bench_press", "open_floor_conditioning"], loadKg: 250, loadType: "rack load", gauge: 2.0, rackInterface: { ...host75Gen2(), ecosystem: "northstar-60", uprightActualMm: 60, holeDiameterMm: 17, requiredDepthMm: null }, priority: 6 }),
  variant({ id: "s20-squat-stand-standard", sku: "NS-S20", name: "S20 Stable Squat Stand", category: "rack", family: "s-series", config: "Braced open stand", description: "A heavier open stand with spotter-arm support.", price: 74900, width: 1280, length: 1220, height: 2150, operatingWidth: 2300, operatingLength: 2300, tags: ["barbell_strength", "bench_press", "pull_up"], loadKg: 320, loadType: "rack load", gauge: 2.3, rackInterface: { ...host75Gen2(), ecosystem: "northstar-60", uprightActualMm: 60 }, priority: 6 }),
  variant({ id: "h30-half-rack-entry", sku: "NS-H30-G2", name: "H30 Half Rack", category: "rack", family: "h-series", config: "G2 compact half rack", description: "A versatile half rack with plate storage and a modest footprint.", price: 109900, width: 1300, length: 1350, height: 2200, operatingWidth: 2400, operatingLength: 2400, tags: ["barbell_strength", "bench_press", "pull_up", "dip"], loadKg: 400, loadType: "rack load", gauge: 2.5, rackInterface: host75Gen2(), generation: "G2", priority: 9 }),
  variant({ id: "h40-half-rack-pro", sku: "NS-H40-G2", name: "H40 Half Rack Pro", category: "rack", family: "h-series", config: "G2 deep half rack", description: "Deeper working area and cable-ready bracing for progressive strength training.", price: 144900, width: 1350, length: 1580, height: 2300, operatingWidth: 2450, operatingLength: 2600, tags: ["barbell_strength", "bench_press", "pull_up", "cable_resistance", "dip"], loadKg: 500, loadType: "rack load", gauge: 3.0, rackInterface: host75Gen2(), generation: "G2", priority: 8 }),
  variant({ id: "p40-power-rack-compact", sku: "NS-P40-G2", name: "P40 Compact Power Rack", category: "rack", family: "p-series", config: "G2 shallow four-post", description: "Four-post rack for compact rooms where enclosed lifting matters.", price: 129900, width: 1320, length: 1420, height: 2080, operatingWidth: 2420, operatingLength: 2520, tags: ["barbell_strength", "bench_press", "pull_up"], loadKg: 500, loadType: "rack load", gauge: 2.5, rackInterface: host75Gen2(), generation: "G2", priority: 8 }),
  variant({ id: "p50-power-rack-standard", sku: "NS-P50-G2", name: "P50 Power Rack", category: "rack", family: "p-series", config: "G2 standard four-post", description: "Balanced depth, attachment coverage and barbell training space.", price: 164900, width: 1380, length: 1720, height: 2280, operatingWidth: 2480, operatingLength: 2820, tags: ["barbell_strength", "bench_press", "pull_up", "cable_resistance", "dip"], loadKg: 600, loadType: "rack load", gauge: 3.0, rackInterface: host75Gen2(), generation: "G2", priority: 9 }),
  variant({ id: "p60-power-rack-premium", sku: "NS-P60-G3", name: "P60 Power Rack Studio", category: "rack", family: "p-series", config: "G3 six-post", description: "High-capacity six-post rack with integrated storage for larger spaces.", price: 219900, width: 1500, length: 2150, height: 2380, operatingWidth: 2600, operatingLength: 3250, tags: ["barbell_strength", "bench_press", "pull_up", "cable_resistance", "storage"], loadKg: 750, loadType: "rack load", gauge: 3.0, rackInterface: host75Gen2("G3"), generation: "G3", priority: 7 }),
  variant({ id: "f20-folding-rack-compact", sku: "NS-F20-G2", name: "F20 Folding Wall Rack", category: "rack", family: "f-series", config: "G2 wall folding", description: "Wall-mounted rack that folds to restore floor area between sessions.", price: 99900, width: 1320, length: 610, height: 2180, operatingWidth: 2420, operatingLength: 2250, tags: ["barbell_strength", "bench_press", "open_floor_conditioning"], anchoring: "wall_required", loadKg: 300, loadType: "rack load", gauge: 2.5, rackInterface: { ...host75Gen2(), mountingFaces: ["front", "side", "crossmember"] }, generation: "G2", priority: 7 }),
  variant({ id: "f30-folding-rack-pro", sku: "NS-F30-G2", name: "F30 Folding Rack Pro", category: "rack", family: "f-series", config: "G2 deep folding", description: "A deeper folding rack for pull-ups and progressive barbell work.", price: 124900, width: 1380, length: 780, height: 2300, operatingWidth: 2480, operatingLength: 2450, tags: ["barbell_strength", "bench_press", "pull_up", "open_floor_conditioning"], anchoring: "wall_required", loadKg: 350, loadType: "rack load", gauge: 3.0, rackInterface: { ...host75Gen2(), mountingFaces: ["front", "side", "crossmember"] }, generation: "G2", priority: 6 }),

  variant({ id: "a10-dip-attachment", sku: "NS-A10-G2", name: "A10 Dip Station", category: "attachment", family: "attachments-75", config: "G2 side-mount", description: "Removable parallel handles for supported dip training.", price: 9900, width: 650, length: 520, height: 250, tags: ["dip", "calisthenics"], rackInterface: attachment75(), generation: "G2" }),
  variant({ id: "a12-spotter-arms", sku: "NS-A12-G2", name: "A12 Spotter Arms", category: "attachment", family: "attachments-75", config: "G2 pair", description: "Pair of rack-mounted bar support arms; use current product instructions.", price: 13900, width: 160, length: 650, height: 220, tags: ["barbell_strength", "bench_press"], rackInterface: attachment75(), generation: "G2" }),
  variant({ id: "a14-safety-straps", sku: "NS-A14-G2", name: "A14 Safety Straps", category: "attachment", family: "attachments-75", config: "G2 pair", description: "Adjustable bar support straps for compatible four-post racks.", price: 11900, width: 80, length: 900, height: 80, tags: ["barbell_strength", "bench_press"], rackInterface: { ...attachment75(), mountingFaces: ["front", "rear"] }, generation: "G2" }),
  variant({ id: "a16-landmine", sku: "NS-A16-UNI", name: "A16 Landmine Pivot", category: "attachment", family: "attachments-base", config: "Base mount", description: "Barbell pivot for rows, presses and rotational work.", price: 6900, width: 180, length: 420, height: 160, operatingWidth: 1500, operatingLength: 1800, tags: ["barbell_strength", "free_weight_hypertrophy"], rackInterface: { ...attachment75(), mountingFaces: ["base"] }, generation: "G2" }),
  variant({ id: "a18-plate-storage", sku: "NS-A18-G2", name: "A18 Plate Storage Pair", category: "attachment", family: "attachments-storage", config: "Side-mount pair", description: "Two storage pegs for compatible rack uprights.", price: 7900, width: 420, length: 160, height: 160, tags: ["storage", "barbell_strength"], rackInterface: attachment75(), generation: "G2" }),
  variant({ id: "a20-cable-compact", sku: "NS-A20-G2", name: "A20 Compact Cable Kit", category: "attachment", family: "attachments-cable", config: "Single pulley with loading pin", description: "Compact high/low cable resistance for compatible racks.", price: 24900, width: 560, length: 900, height: 2050, operatingWidth: 1800, operatingLength: 1800, tags: ["cable_resistance", "free_weight_hypertrophy"], rackInterface: { ...attachment75(), mountingFaces: ["crossmember", "base"] }, generation: "G2" }),
  variant({ id: "a22-cable-pro", sku: "NS-A22-G3", name: "A22 Dual Cable Pro", category: "attachment", family: "attachments-cable", config: "G3 dual pulley", description: "Dual adjustable cable columns for the Studio rack generation.", price: 64900, width: 920, length: 520, height: 2200, operatingWidth: 2100, operatingLength: 1900, tags: ["cable_resistance", "free_weight_hypertrophy"], rackInterface: { ...attachment75("G3"), mountingFaces: ["front", "rear", "crossmember"] }, generation: "G3" }),
  variant({ id: "a24-jammer-arms", sku: "NS-A24-G2", name: "A24 Jammer Arms", category: "attachment", family: "attachments-75", config: "G2 pair", description: "Lever arms for pressing and rowing on approved rack variants.", price: 32900, width: 220, length: 1250, height: 220, operatingWidth: 2100, operatingLength: 2300, tags: ["barbell_strength", "free_weight_hypertrophy"], rackInterface: attachment75(), generation: "G2" }),
  variant({ id: "a26-pullup-multi", sku: "NS-A26-G2", name: "A26 Multi-Grip Pull-up Bar", category: "attachment", family: "attachments-crossmember", config: "G2 crossmember", description: "Neutral and angled pull-up grips for compatible crossmembers.", price: 10900, width: 1100, length: 320, height: 180, operatingHeight: 2550, tags: ["pull_up", "calisthenics"], rackInterface: { ...attachment75(), mountingFaces: ["crossmember"] }, generation: "G2" }),
  variant({ id: "a28-stabiliser", sku: "NS-A28-G2", name: "A28 Rear Stabiliser", category: "attachment", family: "attachments-base", config: "G2 rear brace", description: "Required bracing for specified cable configurations.", price: 8900, width: 1320, length: 280, height: 180, tags: ["cable_resistance"], rackInterface: { ...attachment75(), mountingFaces: ["base"] }, generation: "G2" }),
  variant({ id: "a30-interface-adapter", sku: "NS-A30-60-75", name: "A30 Interface Adapter", category: "attachment", family: "attachments-adapter", config: "60-to-75 mm governed adapter", description: "Named adapter for specifically approved Northstar pairings only.", price: 5900, width: 130, length: 130, height: 240, tags: ["barbell_strength"], rackInterface: { ...attachment75(), ecosystem: "northstar-adapter-60-75" }, generation: "G2" }),

  variant({ id: "b10-flat-bench-entry", sku: "NS-B10", name: "B10 Flat Bench", category: "bench", family: "bench", config: "Flat", description: "Stable flat bench for presses and dumbbell training.", price: 16900, width: 570, length: 1220, height: 430, operatingWidth: 1200, operatingLength: 1900, tags: ["bench_press", "free_weight_hypertrophy"], loadKg: 300, loadType: "combined user and load", priority: 7 }),
  variant({ id: "b20-adjustable-bench-standard", sku: "NS-B20", name: "B20 Adjustable Bench", category: "bench", family: "bench", config: "Seven-position adjustable", description: "Versatile flat-to-incline bench for a compact strength plan.", price: 29900, width: 680, length: 1350, height: 470, operatingWidth: 1350, operatingLength: 2100, operatingHeight: 1350, tags: ["bench_press", "free_weight_hypertrophy"], loadKg: 320, loadType: "combined user and load", priority: 9 }),
  variant({ id: "b30-adjustable-bench-premium", sku: "NS-B30", name: "B30 Adjustable Bench Pro", category: "bench", family: "bench", config: "Heavy adjustable", description: "Wide adjustment range and transport handle for high-volume training.", price: 44900, width: 720, length: 1420, height: 480, operatingWidth: 1400, operatingLength: 2200, operatingHeight: 1450, tags: ["bench_press", "free_weight_hypertrophy"], loadKg: 450, loadType: "combined user and load", priority: 7 }),

  variant({ id: "c10-rower-standard", sku: "NS-C10", name: "C10 Air Rower", category: "cardio", family: "cardio", config: "Air resistance", description: "Full-body rowing machine with a larger use envelope than stored footprint.", price: 109900, width: 620, length: 2440, height: 950, operatingWidth: 1220, operatingLength: 2740, operatingHeight: 1300, tags: ["rowing_cardio", "general_fitness"], priority: 8 }),
  variant({ id: "c20-bike-compact", sku: "NS-C20", name: "C20 Compact Bike", category: "cardio", family: "cardio", config: "Magnetic upright", description: "Low-footprint cycling option for rooms that cannot support a rower envelope.", price: 64900, width: 610, length: 1120, height: 1320, operatingWidth: 1200, operatingLength: 1750, operatingHeight: 2000, tags: ["cycling_cardio", "general_fitness", "low_impact"], priority: 9 }),
  variant({ id: "c30-stepper-compact", sku: "NS-C30", name: "C30 Folding Stepper", category: "cardio", family: "cardio", config: "Folding magnetic", description: "Compact conditioning machine that stores upright between sessions.", price: 49900, width: 680, length: 1180, height: 1580, operatingWidth: 1300, operatingLength: 1850, operatingHeight: 2200, tags: ["general_fitness", "low_impact", "open_floor_conditioning"], priority: 6 }),

  variant({ id: "w10-barbell-general", sku: "NS-W10", name: "W10 General Barbell", category: "barbell", family: "barbell", config: "20 kg general training", description: "General-purpose Olympic-format bar for the governed rack range.", price: 17900, width: 2200, length: 50, height: 50, operatingWidth: 2600, operatingLength: 900, tags: ["barbell_strength", "free_weight_hypertrophy"], loadKg: 450, loadType: "declared bar rating", priority: 9 }),
  variant({ id: "w20-barbell-power", sku: "NS-W20", name: "W20 Power Bar", category: "barbell", family: "barbell", config: "20 kg power training", description: "Stiffer power-oriented bar for experienced strength plans.", price: 26900, width: 2200, length: 50, height: 50, operatingWidth: 2600, operatingLength: 900, tags: ["barbell_strength"], loadKg: 650, loadType: "declared bar rating", skills: ["some_experience", "experienced"], priority: 7 }),
  variant({ id: "p100-plate-pack-starter", sku: "NS-PL100", name: "100 kg Plate Pack", category: "plates", family: "plates", config: "Starter bumper set", description: "Progressive plate package for entry strength plans.", price: 27900, width: 450, length: 450, height: 450, tags: ["barbell_strength", "free_weight_hypertrophy"], priority: 9 }),
  variant({ id: "p150-plate-pack-standard", sku: "NS-PL150", name: "150 kg Plate Pack", category: "plates", family: "plates", config: "Standard bumper set", description: "Broader progression package for regular barbell training.", price: 39900, width: 520, length: 520, height: 520, tags: ["barbell_strength", "free_weight_hypertrophy"], priority: 7 }),
  variant({ id: "p200-plate-pack-heavy", sku: "NS-PL200", name: "200 kg Plate Pack", category: "plates", family: "plates", config: "Heavy bumper set", description: "Higher-capacity package for experienced strength plans.", price: 52900, width: 580, length: 580, height: 580, tags: ["barbell_strength"], skills: ["some_experience", "experienced"], priority: 6 }),
  variant({ id: "d10-adjustable-dumbbells", sku: "NS-D10", name: "D10 Adjustable Dumbbells", category: "dumbbells", family: "dumbbells", config: "2-32 kg pair", description: "Space-efficient pair for general strength and hypertrophy.", price: 49900, width: 760, length: 460, height: 320, operatingWidth: 1800, operatingLength: 1800, tags: ["free_weight_hypertrophy", "general_fitness"], priority: 9 }),
  variant({ id: "d20-fixed-dumbbell-set", sku: "NS-D20", name: "D20 Fixed Dumbbell Set", category: "dumbbells", family: "dumbbells", config: "2.5-25 kg pairs with rack", description: "Quick-access fixed dumbbells with dedicated storage footprint.", price: 89900, width: 1450, length: 650, height: 900, operatingWidth: 2100, operatingLength: 1600, tags: ["free_weight_hypertrophy", "general_fitness", "storage"], priority: 6 }),
  variant({ id: "k10-kettlebell-set", sku: "NS-K10", name: "K10 Kettlebell Set", category: "kettlebell", family: "compact-strength", config: "8-24 kg set", description: "Compact strength and conditioning set.", price: 25900, width: 1000, length: 420, height: 420, operatingWidth: 2000, operatingLength: 2000, tags: ["open_floor_conditioning", "free_weight_hypertrophy", "general_fitness"], priority: 7 }),
  variant({ id: "x10-band-kit", sku: "NS-X10", name: "X10 Resistance Band Kit", category: "bands", family: "compact-strength", config: "Five-band kit", description: "Portable resistance for warm-ups, assistance and accessory work.", price: 5900, width: 320, length: 220, height: 100, tags: ["mobility", "general_fitness", "pull_up"], delivery: 900, priority: 8 }),
  variant({ id: "m10-training-mat", sku: "NS-M10", name: "M10 Training Mat", category: "mat", family: "floor-accessories", config: "1.8 m exercise mat", description: "Personal exercise surface for mobility and floor work.", price: 4900, width: 650, length: 1830, height: 12, operatingWidth: 1000, operatingLength: 2100, tags: ["mobility", "general_fitness"], delivery: 900, priority: 7 }),
  variant({ id: "f10-flooring-general", sku: "NS-FL10", name: "F10 General Flooring Pack", category: "flooring", family: "flooring", config: "10 mm, 6 square metres", description: "General rubber floor coverage; prototype planning assumption, not structural assessment.", price: 23900, width: 3000, length: 2000, height: 10, tags: ["flooring", "general_fitness"], evidence: "assumption", priority: 8 }),
  variant({ id: "f20-flooring-impact", sku: "NS-FL20", name: "F20 Impact Flooring Pack", category: "flooring", family: "flooring", config: "20 mm, 6 square metres", description: "Thicker rubber floor coverage for impact-sensitive plans; not a floor certification.", price: 38900, width: 3000, length: 2000, height: 20, tags: ["flooring", "barbell_strength"], evidence: "assumption", priority: 7 }),
  variant({ id: "st10-storage-vertical", sku: "NS-ST10", name: "ST10 Vertical Storage", category: "storage", family: "storage", config: "Vertical accessory tree", description: "Small-footprint storage for plates and compact accessories.", price: 15900, width: 620, length: 620, height: 1350, operatingWidth: 1250, operatingLength: 1250, tags: ["storage", "open_floor_conditioning"], priority: 8 }),
  variant({ id: "st20-storage-horizontal", sku: "NS-ST20", name: "ST20 Modular Storage", category: "storage", family: "storage", config: "Two-tier shelf", description: "Accessible storage for dumbbells, kettlebells and plates.", price: 24900, width: 1600, length: 650, height: 900, operatingWidth: 1900, operatingLength: 1400, tags: ["storage", "free_weight_hypertrophy"], priority: 6 }),
];

const reviewedAt = "2026-08-11T12:00:00.000Z";
const relation = (
  id: string,
  hostVariantId: string,
  attachmentVariantId: string,
  state: CatalogueBundle["compatibility"][number]["state"],
  options: Partial<Omit<CatalogueBundle["compatibility"][number], "relationshipId" | "hostVariantId" | "attachmentVariantId" | "state">> = {},
): CatalogueBundle["compatibility"][number] => ({
  relationshipId: id,
  hostVariantId,
  attachmentVariantId,
  state,
  adapterVariantId: options.adapterVariantId ?? null,
  conditions: options.conditions ?? [],
  failedReasonCodes: options.failedReasonCodes ?? [],
  evidenceIds: options.evidenceIds ?? [`evidence-${id}`],
  reviewedAt,
  policyVersion: "compat-2026-08",
  active: true,
});

export const seedCatalogue: CatalogueBundle = {
  schemaVersion: "catalogue-2.0",
  variants,
  compatibility: [
    relation("rel-h30-dip", "h30-half-rack-entry", "a10-dip-attachment", "explicitly_compatible"),
    relation("rel-h40-dip", "h40-half-rack-pro", "a10-dip-attachment", "explicitly_compatible"),
    relation("rel-h30-cable", "h30-half-rack-entry", "a20-cable-compact", "compatible_with_condition", { adapterVariantId: "a28-stabiliser", conditions: ["Add the A28 rear stabiliser"] }),
    relation("rel-h40-cable", "h40-half-rack-pro", "a20-cable-compact", "explicitly_compatible"),
    relation("rel-p40-dip", "p40-power-rack-compact", "a10-dip-attachment", "explicitly_compatible"),
    relation("rel-p50-dip", "p50-power-rack-standard", "a10-dip-attachment", "explicitly_compatible"),
    relation("rel-p50-jammer", "p50-power-rack-standard", "a24-jammer-arms", "explicitly_compatible"),
    relation("rel-p60-cable-g2", "p60-power-rack-premium", "a20-cable-compact", "incompatible", { failedReasonCodes: ["GENERATION_MISMATCH", "CROSSMEMBER_CONFLICT"] }),
    relation("rel-p60-cable-g3", "p60-power-rack-premium", "a22-cable-pro", "explicitly_compatible"),
    relation("rel-s10-straps", "s10-squat-stand-entry", "a14-safety-straps", "dimensionally_matching_but_unapproved", { failedReasonCodes: ["RELATION_NOT_APPROVED"] }),
    relation("rel-f20-storage", "f20-folding-rack-compact", "a18-plate-storage", "incompatible", { failedReasonCodes: ["BASE_CONFLICT", "UPRIGHT_FACE_OBSTRUCTED"] }),
    relation("rel-s20-dip-adapter", "s20-squat-stand-standard", "a10-dip-attachment", "compatible_with_condition", { adapterVariantId: "a30-interface-adapter", conditions: ["Use the A30 governed interface adapter"] }),
    relation("rel-h30-jammer-depth", "h30-half-rack-entry", "a24-jammer-arms", "incompatible", { failedReasonCodes: ["DEPTH_INSUFFICIENT"] }),
    relation("rel-p40-pullup", "p40-power-rack-compact", "a26-pullup-multi", "explicitly_compatible"),
  ],
};
