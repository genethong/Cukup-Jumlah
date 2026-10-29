import { Group } from "three";

export interface YbSkeleton {
  root: Group;
  hop: Group;
  hips: Group;
  torso: Group;
  legL: Group;
  legR: Group;
  armL: Group;
  armR: Group;
  handL: Group;
  handR: Group;
  neck: Group;
  head: Group;
  hat: Group;
  hair: Group;
  face: Group;
}

/** Fixed socket hierarchy. Pivots sit on the joints; part meshes are children. */
export function createSkeleton(): YbSkeleton {
  const root = new Group();
  const hop = new Group();
  const hips = new Group();
  const torso = new Group();
  const legL = new Group();
  const legR = new Group();
  const armL = new Group();
  const armR = new Group();
  const handL = new Group();
  const handR = new Group();
  const neck = new Group();
  const head = new Group();
  const hat = new Group();
  const hair = new Group();
  const face = new Group();

  root.name = "yb-root";
  root.add(hop);
  hop.add(hips);
  hips.add(legL, legR, torso);
  torso.add(armL, armR, neck);
  armL.add(handL);
  armR.add(handR);
  neck.add(head);
  head.add(hat, hair, face);

  return { root, hop, hips, torso, legL, legR, armL, armR, handL, handR, neck, head, hat, hair, face };
}
