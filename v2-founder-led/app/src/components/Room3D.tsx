import { useEffect, useRef, useState } from "react";
import { Box, Eye, Maximize2 } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Placement, PlanState, Variant } from "../../shared/types";
import { categoryColour, variantById } from "../utils";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  selectedId: string | null;
  onSelect: (variantId: string | null) => void;
  onReturn2D: () => void;
}

type WallMode = "front_hidden" | "half" | "all";

export function Room3D({ state, catalogue, selectedId, onSelect, onReturn2D }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [wallMode, setWallMode] = useState<WallMode>("front_hidden");
  const [failure, setFailure] = useState<string | null>(null);
  const roomWidth = state.requirements.room.widthMm.value;
  const roomLength = state.requirements.room.lengthMm.value;
  const roomHeight = state.requirements.room.heightMm.value;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !roomWidth || !roomLength || !roomHeight) return;
    let frame = 0;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }); }
    catch { setFailure("3D view is unavailable on this device. Your editable 2D plan and room details are still available."); return; }
    setFailure(null);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf7f9f8, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.dataset.testid = "three-canvas";
    renderer.domElement.setAttribute("aria-label", "Read-only three-dimensional room plan");
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    const roomW = roomWidth / 1000; const roomL = roomLength / 1000; const roomH = roomHeight / 1000;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7f8f8b, 2.0));
    const directional = new THREE.DirectionalLight(0xffffff, 2.1); directional.position.set(roomW * .5, roomH * 1.7, roomL * .2); scene.add(directional);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomL), new THREE.MeshStandardMaterial({ color: 0xe9efed, roughness: 0.86, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(roomW / 2, 0, roomL / 2); scene.add(floor);
    const grid = new THREE.GridHelper(Math.max(roomW, roomL), Math.ceil(Math.max(roomW, roomL) * 2), 0x96aaa5, 0xd8e0de); grid.position.set(roomW / 2, .002, roomL / 2); scene.add(grid);

    const walls = makeWalls(roomW, roomL, roomH, wallMode); scene.add(walls);
    const selectable: THREE.Object3D[] = [];
    for (const placement of state.placements) {
      const variant = variantById(catalogue, placement.variantId); if (!variant) continue;
      const object = equipmentObject(variant, placement, selectedId === variant.variantId);
      object.userData.variantId = variant.variantId;
      object.traverse((child) => { child.userData.variantId = variant.variantId; });
      scene.add(object); selectable.push(object);
    }

    function frameRoom() {
      const distance = Math.max(roomW, roomL) * 1.3 + roomH;
      camera.position.set(roomW * 1.15, Math.max(roomH * 1.25, 2.8), roomL + distance * .55);
      controls.target.set(roomW / 2, roomH * .32, roomL / 2);
      camera.near = .01; camera.far = Math.max(50, distance * 5); camera.updateProjectionMatrix(); controls.update();
    }
    frameRoom(); resetRef.current = frameRoom;

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const click = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(selectable, true)[0];
      onSelect(hit?.object.userData.variantId ?? null);
    };
    renderer.domElement.addEventListener("click", click);
    renderer.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); setFailure("3D view is unavailable on this device. Your editable 2D plan and room details are still available."); });

    const resize = () => {
      const width = Math.max(2, host.clientWidth); const height = Math.max(2, host.clientHeight);
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const animate = () => { controls.update(); renderer.render(scene, camera); renderer.domElement.dataset.renderReady = "true"; frame = requestAnimationFrame(animate); };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener("click", click); controls.dispose(); renderer.dispose(); scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => material.dispose()); } }); host.replaceChildren(); };
  }, [roomWidth, roomLength, roomHeight, state.placements, catalogue, selectedId, wallMode, onSelect]);

  if (!roomWidth || !roomLength || !roomHeight) return <div className="planner-empty"><Box size={38} /><h2>Room waiting for dimensions</h2></div>;
  if (failure) return <div className="three-fallback" role="status"><Box size={40} /><p>{failure}</p><button className="primary-button" onClick={onReturn2D}>Return to 2D</button></div>;
  return <div className="three-shell">
    <div className="canvas-toolbar three-toolbar"><button className="icon-button" title="Reset view" aria-label="Reset 3D view" onClick={() => resetRef.current?.()}><Maximize2 size={18} /></button><button className="quiet-button" title="Cycle walls" onClick={() => setWallMode((mode) => mode === "front_hidden" ? "half" : mode === "half" ? "all" : "front_hidden")}><Eye size={17} />Walls: {wallMode.replace("_", " ")}</button><span className="read-only-label">Read-only placement view</span></div>
    <div className="three-canvas-host" ref={hostRef} data-testid="room-3d" />
    <p className="three-caption">Orbit, zoom and inspect. Move equipment in the 2D plan.</p>
  </div>;
}

function makeWalls(width: number, length: number, height: number, mode: WallMode) {
  const group = new THREE.Group(); const material = new THREE.MeshStandardMaterial({ color: 0xf0f4f3, transparent: true, opacity: .76, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material); back.position.set(width / 2, height / 2, 0); group.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(length, height), material); left.rotation.y = Math.PI / 2; left.position.set(0, height / 2, length / 2); group.add(left);
  const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = width; group.add(right);
  if (mode !== "front_hidden") { const frontHeight = mode === "half" ? height / 2 : height; const front = new THREE.Mesh(new THREE.PlaneGeometry(width, frontHeight), material); front.rotation.y = Math.PI; front.position.set(width / 2, frontHeight / 2, length); group.add(front); }
  return group;
}

function box(width: number, height: number, depth: number, colour: string, metalness = .1) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color: colour, roughness: .62, metalness }));
}

function equipmentObject(variant: Variant, placement: Placement, selected: boolean) {
  const group = new THREE.Group(); const rotated = placement.rotationDeg % 180 !== 0;
  const width = (rotated ? variant.geometry.lengthMm : variant.geometry.widthMm) / 1000;
  const depth = (rotated ? variant.geometry.widthMm : variant.geometry.lengthMm) / 1000;
  const height = variant.geometry.heightMm / 1000;
  const colour = selected ? "#de674b" : categoryColour[variant.category];
  if (variant.category === "rack") {
    const upright = .055; const y = height / 2;
    [[upright, y, upright], [width - upright, y, upright], [upright, y, depth - upright], [width - upright, y, depth - upright]].forEach(([x, py, z]) => { const post = box(.06, height, .06, colour, .68); post.position.set(x, py, z); group.add(post); });
    const topFront = box(width, .055, .055, colour, .68); topFront.position.set(width / 2, height - .04, .04); group.add(topFront);
    const topRear = topFront.clone(); topRear.position.z = depth - .04; group.add(topRear);
    const side = box(.055, .055, depth, colour, .68); side.position.set(.04, height - .04, depth / 2); group.add(side); const side2 = side.clone(); side2.position.x = width - .04; group.add(side2);
  } else if (variant.category === "bench") {
    const pad = box(width * .72, .11, depth * .92, colour); pad.position.set(width / 2, height * .82, depth / 2); group.add(pad);
    const frame = box(.08, height * .72, depth * .65, "#313a3c", .55); frame.position.set(width / 2, height * .38, depth / 2); group.add(frame);
    const feet = box(width, .06, .12, "#313a3c", .55); feet.position.set(width / 2, .04, depth * .2); group.add(feet); const feet2 = feet.clone(); feet2.position.z = depth * .8; group.add(feet2);
  } else if (variant.category === "cardio" && variant.tags.includes("rowing_cardio")) {
    const rail = box(.09, .08, depth * .82, "#3e474a", .55); rail.position.set(width / 2, .34, depth * .55); rail.rotation.x = -.08; group.add(rail);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(width * .28, width * .28, .18, 32), new THREE.MeshStandardMaterial({ color: colour, roughness: .55, metalness: .2 })); wheel.rotation.z = Math.PI / 2; wheel.position.set(width / 2, .38, depth * .12); group.add(wheel);
    const seat = box(width * .5, .08, .28, colour); seat.position.set(width / 2, .48, depth * .53); group.add(seat);
  } else if (variant.category === "cardio") {
    const body = box(width * .62, .2, depth * .7, colour); body.position.set(width / 2, .14, depth / 2); group.add(body);
    const column = box(.09, height * .72, .09, "#3e474a", .45); column.position.set(width / 2, height * .4, depth * .28); column.rotation.x = -.18; group.add(column);
    const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(width * .28, width * .28, .13, 28), new THREE.MeshStandardMaterial({ color: colour, roughness: .55 })); flywheel.rotation.z = Math.PI / 2; flywheel.position.set(width / 2, .38, depth * .58); group.add(flywheel);
  } else if (["dumbbells", "kettlebell"].includes(variant.category)) {
    for (let index = 0; index < 4; index += 1) { const weight = box(width * .17, Math.min(.28, height), depth * .24, colour, .45); weight.position.set(width * (.18 + index * .21), Math.min(.16, height / 2), depth / 2); group.add(weight); }
  } else if (variant.category === "storage") {
    const frame = box(width, height, depth, colour, .35); group.add(frame); frame.position.set(width / 2, height / 2, depth / 2);
    const cut = box(width * .86, height * .72, depth * 1.02, "#f7f9f8"); cut.position.set(width / 2, height * .53, depth / 2); group.add(cut);
  } else {
    const body = box(width, Math.max(.04, Math.min(height, .3)), depth, colour); body.position.set(width / 2, Math.max(.02, Math.min(height, .3) / 2), depth / 2); group.add(body);
  }
  group.position.set(placement.xMm / 1000, 0, placement.zMm / 1000);
  return group;
}
