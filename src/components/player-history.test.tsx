// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlayerSummary } from "@/lib/fpl/types";
import { PlayerHistory } from "./player-history";

function makeSummary(overrides: Partial<PlayerSummary> = {}): PlayerSummary {
  return {
    fixtures: [],
    history: [
      {
        gameweek: 5,
        opponent: "CHE",
        isHome: true,
        minutes: 90,
        goals: 1,
        assists: 0,
        points: 8,
        bonus: 2,
        bps: 30,
        xG: 0.6,
        xA: 0.1,
        xGC: 0.5,
        cleanSheets: 0,
        goalsConceded: 1,
        saves: 0,
        defensiveContribution: 2,
        clearancesBlocksInterceptions: 1,
      },
    ],
    ...overrides,
  };
}

function renderHistory(props: {
  playerId: number;
  playerName: string;
  isExpanded: boolean;
}) {
  return render(
    <table>
      <tbody>
        <PlayerHistory {...props} />
      </tbody>
    </table>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlayerHistory", () => {
  it("renders nothing when collapsed", () => {
    renderHistory({
      playerId: 1,
      playerName: "Test Player",
      isExpanded: false,
    });
    expect(screen.queryByText("Test Player")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton then the fetched history once expanded", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummary()),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHistory({ playerId: 42, playerName: "Bruno G", isExpanded: true });

    expect(await screen.findByText("Bruno G")).toBeInTheDocument();
    expect(await screen.findByText("CHE (H)")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/players/42");
  });

  it("shows an error message with a retry action when the request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeSummary()),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderHistory({ playerId: 7, playerName: "Declan Rice", isExpanded: true });

    const retryButton = await screen.findByRole("button", {
      name: "Try again",
    });
    expect(
      screen.getByText("Unable to load player history."),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(retryButton);

    expect(await screen.findByText("CHE (H)")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state when history has no entries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeSummary({ history: [] })),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHistory({ playerId: 3, playerName: "New Signing", isExpanded: true });

    expect(
      await screen.findByText("No Gameweek history available yet."),
    ).toBeInTheDocument();
  });

  it("renders a table row per gameweek in reverse chronological order", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          makeSummary({
            history: [
              { ...makeSummary().history[0], gameweek: 4, opponent: "ARS" },
              { ...makeSummary().history[0], gameweek: 5, opponent: "CHE" },
            ],
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderHistory({
      playerId: 9,
      playerName: "Player Nine",
      isExpanded: true,
    });

    await screen.findByText("CHE (H)");
    // Scope to the nested history <table> — the outer <table> wrapper used to
    // host this <tr> in a valid document also matches role="table".
    const historyTable = container.querySelector(
      'table[class*="historyTable"]',
    );
    if (!historyTable) throw new Error("history table not found");
    const rows = within(historyTable as HTMLElement).getAllByRole("row");
    expect(within(rows[1]).getByText("5")).toBeInTheDocument();
    expect(within(rows[2]).getByText("4")).toBeInTheDocument();
  });
});
