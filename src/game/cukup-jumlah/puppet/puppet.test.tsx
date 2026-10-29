import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PuppetAvatar } from "./PuppetAvatar";
import {
  FOOT_SCALE,
  NET_HIP_OUT_DEG,
  REST_ARM_OUT_DEG,
  artShinOutDeg,
  elbowWorld,
  footPointWorld,
  headwearOrigin,
  legJointY,
  lowerHemY,
  lowerOrigin,
  rotateClockwise,
  visualHipDeg,
} from "./layout";
import {
  puppetRig,
  type HeadId,
  type HeadwearId,
  type LowerId,
  type OutfitId,
  type ToneId,
} from "./loadRig";
import { beatPhase, createMotionState, sampleMotion, stepSpring } from "./motion";

describe("puppet rig", () => {
  it("keeps v2 offsets, tones, and the right-side mirror as the source of truth", () => {
    expect(puppetRig.placement.headwear_brim_dy).toEqual({
      songkok: 15,
      ketayap: 15,
      turban: 55,
      baseball_cap: 70,
    });
    expect(puppetRig.placement.lower_waist_dy_from_hips).toEqual({
      songket_samping: -110,
      sarong: -60,
    });
    expect(Object.keys(puppetRig.skin.tones)).toEqual([
      "tone_1",
      "tone_2",
      "tone_3",
      "tone_4",
      "tone_5",
      "tone_6",
      "tone_7",
      "tone_8",
    ]);
    expect(puppetRig.placement.mirror.toLowerCase()).toContain("right");
    expect(puppetRig.sleeves.batik_shirt).toEqual(["upper"]);
    expect(puppetRig.sleeves.baju_melayu).toEqual(["upper", "forearm"]);
    expect(puppetRig.parts["sleeves/batik_shirt_upper"].size).toEqual([122, 150]);
  });

  it("places songkok, samping, and sarong from the rig offsets", () => {
    expect(headwearOrigin(puppetRig, "m_head_1", "songkok", 0, 0)).toEqual([74, -484]);
    expect(headwearOrigin(puppetRig, "m_head_2", "baseball_cap", 0, 0)[1]).toBe(-548);
    expect(lowerOrigin(puppetRig, "songket_samping", 0, 0)).toEqual([29, 394]);
    expect(lowerOrigin(puppetRig, "sarong", 0, 0)).toEqual([-9, 444]);
  });

  it("stands with outward toes and hems cut at the ankle and knee", () => {
    const toe: [number, number] = [120, 12];
    const leftAnkle = footPointWorld(puppetRig, "L", 0, 0, 0, [0, 0]);
    const leftToe = footPointWorld(puppetRig, "L", 0, 0, 0, toe);
    const rightAnkle = footPointWorld(puppetRig, "R", 0, 0, 0, [0, 0]);
    const rightToe = footPointWorld(puppetRig, "R", 0, 0, 0, toe);
    const hipL = puppetRig.parts["base/torso"].pins.hip_L[0];
    const hipR = puppetRig.parts["base/torso"].pins.hip_R[0];

    expect(leftToe[0]).toBeLessThan(leftAnkle[0]);
    expect(rightToe[0]).toBeGreaterThan(rightAnkle[0]);
    expect(leftAnkle[0]).toBeLessThan(hipL);
    expect(rightAnkle[0]).toBeGreaterThan(hipR);
    expect(rightAnkle[0] - leftAnkle[0]).toBeGreaterThan(hipR - hipL);

    const gap = hipL - leftAnkle[0];
    expect(gap).toBeGreaterThan(1);
    expect(gap).toBeLessThan(14);
    expect(artShinOutDeg(puppetRig) + visualHipDeg("L", -0.35, puppetRig)).toBeGreaterThan(0.3);
    expect(artShinOutDeg(puppetRig) + visualHipDeg("L", 0.35, puppetRig)).toBeLessThan(2);
    expect(NET_HIP_OUT_DEG).toBeLessThan(2);
    expect(FOOT_SCALE).toBeCloseTo(0.75);

    const ankle = legJointY(puppetRig, "ankle", 0);
    const knee = legJointY(puppetRig, "knee", 0);
    const shoeTop =
      ankle + (100 - puppetRig.parts["base/foot"].pins.ankle[1]) * FOOT_SCALE;
    const sarongHem = lowerHemY(puppetRig, "sarong", 0);
    const sampingHem = lowerHemY(puppetRig, "songket_samping", 0);
    expect(sarongHem).toBeGreaterThan(shoeTop);
    expect(sampingHem).toBeCloseTo(knee, 0);
  });

  it("angles both arms outward from the rest pose", () => {
    expect(REST_ARM_OUT_DEG).toBeGreaterThanOrEqual(8);
    expect(REST_ARM_OUT_DEG).toBeLessThanOrEqual(12);
    const [lx] = rotateClockwise(0, 100, 90);
    expect(lx).toBeCloseTo(-100, 5);

    const left = elbowWorld(puppetRig, "L", 0, 0, 0);
    const right = elbowWorld(puppetRig, "R", 0, 0, 0);
    expect(left[0]).toBeLessThan(puppetRig.parts["base/torso"].pins.shoulder_L[0]);
    expect(right[0]).toBeGreaterThan(puppetRig.parts["base/torso"].pins.shoulder_R[0]);
    expect(left[0]).toBeCloseTo(35.08, 1);
    expect(right[0]).toBeCloseTo(403.92, 1);

    const wider = elbowWorld(puppetRig, "L", 0, 0, 8);
    expect(wider[0]).toBeLessThan(left[0]);
  });

  it("ships only the tinted parts that the rig uses, as WebP", () => {
    const root = path.resolve("public/puppet");
    const files = walk(root);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => file.endsWith(".webp"))).toBe(true);
    expect(fs.existsSync(path.join(root, "base"))).toBe(false);
    const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    expect(bytes).toBeLessThan(1_500_000);

    for (const [id, part] of Object.entries(puppetRig.parts)) {
      if (id.startsWith("base/")) continue;
      const rel = part.file.replace(/^parts\//, "");
      expect(fs.existsSync(path.join(root, rel)), rel).toBe(true);
    }
    for (const tone of Object.keys(puppetRig.skin.tones)) {
      for (const name of ["torso", "upper_arm", "forearm_hand", "leg", "foot"]) {
        expect(fs.existsSync(path.join(root, "base_tones", tone, `${name}.webp`))).toBe(true);
      }
    }
  });
});

describe("puppet motion", () => {
  it("shares a 125 BPM phase and lets a spring settle", () => {
    expect(beatPhase(0, 125)).toEqual({ phase: 0, index: 0 });
    expect(beatPhase(60 / 125, 125).index).toBe(1);

    const spring = { v: 12, vel: 0 };
    for (let i = 0; i < 240; i += 1) stepSpring(spring, 0, 1 / 60, 80, 10);
    expect(Math.abs(spring.v)).toBeLessThan(0.5);

    const state = createMotionState();
    const idle = sampleMotion(state, 1.2, 1 / 60, "idle", undefined, 125, false);
    expect(Math.abs(idle.sway)).toBeGreaterThan(0);
    expect(Math.abs(idle.sway)).toBeLessThan(20);

    const motion = createMotionState();
    for (let t = 0; t < 6; t += 1 / 30) {
      const sample = sampleMotion(motion, t, 1 / 30, "idle", undefined, 125, false);
      const net = artShinOutDeg(puppetRig) + visualHipDeg("L", sample.hip, puppetRig);
      expect(net).toBeGreaterThan(0.2);
      expect(net).toBeLessThan(2.2);
    }
  });
});

describe("PuppetAvatar", () => {
  it("paints the configured tone, outfit sleeves, and no untinted base sheet", () => {
    const { container } = render(
      <PuppetAvatar
        config={{
          head: "m_head_1",
          tone: "tone_6",
          headwear: "songkok",
          outfit: "baju_melayu",
          lower: "songket_samping",
        }}
        anim="still"
      />,
    );
    const srcs = imageSrcs(container);
    expect(srcs.some((src) => src.includes("/puppet/heads/m_head_1.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/base_tones/tone_6/torso.webp"))).toBe(
      true,
    );
    expect(srcs.some((src) => src.includes("/puppet/sleeves/baju_melayu_upper.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/sleeves/baju_melayu_forearm.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/trousers/baju_melayu.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/base/"))).toBe(false);
  });

  it("follows an independent tone and skips a forearm sleeve the outfit does not have", () => {
    const { container } = render(
      <PuppetAvatar
        config={{
          head: "f_head_2",
          tone: "tone_7",
          headwear: null,
          outfit: "batik_shirt",
          lower: "sarong",
        }}
        anim="still"
      />,
    );
    const srcs = imageSrcs(container);
    expect(srcs.some((src) => src.includes("/puppet/base_tones/tone_7/leg.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("batik_shirt_upper.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/trousers/batik_shirt.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("batik_shirt_forearm"))).toBe(false);
    expect(srcs.some((src) => src.includes("headwear/"))).toBe(false);
  });

  it("covers kurung legs under a sarong so the shin cannot show skin", () => {
    const { container } = render(
      <PuppetAvatar
        config={{
          head: "f_head_1",
          tone: "tone_4",
          headwear: "tudung",
          outfit: "baju_kurung",
          lower: "sarong",
        }}
        anim="still"
      />,
    );
    const srcs = imageSrcs(container);
    expect(srcs.some((src) => src.includes("/puppet/trousers/baju_kurung.webp"))).toBe(true);
    expect(srcs.some((src) => src.includes("/puppet/lower/sarong.webp"))).toBe(true);
  });
});

function imageSrcs(container: HTMLElement) {
  return [...container.querySelectorAll("img")].map((img) => img.getAttribute("src") ?? "");
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const _types = {
  head: "m_head_1" satisfies HeadId,
  tone: "tone_1" satisfies ToneId,
  hat: "tudung" satisfies HeadwearId,
  outfit: "baju_kurung" satisfies OutfitId,
  lower: "sarong" satisfies LowerId,
};
void _types;
