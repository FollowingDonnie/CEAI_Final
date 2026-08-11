import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Eye, EyeOff, Grid3X3, Lock, Maximize2, Minus, Move, Redo2, RotateCw, Undo2, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import type { Placement, PlanState, Variant } from "../../shared/types";
import { ApiError } from "../api";
import { categoryColour, variantById } from "../utils";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  selectedId: string | null;
  onSelect: (variantId: string | null) => void;
  onPlacement: (placementId: string, update: Record<string, unknown>) => Promise<void>;
  onRemove: (placementId: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onUndo: () => Promise<void>;
  onRedo: () => Promise<void>;
}

function useSize(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 280, height: 320 });
  useEffect(() => {
    const host = ref.current;
    if (!active || !host) return;
    const update = (width: number, height: number) => {
      const next = { width: Math.max(280, width), height: Math.max(320, height) };
      setSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    const rect = host.getBoundingClientRect();
    update(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(host);
    return () => observer.disconnect();
  }, [active]);
  return { ref, size };
}

function dimensions(variant: Variant, placement: Placement, operating = false) {
  const width = operating ? variant.geometry.operatingWidthMm : variant.geometry.widthMm;
  const length = operating ? variant.geometry.operatingLengthMm : variant.geometry.lengthMm;
  if (width == null || length == null) return null;
  return placement.rotationDeg % 180 === 0 ? { width, length } : { width: length, length: width };
}

export function Planner2D({ state, catalogue, selectedId, onSelect, onPlacement, onRemove, onRegenerate, onUndo, onRedo }: Props) {
  const roomWidth = state.requirements.room.widthMm.value;
  const roomLength = state.requirements.room.lengthMm.value;
  const { ref, size } = useSize(Boolean(roomWidth && roomLength));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layers, setLayers] = useState({ grid: true, zones: true, dimensions: true });
  const [invalidAttempt, setInvalidAttempt] = useState<Placement | null>(null);
  const padding = 34;
  const baseScale = roomWidth && roomLength ? Math.min((size.width - padding * 2) / roomWidth, (size.height - padding * 2) / roomLength) : 0.1;
  const scale = baseScale * zoom;
  const roomPixelWidth = (roomWidth ?? 3000) * scale;
  const roomPixelLength = (roomLength ?? 3000) * scale;
  const origin = { x: padding + pan.x, y: padding + pan.y };
  const selectedPlacement = state.placements.find((placement) => placement.variantId === selectedId);
  const selectedVariant = selectedPlacement ? variantById(catalogue, selectedPlacement.variantId) : undefined;
  const violations = useMemo(() => state.placements.flatMap((placement) => placement.violations), [state.placements]);

  const submitPlacement = async (placement: Placement, update: Record<string, unknown>) => {
    try { setInvalidAttempt(null); await onPlacement(placement.placementId, update); }
    catch (error) {
      if (error instanceof ApiError && error.status === 422) setInvalidAttempt(error.body.attempted as unknown as Placement);
      throw error;
    }
  };

  if (!roomWidth || !roomLength) return <div className="planner-empty"><RulerGraphic /><h2>Room waiting for dimensions</h2><p>Add length, width and height in the plan or tell Mara naturally.</p></div>;

  return <div className="planner-shell">
    <div className="canvas-toolbar" role="toolbar" aria-label="Room plan controls">
      <button className="icon-button" title="Undo" aria-label="Undo" onClick={onUndo}><Undo2 size={18} /></button>
      <button className="icon-button" title="Redo" aria-label="Redo" onClick={onRedo}><Redo2 size={18} /></button>
      <span className="toolbar-rule" />
      <button className="icon-button" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}><ZoomOut size={18} /></button>
      <button className="icon-button" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}><ZoomIn size={18} /></button>
      <button className="icon-button" title="Fit room" aria-label="Fit room" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 size={18} /></button>
      <span className="toolbar-rule" />
      <button className={`icon-button ${layers.grid ? "active" : ""}`} title="Toggle grid" aria-label="Toggle grid" aria-pressed={layers.grid} onClick={() => setLayers((value) => ({ ...value, grid: !value.grid }))}><Grid3X3 size={18} /></button>
      <button className={`icon-button ${layers.zones ? "active" : ""}`} title="Toggle operating zones" aria-label="Toggle operating zones" aria-pressed={layers.zones} onClick={() => setLayers((value) => ({ ...value, zones: !value.zones }))}>{layers.zones ? <Eye size={18} /> : <EyeOff size={18} />}</button>
      <button className="text-button recalculate" onClick={onRegenerate}><Move size={16} />Recalculate unlocked</button>
    </div>
    <div className="konva-wrap" ref={ref} data-testid="planner-2d">
      <Stage width={size.width} height={size.height} onMouseDown={(event) => { if (event.target === event.target.getStage()) onSelect(null); }}>
        <Layer>
          <Rect x={origin.x} y={origin.y} width={roomPixelWidth} height={roomPixelLength} fill="#f7f9f8" stroke="#526064" strokeWidth={2} />
          {layers.grid && <Grid origin={origin} widthMm={roomWidth} lengthMm={roomLength} scale={scale} />}
          {state.requirements.doors.map((door) => <DoorShape key={door.doorId} door={door} origin={origin} roomWidth={roomWidth} roomLength={roomLength} scale={scale} />)}
          {state.placements.map((placement, index) => {
            const variant = variantById(catalogue, placement.variantId);
            if (!variant) return null;
            const footprint = dimensions(variant, placement)!;
            const operating = dimensions(variant, placement, true);
            const invalid = placement.validationStatus === "invalid";
            const selected = selectedId === placement.variantId;
            const x = origin.x + placement.xMm * scale; const y = origin.y + placement.zMm * scale;
            const opX = operating ? x - (operating.width - footprint.width) * scale / 2 : x;
            const opY = operating ? y - (operating.length - footprint.length) * scale / 2 : y;
            return <Group key={placement.placementId}>
              {layers.zones && operating && <Rect x={opX} y={opY} width={operating.width * scale} height={operating.length * scale} fill={invalid ? "rgba(180,35,24,.10)" : "rgba(8,127,115,.07)"} stroke={invalid ? "#b42318" : "#087f73"} dash={[7, 5]} strokeWidth={1} />}
              <Group x={x} y={y} draggable={!placement.locked} onClick={() => onSelect(placement.variantId)} onTap={() => onSelect(placement.variantId)} onDragEnd={(event) => submitPlacement(placement, { xMm: Math.round((event.target.x() - origin.x) / scale / 50) * 50, zMm: Math.round((event.target.y() - origin.y) / scale / 50) * 50 })}>
                <Rect width={footprint.width * scale} height={footprint.length * scale} fill={categoryColour[variant.category]} opacity={0.88} stroke={invalid ? "#b42318" : selected ? "#de674b" : "#ffffff"} strokeWidth={selected ? 4 : 2} cornerRadius={2} shadowColor="#1b2427" shadowBlur={selected ? 5 : 1} shadowOpacity={0.15} />
                {variant.category === "rack" && <RackTop width={footprint.width * scale} height={footprint.length * scale} />}
                {variant.category === "bench" && <BenchTop width={footprint.width * scale} height={footprint.length * scale} />}
                {variant.category === "cardio" && <CardioTop width={footprint.width * scale} height={footprint.length * scale} />}
                <Text text={`${index + 1}`} x={5} y={5} width={22} align="center" fontSize={12} fontStyle="bold" fill="#ffffff" />
                {placement.locked && <Text text="LOCK" x={5} y={Math.max(20, footprint.length * scale - 17)} fontSize={9} fontStyle="bold" fill="#ffffff" />}
              </Group>
            </Group>;
          })}
          {invalidAttempt && (() => {
            const variant = variantById(catalogue, invalidAttempt.variantId); if (!variant) return null; const footprint = dimensions(variant, invalidAttempt)!;
            return <Rect x={origin.x + invalidAttempt.xMm * scale} y={origin.y + invalidAttempt.zMm * scale} width={footprint.width * scale} height={footprint.length * scale} stroke="#b42318" fill="rgba(180,35,24,.2)" dash={[5, 4]} strokeWidth={3} />;
          })()}
          {layers.dimensions && <><Text text={`${(roomWidth / 1000).toFixed(2)} m`} x={origin.x} y={8} width={roomPixelWidth} align="center" fontSize={12} fill="#526064" /><Text text={`${(roomLength / 1000).toFixed(2)} m`} x={2} y={origin.y + roomPixelLength / 2} fontSize={12} fill="#526064" rotation={-90} /></>}
        </Layer>
      </Stage>
    </div>
    {invalidAttempt?.violations.length ? <div className="violation-panel" tabIndex={-1} role="alert"><strong>Position not accepted</strong>{invalidAttempt.violations.map((violation) => <span key={violation.code}>{violation.message}</span>)}</div> : violations.length > 0 && <div className="violation-panel" role="status"><strong>{violations.length} room check{violations.length === 1 ? "" : "s"} need attention</strong>{violations.slice(0, 3).map((violation) => <span key={`${violation.code}-${violation.itemIds.join("-")}`}>{violation.message}</span>)}</div>}
    {selectedPlacement && selectedVariant && <PlacementControls placement={selectedPlacement} variant={selectedVariant} onChange={(update) => submitPlacement(selectedPlacement, update)} onRemove={() => onRemove(selectedPlacement.placementId)} />}
    <PlacementTable state={state} catalogue={catalogue} onSelect={onSelect} onChange={submitPlacement} />
  </div>;
}

function Grid({ origin, widthMm, lengthMm, scale }: { origin: { x: number; y: number }; widthMm: number; lengthMm: number; scale: number }) {
  const lines = [];
  for (let x = 500; x < widthMm; x += 500) lines.push(<Line key={`x-${x}`} points={[origin.x + x * scale, origin.y, origin.x + x * scale, origin.y + lengthMm * scale]} stroke="#d8e0de" strokeWidth={x % 1000 === 0 ? 1 : 0.5} />);
  for (let z = 500; z < lengthMm; z += 500) lines.push(<Line key={`z-${z}`} points={[origin.x, origin.y + z * scale, origin.x + widthMm * scale, origin.y + z * scale]} stroke="#d8e0de" strokeWidth={z % 1000 === 0 ? 1 : 0.5} />);
  return <>{lines}</>;
}
function DoorShape({ door, origin, roomWidth, roomLength, scale }: { door: PlanState["requirements"]["doors"][number]; origin: { x: number; y: number }; roomWidth: number; roomLength: number; scale: number }) {
  const x = door.wall === "east" ? roomWidth - door.widthMm : door.wall === "west" ? 0 : door.offsetMm;
  const z = door.wall === "south" ? roomLength - door.widthMm : door.wall === "north" ? 0 : door.offsetMm;
  const width = ["north", "south"].includes(door.wall) ? door.widthMm : door.widthMm;
  return <Rect x={origin.x + x * scale} y={origin.y + z * scale} width={width * scale} height={door.widthMm * scale} fill="rgba(222,103,75,.14)" stroke="#de674b" dash={[4, 3]} />;
}
function RackTop({ width, height }: { width: number; height: number }) { return <><Rect x={3} y={3} width={6} height={Math.max(8, height - 6)} fill="#ffffff" opacity={0.8} /><Rect x={Math.max(3, width - 9)} y={3} width={6} height={Math.max(8, height - 6)} fill="#ffffff" opacity={0.8} /><Line points={[6, 6, width - 6, 6]} stroke="#ffffff" strokeWidth={2} /></>; }
function BenchTop({ width, height }: { width: number; height: number }) { return <Rect x={width * .2} y={height * .08} width={width * .6} height={height * .84} fill="#ffffff" opacity={0.34} cornerRadius={3} />; }
function CardioTop({ width, height }: { width: number; height: number }) { return <><Line points={[width / 2, 8, width / 2, height - 8]} stroke="#ffffff" strokeWidth={4} /><Rect x={width * .2} y={height * .6} width={width * .6} height={Math.min(20, height * .18)} fill="#ffffff" opacity={0.35} /></>; }

function PlacementControls({ placement, variant, onChange, onRemove }: { placement: Placement; variant: Variant; onChange: (update: Record<string, unknown>) => Promise<void>; onRemove: () => Promise<void> }) {
  return <div className="placement-controls"><div><strong>{variant.name}</strong><small>{placement.validationStatus.replaceAll("_", " ")}</small></div><label>West<input type="number" value={placement.xMm} step={10} onChange={(event) => onChange({ xMm: Number(event.target.value) })} /><span>mm</span></label><label>North<input type="number" value={placement.zMm} step={10} onChange={(event) => onChange({ zMm: Number(event.target.value) })} /><span>mm</span></label><button className="icon-button" title="Nudge west" aria-label="Nudge west" onClick={() => onChange({ xMm: placement.xMm - 50 })}><Minus size={17} /></button><button className="icon-button" title="Rotate 90 degrees" aria-label="Rotate 90 degrees" onClick={() => onChange({ rotationDeg: (placement.rotationDeg + 90) % 360 })}><RotateCw size={17} /></button><button className="icon-button" title={placement.locked ? "Unlock" : "Lock"} aria-label={placement.locked ? "Unlock placement" : "Lock placement"} onClick={() => onChange({ locked: !placement.locked })}>{placement.locked ? <Unlock size={17} /> : <Lock size={17} />}</button><button className="text-button danger" onClick={onRemove}>Remove</button></div>;
}
function PlacementTable({ state, catalogue, onSelect, onChange }: { state: PlanState; catalogue: Variant[]; onSelect: (id: string) => void; onChange: (placement: Placement, update: Record<string, unknown>) => Promise<void> }) {
  if (!state.placements.length) return null;
  return <div className="placement-table-wrap"><h3>Placement details</h3><table className="placement-table"><thead><tr><th>Item</th><th>Position</th><th>Rotation</th><th>Lock</th><th>Fit</th><th>Action</th></tr></thead><tbody>{state.placements.map((placement) => { const item = variantById(catalogue, placement.variantId); return <tr key={placement.placementId}><td>{item?.name}</td><td>{placement.xMm} mm west, {placement.zMm} mm north</td><td>{placement.rotationDeg}°</td><td>{placement.locked ? "Locked" : "Unlocked"}</td><td>{placement.validationStatus}</td><td><button className="text-button" onClick={() => onSelect(placement.variantId)}>Select</button><button className="icon-button small" aria-label={`Nudge ${item?.name} east`} title="Nudge east" onClick={() => onChange(placement, { xMm: placement.xMm + 50 })}><Move size={15} /></button></td></tr>; })}</tbody></table></div>;
}
function RulerGraphic() { return <div className="ruler-graphic" aria-hidden="true"><span /><span /><span /><span /><span /></div>; }
