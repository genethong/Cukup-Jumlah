import { BoxGeometry, Color, DynamicDrawUsage, InstancedMesh, MeshLambertMaterial, Object3D, type Group } from "three";
import { VOXEL_SIZE } from "../../core/scale";

export interface NoodleSpray {
  count: number;
  update: (time: number) => void;
}

interface Bit {
  x: number;
  y: number;
  z: number;
  phase: number;
  color: Color;
  spin: number;
  ang: number;
}

function bezier(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Flying mee, scallion and sambal bits parented to the spatula hand. */
export function createNoodleSpray(parent: Group): NoodleSpray {
  const strands = [
    { a: [0.02, 0.52, 0.02], b: [-0.1, 0.72, 0.06], c: [0.02, 0.92, 0.0], d: [0.14, 1.08, 0.08] },
    { a: [0.0, 0.5, 0.0], b: [-0.22, 0.66, 0.1], c: [-0.28, 0.88, 0.02], d: [-0.08, 1.05, -0.02] },
    { a: [0.04, 0.54, -0.02], b: [0.1, 0.74, 0.08], c: [0.0, 0.96, 0.12], d: [-0.1, 1.12, 0.04] },
    { a: [0.0, 0.48, 0.04], b: [-0.14, 0.62, -0.04], c: [-0.24, 0.84, 0.1], d: [-0.06, 1.0, 0.12] },
    { a: [0.05, 0.56, 0.0], b: [0.02, 0.78, -0.08], c: [-0.12, 0.94, -0.02], d: [0.06, 1.1, 0.06] },
  ];
  const noodle = new Color("#f0d29a");
  const scallion = new Color("#6aaa3a");
  const meat = new Color("#8a4a2a");
  const bits: Bit[] = [];
  strands.forEach((s, si) => {
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const t2 = Math.min(1, t + 0.08);
      const x = bezier(s.a[0], s.b[0], s.c[0], s.d[0], t);
      const y = bezier(s.a[1], s.b[1], s.c[1], s.d[1], t);
      const z = bezier(s.a[2], s.b[2], s.c[2], s.d[2], t);
      const x2 = bezier(s.a[0], s.b[0], s.c[0], s.d[0], t2);
      const y2 = bezier(s.a[1], s.b[1], s.c[1], s.d[1], t2);
      bits.push({
        x,
        y,
        z,
        phase: si * 1.3 + i * 0.35,
        color: noodle,
        spin: (si + 1) * 0.15,
        ang: Math.atan2(x2 - x, y2 - y),
      });
    }
  });
  const extras: Array<[number, number, number, Color]> = [
    [-0.18, 0.9, 0.1, scallion],
    [-0.26, 0.78, 0.04, scallion],
    [0.1, 0.98, 0.08, scallion],
    [-0.06, 1.08, -0.02, meat],
    [0.12, 0.84, 0.06, meat],
    [-0.2, 1.02, 0.08, meat],
  ];
  for (const [x, y, z, color] of extras) {
    bits.push({ x, y, z, phase: x * 4, color, spin: 0.2, ang: 0.4 });
  }

  const geo = new BoxGeometry(VOXEL_SIZE * 0.85, VOXEL_SIZE * 2.4, VOXEL_SIZE * 0.85);
  const mat = new MeshLambertMaterial();
  const mesh = new InstancedMesh(geo, mat, bits.length);
  mesh.name = "noodles";
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.count = bits.length;
  const dummy = new Object3D();
  bits.forEach((bit, i) => {
    dummy.position.set(bit.x, bit.y, bit.z);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, bit.color);
  });
  parent.add(mesh);

  return {
    count: bits.length,
    update(time: number) {
      bits.forEach((bit, i) => {
        const bob = Math.sin(time * 2.4 + bit.phase) * 0.018;
        dummy.position.set(bit.x, bit.y + bob, bit.z);
        dummy.rotation.set(0.2, bit.phase, bit.ang);
        dummy.scale.set(1, 1 + Math.sin(bit.phase) * 0.15, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
