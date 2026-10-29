import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeadGridInspectorProps {
  onBackToGame?: () => void;
}

export function HeadGridInspector({ onBackToGame }: HeadGridInspectorProps) {
  // Head Grid Parameters
  const [headRatio, setHeadRatio] = useState<"5x6x5" | "5x5x5" | "5x7x5">("5x6x5");
  const [eyeRow, setEyeRow] = useState<number>(3); // row from bottom (1 to 5)
  const [eyeSpacing, setEyeSpacing] = useState<"wide" | "medium">("wide");
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [facialFeature, setFacialFeature] = useState<"clean" | "mustache" | "red_lips" | "glasses">("mustache");
  const [skinColor] = useState<string>("#f6c9a3");

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    headMesh: THREE.Mesh;
    updateHead: () => void;
  } | null>(null);

  const gridWidth = 5;
  const gridDepth = 5;
  const gridHeight = headRatio === "5x5x5" ? 5 : headRatio === "5x6x5" ? 6 : 7;

  // Generate crisp 2D Face Texture with pixel-sharp features
  const generateFaceTexture = () => {
    const canvas = document.createElement("canvas");
    const scale = 32; // 32px per unit cell for crystal clarity
    const w = gridWidth * scale;
    const h = gridHeight * scale;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // 1. Skin Base
    ctx.fillStyle = skinColor;
    ctx.fillRect(0, 0, w, h);

    // 2. Coordinate Grid Lines
    if (showGridLines) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, h);
        ctx.stroke();
      }
      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(w, y * scale);
        ctx.stroke();
      }
    }

    // 3. Eyes: Spaced-apart dots exactly like reference image
    const eyeY = (gridHeight - 1 - eyeRow) * scale;
    const leftEyeX = eyeSpacing === "wide" ? 1 * scale : 1.5 * scale;
    const rightEyeX = eyeSpacing === "wide" ? 3 * scale : 2.5 * scale;

    ctx.fillStyle = "#0f172a";
    // Large, crisp square eye dots
    ctx.fillRect(leftEyeX + scale * 0.15, eyeY + scale * 0.15, scale * 0.7, scale * 0.7);
    ctx.fillRect(rightEyeX + scale * 0.15, eyeY + scale * 0.15, scale * 0.7, scale * 0.7);

    // Specular glint
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(leftEyeX + scale * 0.15, eyeY + scale * 0.15, scale * 0.25, scale * 0.25);
    ctx.fillRect(rightEyeX + scale * 0.15, eyeY + scale * 0.15, scale * 0.25, scale * 0.25);

    // 4. Feature / Mouth / Mustache / Glasses
    const mouthY = (gridHeight - eyeRow + 0.3) * scale;
    if (facialFeature === "mustache") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(1.3 * scale, mouthY, 2.4 * scale, scale * 0.6);
    } else if (facialFeature === "red_lips") {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(1.7 * scale, mouthY, 1.6 * scale, scale * 0.45);
    } else if (facialFeature === "glasses") {
      ctx.strokeStyle = "#047857";
      ctx.lineWidth = 5;
      ctx.strokeRect(leftEyeX - scale * 0.1, eyeY - scale * 0.1, scale * 1.2, scale * 1.1);
      ctx.strokeRect(rightEyeX - scale * 0.1, eyeY - scale * 0.1, scale * 1.2, scale * 1.1);
      ctx.fillStyle = "#047857";
      ctx.fillRect(leftEyeX + scale * 1.1, eyeY + scale * 0.35, rightEyeX - (leftEyeX + scale * 1.1), 5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  };

  // 3D Three.js Scene
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    // Orthographic Camera positioned so FRONT FACE (+Z) is prominently angled towards camera!
    const frustumSize = 3.6;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      50
    );

    // Clean angle: Facing front face (+Z), tilted slightly to show top (+Y) and side (+X)
    camera.position.set(2.4, 2.0, 3.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);

    // Faceted 3-tone lighting:
    // Top face is bright, front face (FACE) is clearly illuminated, side face has soft shadow
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const frontKey = new THREE.DirectionalLight(0xffffff, 0.9);
    frontKey.position.set(2, 4, 6);
    scene.add(frontKey);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);

    // Root pivot for the head
    const headPivot = new THREE.Group();
    scene.add(headPivot);

    // Initial Mesh
    const headUnitW = 1.2;
    const headUnitH = (gridHeight / gridWidth) * 1.2;
    const headUnitD = 1.2;

    const sideMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const topMat = new THREE.MeshLambertMaterial({ color: 0xfde7d4 }); // slightly brighter top tone
    const faceTex = generateFaceTexture();
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTex });

    const materials = [
      sideMat, // Right (+X)
      sideMat, // Left (-X)
      topMat,  // Top (+Y)
      sideMat, // Bottom (-Y)
      faceMat, // Front (+Z) FACE IS HERE!
      sideMat, // Back (-Z)
    ];

    const headGeo = new THREE.BoxGeometry(headUnitW, headUnitH, headUnitD);
    const headMesh = new THREE.Mesh(headGeo, materials);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Subtle dark turntable pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.45, 0.08, 32),
      new THREE.MeshLambertMaterial({ color: 0x1e293b })
    );
    pedestal.position.y = -headUnitH / 2 - 0.05;
    headPivot.add(pedestal);

    // Mouse Drag to Rotate
    let isDragging = false;
    let prevX = 0;
    let autoRotation = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      prevX = e.clientX;
      headPivot.rotation.y += dx * 0.015;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        // Gentle subtle bob, maintaining face readability
        autoRotation += 0.003;
        headPivot.rotation.y = Math.sin(autoRotation) * 0.25;
      }
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      headMesh,
      updateHead: () => {
        const newH = (gridHeight / gridWidth) * 1.2;
        headMesh.geometry.dispose();
        headMesh.geometry = new THREE.BoxGeometry(headUnitW, newH, headUnitD);
        pedestal.position.y = -newH / 2 - 0.05;

        const updatedFaceTex = generateFaceTexture();
        materials[0] = new THREE.MeshLambertMaterial({ color: skinColor });
        materials[1] = new THREE.MeshLambertMaterial({ color: skinColor });
        materials[2] = new THREE.MeshLambertMaterial({ color: 0xfde7d4 });
        materials[3] = new THREE.MeshLambertMaterial({ color: skinColor });
        materials[4] = new THREE.MeshLambertMaterial({ map: updatedFaceTex });
        materials[5] = new THREE.MeshLambertMaterial({ color: skinColor });
        headMesh.material = materials;
      },
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const asp = w / h;
      camera.left = (-frustumSize * asp) / 2;
      camera.right = (frustumSize * asp) / 2;
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
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
    };
  }, []);

  // Update when settings change
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateHead();
    }
  }, [headRatio, eyeRow, eyeSpacing, showGridLines, facialFeature, skinColor]);

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col p-4 sm:p-8 font-sans select-none">
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase">
            FEATURE 1 OF 8
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              HEAD BLOCK & FACE GRID STUDIO
            </h1>
            <p className="text-xs text-slate-400">
              Examining the raw head cuboid proportions and printed face grid from first principles.
            </p>
          </div>
        </div>

        {onBackToGame && (
          <button
            type="button"
            onClick={onBackToGame}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition"
          >
            ← Kembali ke Game
          </button>
        )}
      </header>

      {/* Main Workspace (Full Width, No Frame Constraints) */}
      <main className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mt-6 items-stretch">
        {/* Left Column: Huge 3D Isometric Viewport */}
        <div className="bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              3D ISOMETRIC HEAD VIEWPORT
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              {gridWidth}w × {gridHeight}h × {gridDepth}d Cuboid
            </span>
          </div>

          {/* 3D Canvas Mount */}
          <div className="flex-1 w-full min-h-[360px] sm:min-h-[440px] relative rounded-2xl overflow-hidden bg-[#0a0f1d] border border-slate-800 flex items-center justify-center">
            <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur px-3 py-1 rounded-lg text-xs text-slate-300 border border-slate-800 pointer-events-none">
              👆 Seret (drag) untuk pusing 360°
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Pencahayaan isometrik 3-ton (muka hadapan jelas diterangi)</span>
            <span className="font-bold text-amber-400">{headRatio}</span>
          </div>
        </div>

        {/* Right Column: 2D Face Coordinate Map & Tweak Controls */}
        <div className="flex flex-col gap-4">
          {/* 2D Face Map Card */}
          <div className="bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                FRONT FACE GRID COORDINATES ({gridWidth} × {gridHeight} cells)
              </span>
              <span className="text-[10px] text-slate-400">1 grid cell = 1 unit</span>
            </div>

            {/* Visual 2D Grid Cells */}
            <div className="w-full max-w-[240px] mx-auto bg-[#0f172a] p-3 rounded-2xl border border-slate-700/60 shadow-inner">
              <div
                className="grid gap-1.5 w-full aspect-square"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                  gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
                }}
              >
                {Array.from({ length: gridHeight }).map((_, rIndex) => {
                  const rFromBottom = gridHeight - 1 - rIndex;
                  return Array.from({ length: gridWidth }).map((_, cIndex) => {
                    const isLeftEye =
                      rFromBottom === eyeRow &&
                      (eyeSpacing === "wide" ? cIndex === 1 : cIndex === 1);
                    const isRightEye =
                      rFromBottom === eyeRow &&
                      (eyeSpacing === "wide" ? cIndex === 3 : cIndex === 3);
                    const isEye = isLeftEye || isRightEye;
                    const isMouth =
                      rFromBottom === eyeRow - 1 &&
                      (cIndex === 2 || (facialFeature === "mustache" && (cIndex === 1 || cIndex === 3)));

                    return (
                      <div
                        key={`${rIndex}-${cIndex}`}
                        className={`aspect-square rounded-md transition-all flex items-center justify-center font-bold text-xs ${
                          isEye
                            ? "bg-slate-950 text-white shadow-md ring-2 ring-amber-400"
                            : isMouth
                            ? facialFeature === "mustache"
                              ? "bg-slate-900 text-amber-300"
                              : facialFeature === "red_lips"
                              ? "bg-red-600 text-white"
                              : "bg-[#e8b896]"
                            : "bg-[#f6c9a3]/40 border border-slate-700/40"
                        }`}
                      >
                        {isEye ? "●" : isMouth ? "—" : ""}
                      </div>
                    );
                  });
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Mata terletak pada <strong>Baris {eyeRow}</strong> dari dagu, jarak <strong>{eyeSpacing === "wide" ? "4 unit (Tepi)" : "3 unit"}</strong>.
            </p>
          </div>

          {/* Interactive Control Deck */}
          <div className="bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-5 shadow-xl space-y-4">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider block border-b border-slate-800 pb-2">
              KAWALAN PARAMETER FEATURE 1
            </span>

            {/* 1. Head Ratio */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
                1. Nisbah Bentuk Kepala (Head Cuboid Ratio)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "5x6x5", label: "5×6×5 (Default ⭐)", desc: "Tinggi sedikit" },
                  { id: "5x5x5", label: "5×5×5 (Kubus)", desc: "Sama sisi" },
                  { id: "5x7x5", label: "5×7×5 (Ekstra)", desc: "Lebih lonjong" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setHeadRatio(r.id as typeof headRatio)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center flex flex-col items-center gap-0.5 ${
                      headRatio === r.id
                        ? "bg-amber-400 text-slate-950 font-black shadow-lg"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[9px] opacity-75">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Eye Row & Spacing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
                  2. Ketinggian Mata
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4].map((row) => (
                    <button
                      key={row}
                      type="button"
                      onClick={() => setEyeRow(row)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        eyeRow === row
                          ? "bg-amber-400 text-slate-950 font-black shadow"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Baris {row} {row === 3 ? "⭐" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
                  3. Jarak Mata (Spacing)
                </label>
                <div className="flex gap-1.5">
                  {[
                    { id: "wide", label: "Luas (⭐ Rujukan)" },
                    { id: "medium", label: "Dekat" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEyeSpacing(s.id as typeof eyeSpacing)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        eyeSpacing === s.id
                          ? "bg-amber-400 text-slate-950 font-black shadow"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Facial Feature */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase">
                4. Ciri Wajah Bercetak (Printed Feature)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "mustache", label: "Misai" },
                  { id: "red_lips", label: "Bibir" },
                  { id: "glasses", label: "Cermin Mata" },
                  { id: "clean", label: "Kosong" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacialFeature(f.id as typeof facialFeature)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                      facialFeature === f.id
                        ? "bg-amber-400 text-slate-950 font-black shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Grid Overlay Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={showGridLines}
                  onChange={(e) => setShowGridLines(e.target.checked)}
                  className="rounded border-slate-700 text-amber-400 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Tunjuk Garisan Grid Koordinat pada Blok</span>
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
