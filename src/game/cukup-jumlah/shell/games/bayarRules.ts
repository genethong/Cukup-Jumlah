// Bayar Deposit (KIRA!): pay the parliamentary deposit, exactly RM10,000, out of a briefcase
// with a stack of each kind of bundle. Tap stacks to put bundles on the counter (and back),
// then pay. The clerk counts it
// and says if it's short or over; too many wrong payments and the time is gone.
// Pure rules here; the screen is BayarDeposit.tsx.

/** The deposit to stand for Parliament. */
export const DEPOSIT = 10_000;
/** Bundle values in the briefcase. */
export const BUNDLES = [1000, 500, 100, 50] as const;
export type Bundle = (typeof BUNDLES)[number];

/** Wrong payments forgiven before the round is lost; Mesra Rakyat gets one more. */
export function wrongPaymentsAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

export function total(bundles: readonly number[]): number {
  return bundles.reduce((a, b) => a + b, 0);
}

/** Whether some of these bundles add up to exactly `target`. */
export function canPay(bundles: readonly number[], target = DEPOSIT): boolean {
  const reach = new Set<number>([0]);
  for (const b of bundles) {
    for (const s of [...reach]) if (s + b <= target) reach.add(s + b);
    if (reach.has(target)) return true;
  }
  return reach.has(target);
}

/**
 * A briefcase of about 14 mixed bundles that hold more than the deposit and can make it
 * exactly, shuffled so they have to be counted.
 */
export function dealCase(random: () => number = Math.random): Bundle[] {
  for (;;) {
    const out: Bundle[] = [];
    const counts: Record<Bundle, number> = {
      1000: 5 + Math.floor(random() * 3),
      500: 3 + Math.floor(random() * 3),
      100: 3 + Math.floor(random() * 3),
      50: 1 + Math.floor(random() * 3),
    };
    for (const b of BUNDLES) for (let i = 0; i < counts[b]; i++) out.push(b);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    if (total(out) > DEPOSIT && canPay(out)) return out;
  }
}

export type Payment = "exact" | "short" | "over";

export function judgePayment(paid: number, target = DEPOSIT): Payment {
  return paid === target ? "exact" : paid < target ? "short" : "over";
}

export type Till = { wrong: number; paid: boolean };

export function tillVerdict(t: Till, allowed: number, timeUp: boolean): "won" | "lost" | "going" {
  if (t.paid) return "won";
  if (t.wrong > allowed) return "lost";
  return timeUp ? "lost" : "going";
}
