import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CandidateProfile } from "../types";
import { buildVoxelCandidate, createPedestal, type VoxelStyleOption, type VoxelModelInstance } from "./voxelBuilder";
import { Play, CheckCircle, Info } from "lucide-react";

interface VoxelComparisonViewerProps {
  profile: CandidateProfile;
  selectedStyle: VoxelStyleOption;
  onSelectStyle: (style: VoxelStyleOption) => void;
  onClose?: () => void;
}

interface SingleVoxelViewProps {
  styleOption: VoxelStyleOption;
  title: string;
  badge: string;
  desc: string;
  profile: CandidateProfile;
  isSelected: boolean;
  onSelect: () => void;
}

function SingleVoxelCanvas({
  styleOption,
  title,
  badge,
  desc,
  profile,
  isSelected,
  onSelect,
}: SingleVoxelViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelInstanceRef = useRef<VoxelModelInstance | null>(null);
  const [isRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 260;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isSelected ? 0x0f172a : 0x1e293b);

    // 2. Camera (Orthographic Isometric like Crossy Road)
    const aspect = width / height;
    const frustumSize = 4.4;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );

    // Classic Crossy Road angle: 45° elevation, 35.264° azimuth
    const distance = 16;
    const phi = (45 * Math.PI) / 180;
    const theta = (45 * Math.PI) / 180;
    camera.position.set(
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 1.15, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 4. Lighting (Warm sun + soft ambient fill)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffedd5, 1.4);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    const d = 4;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);

    // Blue sky bounce light from opposite side
    const skyLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    skyLight.position.set(-6, 4, -8);
    scene.add(skyLight);

    // 5. Ground Pedestal (Floating Crossy Road Road Block)
    const pedestal = createPedestal("road");
    scene.add(pedestal);

    // 6. Voxel Character
    const model = buildVoxelCandidate(styleOption, profile);
    modelInstanceRef.current = model;
    scene.add(model.group);

    // 7. Interaction: Drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let autoRotationAngle = 0;

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

    // Click canvas to trigger a joyful Crossy Hop!
    const handleClick = () => {
      model.triggerHop();
    };
    renderer.domElement.addEventListener("click", handleClick);

    // 8. Render loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto turntable rotation when not dragging
      if (!isDragging && isRotating) {
        autoRotationAngle += 0.012;
        model.group.rotation.y = autoRotationAngle;
      }

      model.update(elapsedTime, false);
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 260;
      const newAspect = w / h;
      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", handleClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [styleOption, profile, isSelected, isRotating]);

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border-3 transition-all cursor-pointer overflow-hidden group ${
        isSelected
          ? "border-amber-400 bg-slate-900 shadow-[0_0_24px_rgba(251,191,36,0.35)] scale-[1.02]"
          : "border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:scale-[1.01]"
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between p-2.5 bg-slate-900 border-b-2 border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="font-comic font-black text-xs text-white">{title}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
            {badge}
          </span>
        </div>
        {isSelected && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
            <CheckCircle className="w-3.5 h-3.5 fill-amber-400 text-slate-900" />
            PILIHAN AKTIF
          </span>
        )}
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-950 flex items-center justify-center select-none">
        <div ref={mountRef} className="w-full h-full" />

        {/* Hover / Hint Indicator */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] text-slate-400 bg-slate-900/80 backdrop-blur px-2 py-1 rounded border border-slate-800">
          <span>👆 Klik untuk lompat (Hop!)</span>
          <span>🔄 Seret untuk pusing</span>
        </div>

        {/* Manual Hop Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            modelInstanceRef.current?.triggerHop();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shadow active:scale-90 transition flex items-center gap-1 cursor-pointer"
          title="Uji Lompatan Crossy Road"
        >
          <Play className="w-3 h-3 fill-slate-950" />
          <span>LOMPAT!</span>
        </button>
      </div>

      {/* Description / Architectural Specs */}
      <div className="p-3 bg-slate-900/90 border-t-2 border-slate-800 flex-1 flex flex-col justify-between">
        <p className="text-[11px] text-slate-300 leading-snug">{desc}</p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`mt-2.5 w-full py-1.5 rounded-xl font-comic font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            isSelected
              ? "bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.5)]"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>GAYA INI DIPILIH (LOCKED)</span>
            </>
          ) : (
            <span>PILIH GAYA INI</span>
          )}
        </button>
      </div>
    </div>
  );
}

export function VoxelComparisonViewer({
  profile,
  selectedStyle,
  onSelectStyle,
  onClose,
}: VoxelComparisonViewerProps) {
  return (
    <div className="w-full bg-slate-950 text-slate-100 p-4 sm:p-6 rounded-3xl border-3 border-amber-400 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-lg bg-red-600 text-white font-comic font-black text-xs">
              3D VOXEL SHOWCASE
            </span>
            <h2 className="font-comic font-black text-lg sm:text-xl text-amber-400">
              PILIH PROPORSI 3D CROSSY ROAD YB
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lihat perbandingan masa nyata (real-time 3D) dengan pencahayaan suria, bayang lembut & fizik lompat Crossy Road!
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition"
          >
            Tutup Preview ✕
          </button>
        )}
      </div>

      {/* Grid of the 3 Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SingleVoxelCanvas
          styleOption="A"
          title="OPTION A: CROSSY CHIBI"
          badge="DISYORKAN ⭐"
          desc="Kepala kubus besar (8×8×8), kaki comel terloncat-loncat, songkok emas & beg bimbit. Nisbah Crossy Road asli paling comel & jelas!"
          profile={profile}
          isSelected={selectedStyle === "A"}
          onSelect={() => onSelectStyle("A")}
        />

        <SingleVoxelCanvas
          styleOption="B"
          title="OPTION B: SATIRICAL CARICATURE"
          badge="GILA-GILA / LAT"
          desc="Hidung bulat berketul terkeluar (Lat caricature), kening melengkung tajam, songkok senget & titisan peluh panik terapung."
          profile={profile}
          isSelected={selectedStyle === "B"}
          onSelect={() => onSelectStyle("B")}
        />

        <SingleVoxelCanvas
          styleOption="C"
          title="OPTION C: LEGO-BLOCK MICRO"
          badge="MINIMALIST TOY"
          desc="Blok geometri ringkas & bersih. Rekaan patung mainan minimalis dengan siluet blok tajam dan pergerakan padat."
          profile={profile}
          isSelected={selectedStyle === "C"}
          onSelect={() => onSelectStyle("C")}
        />
      </div>

      {/* Comparison Bottom Tips */}
      <div className="mt-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Warna baju mengikut parti pilihan ({profile.party}) dan ton kulit terpilih secara automatik!
          </span>
        </div>
      </div>
    </div>
  );
}
