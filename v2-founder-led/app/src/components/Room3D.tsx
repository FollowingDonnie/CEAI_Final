import { useEffect, useRef, useState } from "react";
import { Box, Dumbbell, Eye, Maximize2 } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Placement, PlanState, Variant } from "../../shared/types";
import { categoryColour, variantById } from "../utils";
import { deriveVisualInventory, type VisualInventoryItem } from "../visual-inventory";

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
    for (const item of deriveVisualInventory(state, catalogue)) {
      const object = visualInventoryObject(item, selectedId === item.variant.variantId, catalogue);
      object.userData.variantId = item.variant.variantId;
      object.traverse((child) => { child.userData.variantId = item.variant.variantId; });
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
  }, [roomWidth, roomLength, roomHeight, state.placements, state.selectedItems, catalogue, selectedId, wallMode, onSelect]);

  if (!roomWidth || !roomLength || !roomHeight) return <div className="planner-empty"><Dumbbell size={38} /><h2>Your training space starts here</h2><p>Add the room dimensions so Mara can begin arranging equipment.</p></div>;
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
    const twoPost = ["s-series", "f-series"].includes(variant.familyId);
    const postPositions = twoPost
      ? [[upright, y, depth - upright], [width - upright, y, depth - upright]]
      : [[upright, y, upright], [width - upright, y, upright], [upright, y, depth - upright], [width - upright, y, depth - upright]];
    postPositions.forEach(([x, py, z]) => { const post = box(.06, height, .06, colour, .68); post.position.set(x, py, z); group.add(post); });
    const topRear = box(width, .055, .055, colour, .68); topRear.position.set(width / 2, height - .04, depth - .04); group.add(topRear);
    if (!twoPost) {
      const topFront = topRear.clone(); topFront.position.z = .04; group.add(topFront);
      const side = box(.055, .055, depth, colour, .68); side.position.set(.04, height - .04, depth / 2); group.add(side); const side2 = side.clone(); side2.position.x = width - .04; group.add(side2);
    }
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
    if (variant.variantId === "st10-storage-vertical") {
      const baseX = box(width * .92, .06, .09, "#30393b", .6); baseX.position.set(width / 2, .03, depth / 2); group.add(baseX);
      const baseZ = box(.09, .06, depth * .92, "#30393b", .6); baseZ.position.set(width / 2, .03, depth / 2); group.add(baseZ);
      const upright = box(.09, height * .9, .09, colour, .68); upright.position.set(width / 2, height * .45 + .05, depth / 2); group.add(upright);
      for (const y of [.55, .88, 1.16]) for (const side of [-1, 1]) {
        const peg = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, width * .36, 16), new THREE.MeshStandardMaterial({ color: colour, roughness: .36, metalness: .7 }));
        peg.rotation.z = Math.PI / 2; peg.position.set(width / 2 + side * width * .2, Math.min(y, height * .84), depth / 2); group.add(peg);
      }
    } else {
      for (const x of [.045, width - .045]) for (const z of [.045, depth - .045]) { const post = box(.06, height, .06, colour, .55); post.position.set(x, height / 2, z); group.add(post); }
      for (const y of [.08, height * .52, height - .08]) { const shelf = box(width, .06, depth, colour, .4); shelf.position.set(width / 2, y, depth / 2); group.add(shelf); }
    }
  } else {
    const body = box(width, Math.max(.04, Math.min(height, .3)), depth, colour); body.position.set(width / 2, Math.max(.02, Math.min(height, .3) / 2), depth / 2); group.add(body);
  }
  group.position.set(placement.xMm / 1000, 0, placement.zMm / 1000);
  return group;
}

function visualInventoryObject(item: VisualInventoryItem, selected: boolean, catalogue: Variant[]) {
  const group = new THREE.Group();
  const colour = selected ? "#de674b" : categoryColour[item.variant.category];
  const x = item.xMm / 1000;
  const z = item.zMm / 1000;
  const parent = item.parentVariantId ? catalogue.find((variant) => variant.variantId === item.parentVariantId) : undefined;
  const parentRotated = item.rotationDeg === 90;
  const parentWidth = parent ? (parentRotated ? parent.geometry.lengthMm : parent.geometry.widthMm) / 1000 : 0;
  const parentDepth = parent ? (parentRotated ? parent.geometry.widthMm : parent.geometry.lengthMm) / 1000 : 0;

  if (item.mode === "flooring") {
    const width = item.variant.geometry.widthMm / 1000;
    const depth = item.variant.geometry.lengthMm / 1000;
    const mat = box(width, .025, depth, selected ? "#de674b" : "#343d3e");
    mat.position.set(width / 2, .013, depth / 2); group.add(mat);
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0x66716f });
    for (let offset = .5; offset < width; offset += .5) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(offset, .027, 0), new THREE.Vector3(offset, .027, depth)]);
      group.add(new THREE.Line(geometry, seamMaterial));
    }
    group.position.set(x, 0, z);
    return group;
  }

  if (item.mode === "racked_barbell" || item.mode === "loose_barbell") {
    const length = item.variant.geometry.widthMm / 1000;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, length, 20), new THREE.MeshStandardMaterial({ color: colour, roughness: .3, metalness: .85 }));
    const racked = item.mode === "racked_barbell";
    if (item.rotationDeg === 0) bar.rotation.z = Math.PI / 2; else bar.rotation.x = Math.PI / 2;
    group.add(bar);
    for (const side of [-1, 1]) {
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .045, 20), new THREE.MeshStandardMaterial({ color: "#1b2427", roughness: .48, metalness: .5 }));
      if (item.rotationDeg === 0) { collar.rotation.z = Math.PI / 2; collar.position.x = side * length * .39; }
      else { collar.rotation.x = Math.PI / 2; collar.position.z = side * length * .39; }
      group.add(collar);
    }
    group.position.set(x + (item.rotationDeg === 0 ? length / 2 : 0), racked ? 1.24 : .09, z + (item.rotationDeg === 90 ? length / 2 : 0));
    return group;
  }

  if (item.mode === "stacked_plates") {
    for (let index = 0; index < 5; index += 1) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.22 - index * .012, .22 - index * .012, .045, 28), new THREE.MeshStandardMaterial({ color: index % 2 ? "#30393b" : colour, roughness: .72 }));
      plate.position.y = .024 + index * .048; group.add(plate);
    }
    group.position.set(x + .24, 0, z + .24);
    return group;
  }

  if (item.mode === "stored_plates") {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .62, 16), new THREE.MeshStandardMaterial({ color: "#283133", metalness: .7, roughness: .35 }));
    peg.rotation.z = Math.PI / 2; peg.position.y = .55; group.add(peg);
    for (let index = 0; index < 5; index += 1) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.20, .20, .038, 28), new THREE.MeshStandardMaterial({ color: index % 2 ? "#30393b" : colour, roughness: .7 }));
      plate.rotation.z = Math.PI / 2; plate.position.set(-.16 + index * .042, .55, 0); group.add(plate);
    }
    group.position.set(x, 0, z);
    return group;
  }

  if (item.mode === "mounted_attachment") {
    if (item.variant.variantId === "a18-plate-storage") {
      for (const side of [-1, 1]) { const peg = box(.42, .045, .045, colour, .7); peg.position.set(side * .34, .54, 0); group.add(peg); }
    } else if (item.variant.variantId === "a08-j-hooks") {
      for (const side of [-1, 1]) { const hook = box(.09, .16, .14, colour, .7); hook.position.set(side * .42, 1.18, .08); group.add(hook); }
    } else if (item.variant.variantId === "a32-gym-rings") {
      for (const side of [-1, 1]) {
        const strap = box(.012, .72, .012, "#30393b", .5); strap.position.set(side * .22, 1.58, .12); group.add(strap);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.09, .013, 10, 28), new THREE.MeshStandardMaterial({ color: colour, roughness: .62 })); ring.position.set(side * .22, 1.18, .12); group.add(ring);
      }
    } else if (item.variant.variantId === "a12-spotter-arms" && parent?.category === "rack") {
      const fourPost = ["h-series", "p-series"].includes(parent.familyId);
      const inset = .055;
      const armDepth = fourPost ? Math.max(.3, parentDepth - inset * 2) : Math.min(.65, Math.max(.45, parentDepth * .72));
      const centreZ = fourPost ? parentDepth / 2 : Math.max(inset + armDepth / 2, parentDepth - inset - armDepth / 2);
      for (const xPosition of [inset, parentWidth - inset]) {
        const arm = box(.075, .09, armDepth, colour, .65); arm.position.set(xPosition, .82, centreZ); group.add(arm);
        const lip = box(.075, .16, .08, colour, .65); lip.position.set(xPosition, .88, fourPost ? inset : Math.max(inset, centreZ - armDepth / 2)); group.add(lip);
      }
      group.position.set(x, 0, z);
      return group;
    } else if (item.variant.variantId === "a10-dip-attachment") {
      for (const side of [-1, 1]) { const handle = box(.04, .04, .52, colour, .7); handle.position.set(side * .24, 1.15, .3); group.add(handle); }
    } else {
      const body = box(.32, .12, .38, colour, .55); body.position.set(0, .75, .18); group.add(body);
    }
    group.position.set(x + .65, 0, z + .22);
    if (item.rotationDeg === 90) group.rotation.y = Math.PI / 2;
    return group;
  }

  if (item.mode === "stored_bands") {
    const band = new THREE.Mesh(new THREE.TorusGeometry(.18, .012, 10, 36), new THREE.MeshStandardMaterial({ color: colour, roughness: .65 }));
    band.rotation.y = Math.PI / 2; band.position.set(.04, 1.25, .12); group.add(band);
    group.position.set(x, 0, z); return group;
  }

  const body = box(Math.min(.42, item.variant.geometry.widthMm / 1000), Math.min(.18, item.variant.geometry.heightMm / 1000), Math.min(.42, item.variant.geometry.lengthMm / 1000), colour);
  body.position.y = Math.min(.09, item.variant.geometry.heightMm / 2000); group.add(body); group.position.set(x, 0, z);
  return group;
}
