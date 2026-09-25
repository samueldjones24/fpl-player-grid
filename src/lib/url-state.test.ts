import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "./player-filters";
import {
  DEFAULT_SORT,
  buildGridSearchParams,
  parseGridUrlState,
} from "./url-state";

describe("parseGridUrlState", () => {
  it("falls back to defaults when no params are present", () => {
    const state = parseGridUrlState(new URLSearchParams());
    expect(state.filters).toEqual(EMPTY_FILTERS);
    expect(state.sorting).toEqual(DEFAULT_SORT);
    expect(state.hiddenColumns).toEqual([]);
  });

  it("parses filters, ranges, sort, and hidden columns", () => {
    const params = new URLSearchParams(
      "pos=MID,FWD&team=1,2&status=a,i&range=price:4:8,points:50:&sort=points:desc,minutes:asc&hide=xG,xA",
    );
    const state = parseGridUrlState(params);

    expect(state.filters).toEqual({
      query: "",
      positions: ["MID", "FWD"],
      teamIds: [1, 2],
      statuses: ["a", "i"],
      ranges: {
        price: { min: 4, max: 8 },
        points: { min: 50, max: null },
      },
    });
    expect(state.sorting).toEqual([
      { id: "points", desc: true },
      { id: "minutes", desc: false },
    ]);
    expect(state.hiddenColumns).toEqual(["xG", "xA"]);
  });

  it("treats a missing sort param as the default sort even when other params exist", () => {
    const state = parseGridUrlState(new URLSearchParams("pos=MID"));
    expect(state.sorting).toEqual(DEFAULT_SORT);
  });

  it("ignores the search query even if present in the URL", () => {
    const state = parseGridUrlState(new URLSearchParams("q=salah&pos=MID"));
    expect(state.filters.query).toBe("");
  });

  it("ignores unknown positions and statuses", () => {
    const state = parseGridUrlState(
      new URLSearchParams("pos=MID,BOGUS&status=a,BOGUS"),
    );
    expect(state.filters.positions).toEqual(["MID"]);
    expect(state.filters.statuses).toEqual(["a"]);
  });
});

describe("buildGridSearchParams", () => {
  it("omits all params for empty filters, cleared sort, and no hidden columns", () => {
    const params = buildGridSearchParams({
      filters: EMPTY_FILTERS,
      sorting: [],
      hiddenColumns: [],
    });

    expect(params.toString()).toBe("");
  });

  it("round-trips through parseGridUrlState", () => {
    const state = {
      filters: {
        query: "",
        positions: ["MID", "FWD"] as const,
        teamIds: [1, 2],
        statuses: ["a", "i"] as const,
        ranges: {
          price: { min: 4, max: 8 },
          points: { min: 50, max: null },
        },
      },
      sorting: [
        { id: "points", desc: true },
        { id: "minutes", desc: false },
      ],
      hiddenColumns: ["xG", "xA"],
    };

    const params = buildGridSearchParams({
      filters: {
        ...state.filters,
        positions: [...state.filters.positions],
        statuses: [...state.filters.statuses],
      },
      sorting: state.sorting,
      hiddenColumns: state.hiddenColumns,
    });
    const parsed = parseGridUrlState(params);

    expect(parsed.filters).toEqual(state.filters);
    expect(parsed.sorting).toEqual(state.sorting);
    expect(parsed.hiddenColumns).toEqual(state.hiddenColumns);
  });
});
