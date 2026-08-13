import { useEffect, useState } from "react";
import { AlertCircle, Anchor, ExternalLink, RefreshCw, Ruler, ShieldCheck, Trash2 } from "lucide-react";
import type { PlanState, Variant } from "../../shared/types";
import { euro } from "../utils";

type Replacement = { product: Variant; totalCents: number; differenceCents: number };

export function DetailsView({ variant, state, replacements, busy, onReplace, onRemove }: {
  variant?: Variant;
  state: PlanState;
  replacements: Replacement[];
  busy: boolean;
  onReplace: (variantId: string, replacementVariantId: string) => Promise<void>;
  onRemove: (variantId: string) => Promise<void>;
}) {
  const [replacementId, setReplacementId] = useState("");
  useEffect(() => setReplacementId(""), [variant?.variantId]);
  if (!variant) return <div className="empty-panel"><Ruler size={30} /><h3>Select an item</h3><p>Choose equipment in the plan or room to inspect its governed details.</p></div>;
  const status = variant.evidenceStatus === "verified" ? "Source checked" : variant.evidenceStatus === "assumption" ? "Northstar planning assumption" : "Not provided";
  const owned = state.existingEquipment.some((item) => item.identityKind !== "manual" && item.variantId === variant.variantId);
  const required = variant.tags.includes("required_setup");
  const category = variant.category.replaceAll("_", " ");
  const selectedReplacement = replacements.find((item) => item.product.variantId === replacementId);
  return <div className="details-view">
    <div className="product-heading"><span className={`product-glyph ${variant.category}`} aria-hidden="true" /><span><small>{variant.sku}</small><h2>{variant.name}</h2><p>{variant.configuration}</p></span></div>
    <p>{variant.description}</p>
    <dl className="spec-grid">
      <div><dt>Price</dt><dd>{owned ? "Owned" : euro(variant.priceCents)}</dd></div><div><dt>Availability</dt><dd>{variant.stockState.replaceAll("_", " ")}</dd></div>
      <div><dt>Physical size</dt><dd>{variant.geometry.widthMm} x {variant.geometry.lengthMm} x {variant.geometry.heightMm} mm</dd></div>
      <div><dt>Operating area</dt><dd>{variant.geometry.operatingWidthMm && variant.geometry.operatingLengthMm ? `${variant.geometry.operatingWidthMm} x ${variant.geometry.operatingLengthMm} mm` : "Not provided"}</dd></div>
      <div><dt>Anchoring</dt><dd><Anchor size={14} />{variant.anchoringMode.replaceAll("_", " ")}</dd></div>
      <div><dt>Declared load</dt><dd>{variant.declaredLoadKg ? `${variant.declaredLoadKg} kg, ${variant.declaredLoadType}` : "Not provided"}</dd></div>
      {variant.rackInterface && <><div><dt>Upright</dt><dd>{variant.rackInterface.uprightActualMm ?? "Not provided"} mm</dd></div><div><dt>Hole / pin</dt><dd>{variant.rackInterface.holeDiameterMm ?? "Not provided"} / {variant.rackInterface.pinDiameterMm ?? "Not provided"} mm</dd></div><div><dt>Generation</dt><dd>{variant.generation ?? "Not provided"}</dd></div><div><dt>Interface</dt><dd>{variant.rackInterface.ecosystem ?? "Not provided"}</dd></div></>}
    </dl>
    <div className={`evidence-box ${variant.evidenceStatus}`}><ShieldCheck size={18} /><span><strong>{status}</strong><small>Checked {variant.sourceCheckedAt}</small></span></div>
    <a className="source-link" href={variant.sourceUrl} target="_blank" rel="noreferrer">{variant.sourceTitle}<ExternalLink size={14} /></a>
    {!required && <div className="replacement-control">
      <label htmlFor="replacement-select">View replacement options</label>
      {replacements.length ? <><select id="replacement-select" value={replacementId} onChange={(event) => setReplacementId(event.target.value)}><option value="">Choose a checked {category}</option>{replacements.map((item) => <option key={item.product.variantId} value={item.product.variantId}>{item.product.name} - {euro(item.product.priceCents)} ({item.differenceCents === 0 ? "same total" : `${item.differenceCents > 0 ? "+" : "-"}${euro(Math.abs(item.differenceCents))}`})</option>)}</select><button className="quiet-button product-swap" type="button" disabled={busy || !replacementId} onClick={() => onReplace(variant.variantId, replacementId)}><RefreshCw className={busy ? "spin" : ""} size={16} />Replace item</button>{selectedReplacement && <small>Checked plan total: {euro(selectedReplacement.totalCents)}</small>}</> : <p className="no-alternatives">No other checked {category} options fit this plan.</p>}
    </div>}
    {!owned && !required && <button className="text-button remove-item" type="button" disabled={busy} onClick={() => onRemove(variant.variantId)}><Trash2 size={16} />Remove from plan</button>}
    {required && <p className="required-item-note">Required by the current rack-and-barbell setup.</p>}
    <p className="boundary-note"><AlertCircle size={16} />Recorded geometry is not an installation or exercise safety assessment. Verify current instructions and the mounting surface before installation.</p>
  </div>;
}
