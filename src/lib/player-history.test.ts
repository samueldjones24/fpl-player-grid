import { describe, expect, it } from "vitest";
import { summarizeRecentHistory } from "./player-history";
import type { PlayerHistoryEntry } from "./fpl/types";

const entry = (
  gameweek: number,
  minutes: number,
  points: number,
  xG: number,
  xA: number,
): PlayerHistoryEntry => ({
  gameweek,
  opponent: "TST",
  isHome: true,
  minutes,
  goals: 0,
  assists: 0,
  points,
  bonus: 1,
  bps: 20,
  xG,
  xA,
  xGC: 0,
  cleanSheets: 0,
  goalsConceded: 0,
  saves: 0,
  defensiveContribution: 0,
  clearancesBlocksInterceptions: 0,
});

describe("summarizeRecentHistory", () => {
  it("aggregates the requested recent Gameweeks and derives xGI rates", () => {
    const stats = summarizeRecentHistory(
      [
        entry(1, 90, 6, 0.5, 0.2),
        entry(2, 45, 3, 0.25, 0.1),
        entry(3, 90, 8, 0.75, 0.3),
      ],
      2,
    );
    expect(stats.gameweeks).toBe(2);
    expect(stats.points).toBe(11);
    expect(stats.xGI).toBeCloseTo(1.4);
    expect(stats.xGI90).toBeCloseTo(0.9333);
  });

  it("returns zero rates when the recent period has no minutes", () => {
    const stats = summarizeRecentHistory([entry(1, 0, 1, 0.2, 0.1)], 3);
    expect(stats.xG90).toBe(0);
    expect(stats.xGI90).toBe(0);
  });
});
