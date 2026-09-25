import type { PlayerStatus, Position } from "./fpl/types";
import {
  EMPTY_FILTERS,
  type PlayerFilters,
  type RangeFilterKey,
  type SortRule,
} from "./player-filters";

const POSITIONS: readonly Position[] = ["GKP", "DEF", "MID", "FWD"];
const STATUSES: readonly PlayerStatus[] = ["a", "d", "i", "s", "u"];

export const DEFAULT_SORT: SortRule[] = [];

export interface GridUrlState {
  filters: PlayerFilters;
  sorting: SortRule[];
  hiddenColumns: string[];
}

function parseEnumList<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  const allowedSet: readonly string[] = allowed;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => allowedSet.includes(item));
}

function parseTeamIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((id) => Number.isFinite(id));
}

function parseRanges(value: string | null): PlayerFilters["ranges"] {
  const ranges: PlayerFilters["ranges"] = {};
  if (!value) return ranges;

  for (const entry of value.split(",")) {
    const [key, minRaw, maxRaw] = entry.split(":");
    if (!key) continue;
    const min = minRaw ? Number(minRaw) : null;
    const max = maxRaw ? Number(maxRaw) : null;
    if (min === null && max === null) continue;
    if ((minRaw && Number.isNaN(min)) || (maxRaw && Number.isNaN(max)))
      continue;
    ranges[key as RangeFilterKey] = { min, max };
  }

  return ranges;
}

function parseSorting(value: string | null): SortRule[] {
  if (value === null) return DEFAULT_SORT;
  if (value === "" || value === "none") return [];

  return value
    .split(",")
    .map((entry) => {
      const [id, direction] = entry.split(":");
      return id ? { id, desc: direction === "desc" } : null;
    })
    .filter((rule): rule is SortRule => rule !== null);
}

export function parseGridUrlState(searchParams: URLSearchParams): GridUrlState {
  const hasFilterParams =
    searchParams.has("pos") ||
    searchParams.has("team") ||
    searchParams.has("status") ||
    searchParams.has("range");

  const filters: PlayerFilters = hasFilterParams
    ? {
        query: "",
        positions: parseEnumList(searchParams.get("pos"), POSITIONS),
        teamIds: parseTeamIds(searchParams.get("team")),
        statuses: parseEnumList(searchParams.get("status"), STATUSES),
        ranges: parseRanges(searchParams.get("range")),
      }
    : EMPTY_FILTERS;

  const sorting = parseSorting(searchParams.get("sort"));

  const hiddenColumns = (searchParams.get("hide") ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  return { filters, sorting, hiddenColumns };
}

export function buildGridSearchParams(state: GridUrlState): URLSearchParams {
  const { filters, sorting, hiddenColumns } = state;
  const params = new URLSearchParams();

  if (filters.positions.length) params.set("pos", filters.positions.join(","));
  if (filters.teamIds.length) params.set("team", filters.teamIds.join(","));
  if (filters.statuses.length) params.set("status", filters.statuses.join(","));

  const rangeEntries = Object.entries(filters.ranges).filter(
    ([, range]) => range && (range.min !== null || range.max !== null),
  );
  if (rangeEntries.length) {
    params.set(
      "range",
      rangeEntries
        .map(([key, range]) => `${key}:${range?.min ?? ""}:${range?.max ?? ""}`)
        .join(","),
    );
  }

  if (sorting.length) {
    params.set(
      "sort",
      sorting
        .map((rule) => `${rule.id}:${rule.desc ? "desc" : "asc"}`)
        .join(","),
    );
  }

  if (hiddenColumns.length) params.set("hide", hiddenColumns.join(","));

  return params;
}
