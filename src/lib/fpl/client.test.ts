import { describe, expect, it } from "vitest";
import { normalizePlayer, type RawElement, type RawTeam } from "./client";

const element = (
  overrides: Record<string, string | number | null | boolean> = {},
) =>
  ({
    id: 1,
    first_name: "Test",
    second_name: "Player",
    web_name: "Test",
    element_type: 3,
    team: 1,
    now_cost: 85,
    status: "a",
    minutes: 900,
    starts: 10,
    total_points: 80,
    form: "7.8",
    points_per_game: "8.0",
    goals_scored: 5,
    assists: 4,
    expected_goals: "6.42",
    expected_assists: "4.18",
    expected_goal_involvements: "10.91",
    bonus: 12,
    bps: 530,
    clean_sheets: 4,
    goals_conceded: 8,
    saves: 0,
    penalties_saved: 0,
    defensive_contribution: 14,
    clearances_blocks_interceptions: 28,
    tackles: 7,
    recoveries: 42,
    influence: "100.1",
    creativity: "80.2",
    threat: "90.3",
    ict_index: "27.1",
    selected_by_percent: "23.4",
    transfers_in: 1200,
    transfers_out: 300,
    cost_change_event: 2,
    ...overrides,
  }) as RawElement;

const teams = new Map<number, RawTeam>([
  [1, { id: 1, name: "Test FC", short_name: "TST" }],
]);
const positions = new Map([[3, "MID" as const]]);

describe("normalizePlayer", () => {
  it("maps API statistics and keeps supplied xGI distinct from calculated per-90 values", () => {
    const player = normalizePlayer(element(), teams, positions, []);
    expect(player.price).toBe(8.5);
    expect(player.xGI).toBe(10.91);
    expect(player.xG90).toBeCloseTo(0.642);
    expect(player.xA90).toBeCloseTo(0.418);
    expect(player.xGI90).toBeCloseTo(1.091);
    expect(player.defensiveContribution).toBe(14);
    expect(player.transfersBalance).toBe(900);
    expect(player.priceChange).toBe(0.2);
  });

  it("returns zero for calculated per-90 values when minutes are zero", () => {
    const player = normalizePlayer(
      element({ minutes: 0, expected_goal_involvements: null }),
      teams,
      positions,
      [],
    );
    expect(player.xGI).toBe(0);
    expect(player.xG90).toBe(0);
    expect(player.xA90).toBe(0);
    expect(player.xGI90).toBe(0);
  });
});
