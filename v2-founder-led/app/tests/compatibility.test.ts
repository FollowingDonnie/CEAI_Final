import { describe, expect, it } from "vitest";
import { CatalogueRepository } from "../server/catalogue/repository.js";
import { checkCompatibility } from "../server/domain/compatibility.js";

const snapshot = new CatalogueRepository().getSnapshot();
const host = (variantId: string) => ({ id: variantId, identityKind: "northstar" as const, variantId, evidenceStatus: "verified" as const });

describe("five-state compatibility", () => {
  it("approves an explicit governed relation", () => expect(checkCompatibility(snapshot, host("h30-half-rack-entry"), "a10-dip-attachment").state).toBe("explicitly_compatible"));
  it("requires and then accepts the named condition", () => {
    const without = checkCompatibility(snapshot, host("h30-half-rack-entry"), "a20-cable-compact");
    const withAdapter = checkCompatibility(snapshot, host("h30-half-rack-entry"), "a20-cable-compact", ["a28-stabiliser"]);
    expect(without.state).toBe("compatible_with_condition");
    expect(without.allowedInPlan).toBe(false);
    expect(withAdapter.allowedInPlan).toBe(true);
  });
  it("keeps a dimensional match unapproved", () => {
    const checked = checkCompatibility(snapshot, host("s10-squat-stand-entry"), "a14-safety-straps");
    expect(checked.state).toBe("dimensionally_matching_but_unapproved");
    expect(checked.allowedInPlan).toBe(false);
  });
  it("reports exact mismatch reasons", () => {
    const checked = checkCompatibility(snapshot, host("p60-power-rack-premium"), "a20-cable-compact");
    expect(checked.state).toBe("incompatible");
    expect(checked.reasonCodes).toContain("GENERATION_MISMATCH");
  });
  it("never approves a manual host", () => {
    const manual = { id: "manual", identityKind: "manual" as const, name: "My rack", widthMm: 1200, lengthMm: 1200, heightMm: 2100, evidenceStatus: "footprint_only" as const };
    expect(checkCompatibility(snapshot, manual, "a10-dip-attachment").state).toBe("insufficient_information");
  });
});
