import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomConfig, withPatch } from "../puppet/options";
import {
  DEFAULT_CANDIDATE,
  DEFAULT_NAME,
  NAME_MAX,
  PARTIES,
  loadCandidate,
  sanitizeCandidate,
  sanitizePuppet,
  saveCandidate,
} from "./candidate";

// An in-memory store, so the test doesn't depend on which localStorage the runtime provides.
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  });
});

describe("candidate", () => {
  it("round-trips through device storage", () => {
    const c = { ...DEFAULT_CANDIDATE, name: "Datuk Cendol", party: "boba" as const };
    saveCandidate(c);
    expect(loadCandidate()).toEqual(sanitizeCandidate(c));
    expect(loadCandidate()?.name).toBe("Datuk Cendol");
  });

  it("returns null when nothing is saved or the save is broken", () => {
    expect(loadCandidate()).toBeNull();
    window.localStorage.setItem("cukup-jumlah.candidate.v1", "{not json");
    expect(loadCandidate()).toBeNull();
  });

  it("replaces unknown or tampered values with defaults", () => {
    const c = sanitizeCandidate({
      name: "   ",
      party: "barisan",
      talent: "rasuah",
      puppet: { gender: "m", tone: "blue", headwear: "tudung", hair: "bun" },
    });
    expect(c.name).toBe(DEFAULT_NAME);
    expect(c.party).toBe(DEFAULT_CANDIDATE.party);
    expect(c.talent).toBe(DEFAULT_CANDIDATE.talent);
    expect(c.puppet.tone).toBe(DEFAULT_CANDIDATE.puppet.tone);
    expect(c.puppet.headwear).toBeNull();
    expect(c.puppet.hair).toBe("sidepart");
  });

  it("trims names and caps their length", () => {
    const c = sanitizeCandidate({ name: "  Tan   Sri   " + "x".repeat(40) });
    expect(c.name.startsWith("Tan Sri x")).toBe(true);
    expect(c.name.length).toBe(NAME_MAX);
  });

  it("keeps random puppets valid", () => {
    for (let i = 0; i < 200; i++) {
      const p = randomConfig();
      expect(sanitizePuppet(p)).toEqual(p);
    }
  });

  it("swaps gender-specific parts and clothes when switching gender", () => {
    const f = withPatch(sanitizePuppet({ gender: "f", headwear: "tudung" }), { gender: "m" });
    expect(f.headwear).toBeNull();
    const m = withPatch(sanitizePuppet({ gender: "m", facialHair: "full_beard" }), { gender: "f" });
    expect(m.facialHair).toBe("none");
    const songkok = withPatch(sanitizePuppet({ gender: "m", headwear: "songkok" }), {
      gender: "f",
    });
    expect(songkok.headwear).toBeNull();
    expect(songkok.outfit).toBe("baju_kurung");
  });

  it("uses no party names that echo real coalitions", () => {
    for (const p of PARTIES)
      expect(p.name).not.toMatch(/barisan|bersatu|gabungan|pakatan|perikatan/i);
  });
});
