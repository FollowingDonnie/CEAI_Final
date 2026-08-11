import { AlertCircle, Anchor, ExternalLink, Ruler, ShieldCheck } from "lucide-react";
import type { Variant } from "../../shared/types";
import { euro } from "../utils";

export function DetailsView({ variant }: { variant?: Variant }) {
  if (!variant) return <div className="empty-panel"><Ruler size={30} /><h3>Select an item</h3><p>Choose equipment in the plan or room to inspect its governed details.</p></div>;
  const status = variant.evidenceStatus === "verified" ? "Source checked" : variant.evidenceStatus === "assumption" ? "Northstar planning assumption" : "Not provided";
  return <div className="details-view">
    <div className="product-heading"><span className={`product-glyph ${variant.category}`} aria-hidden="true" /><span><small>{variant.sku}</small><h2>{variant.name}</h2><p>{variant.configuration}</p></span></div>
    <p>{variant.description}</p>
    <dl className="spec-grid">
      <div><dt>Price</dt><dd>{euro(variant.priceCents)}</dd></div><div><dt>Availability</dt><dd>{variant.stockState.replaceAll("_", " ")}</dd></div>
      <div><dt>Physical size</dt><dd>{variant.geometry.widthMm} × {variant.geometry.lengthMm} × {variant.geometry.heightMm} mm</dd></div>
      <div><dt>Operating area</dt><dd>{variant.geometry.operatingWidthMm && variant.geometry.operatingLengthMm ? `${variant.geometry.operatingWidthMm} × ${variant.geometry.operatingLengthMm} mm` : "Not provided"}</dd></div>
      <div><dt>Anchoring</dt><dd><Anchor size={14} />{variant.anchoringMode.replaceAll("_", " ")}</dd></div>
      <div><dt>Declared load</dt><dd>{variant.declaredLoadKg ? `${variant.declaredLoadKg} kg, ${variant.declaredLoadType}` : "Not provided"}</dd></div>
      {variant.rackInterface && <><div><dt>Upright</dt><dd>{variant.rackInterface.uprightActualMm ?? "Not provided"} mm</dd></div><div><dt>Hole / pin</dt><dd>{variant.rackInterface.holeDiameterMm ?? "Not provided"} / {variant.rackInterface.pinDiameterMm ?? "Not provided"} mm</dd></div><div><dt>Generation</dt><dd>{variant.generation ?? "Not provided"}</dd></div><div><dt>Interface</dt><dd>{variant.rackInterface.ecosystem ?? "Not provided"}</dd></div></>}
    </dl>
    <div className={`evidence-box ${variant.evidenceStatus}`}><ShieldCheck size={18} /><span><strong>{status}</strong><small>Checked {variant.sourceCheckedAt}</small></span></div>
    <a className="source-link" href={variant.sourceUrl} target="_blank" rel="noreferrer">{variant.sourceTitle}<ExternalLink size={14} /></a>
    <p className="boundary-note"><AlertCircle size={16} />Recorded geometry is not an installation or exercise safety assessment. Verify current instructions and the mounting surface before installation.</p>
  </div>;
}
