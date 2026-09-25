import { describe, expect, it } from "vitest";
import type { Player } from "./fpl/types";
import {
  EMPTY_FILTERS,
  filterPlayers,
  hasActiveFilters,
  sortPlayers,
  type PlayerFilters,
} from "./player-filters";

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

const players: Player[] = [
  makePlayer({
    id: 1,
    name: "Mohamed Salah",
    webName: "Salah",
    position: "MID",
    teamId: 1,
    team: "LIV",
    price: 14.5,
    points: 82,
    form: 8.2,
    minutes: 810,
    goals: 12,
    assists: 8,
    xG: 6.4,
    xA: 4.1,
    xGI: 10.5,
    status: "a",
  }),
  makePlayer({
    id: 2,
    name: "Cole Palmer",
    webName: "Palmer",
    position: "MID",
    teamId: 2,
    team: "CHE",
    price: 10.5,
    points: 76,
    form: 7.8,
    minutes: 765,
    goals: 9,
    assists: 7,
    xG: 5.1,
    xA: 5.8,
    xGI: 10.9,
    status: "a",
  }),
  makePlayer({
    id: 3,
    name: "Erling Haaland",
    webName: "Haaland",
    position: "FWD",
    teamId: 3,
    team: "MCI",
    price: 15.0,
    points: 90,
    form: 9.1,
    minutes: 720,
    goals: 20,
    assists: 2,
    xG: 15.2,
    xA: 1.1,
    xGI: 16.3,
    status: "d",
  }),
  makePlayer({
    id: 4,
    name: "William Saliba",
    webName: "Saliba",
    position: "DEF",
    teamId: 4,
    team: "ARS",
    price: 6.0,
    points: 60,
    form: 5.0,
    minutes: 900,
    goals: 1,
    assists: 0,
    xG: 0.5,
    xA: 0.2,
    xGI: 0.7,
    status: "a",
  }),
];

describe("filterPlayers", () => {
  it("returns all players when no filters are active", () => {
    expect(filterPlayers(players, EMPTY_FILTERS)).toHaveLength(4);
  });

  it("matches by partial, case-insensitive name search", () => {
    const result = filterPlayers(players, { ...EMPTY_FILTERS, query: "sala" });
    expect(result.map((player) => player.webName)).toEqual(["Salah"]);
  });

  it("matches names with diacritics when searching without them", () => {
    const withDiacritics = [
      ...players,
      makePlayer({
        id: 5,
        name: "Martin Ødegaard",
        webName: "Ødegaard",
        position: "MID",
        teamId: 5,
        team: "ARS",
        status: "a",
      }),
    ];
    const result = filterPlayers(withDiacritics, {
      ...EMPTY_FILTERS,
      query: "ode",
    });
    expect(result.map((player) => player.webName)).toEqual(["Ødegaard"]);
  });

  it("matches names with an eszett when searching with 'ss'", () => {
    const withEszett = [
      ...players,
      makePlayer({
        id: 6,
        name: "Pascal Groß",
        webName: "Groß",
        position: "MID",
        teamId: 6,
        team: "BHA",
        status: "a",
      }),
    ];
    const result = filterPlayers(withEszett, {
      ...EMPTY_FILTERS,
      query: "gross",
    });
    expect(result.map((player) => player.webName)).toEqual(["Groß"]);
  });

  it("filters by position", () => {
    const result = filterPlayers(players, {
      ...EMPTY_FILTERS,
      positions: ["FWD"],
    });
    expect(result.map((player) => player.webName)).toEqual(["Haaland"]);
  });

  it("filters by price range", () => {
    const result = filterPlayers(players, {
      ...EMPTY_FILTERS,
      ranges: { price: { min: 10, max: null } },
    });
    expect(result.map((player) => player.webName).sort()).toEqual([
      "Haaland",
      "Palmer",
      "Salah",
    ]);
  });

  it("filters by status", () => {
    const result = filterPlayers(players, {
      ...EMPTY_FILTERS,
      statuses: ["d"],
    });
    expect(result.map((player) => player.webName)).toEqual(["Haaland"]);
  });

  it("combines multiple simultaneous filters with AND logic", () => {
    const filters: PlayerFilters = {
      ...EMPTY_FILTERS,
      positions: ["MID"],
      ranges: { minutes: { min: 800, max: null } },
    };
    const result = filterPlayers(players, filters);
    expect(result.map((player) => player.webName)).toEqual(["Salah"]);
  });

  it("returns no players when nothing matches", () => {
    const result = filterPlayers(players, {
      ...EMPTY_FILTERS,
      positions: ["GKP"],
    });
    expect(result).toHaveLength(0);
  });

  it("applies derived stats such as xGI in range filters", () => {
    const result = filterPlayers(players, {
      ...EMPTY_FILTERS,
      ranges: { xGI: { min: 10, max: null } },
    });
    expect(result.map((player) => player.webName).sort()).toEqual([
      "Haaland",
      "Palmer",
      "Salah",
    ]);
  });

  it("filters representative Phase 3 statistics", () => {
    const enriched = players.map((player, index) => ({
      ...player,
      bonus: index * 5,
      bps: index * 250,
      xG90: index * 0.3,
    }));
    expect(
      filterPlayers(enriched, {
        ...EMPTY_FILTERS,
        ranges: { bonus: { min: 10, max: null } },
      }).map((player) => player.webName),
    ).toEqual(["Haaland", "Saliba"]);
    expect(
      filterPlayers(enriched, {
        ...EMPTY_FILTERS,
        ranges: { bps: { min: 500, max: null } },
      }).map((player) => player.webName),
    ).toEqual(["Haaland", "Saliba"]);
    expect(
      filterPlayers(enriched, {
        ...EMPTY_FILTERS,
        ranges: { xG90: { min: 0.5, max: null } },
      }).map((player) => player.webName),
    ).toEqual(["Haaland", "Saliba"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter state", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("is true when a range filter is set", () => {
    expect(
      hasActiveFilters({
        ...EMPTY_FILTERS,
        ranges: { minutes: { min: 300, max: null } },
      }),
    ).toBe(true);
  });

  it("is true when search text is present", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "sala" })).toBe(true);
  });
});

describe("sortPlayers", () => {
  it("sorts ascending by a numeric column", () => {
    const result = sortPlayers(players, [{ id: "price", desc: false }]);
    expect(result.map((player) => player.webName)).toEqual([
      "Saliba",
      "Palmer",
      "Salah",
      "Haaland",
    ]);
  });

  it("sorts descending by a numeric column", () => {
    const result = sortPlayers(players, [{ id: "points", desc: true }]);
    expect(result.map((player) => player.webName)).toEqual([
      "Haaland",
      "Salah",
      "Palmer",
      "Saliba",
    ]);
  });

  it("applies multi-column sorting with priority order", () => {
    const withTie = [
      makePlayer({
        id: 5,
        webName: "PlayerA",
        position: "MID",
        minutes: 500,
        price: 5,
      }),
      makePlayer({
        id: 6,
        webName: "PlayerB",
        position: "MID",
        minutes: 500,
        price: 4,
      }),
    ];
    const result = sortPlayers(withTie, [
      { id: "minutes", desc: true },
      { id: "price", desc: false },
    ]);
    expect(result.map((player) => player.webName)).toEqual([
      "PlayerB",
      "PlayerA",
    ]);
  });

  it("sorts enriched statistics in both directions", () => {
    expect(
      sortPlayers(players, [{ id: "bps", desc: true }]).map(
        (player) => player.webName,
      ),
    ).toEqual(["Salah", "Palmer", "Haaland", "Saliba"]);
    expect(
      sortPlayers(players, [{ id: "defensiveContribution", desc: false }]).map(
        (player) => player.webName,
      ),
    ).toEqual(["Salah", "Palmer", "Haaland", "Saliba"]);
  });

  it("returns players unchanged when no sort rules are provided", () => {
    expect(sortPlayers(players, [])).toEqual(players);
  });
});
