// Semak Borang (SEMAK!): nomination day, checking your own papers before they go in. Each
// form has exactly one thing wrong: tap it before the next form comes. A candidate must be a
// citizen aged 18 or over (Federal Constitution, Art. 47), sign the paper, and bring the
// deposit receipt. Tapping a field that's fine is a mistake.
// Pure rules here; the screen is SemakBorang.tsx.

export const FORMS_NEEDED = 3;

export type FieldId = "name" | "age" | "citizen" | "seat" | "signature" | "receipt";

/** The fields on the form, top to bottom. */
export const FIELDS: readonly FieldId[] = [
  "name",
  "age",
  "citizen",
  "seat",
  "signature",
  "receipt",
];

/** What each field says when it's fine, and the one way it can be wrong. */
export type Form = { wrong: FieldId; age: number };

/** The fields that can be the mistake: under age, not a citizen, unsigned, no receipt. */
export const FAULTS: readonly FieldId[] = ["age", "citizen", "signature", "receipt"];

/** Mistaken taps forgiven; Mesra Rakyat gets one more. */
export function mistakesAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

/** Three forms, each wrong in a different way, with ages that look plausible. */
export function dealForms(random: () => number = Math.random): Form[] {
  const faults = [...FAULTS];
  for (let i = faults.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [faults[i], faults[j]] = [faults[j]!, faults[i]!];
  }
  return faults.slice(0, FORMS_NEEDED).map((wrong) => ({
    wrong,
    age: wrong === "age" ? 17 : 18 + Math.floor(random() * 50),
  }));
}

export type Desk = { checked: number; mistakes: number };

export function check(d: Desk, form: Form, tapped: FieldId): { desk: Desk; right: boolean } {
  const right = tapped === form.wrong;
  return {
    right,
    desk: right ? { ...d, checked: d.checked + 1 } : { ...d, mistakes: d.mistakes + 1 },
  };
}

export function deskVerdict(d: Desk, allowed: number, timeUp: boolean): "won" | "lost" | "going" {
  if (d.checked >= FORMS_NEEDED) return "won";
  if (d.mistakes > allowed) return "lost";
  return timeUp ? "lost" : "going";
}
