import type { Player } from "./fpl/types";
import {
  PLAYER_STAT_DEFINITIONS,
  type PlayerStatDefinition,
  type PlayerStatKey,
} from "./player-stats";

export const MAX_COMPARISON_PLAYERS = 4;
export const DEFAULT_COMPARISON_STATS: PlayerStatKey[] = [
  "price",
  "points",
  "form",
  "minutes",
  "xG",
  "xA",
];

export function toggleComparisonSelection(
  current: number[],
  playerId: number,
): number[] {
  if (current.includes(playerId)) {
    return current.filter((id) => id !== playerId);
  }

  if (current.length >= MAX_COMPARISON_PLAYERS) {
    return current;
  }

  return [...current, playerId];
}

export function getVisibleComparisonStats(
  players: Player[],
  selectedKeys: Set<PlayerStatKey>,
): PlayerStatDefinition[] {
  return PLAYER_STAT_DEFINITIONS.filter((definition) => {
    if (!selectedKeys.has(definition.key)) return false;
    return players.some((player) => {
      const value = player[definition.key as keyof Player];
      return typeof value === "number" && Number.isFinite(value);
    });
  });
}

export function formatComparisonValue(
  key: PlayerStatKey | string,
  value: number | null | undefined,
): string {
  const raw = value == null ? Number.NaN : Number(value);
  if (!Number.isFinite(raw)) return "—";

  const definition = PLAYER_STAT_DEFINITIONS.find((stat) => stat.key === key);
  const decimals =
    key === "xGC"
      ? 2
      : definition && "decimals" in definition
        ? (definition.decimals ?? 0)
        : 0;
  const formatted = raw.toFixed(decimals);

  if (key === "price" || key === "priceChange") {
    return `£${formatted}`;
  }

  if (key === "ownership") {
    return `${formatted}%`;
  }

  if (
    key === "transfersIn" ||
    key === "transfersOut" ||
    key === "transfersBalance"
  ) {
    return raw.toLocaleString("en-GB");
  }

  return formatted;
}
