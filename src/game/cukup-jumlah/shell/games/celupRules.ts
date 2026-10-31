// Celup Dakwat Kekal (CELUP!): the YB is voting. Before the ballot is issued, the polling
// clerk inks the voter's left index finger. The YB holds both hands out across the desk,
// facing the player, so the YB's left hand is on the player's right. Tap the right finger.
// Pure rules here; the screen is CelupDakwat.tsx.

export type Hand = "left" | "right";
export type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky";
export type Finger = { hand: Hand; name: FingerName };

/**
 * The ten fingers in screen order, left to right, as the clerk sees them: the YB faces the
 * player with palms down, so the YB's right hand is on screen-left, thumbs pointing inward.
 */
export const FINGERS: readonly Finger[] = [
  { hand: "right", name: "pinky" },
  { hand: "right", name: "ring" },
  { hand: "right", name: "middle" },
  { hand: "right", name: "index" },
  { hand: "right", name: "thumb" },
  { hand: "left", name: "thumb" },
  { hand: "left", name: "index" },
  { hand: "left", name: "middle" },
  { hand: "left", name: "ring" },
  { hand: "left", name: "pinky" },
];

/** The indelible ink goes on the left index finger. */
export function isInkFinger(f: Finger): boolean {
  return f.hand === "left" && f.name === "index";
}

export const INK_FINGER_INDEX = FINGERS.findIndex(isInkFinger);

/** Wrong fingers forgiven before the round is lost; Mesra Rakyat forgives one more. */
export function wrongAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

export type Offer = { wrong: number; inked: boolean };

export const FRESH_OFFER: Offer = { wrong: 0, inked: false };

/** Offering finger `index` (screen order) to the clerk. */
export function offerFinger(o: Offer, index: number): { offer: Offer; right: boolean } {
  const f = FINGERS[index];
  const right = !!f && isInkFinger(f);
  return { right, offer: right ? { ...o, inked: true } : { ...o, wrong: o.wrong + 1 } };
}

export function celupVerdict(
  o: Offer,
  allowed: number,
  timeUp: boolean,
): "won" | "lost" | "waiting" {
  if (o.inked) return "won";
  if (o.wrong > allowed) return "lost";
  return timeUp ? "lost" : "waiting";
}
