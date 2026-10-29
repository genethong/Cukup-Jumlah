import { Color, MeshLambertMaterial } from "three";
import { VOXEL_SIZE } from "./scale";

const VERT = /* glsl */ `
  uniform float uVoxel;
  varying vec3 vVoxelLocal;
  varying vec3 vVoxelN;
`;

const VERT_BODY = /* glsl */ `
  #include <begin_vertex>
  vVoxelLocal = transformed / uVoxel;
  vVoxelN = normalize(objectNormal);
`;

const FRAG_COMMON = /* glsl */ `
  varying vec3 vVoxelLocal;
  varying vec3 vVoxelN;
  uniform float uVoxel;
  uniform float uGlow;
`;

const FRAG_COLOR = /* glsl */ `
  #include <color_fragment>
  {
    vec3 n = abs(normalize(vVoxelN));
    vec3 f = fract(vVoxelLocal);
    vec3 edge = min(f, 1.0 - f);
    float crease = edge.x;
    if (n.x > n.y && n.x > n.z) crease = min(edge.y, edge.z);
    else if (n.y > n.z) crease = min(edge.x, edge.z);
    else crease = min(edge.x, edge.y);
    float edgeAmt = smoothstep(0.0, 0.2, crease);
    diffuseColor.rgb *= mix(0.74, 1.05, edgeAmt);
    vec3 cell = floor(vVoxelLocal);
    float h = fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    diffuseColor.rgb *= 0.96 + 0.08 * h;
  }
`;

const FRAG_GLOW = /* glsl */ `
  #include <emissivemap_fragment>
  if (uGlow > 0.0) {
    totalEmissiveRadiance += diffuseColor.rgb * uGlow;
  }
`;

function patch(shader: { uniforms: Record<string, { value: number }>; vertexShader: string; fragmentShader: string }, glow: number) {
  shader.uniforms.uVoxel = { value: VOXEL_SIZE };
  shader.uniforms.uGlow = { value: glow };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${VERT}`)
    .replace("#include <begin_vertex>", VERT_BODY);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${FRAG_COMMON}`)
    .replace("#include <color_fragment>", FRAG_COLOR)
    .replace("#include <emissivemap_fragment>", FRAG_GLOW);
}

let opaqueMat: MeshLambertMaterial | null = null;
let emissiveMat: MeshLambertMaterial | null = null;

export function getVoxelMaterial(): MeshLambertMaterial {
  if (!opaqueMat) {
    opaqueMat = new MeshLambertMaterial({ vertexColors: true });
    opaqueMat.onBeforeCompile = (shader) => patch(shader, 0);
    opaqueMat.customProgramCacheKey = () => "cukup-voxel-opaque-v1";
  }
  return opaqueMat;
}

export function getEmissiveMaterial(): MeshLambertMaterial {
  if (!emissiveMat) {
    emissiveMat = new MeshLambertMaterial({
      vertexColors: true,
      emissive: new Color(0xffffff),
      emissiveIntensity: 0.2,
    });
    emissiveMat.onBeforeCompile = (shader) => patch(shader, 1.6);
    emissiveMat.customProgramCacheKey = () => "cukup-voxel-emissive-v1";
  }
  return emissiveMat;
}
