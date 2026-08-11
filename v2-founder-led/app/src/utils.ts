import type { PlanState, Variant } from "../shared/types";

export const euro = (cents: number | null) => cents == null ? "Not currently available" : new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
export const metres = (mm: number | null) => mm == null ? "Not set" : `${(mm / 1000).toFixed(mm % 1000 === 0 ? 1 : 2)} m`;
export const checkedTime = (iso: string | null) => iso ? new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "Not checked";
export const statusLabel: Record<PlanState["status"], string> = {
  collecting: "Collecting details", ready: "Ready to plan", checking: "Checking", current: "Current", needs_review: "Needs review", infeasible: "Needs a change", unavailable: "Unavailable",
};
export const variantById = (variants: Variant[], id: string) => variants.find((item) => item.variantId === id);
export const categoryColour: Record<Variant["category"], string> = {
  rack: "#087f73", attachment: "#936119", bench: "#de674b", cardio: "#335c81", barbell: "#526064", plates: "#665d76", dumbbells: "#247a4a", kettlebell: "#247a4a", bands: "#936119", mat: "#527a89", flooring: "#7c8683", storage: "#965c3c",
};
