import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CandidateProfile } from "../types";
import {
  buildFloatingChunkStage,
  buildVoxelWorkbenchStage,
  buildHybridStage,
  type StageStyleOption,
  type StageModelInstance,
} from "./stageBuilder";
import { Play, CheckCircle, Info } from "lucide-react";

interface StageComparisonViewerProps {
  profile: CandidateProfile;
  selectedStage: StageStyleOption;
  onSelectStage: (stage: StageStyleOption) => void;
  onClose?: () => void;
}

interface SingleStageCardProps {
  stageOption: StageStyleOption;
  title: string;
  badge: string;
  desc: string;
  profile: CandidateProfile;
  isSelected: boolean;
  onSelect: () => void;
  actionButtonLabel: string;
}

function SingleStageCanvas({
  stageOption,
  title,
  badge,
  desc,
  profile,
  isSelected,
  onSelect,
  actionButtonLabel,
}: SingleStageCardProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageInstanceRef = useRef<StageModelInstance | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 260;
    const height = container.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isSelected ? 0x0f172a : 0x1e293b);

    // 2. Build Stage Instance
    let stage: StageModelInstance;
    if (stageOption === "1") {
      stage = buildFloatingChunkStage(profile);
    } else if (stageOption === "2") {
      stage = buildVoxelWorkbenchStage(profile);
    } else {
      stage = buildHybridStage(profile);
    }
    stageInstanceRef.current = stage;
    scene.add(stage.group);

    // 3. Orthographic Isometric Camera
    const aspect = width / height;
    const { frustumSize, position, lookAt } = stage.cameraConfig;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);

    // 4. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 5. Lights
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffedd5, 1.4);
    sun.position.set(12, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    const d = 6;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);

    const skyFill = new THREE.DirectionalLight(0x38bdf8, 0.4);
    skyFill.position.set(-8, 6, -10);
    scene.add(skyFill);

    // 6. Interactive Drag to Rotate
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
      stage.group.rotation.y += deltaX * 0.015;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Click triggers action
    const handleClick = () => {
      stage.triggerAction();
    };
    renderer.domElement.addEventListener("click", handleClick);

    // 7. Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        autoYaw += 0.005;
        stage.group.rotation.y = autoYaw;
      }

      stage.update(elapsed);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 260;
      const h = container.clientHeight || 280;
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
  }, [stageOption, profile, isSelected]);

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
            AKTIF
          </span>
        )}
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative w-full h-60 sm:h-72 bg-slate-950 flex items-center justify-center select-none">
        <div ref={mountRef} className="w-full h-full" />

        {/* Action Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stageInstanceRef.current?.triggerAction();
          }}
          className="absolute top-2 right-2 p-1.5 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shadow active:scale-90 transition flex items-center gap-1 cursor-pointer"
          title="Uji Aksi Pentas"
        >
          <Play className="w-3 h-3 fill-slate-950" />
          <span>{actionButtonLabel}</span>
        </button>

        {/* Bottom Hint */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] text-slate-400 bg-slate-900/80 backdrop-blur px-2 py-1 rounded border border-slate-800">
          <span>👆 Klik untuk aksi</span>
          <span>🔄 Seret untuk pusing</span>
        </div>
      </div>

      {/* Description */}
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
              <span>GAYA PENTAS INI DIPILIH</span>
            </>
          ) : (
            <span>PILIH PENTAS INI</span>
          )}
        </button>
      </div>
    </div>
  );
}

export function StageComparisonViewer({
  profile,
  selectedStage,
  onSelectStage,
  onClose,
}: StageComparisonViewerProps) {
  return (
    <div className="w-full bg-slate-950 text-slate-100 p-4 sm:p-6 rounded-3xl border-3 border-amber-400 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-lg bg-emerald-600 text-white font-comic font-black text-xs">
              STEP 4: 3D DIORAMA STAGE
            </span>
            <h2 className="font-comic font-black text-lg sm:text-xl text-amber-400">
              PILIH FORMAT PENTAS 3D MINIGAME
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lihat bagaimana setiap pusingan minigame dipersembahkan dalam ruang 3D voxel: bongkah jalan terapung, meja kerja makro, atau hibrid!
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
        <SingleStageCanvas
          stageOption="1"
          title="OPTION 1: FLOATING CHUNK"
          badge="DISYORKAN ⭐"
          desc="Bongkah tanah terapung (jalan raya bertar, longkang, curb kuning, kanopi mamak, bendera parti & Vellfire VIP). Format Crossy Road paling tulen!"
          profile={profile}
          isSelected={selectedStage === "1"}
          onSelect={() => onSelectStage("1")}
          actionButtonLabel="LOMPAT YB!"
        />

        <SingleStageCanvas
          stageOption="2"
          title="OPTION 2: VOXEL WORKBENCH"
          badge="MEJA SPR MAKRO"
          desc="Perspektif dekat ke atas meja kayu SK. Borang 4 rasmi, ikatan wang tunai RM10,000 deposit, dan cop getah SPR yang menghentam ke bawah!"
          profile={profile}
          isSelected={selectedStage === "2"}
          onSelect={() => onSelectStage("2")}
          actionButtonLabel="HENTAM COP! 💥"
        />

        <SingleStageCanvas
          stageOption="3"
          title="OPTION 3: HYBRID DUAL STAGE"
          badge="DINAMIK GABUNGAN"
          desc="Menggabungkan aksi jalanan (chunk) untuk aktiviti luar & zum ke meja makro untuk minigame borang/deposit. Kamera beralih secara automatik."
          profile={profile}
          isSelected={selectedStage === "3"}
          onSelect={() => onSelectStage("3")}
          actionButtonLabel="UJI KEDUA-DUA!"
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="mt-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Setiap bongkah pentas terapung mempunyai bayang lembut suria dan fizik pergerakan masa nyata!
          </span>
        </div>
      </div>
    </div>
  );
}
