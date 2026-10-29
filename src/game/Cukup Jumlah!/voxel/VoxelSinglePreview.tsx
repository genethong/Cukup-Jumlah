import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CandidateProfile } from "../types";
import { buildVoxelCandidate, createPedestal, type VoxelStyleOption } from "./voxelBuilder";

interface VoxelSinglePreviewProps {
  profile: CandidateProfile;
  styleOption?: VoxelStyleOption;
  size?: number;
  className?: string;
  isBouncing?: boolean;
}

export function VoxelSinglePreview({
  profile,
  styleOption = "A",
  size = 142,
  className = "",
  isBouncing = true,
}: VoxelSinglePreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    // Warm retro paper card background
    scene.background = new THREE.Color(0xfef9c3);

    // 2. Camera (Orthographic Crossy Road Angle)
    const frustumSize = 3.6;
    const aspect = 1;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      50
    );

    const distance = 14;
    const phi = (48 * Math.PI) / 180;
    const theta = (45 * Math.PI) / 180;
    camera.position.set(
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 1.15, 0);

    // 3. Renderer with antialiasing & soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 4. Lights: Warm sunlight + sky bounce
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffedd5, 1.35);
    sun.position.set(6, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 512;
    sun.shadow.mapSize.height = 512;
    scene.add(sun);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rimLight.position.set(-6, 4, -6);
    scene.add(rimLight);

    // 5. Pedestal
    const pedestal = createPedestal("road");
    pedestal.scale.set(0.85, 0.85, 0.85);
    scene.add(pedestal);

    // 6. Character
    const model = buildVoxelCandidate(styleOption, profile);
    scene.add(model.group);

    // 7. Interactive Drag to Spin
    let isDragging = false;
    let prevMouseX = 0;
    let autoYaw = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      model.group.rotation.y += deltaX * 0.02;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Click triggers an energetic Crossy Road hop!
    const handleClick = () => {
      model.triggerHop();
    };
    renderer.domElement.addEventListener("click", handleClick);

    // 8. Render loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        autoYaw += 0.012;
        model.group.rotation.y = autoYaw;
      }

      if (isBouncing) {
        model.update(elapsed, false);
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", handleClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [profile, styleOption, size, isBouncing]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      className={`overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
      title="Seret untuk pusing 360°, klik untuk melompat!"
    />
  );
}
