"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { PlayerHistoryEntry, PlayerSummary } from "@/lib/fpl/types";
import { formatComparisonValue } from "@/lib/player-comparison";
import { PLAYER_STAT_DEFINITIONS } from "@/lib/player-stats";
import styles from "./player-grid.module.css";

const historyCache = new Map<number, PlayerSummary>();
const historyFeatures = tableFeatures({ columnVisibilityFeature });
type HistoryFeatures = typeof historyFeatures;
const historyColumnHelper = createColumnHelper<
  HistoryFeatures,
  PlayerHistoryEntry
>();
const HIDDEN_HISTORY_STAT_KEYS = new Set([
  "price",
  "form",
  "starts",
  "pointsPerGame",
  "xG90",
  "xA90",
  "xGI90",
  "ownership",
  "transfersIn",
  "transfersOut",
  "transfersBalance",
  "priceChange",
]);
const fetchPlayerSummary = async (playerId: number) => {
  const response = await fetch(`/api/players/${playerId}`);
  if (!response.ok) throw new Error("History request failed");
  return (await response.json()) as PlayerSummary;
};

function HistoryTable({ history }: { history: PlayerHistoryEntry[] }) {
  const visibleDefinitions = useMemo(
    () =>
      PLAYER_STAT_DEFINITIONS.filter(
        (definition) =>
          !HIDDEN_HISTORY_STAT_KEYS.has(definition.key) &&
          history.some((entry) =>
            Number.isFinite(
              Number(entry[definition.key as keyof PlayerHistoryEntry]),
            ),
          ),
      ),
    [history],
  );
  const columns = useMemo(
    () =>
      historyColumnHelper.columns([
        historyColumnHelper.accessor("gameweek", {
          id: "gameweek",
          header: "GW",
          cell: (info) => info.getValue(),
        }),
        historyColumnHelper.accessor((entry) => entry.opponent, {
          id: "opponent",
          header: "Opponent",
          cell: (info) =>
            `${info.getValue()} (${info.row.original.isHome ? "H" : "A"})`,
        }),
        ...visibleDefinitions.map((definition) =>
          historyColumnHelper.accessor(
            (entry) =>
              entry[definition.key as keyof PlayerHistoryEntry] as
                number | undefined,
            {
              id: definition.key,
              header: definition.label,
              cell: (info) =>
                formatComparisonValue(definition.key, info.getValue()),
            },
          ),
        ),
      ]),
    [visibleDefinitions],
  );
  const table = useTable({
    features: historyFeatures,
    columns,
    data: history.slice().reverse(),
    state: { columnVisibility: {} },
    getRowId: (entry) => String(entry.gameweek),
  });

  return (
    <div className={styles.historyTableWrap}>
      <table className={styles.historyTable}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={
                    header.column.id === "gameweek"
                      ? styles.historyPinnedGameweek
                      : header.column.id === "opponent"
                        ? styles.historyPinnedOpponent
                        : undefined
                  }
                >
                  {!header.isPlaceholder &&
                    String(header.column.columnDef.header ?? header.column.id)}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={
                    cell.column.id === "gameweek"
                      ? styles.historyPinnedGameweek
                      : cell.column.id === "opponent"
                        ? styles.historyPinnedOpponent
                        : undefined
                  }
                >
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlayerHistory({
  playerId,
  playerName,
  isExpanded,
}: {
  playerId: number;
  playerName: string;
  isExpanded: boolean;
}) {
  const [summary, setSummary] = useState<PlayerSummary | null>(
    () => historyCache.get(playerId) ?? null,
  );
  const [loading, setLoading] = useState(!historyCache.has(playerId));
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchPlayerSummary(playerId);
      historyCache.set(playerId, next);
      setSummary(next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!isExpanded || summary) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [isExpanded, load, summary]);

  if (!isExpanded) {
    return null;
  }

  return (
    <tr className={styles.expandedRow}>
      <td colSpan={99}>
        <section
          className={styles.historyPanel}
          aria-label={`${playerName} Gameweek history`}
        >
          <div className={styles.historyHeading}>
            <div>
              <span className="eyebrow">PLAYER HISTORY</span>
              <h2>{playerName}</h2>
            </div>
          </div>
          {loading && (
            <div className={styles.historyTableWrap} aria-hidden="true">
              <div className={styles.skeletonHeader}>
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} className={styles.skeletonCell} />
                ))}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className={styles.skeletonRow}>
                  {Array.from({ length: 6 }, (_, cellIndex) => (
                    <span key={cellIndex} className={styles.skeletonCell} />
                  ))}
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className={styles.historyMessage}>
              <p>Unable to load player history.</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  void load();
                }}
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && summary && summary.history.length === 0 && (
            <p className={styles.historyMessage}>
              No Gameweek history available yet.
            </p>
          )}
          {!loading && !error && summary && summary.history.length > 0 && (
            <HistoryTable history={summary.history} />
          )}
        </section>
      </td>
    </tr>
  );
}
