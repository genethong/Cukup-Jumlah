import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameShell } from "./GameShell";
import { UI } from "./strings";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => () => undefined,
}));

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

afterEach(cleanup);

describe("GameShell", () => {
  it("opens on the title with the parody disclaimer", () => {
    render(<GameShell />);
    expect(screen.getByRole("heading", { name: "Cukup Jumlah!" })).toBeTruthy();
    expect(screen.getByText(UI.disclaimer.ms)).toBeTruthy();
    expect(screen.getByRole("button", { name: UI.play.ms })).toBeTruthy();
  });

  it("switches to English and remembers it", () => {
    render(<GameShell />);
    fireEvent.click(screen.getByRole("button", { name: UI.otherLang.ms }));
    expect(screen.getByText(UI.disclaimer.en)).toBeTruthy();
    expect(localStorage.getItem("cukup_jumlah_lang")).toBe("en");
  });

  it("says so when the browser has no Web Audio, instead of starting silently", () => {
    render(<GameShell />);
    fireEvent.click(screen.getByRole("button", { name: UI.play.ms }));
    expect(screen.getByText(UI.noAudio.ms)).toBeTruthy();
  });
});
