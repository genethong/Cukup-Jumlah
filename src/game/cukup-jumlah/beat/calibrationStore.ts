// The player's audio/touch latency correction, saved on this device only.

const KEY = "cukup-jumlah.audioOffsetMs";

export function loadOffsetMs(): number {
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveOffsetMs(offsetMs: number): void {
  try {
    window.localStorage.setItem(KEY, String(Math.round(offsetMs)));
  } catch {
    // Private mode or blocked storage: the correction just lasts this session.
  }
}
