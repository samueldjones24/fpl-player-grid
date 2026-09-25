// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Player } from "@/lib/fpl/types";
import { PlayerGrid } from "./player-grid";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

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
    status: "d",
  }),
];

function getPlayerRows() {
  const table = screen.getByRole("table");
  const rows = within(table).getAllByRole("row");
  return rows.slice(1); // drop the header row
}

afterEach(() => {
  cleanup();
  routerReplace.mockClear();
});

describe("PlayerGrid", () => {
  it("renders every player by default in the given order, unsorted", () => {
    render(<PlayerGrid players={players} />);

    expect(screen.getByText("3", { selector: "strong" })).toBeInTheDocument();
    const rows = getPlayerRows();
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Salah")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Palmer")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Haaland")).toBeInTheDocument();
  });

  it("filters players by search query", async () => {
    const user = userEvent.setup();
    render(<PlayerGrid players={players} />);

    const search = screen.getByRole("searchbox", { name: "Search players" });
    await user.type(search, "sala");

    expect(
      await screen.findByText("1", { selector: "strong" }),
    ).toBeInTheDocument();
    const rows = getPlayerRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("Salah")).toBeInTheDocument();
  });

  it("sorts by points descending on first click, ascending on second click", async () => {
    const user = userEvent.setup();
    render(<PlayerGrid players={players} />);

    const pointsHeader = screen
      .getAllByRole("columnheader")
      .find((header) => header.textContent?.includes("Points"));
    if (!pointsHeader) throw new Error("Points column header not found");
    const sortButton = within(pointsHeader).getByRole("button");

    await user.click(sortButton);
    let rows = getPlayerRows();
    expect(within(rows[0]).getByText("Haaland")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Palmer")).toBeInTheDocument();

    await user.click(sortButton);
    rows = getPlayerRows();
    expect(within(rows[0]).getByText("Palmer")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Haaland")).toBeInTheDocument();
  });

  it("adds players to the comparison tray via the compare checkboxes", async () => {
    const user = userEvent.setup();
    render(<PlayerGrid players={players} />);

    await user.click(
      screen.getByRole("checkbox", { name: "Select Salah for comparison" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Select Palmer for comparison" }),
    );

    expect(
      await screen.findByRole("complementary", { name: "Comparison tray" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Compare Players" }),
    ).toBeEnabled();
  });

  it("shows a 'Clear all' action once a filter is active and resets filters when clicked", async () => {
    const user = userEvent.setup();
    render(<PlayerGrid players={players} />);

    await user.click(screen.getByText("Position"));
    await user.click(screen.getByRole("checkbox", { name: "FWD" }));

    expect(
      await screen.findByText("1", { selector: "strong" }),
    ).toBeInTheDocument();
    const clearAll = screen.getByRole("button", { name: "Clear all" });
    await user.click(clearAll);

    expect(
      await screen.findByText("3", { selector: "strong" }),
    ).toBeInTheDocument();
  });
});
