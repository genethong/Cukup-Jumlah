import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CukupJumlahGame } from "./CukupJumlahGame";
import { PARTIES } from "./types";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => () => undefined,
}));

describe("CukupJumlahGame", () => {
  it("opens on the backstage candidate creator", () => {
    render(<CukupJumlahGame />);
    expect(screen.getByRole("heading", { name: "Belakang Tabir" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Mula/ })).toBeTruthy();
    // In the game the creator hands off to the game, so the lab link is hidden.
    expect(screen.queryByText(/Makmal boneka/)).toBeNull();
  });

  it("uses the renamed food parties everywhere", () => {
    expect(Object.values(PARTIES).map((p) => [p.name, p.fullName])).toEqual([
      ["PNL", "Parti Nasi Lemak"],
      ["PD", "Parti Durian"],
      ["PTT", "Parti Teh Tarik"],
      ["PB", "Parti Boba"],
    ]);
  });
});
