import { describe, expect, it } from "vitest";
import type { Player } from "./fpl/types";
import {
  DEFAULT_COMPARISON_STATS,
  formatComparisonValue,
  getVisibleComparisonStats,
  toggleComparisonSelection,
  MAX_COMPARISON_PLAYERS,
} from "./player-comparison";

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: 1,
    name: "Test Player",
    webName: "Test",
    position: "MID",
    teamId: 1,
    team: "ARS",
    price: 5,
    status: "a",
    points: 0,
    form: 0,
    pointsPerGame: 0,
    minutes: 0,
    starts: 0,
    goals: 0,
    assists: 0,
    xG: 0,
    xA: 0,
    xGI: 0,
    xG90: 0,
    xA90: 0,
    xGI90: 0,
    bonus: 0,
    bps: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    saves: 0,
    penaltiesSaved: 0,
    defensiveContribution: 0,
    clearancesBlocksInterceptions: 0,
    tackles: 0,
    recoveries: 0,
    influence: 0,
    creativity: 0,
    threat: 0,
    ictIndex: 0,
    ownership: 0,
    transfersIn: 0,
    transfersOut: 0,
    transfersBalance: 0,
    priceChange: 0,
    nextFixtures: [],
    ...overrides,
  };
}

describe("toggleComparisonSelection", () => {
  it("adds a player and keeps the list ordered by selection order", () => {
    expect(toggleComparisonSelection([], 15)).toEqual([15]);
    expect(toggleComparisonSelection([15], 20)).toEqual([15, 20]);
  });

  it("removes a selected player when toggled again", () => {
    expect(toggleComparisonSelection([15, 20], 15)).toEqual([20]);
  });

  it("stops at the maximum selection count and keeps players removable", () => {
    const selected = [1, 2, 3, 4];
    expect(toggleComparisonSelection(selected, 5)).toEqual(selected);
    expect(toggleComparisonSelection(selected, 3)).toEqual([1, 2, 4]);
  });
});

describe("getVisibleComparisonStats", () => {
  it("includes only the selected stats that are represented on the players", () => {
    const players = [
      makePlayer({
        id: 1,
        price: 9.5,
        points: 80,
        form: 7.3,
        minutes: 800,
        xG: 4.2,
        xA: 5.1,
        goals: 10,
        assists: 6,
      }),
      makePlayer({
        id: 2,
        price: 7.5,
        points: 60,
        form: 5.4,
        minutes: 640,
        xG: 1.6,
        xA: 2.4,
      }),
    ];

    const visible = getVisibleComparisonStats(
      players,
      new Set(DEFAULT_COMPARISON_STATS),
    );
    expect(visible.map((stat) => stat.key)).toEqual([
      "price",
      "points",
      "form",
      "minutes",
      "xG",
      "xA",
    ]);
    expect(visible.some((stat) => stat.key === "goals")).toBe(false);
  });
});

describe("formatComparisonValue", () => {
  it("formats currency, decimal and percentage values consistently", () => {
    expect(formatComparisonValue("price", 10.5)).toBe("£10.5");
    expect(formatComparisonValue("xG", 4.123)).toBe("4.12");
    expect(formatComparisonValue("xGC", 1.77)).toBe("1.77");
    expect(formatComparisonValue("ownership", 52.5)).toBe("52.5%");
    expect(formatComparisonValue("minutes", 0)).toBe("0");
    expect(formatComparisonValue("goals", 2)).toBe("2");
    expect(formatComparisonValue("transfersIn", 1203948)).toBe("1,203,948");
    expect(formatComparisonValue("transfersOut", 23487)).toBe("23,487");
    expect(formatComparisonValue("transfersBalance", 120946)).toBe("120,946");
  });

  it("returns a placeholder when a statistic is missing", () => {
    expect(formatComparisonValue("xA", null)).toBe("—");
    expect(formatComparisonValue("price", undefined)).toBe("—");
  });
});

describe("comparison limits", () => {
  it("matches the configured maximum selection count", () => {
    expect(MAX_COMPARISON_PLAYERS).toBe(4);
  });
});
