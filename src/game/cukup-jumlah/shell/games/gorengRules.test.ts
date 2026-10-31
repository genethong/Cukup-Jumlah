import { describe, expect, it } from "vitest";
import {
  COOK_SECONDS,
  FIRST_FLASH_S,
  FRESH_SHOOT,
  POSE_SECONDS,
  flashTimes,
  judgeFlash,
  photosNeeded,
  shootVerdict,
  stepCook,
} from "./gorengRules";

describe("Goreng Kuey Teow photo-op rules", () => {
  it("spaces the flashes through the round and stops before the fuse runs out", () => {
    const times = flashTimes(9.6, () => 0.5);
    expect(times[0]).toBe(FIRST_FLASH_S);
    expect(times.length).toBe(4);
    expect(times.at(-1)!).toBeLessThanOrEqual(9.6 - 0.5);
  });

  it("lets the hawker cook only while the YB keeps off the senduk", () => {
    expect(stepCook(FRESH_SHOOT, 1, true).cooked).toBe(0);
    expect(stepCook(FRESH_SHOOT, COOK_SECONDS, false).cooked).toBe(1);
  });

  it("counts a photo only if the YB was already posing", () => {
    expect(judgeFlash(FRESH_SHOOT, POSE_SECONDS).good).toBe(true);
    expect(judgeFlash(FRESH_SHOOT, POSE_SECONDS / 2).good).toBe(false);
    expect(judgeFlash(FRESH_SHOOT, null).shoot.missed).toBe(1);
  });

  it("needs the photos and the dish; Mesra Rakyat needs one photo fewer", () => {
    expect(photosNeeded(false, 4)).toBe(3);
    expect(photosNeeded(true, 4)).toBe(2);
    expect(shootVerdict({ cooked: 1, photos: 3, missed: 1 }, 4, 3, false)).toBe("won");
    expect(shootVerdict({ cooked: 0.8, photos: 3, missed: 0 }, 4, 3, false)).toBe("shooting");
    expect(shootVerdict({ cooked: 0.8, photos: 3, missed: 0 }, 4, 3, true)).toBe("lost");
  });

  it("ends early once too many photos are missed to make the count", () => {
    expect(shootVerdict({ cooked: 0.5, photos: 0, missed: 2 }, 4, 3, false)).toBe("lost");
    expect(shootVerdict({ cooked: 0.5, photos: 1, missed: 1 }, 4, 3, false)).toBe("shooting");
  });
});
