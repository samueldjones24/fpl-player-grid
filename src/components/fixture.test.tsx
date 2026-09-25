// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Fixture } from "@/lib/fpl/types";
import { FixtureStrip } from "./fixture";

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 1,
    gameweek: 10,
    opponent: "ARS",
    opponentId: 1,
    isHome: true,
    difficulty: 3,
    finished: false,
    kickoffTime: null,
    ...overrides,
  };
}

describe("FixtureStrip", () => {
  it("renders a message when there are no fixtures", () => {
    render(<FixtureStrip fixtures={[]} />);
    expect(screen.getByText("No fixtures")).toBeInTheDocument();
  });

  it("renders a card per fixture with opponent, venue, and difficulty", () => {
    render(
      <FixtureStrip
        fixtures={[
          makeFixture({ id: 1, opponent: "ARS", isHome: true, difficulty: 4 }),
          makeFixture({ id: 2, opponent: "CHE", isHome: false, difficulty: 2 }),
        ]}
      />,
    );

    expect(screen.getByText("ARS (H)")).toBeInTheDocument();
    expect(screen.getByText("CHE (A)")).toBeInTheDocument();
    expect(screen.getByLabelText("GW10, ARS, Home, FDR 4")).toBeInTheDocument();
    expect(screen.getByLabelText("GW10, CHE, Away, FDR 2")).toBeInTheDocument();
  });

  it("shows a dash instead of 0 for an unknown difficulty", () => {
    render(<FixtureStrip fixtures={[makeFixture({ difficulty: 0 })]} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
