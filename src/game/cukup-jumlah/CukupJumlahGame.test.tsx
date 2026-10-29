import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CukupJumlahGame } from "./CukupJumlahGame";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
  }: {
    children?: React.ReactNode;
    to: string;
    search?: { lab?: string };
  }) => <a href={search?.lab ? `${to}?lab=${search.lab}` : to}>{children}</a>,
}));

// The candidacy screen mounts WebGL viewers. jsdom has no WebGL context, so
// these stand-ins let the smoke test check that the game shell renders.
vi.mock("./voxel/HeadGridInspector", () => ({
  HeadGridInspector: () => <div data-testid="voxel-stub" />,
}));
vi.mock("./voxel/VoxelSinglePreview", () => ({
  VoxelSinglePreview: () => <div data-testid="voxel-preview-stub" />,
}));
vi.mock("./voxel/VoxelComparisonViewer", () => ({
  VoxelComparisonViewer: () => null,
}));
vi.mock("./voxel/StageComparisonViewer", () => ({
  StageComparisonViewer: () => null,
}));

describe("CukupJumlahGame", () => {
  it("renders the candidacy screen", () => {
    render(<CukupJumlahGame />);
    expect(screen.getByText("CUKUP JUMLAH!")).toBeTruthy();
    expect(screen.getByText("BORANG PENAMAAN")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "🎨 RUPA" })).toBeTruthy();
  });
});
