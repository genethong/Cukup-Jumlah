import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PointLight,
  Scene,
  ShaderMaterial,
  PlaneGeometry,
  OrthographicCamera,
  WebGLRenderer,
  type Box3,
  Vector3,
} from "three";

export type QualityTier = "high" | "low";

export interface SceneLights {
  hemi: HemisphereLight;
  sun: DirectionalLight;
  lamp: PointLight;
  stall: PointLight;
  flash: PointLight;
}

export function createNavyBackdrop(): Mesh {
  const geo = new PlaneGeometry(2, 2);
  const mat = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      top: { value: new Color("#1c4a78") },
      bottom: { value: new Color("#07111e") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform vec3 top;
      uniform vec3 bottom;
      void main() {
        float h = smoothstep(0.0, 1.0, vUv.y);
        vec3 col = mix(bottom, top, h);
        vec2 p = vUv * 2.0 - 1.0;
        float vig = smoothstep(1.25, 0.25, length(p));
        col *= mix(0.72, 1.0, vig);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function setupLighting(scene: Scene, tier: QualityTier): SceneLights {
  const hemi = new HemisphereLight(0xfff6e8, 0x7d8da0, 0.9);
  scene.add(hemi);

  const sun = new DirectionalLight(0xffe0b0, 1.6);
  sun.position.set(-4.2, 7.4, 5.2);
  if (tier === "high") {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 0.025;
  }
  scene.add(sun);
  scene.add(sun.target);

  const lamp = new PointLight(0xffb14a, 1.15, 3.2, 2);
  const stall = new PointLight(0xffc56b, 0.9, 2.8, 2);
  const flash = new PointLight(0xfff6dd, 2.4, 2.4, 2);
  scene.add(lamp);
  scene.add(stall);
  scene.add(flash);

  return { hemi, sun, lamp, stall, flash };
}

export function fitShadow(sun: DirectionalLight, box: Box3) {
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const r = Math.max(size.x, size.y, size.z) * 0.72 + 0.2;
  const cam = sun.shadow.camera as OrthographicCamera;
  cam.left = -r;
  cam.right = r;
  cam.top = r;
  cam.bottom = -r;
  cam.near = 0.05;
  cam.far = r * 8;
  sun.target.position.copy(center);
  sun.position.copy(center).add(new Vector3(-3.4, 6.8, 4.6));
  sun.target.updateMatrixWorld();
  cam.updateProjectionMatrix();
}

export function configureRenderer(renderer: WebGLRenderer, tier: QualityTier) {
  renderer.shadowMap.enabled = tier === "high";
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = 4; // ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.22;
  renderer.outputColorSpace = "srgb";
  const cap = tier === "high" ? 2 : 1.25;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
}

export function createIsoCamera(aspect: number, frustumHeight: number): OrthographicCamera {
  const cam = new OrthographicCamera(
    (-frustumHeight * aspect) / 2,
    (frustumHeight * aspect) / 2,
    frustumHeight / 2,
    -frustumHeight / 2,
    0.05,
    80
  );
  return cam;
}

/** True isometric elevation (atan(1/sqrt(2))) with a yaw that shows the spatula side. */
export function placeIsoCamera(
  cam: OrthographicCamera,
  look: Vector3,
  distance: number,
  yawDeg = -52,
  elevDeg = 35.264
) {
  const elev = (elevDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;
  cam.position.set(
    look.x + distance * Math.cos(elev) * Math.sin(yaw),
    look.y + distance * Math.sin(elev),
    look.z + distance * Math.cos(elev) * Math.cos(yaw)
  );
  cam.lookAt(look);
  cam.updateProjectionMatrix();
}

export function frustumForAspect(aspect: number, sceneWidth: number, sceneHeight: number): number {
  let fh = sceneHeight;
  if (fh * aspect < sceneWidth) fh = sceneWidth / aspect;
  return fh;
}
