import type { PlayerHistoryEntry } from "./fpl/types";

export interface RecentHistoryStats {
  gameweeks: number;
  points: number;
  minutes: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  xGI: number;
  bonus: number;
  xG90: number;
  xGI90: number;
}

export function summarizeRecentHistory(
  history: PlayerHistoryEntry[],
  count: number,
): RecentHistoryStats {
  const recent = history.slice(-count);
  const totals = recent.reduce(
    (summary, entry) => ({
      gameweeks: summary.gameweeks + 1,
      points: summary.points + entry.points,
      minutes: summary.minutes + entry.minutes,
      goals: summary.goals + entry.goals,
      assists: summary.assists + entry.assists,
      xG: summary.xG + entry.xG,
      xA: summary.xA + entry.xA,
      xGI: summary.xGI + entry.xG + entry.xA,
      bonus: summary.bonus + entry.bonus,
    }),
    {
      gameweeks: 0,
      points: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      xG: 0,
      xA: 0,
      xGI: 0,
      bonus: 0,
    },
  );
  return {
    ...totals,
    xG90: totals.minutes ? (totals.xG / totals.minutes) * 90 : 0,
    xGI90: totals.minutes ? (totals.xGI / totals.minutes) * 90 : 0,
  };
}
