import React, { useEffect, useRef } from "react";
import {
  Box3,
  CanvasTexture,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { CandidateProfile } from "../types";
import { buildVoxelYB, type VoxelYb } from "./avatar/assemble";
import { heroProfile, lookFromProfile, type HeadwearKind } from "./avatar/look";
import {
  configureRenderer,
  createIsoCamera,
  createNavyBackdrop,
  fitShadow,
  frustumForAspect,
  placeIsoCamera,
  setupLighting,
  type QualityTier,
} from "./core/lighting";
import { buildMamakCorner } from "./scenes/tiles/mamakCorner";

export interface VoxelPocStats {
  ready: boolean;
  voxels: number;
  characterVoxels?: number;
  triangles: number;
  renderedTriangles?: number;
  drawCalls: number;
  fps: number;
  quality: QualityTier;
}

declare global {
  interface Window {
    __VOXEL_POC__?: VoxelPocStats;
  }
}

function readTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  return new URLSearchParams(window.location.search).get("quality") === "low" ? "low" : "high";
}

function flashSprite(): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(255,252,240,1)");
    g.addColorStop(0.25, "rgba(255,236,190,0.9)");
    g.addColorStop(1, "rgba(255,220,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(new SpriteMaterial({ map, transparent: true, depthWrite: false }));
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

function blobShadow(): Mesh {
  const mesh = new Mesh(
    new CircleGeometry(0.42, 24),
    new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = "blob-shadow";
  return mesh;
}

export function VoxelPocPreview() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const params = new URLSearchParams(window.location.search);
    const tier = readTier();
    const shot = params.get("shot") === "1";
    const profile = heroProfile();
    const skin = params.get("skin");
    if (skin !== null && skin !== "") profile.skinIndex = Number(skin);
    const wear = params.get("wear") as HeadwearKind | null;
    if (wear === "songkok" || wear === "tudung" || wear === "cap" || wear === "none") {
      profile.headwear = wear === "tudung" ? "tudung_bawal" : wear;
      if (wear === "none") profile.mouth = "misai";
    }
    if (wear === "tudung") {
      profile.gender = "female";
      profile.headwearColor = "#0f766e";
      profile.headwearShadow = "#115e59";
      profile.headwearLight = "#2dd4bf";
    }
    if (wear === "cap") {
      profile.headwearColor = "#1d4ed8";
      profile.headwearShadow = "#1e3a8a";
      profile.headwearLight = "#60a5fa";
    }

    const scene = new Scene();
    scene.add(createNavyBackdrop());
    const lights = setupLighting(scene, tier);
    const diorama = buildMamakCorner();
    scene.add(diorama.group);
    const yb = buildVoxelYB(profile);
    yb.group.position.set(diorama.feet[0], diorama.feet[1], diorama.feet[2]);
    scene.add(yb.group);

    lights.lamp.position.set(diorama.lamp[0], diorama.lamp[1], diorama.lamp[2]);
    lights.stall.position.set(diorama.stallLight[0], diorama.stallLight[1], diorama.stallLight[2]);
    lights.flash.position.set(diorama.flash[0], diorama.flash[1], diorama.flash[2]);

    const flare = flashSprite();
    flare.position.set(diorama.flash[0], diorama.flash[1], diorama.flash[2]);
    scene.add(flare);

    yb.group.rotation.y = 0.42;

    const blob = blobShadow();
    blob.position.set(diorama.feet[0], diorama.feet[1] + 0.012, diorama.feet[2]);
    blob.visible = tier === "low";
    scene.add(blob);

    const box = new Box3().setFromObject(diorama.group);
    box.expandByObject(yb.group);
    if (tier === "high") fitShadow(lights.sun, box);

    const look = new Vector3(diorama.feet[0] + 0.62, diorama.feet[1] + 1.02, diorama.feet[2]);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    configureRenderer(renderer, tier);
    host.replaceChildren(renderer.domElement);

    const cam = createIsoCamera(1, 3.2);
    placeIsoCamera(cam, look, 9, -24, 22);

    const fit = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const aspect = w / Math.max(1, h);
      const frustum = frustumForAspect(aspect, 3.7, 3.35);
      cam.left = (-frustum * aspect) / 2;
      cam.right = (frustum * aspect) / 2;
      cam.top = frustum / 2;
      cam.bottom = -frustum / 2;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    fit();

    let shotTime = 1.25;
    const onResize = () => {
      fit();
      if (shot) draw(shotTime);
    };
    window.addEventListener("resize", onResize);
    const onPointer = () => yb.triggerHop();
    renderer.domElement.addEventListener("pointerdown", onPointer);

    let frames = 0;
    let fpsStamp = performance.now();
    let fps = 0;
    let raf = 0;
    const publish = () => {
      window.__VOXEL_POC__ = {
        ready: true,
        voxels: yb.stats.voxels + diorama.voxels,
        characterVoxels: yb.stats.voxels,
        triangles: yb.stats.triangles + diorama.triangles,
        drawCalls: renderer.info.render.calls,
        renderedTriangles: renderer.info.render.triangles,
        fps,
        quality: tier,
      };
    };

    const draw = (time: number) => {
      yb.update(time, false);
      const pulse = 0.65 + Math.sin(time * 5) * 0.35;
      lights.flash.intensity = shot ? 0.9 : 0.6 + pulse * 0.4;
      flare.scale.setScalar(shot ? 0.28 : 0.22 + pulse * 0.12);
      renderer.render(scene, cam);
      frames++;
      const now = performance.now();
      if (now - fpsStamp > 500) {
        fps = (frames * 1000) / (now - fpsStamp);
        frames = 0;
        fpsStamp = now;
      }
      publish();
    };

    if (shot) {
      draw(1.25);
    } else {
      const loop = (ms: number) => {
        draw(ms / 1000);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointer);
      renderer.dispose();
      delete window.__VOXEL_POC__;
    };
  }, []);

  return <div ref={hostRef} style={{ position: "fixed", inset: 0, background: "#07111e" }} />;
}

export function VoxelYbPortrait({
  profile,
  size = 142,
}: {
  profile: CandidateProfile;
  size?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<VoxelYb | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new Scene();
    scene.add(createNavyBackdrop());
    const lights = setupLighting(scene, "low");
    const model = buildVoxelYB(profile);
    modelRef.current = model;
    scene.add(model.group);
    const blob = blobShadow();
    blob.visible = true;
    scene.add(blob);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    configureRenderer(renderer, "low");
    renderer.setSize(size, size, false);
    host.replaceChildren(renderer.domElement);

    const cam = createIsoCamera(1, 2.35);
    placeIsoCamera(cam, new Vector3(0, 0.9, 0), 7.2, -24, 16);
    const onPointer = () => model.triggerHop();
    renderer.domElement.addEventListener("pointerdown", onPointer);

    let raf = 0;
    const loop = (ms: number) => {
      model.update(ms / 1000, false);
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointer);
      renderer.dispose();
      modelRef.current = null;
    };
    // Profile identity is applied by the effect below so skin/hat changes remesh in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    modelRef.current?.setProfile(profile);
  }, [profile]);

  return <div ref={hostRef} style={{ width: size, height: size }} />;
}

export function previewLook(profile: CandidateProfile) {
  return lookFromProfile(profile);
}
