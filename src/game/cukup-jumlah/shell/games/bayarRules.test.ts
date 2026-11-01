import { describe, expect, it } from "vitest";
import {
  DEPOSIT,
  canPay,
  dealCase,
  judgePayment,
  tillVerdict,
  total,
  wrongPaymentsAllowed,
} from "./bayarRules";

describe("Bayar Deposit rules", () => {
  it("deals a mixed briefcase that holds more than the deposit and can make it exactly", () => {
    for (let k = 0; k < 50; k++) {
      const bag = dealCase();
      expect(total(bag)).toBeGreaterThan(DEPOSIT);
      expect(canPay(bag)).toBe(true);
      expect(new Set(bag).size).toBeGreaterThan(2);
    }
  });

  it("knows when an exact amount can't be made", () => {
    expect(canPay([1000, 1000], 1500)).toBe(false);
    expect(canPay([1000, 500, 50], 1500)).toBe(true);
  });

  it("has the clerk say exact, short or over", () => {
    expect(judgePayment(10_000)).toBe("exact");
    expect(judgePayment(9_950)).toBe("short");
    expect(judgePayment(10_100)).toBe("over");
  });

  it("forgives one wrong payment, two with Mesra Rakyat", () => {
    expect(tillVerdict({ wrong: 1, paid: false }, wrongPaymentsAllowed(false), false)).toBe(
      "going",
    );
    expect(tillVerdict({ wrong: 2, paid: false }, wrongPaymentsAllowed(false), false)).toBe("lost");
    expect(tillVerdict({ wrong: 2, paid: false }, wrongPaymentsAllowed(true), false)).toBe("going");
    expect(tillVerdict({ wrong: 1, paid: true }, 1, false)).toBe("won");
    expect(tillVerdict({ wrong: 0, paid: false }, 1, true)).toBe("lost");
  });
});
