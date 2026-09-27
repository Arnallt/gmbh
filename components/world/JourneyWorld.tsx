"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { clamp, journey, METALS, type MetalId, type SceneId } from "@/lib/journey";

/**
 * One fixed WebGL world behind every chapter below the hero. Each chapter publishes its
 * scroll progress to `journey`; this loop poses the matching scene from that progress.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Scene = { id: SceneId; holder: THREE.Group; update: (p: number, v: number, t: number) => void };

const LAYERS = ["Blockchain networks", "Smart contracts", "Tokenisation engine", "ComTech APIs", "Your platform"];
const AUDIENCES = ["Banks", "Asset managers", "Corporates", "FinTechs"];
const PARTNERS = ["Custodians", "Vaults", "KYC / AML", "Legal advisers", "Auditors", "DLT networks", "Payment providers", "Trading venues"];

function metalColor(id: MetalId) {
  const [r, g, b] = METALS[id].rgb;
  return new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}

function brandTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 692;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 1024, 692);
  g.addColorStop(0, "#f4f0e8");
  g.addColorStop(1, "#e6e0d4");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 692);
  x.strokeStyle = "rgba(160,120,50,0.35)";
  x.lineWidth = 2;
  x.strokeRect(36, 36, 952, 620);
  x.fillStyle = "#b8893b";
  x.fillRect(96, 96, 64, 64);
  x.fillStyle = "#f4f0e8";
  x.fillRect(110, 110, 36, 36);
  x.fillStyle = "#6f6352";
  x.font = "500 30px Helvetica, Arial, sans-serif";
  x.textAlign = "left";
  x.letterSpacing = "12px";
  x.fillText("YOUR BRAND", 96, 600);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function JourneyWorld() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.domElement.className = "journey-canvas";
    host.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.domElement.className = "journey-labels";
    host.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b0a08, 12, 30);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    const key = new THREE.DirectionalLight(0xfff0d6, 2.4);
    key.position.set(-4, 6, 5);
    const rim = new THREE.DirectionalLight(0xffcf8a, 1.4);
    rim.position.set(5, -2, -5);
    scene.add(key, rim);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    const root = new THREE.Group();
    scene.add(root);

    // Materials
    const gold = new THREE.MeshPhysicalMaterial({ color: metalColor("Au"), metalness: 1, roughness: 0.2, envMapIntensity: 1.0 });
    const goldFace = new THREE.MeshPhysicalMaterial({ color: metalColor("Au"), metalness: 1, roughness: 0.38, envMapIntensity: 0.9 });
    const platinum = new THREE.MeshPhysicalMaterial({ color: metalColor("Pt"), metalness: 1, roughness: 0.3, envMapIntensity: 1.1 });
    const ingotMat = gold.clone();
    const ingotFace = goldFace.clone();
    const hairGold = (opacity: number) => new THREE.MeshBasicMaterial({ color: 0xdcbd7c, transparent: true, opacity, depthWrite: false });

    const tokenGeo = new RoundedBoxGeometry(1.3, 1.3, 0.14, 4, 0.07);
    const faceGeo = new RoundedBoxGeometry(0.86, 0.86, 0.03, 2, 0.012);
    const makeToken = (s: number, body = gold, face = goldFace) => {
      const g = new THREE.Group();
      const f1 = new THREE.Mesh(faceGeo, face);
      f1.position.z = 0.074;
      const f2 = f1.clone();
      f2.position.z = -0.074;
      g.add(new THREE.Mesh(tokenGeo, body), f1, f2);
      g.scale.setScalar(s);
      return g;
    };

    const scenes: Scene[] = [];
    const addScene = (id: SceneId, build: (g: THREE.Group) => Scene["update"]) => {
      const holder = new THREE.Group();
      holder.visible = false;
      root.add(holder);
      scenes.push({ id, holder, update: build(holder) });
    };

    // ── 1. Three ways in: a token at the centre of three orbits ──────────────────
    addScene("pillars", (g) => {
      const token = makeToken(1.05);
      g.add(token);
      const radii = [2.3, 2.75, 3.2];
      const tilts: [number, number, number][] = [[1.3, 0, 0], [1.05, 0.95, 0.25], [1.05, -0.95, -0.25]];
      const rings = radii.map((r, i) => {
        const pivot = new THREE.Group();
        pivot.rotation.set(...tilts[i]);
        const mat = hairGold(0.15);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 256), mat);
        const sat = makeToken(0.16);
        pivot.add(ring, sat);
        g.add(pivot);
        return { mat, sat, r };
      });
      return (p, _v, t) => {
        const active = Math.min(2, Math.floor(p * 3));
        token.rotation.set(0.22 * Math.sin(t * 0.6), t * 0.3 + p * Math.PI * 2.5, 0.05);
        rings.forEach((ring, i) => {
          const on = i === active;
          ring.mat.opacity = lerp(ring.mat.opacity, on ? 0.95 : 0.13, 0.08);
          const a = t * (0.22 + i * 0.06) + p * 5 + i * 2.1;
          ring.sat.position.set(Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0);
          ring.sat.rotation.set(t * 0.8, t, 0);
          ring.sat.scale.setScalar(lerp(ring.sat.scale.x, on ? 0.3 : 0.14, 0.08));
        });
        g.rotation.set(0.12, -0.35 + p * 0.7, 0);
      };
    });

    // ── 2. Architecture: layers drop in and stack, your platform lands on top ────
    addScene("stack", (g) => {
      const plateGeo = new RoundedBoxGeometry(3.4, 0.1, 2.3, 3, 0.04);
      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 0.1, 2.3));
      const plateMat = new THREE.MeshPhysicalMaterial({ color: 0x17140f, metalness: 0.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2, envMapIntensity: 0.9 });
      const brandMat = new THREE.MeshPhysicalMaterial({ color: 0xf1ede6, metalness: 0, roughness: 0.6 });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.16), new THREE.MeshBasicMaterial({ map: brandTexture(), toneMapped: false }));
      screen.rotation.x = -Math.PI / 2;
      screen.position.y = 0.052;
      const plates = LAYERS.map((_, i) => {
        const top = i === LAYERS.length - 1;
        const grp = new THREE.Group();
        const mesh = new THREE.Mesh(plateGeo, top ? brandMat : plateMat);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xdcbd7c, transparent: true, opacity: 0 });
        grp.add(mesh, new THREE.LineSegments(edgeGeo, lineMat));
        if (top) grp.add(screen);
        g.add(grp);
        return { grp, lineMat };
      });
      const token = makeToken(0.42);
      g.add(token);
      const gap = 0.3;
      return (p, _v, t) => {
        const build = clamp(p / 0.72) * 5.4;
        plates.forEach(({ grp, lineMat }, i) => {
          const local = easeInOut(clamp((build - i) / 1.4));
          const finalY = (i - 2) * gap;
          grp.position.y = lerp(finalY + 4.5 + i * 0.35, finalY, local);
          grp.rotation.y = (1 - local) * (i % 2 ? 0.9 : -0.9);
          grp.visible = local > 0.001;
          const fresh = clamp(1 - Math.abs(build - i - 1.2) / 1.2);
          lineMat.opacity = local * (0.35 + fresh * 0.65);
        });
        const drop = easeOut(clamp((p - 0.74) / 0.16));
        const topY = 2 * gap + 0.05 + 0.1;
        token.visible = p > 0.72;
        token.position.set(0.9, lerp(3.2, topY, drop), 0.35);
        token.rotation.set(lerp(0, -Math.PI / 2, drop), (1 - drop) * 6 + t * 0.2 * (1 - drop), 0);
        g.rotation.set(0.5, -0.7 + p * 0.55, 0);
      };
    });

    // ── 3. Gold: an ingot that splits into programmable units ─────────────────────
    addScene("gold", (g) => {
      const ingotGeo = new RoundedBoxGeometry(2.6, 0.72, 1.3, 5, 0.09);
      const pos = ingotGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = lerp(1, 0.78, (pos.getY(i) + 0.36) / 0.72);
        pos.setX(i, pos.getX(i) * k);
        pos.setZ(i, pos.getZ(i) * lerp(1, 0.82, (pos.getY(i) + 0.36) / 0.72));
      }
      ingotGeo.computeVertexNormals();
      const ingot = new THREE.Mesh(ingotGeo, ingotMat);
      g.add(ingot);

      const cols = 8, rows = 6, N = cols * rows;
      const tileGeo = new RoundedBoxGeometry(0.34, 0.34, 0.05, 2, 0.016);
      const tiles = new THREE.InstancedMesh(tileGeo, ingotMat, N);
      tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      g.add(tiles);
      const start: THREE.Vector3[] = [], end: THREE.Vector3[] = [], delay: number[] = [];
      for (let i = 0; i < N; i++) {
        const sx = i % 6, sy = Math.floor(i / 24), sz = Math.floor(i / 6) % 4;
        start.push(new THREE.Vector3(-0.85 + sx * 0.34, -0.12 + sy * 0.24, -0.39 + sz * 0.26));
        const ex = i % cols, ey = Math.floor(i / cols);
        end.push(new THREE.Vector3((ex - (cols - 1) / 2) * 0.42, ((rows - 1) / 2 - ey) * 0.42, 0.4));
        delay.push(((ex + ey * 0.6) / (cols + rows * 0.6)) * 0.45 + Math.random() * 0.05);
      }
      const d = new THREE.Object3D();
      const target = new THREE.Color();
      return (p, _v, t) => {
        target.copy(metalColor(journey.metal));
        ingotMat.color.lerp(target, 0.08);
        ingotFace.color.copy(ingotMat.color);
        const q = clamp((p - 0.3) / 0.5);
        const settle = easeInOut(q);
        ingot.scale.setScalar(Math.max(0.0001, 1 - smooth(0.05, 0.75, q)));
        ingot.rotation.set(0, t * 0.12, 0);
        for (let i = 0; i < N; i++) {
          const k = easeInOut(clamp((q - delay[i]) / 0.5));
          const s = smooth(0, 0.12, k);
          d.position.lerpVectors(start[i], end[i], k);
          d.position.y += Math.sin(k * Math.PI) * 0.9;
          d.position.z += Math.sin(k * Math.PI) * 0.8;
          d.rotation.set(lerp(-Math.PI / 2, 0, k) + Math.sin(k * Math.PI) * 1.2, Math.sin(k * Math.PI) * 0.8, 0);
          d.scale.setScalar(Math.max(0.0001, s));
          d.updateMatrix();
          tiles.setMatrixAt(i, d.matrix);
        }
        tiles.instanceMatrix.needsUpdate = true;
        g.rotation.set(lerp(0.38, 0.05, settle), lerp(-0.55 + Math.sin(t * 0.3) * 0.12, 0, settle), 0);
        g.scale.setScalar(lerp(1.15, 1, settle));
      };
    });

    // ── 4. Process: a flythrough along a gold path with five stations ─────────────
    addScene("process", (g) => {
      const pts = [
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.6, 0.7, -5), new THREE.Vector3(-2.2, -0.4, -10),
        new THREE.Vector3(2.2, 0.5, -15), new THREE.Vector3(0, 0, -20),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      const SEG = 600, RAD = 8;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.016, RAD, false), new THREE.MeshBasicMaterial({ color: 0xe6c47f }));
      const ghost = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 0.006, 6, false), hairGold(0.22));
      const track = new THREE.Group();
      track.add(tube, ghost);
      const markers = pts.map((pt) => {
        const m = new THREE.Group();
        const ringMat = hairGold(0.25);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.52, 0.545, 96), ringMat);
        const halo = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.806, 96), hairGold(0.12));
        m.add(ring, halo);
        m.position.copy(pt);
        track.add(m);
        return { m, ringMat };
      });
      const token = makeToken(0.36);
      track.add(token);
      const pivot = new THREE.Group();
      pivot.add(track);
      g.add(pivot);
      const here = new THREE.Vector3();
      return (p, _v, t) => {
        const x = clamp(p * 1.04) * 4;
        const seg = Math.min(3, Math.floor(x));
        const tt = x >= 4 ? 1 : (seg + smooth(0.3, 0.95, x - seg)) / 4;
        curve.getPointAt(tt, here);
        token.position.copy(here);
        token.rotation.set(t * 0.5, t * 0.9 + tt * 12, 0);
        track.position.copy(here).multiplyScalar(-1);
        tube.geometry.setDrawRange(0, Math.floor(tt * SEG) * RAD * 6);
        markers.forEach(({ m, ringMat }, i) => {
          const reached = tt >= i / 4 - 0.002;
          ringMat.opacity = lerp(ringMat.opacity, reached ? 0.95 : 0.22, 0.1);
          const pulse = reached ? 1 + Math.max(0, 0.25 - Math.abs(tt - i / 4) * 2) : 1;
          m.scale.setScalar(lerp(m.scale.x, pulse, 0.12));
          m.lookAt(camera.position);
        });
        pivot.rotation.set(0.18, Math.sin(t * 0.2) * 0.05, 0);
      };
    });

    // ── 5. Ecosystem: audiences and partners orbiting the orchestration layer ─────
    addScene("ecosystem", (g) => {
      const tilt = new THREE.Group();
      tilt.rotation.x = 0.42;
      g.add(tilt);
      const core = makeToken(0.62);
      tilt.add(core);
      const orbitA = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.006, 6, 200), hairGold(0.3));
      const orbitB = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.005, 6, 256), new THREE.MeshBasicMaterial({ color: 0xb6babe, transparent: true, opacity: 0.18, depthWrite: false }));
      orbitA.rotation.x = orbitB.rotation.x = Math.PI / 2;
      tilt.add(orbitA, orbitB);
      const dot = new THREE.SphereGeometry(0.075, 20, 20);
      const mkLabel = (text: string, cls: string) => {
        const el = document.createElement("div");
        el.className = cls;
        el.textContent = text;
        const o = new CSS2DObject(el);
        o.position.set(0, 0.45, 0);
        return { o, el };
      };
      const inner = AUDIENCES.map((name) => {
        const n = makeToken(0.2);
        const l = mkLabel(name, "orbit-label");
        l.o.position.set(0, 2.4, 0);
        n.add(l.o);
        tilt.add(n);
        return { n, ...l };
      });
      const outer = PARTNERS.map((name) => {
        const n = new THREE.Mesh(dot, platinum);
        const l = mkLabel(name, "orbit-label orbit-label-partner");
        n.add(l.o);
        tilt.add(n);
        return { n, ...l };
      });
      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array((AUDIENCES.length + PARTNERS.length) * 6);
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      tilt.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xdcbd7c, transparent: true, opacity: 0.2, depthWrite: false })));
      const wp = new THREE.Vector3();
      return (p, v, t) => {
        const active = Math.min(3, Math.floor(p * 4));
        core.rotation.set(Math.sin(t * 0.5) * 0.2, t * 0.4 + p * 4, 0);
        const ra = t * 0.07 + p * 2.2, rb = -t * 0.04 - p * 1.3;
        let k = 0;
        const place = (obj: THREE.Object3D, a: number, r: number) => {
          obj.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
          linePos.set([0, 0, 0, obj.position.x, 0, obj.position.z], k);
          k += 6;
        };
        inner.forEach(({ n, el }, i) => {
          place(n, ra + (i / inner.length) * Math.PI * 2, 2.2);
          n.rotation.set(t * 0.6, t, 0);
          const on = i === active;
          n.scale.setScalar(lerp(n.scale.x, on ? 0.3 : 0.18, 0.1));
          n.getWorldPosition(wp);
          el.style.opacity = String(v * (on ? 1 : wp.z > -1 ? 0.75 : 0.35));
          el.dataset.active = String(on);
        });
        outer.forEach(({ n, el }, i) => {
          place(n, rb + (i / outer.length) * Math.PI * 2, 3.2);
          n.getWorldPosition(wp);
          el.style.opacity = String(v * (wp.z > -1 ? 0.7 : 0.25));
        });
        lineGeo.attributes.position.needsUpdate = true;
        g.rotation.set(0, Math.sin(t * 0.15) * 0.08, 0);
        g.scale.setScalar(0.92);
      };
    });

    // ── 6. Contact: tokens drifting, weightless, behind the form ─────────────────
    addScene("contact", (g) => {
      const N = 22;
      const field = new THREE.InstancedMesh(tokenGeo, gold, N);
      field.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      g.add(field);
      const seeds = Array.from({ length: N }, (_, i) => ({
        x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 9, z: -2 - Math.random() * 12,
        s: 0.22 + Math.random() * 0.3, r: Math.random() * 6, sp: 0.2 + Math.random() * 0.4, i,
      }));
      const d = new THREE.Object3D();
      return (p, _v, t) => {
        seeds.forEach((s) => {
          d.position.set(s.x, s.y + Math.sin(t * s.sp + s.r) * 0.3 + p * 1.5 * s.sp, s.z);
          d.rotation.set(t * s.sp + s.r, t * s.sp * 0.7 + s.r, 0);
          d.scale.setScalar(s.s);
          d.updateMatrix();
          field.setMatrixAt(s.i, d.matrix);
        });
        field.instanceMatrix.needsUpdate = true;
      };
    });

    // Ambient dust for depth
    const small = () => window.innerWidth < 768;
    const DUST = small() ? 220 : 480;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 24;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      dustPos[i * 3 + 2] = -14 + Math.random() * 20;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xe8c887, size: 0.03, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Layout: push the world right on desktop (text sits left), up on phones (text sits low).
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = small();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s ? 1.5 : 1.75));
      renderer.setSize(w, h);
      labels.setSize(w, h);
      camera.aspect = w / h;
      camera.position.set(0, 0.3, s ? 12.5 : 9);
      camera.lookAt(0, 0, 0);
      root.scale.setScalar(s ? 0.78 : 1);
      if (s) camera.setViewOffset(w, h, 0, h * 0.24, w, h);
      else camera.setViewOffset(w, h, -w * 0.19, 0, w, h);
      camera.updateProjectionMatrix();
      needsRender = true;
    };

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    let needsRender = true;
    resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clock = new THREE.Clock();
    let t = 0;
    let wasVisible = true;
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (document.hidden) return;
      if (!reduced.matches) t += dt;
      let maxV = 0;
      for (const sc of scenes) {
        const st = journey.scenes[sc.id] ?? { p: 0, v: 0 };
        maxV = Math.max(maxV, st.v);
        const on = st.v > 0.002;
        sc.holder.visible = on;
        if (!on) continue;
        const dir = st.p < 0.5 ? -1 : 1;
        sc.holder.position.y = dir * (1 - easeOut(st.v)) * 6;
        sc.update(st.p, st.v, t);
      }
      if (maxV <= 0.002 && !wasVisible && !needsRender) return;
      wasVisible = maxV > 0.002;
      needsRender = false;
      dustMat.opacity = 0.55 * maxV;
      const dp = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let y = dp.getY(i) + dt * 0.06;
        if (y > 7) y = -7;
        dp.setY(i, y);
      }
      dp.needsUpdate = true;
      root.rotation.y = lerp(root.rotation.y, pointer.x * 0.18, 0.04);
      root.rotation.x = lerp(root.rotation.x, pointer.y * 0.08, 0.04);
      renderer.render(scene, camera);
      labels.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" />;
}
