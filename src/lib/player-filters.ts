import type { Player, PlayerStatus, Position } from "./fpl/types";
import {
  RANGE_FILTER_KEYS as STAT_RANGE_FILTER_KEYS,
  type PlayerStatKey,
} from "./player-stats";

/** Player fields that support a numeric min/max range filter. */
export const RANGE_FILTER_KEYS = STAT_RANGE_FILTER_KEYS;
export type RangeFilterKey = PlayerStatKey;

export interface RangeValue {
  min: number | null;
  max: number | null;
}

export interface PlayerFilters {
  query: string;
  positions: Position[];
  teamIds: number[];
  statuses: PlayerStatus[];
  ranges: Partial<Record<RangeFilterKey, RangeValue>>;
}

export const EMPTY_FILTERS: PlayerFilters = {
  query: "",
  positions: [],
  teamIds: [],
  statuses: [],
  ranges: {},
};

const isRangeActive = (range?: RangeValue) =>
  range !== undefined && (range.min !== null || range.max !== null);

/** Strips diacritics and normalizes letters (e.g. Ø, Æ) not covered by Unicode decomposition. */
function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .replace(/[łŁ]/g, "l")
    .replace(/[đĐ]/g, "d")
    .replace(/[ßẞ]/g, "ss")
    .toLowerCase();
}

export function hasActiveFilters(filters: PlayerFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.positions.length > 0 ||
    filters.teamIds.length > 0 ||
    filters.statuses.length > 0 ||
    Object.values(filters.ranges).some(isRangeActive)
  );
}

export function filterPlayers(
  players: Player[],
  filters: PlayerFilters,
): Player[] {
  const query = normalizeSearchText(filters.query.trim());
  const ranges = Object.entries(filters.ranges) as [
    RangeFilterKey,
    RangeValue | undefined,
  ][];

  return players.filter((player) => {
    if (
      query &&
      !normalizeSearchText(player.name).includes(query) &&
      !normalizeSearchText(player.webName).includes(query)
    )
      return false;
    if (
      filters.positions.length &&
      !filters.positions.includes(player.position)
    )
      return false;
    if (filters.teamIds.length && !filters.teamIds.includes(player.teamId))
      return false;
    if (filters.statuses.length && !filters.statuses.includes(player.status))
      return false;

    for (const [key, range] of ranges) {
      if (!isRangeActive(range)) continue;
      const value = player[key];
      if (range!.min !== null && value < range!.min) return false;
      if (range!.max !== null && value > range!.max) return false;
    }

    return true;
  });
}

export interface SortRule {
  id: string;
  desc: boolean;
}

const sortValue = (player: Player, id: string): string | number => {
  if (id === "player") return player.webName;
  const value = (player as unknown as Record<string, unknown>)[id];
  return typeof value === "string" || typeof value === "number" ? value : 0;
};

export function sortPlayers(players: Player[], sorting: SortRule[]): Player[] {
  if (!sorting.length) return players;
  return [...players].sort((a, b) => {
    for (const rule of sorting) {
      const left = sortValue(a, rule.id);
      const right = sortValue(b, rule.id);
      const result =
        typeof left === "string"
          ? left.localeCompare(right as string)
          : (left as number) - (right as number);
      if (result !== 0) return rule.desc ? -result : result;
    }
    return 0;
  });
}
