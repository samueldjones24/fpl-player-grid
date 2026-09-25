"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  columnVisibilityFeature,
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Column,
} from "@tanstack/react-table";
import type {
  Player,
  PlayerStatus,
  Position,
  PlayerSummary,
} from "@/lib/fpl/types";
import { FixtureStrip } from "./fixture";
import { PlayerHistory } from "./player-history";
import { BackToTop } from "./back-to-top";
import { buildGridSearchParams, parseGridUrlState } from "@/lib/url-state";
import {
  EMPTY_FILTERS,
  RANGE_FILTER_KEYS,
  filterPlayers,
  hasActiveFilters,
  sortPlayers,
  type PlayerFilters,
  type RangeFilterKey,
  type SortRule,
} from "@/lib/player-filters";
import {
  MAX_COMPARISON_PLAYERS,
  formatComparisonValue,
  toggleComparisonSelection,
} from "@/lib/player-comparison";
import {
  PLAYER_STAT_DEFINITIONS,
  STAT_GROUP_LABELS,
  type PlayerStatDefinition,
  type PlayerStatKey,
  type StatGroup,
} from "@/lib/player-stats";
import styles from "./player-grid.module.css";

const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature });
type Features = typeof features;
const columnHelper = createColumnHelper<Features, Player>();

const POSITIONS: Position[] = ["GKP", "DEF", "MID", "FWD"];
const STATUS_LABELS: Record<PlayerStatus, string> = {
  a: "Available",
  d: "Doubtful",
  i: "Injured",
  s: "Suspended",
  u: "Unavailable",
};
const STAT_COLUMNS = PLAYER_STAT_DEFINITIONS;
const comparisonSummaryRequests = new Map<number, Promise<PlayerSummary>>();
const STAT_GROUPS: StatGroup[] = [
  "core",
  "attacking",
  "defending",
  "bonus",
  "ict",
  "ownership",
];
const statByKey = new Map(STAT_COLUMNS.map((column) => [column.key, column]));
const getStatDescription = (key: PlayerStatKey) => {
  const stat = statByKey.get(key);
  return stat && "description" in stat ? stat.description : undefined;
};
const formatStat = (definition: PlayerStatDefinition, value: number) => {
  const decimals = definition.decimals ?? 0;
  if (
    definition.key === "transfersIn" ||
    definition.key === "transfersOut" ||
    definition.key === "transfersBalance"
  ) {
    return value.toLocaleString("en-GB");
  }
  const formatted = value.toFixed(decimals);
  if (definition.type === "percentage") return `${formatted}%`;
  if (definition.type === "currency")
    return `${definition.key === "priceChange" && value >= 0 ? "+" : ""}£${formatted}m`;
  return formatted;
};

type HistoryMetric =
  | "points"
  | "minutes"
  | "goals"
  | "assists"
  | "xG"
  | "xA"
  | "xGC"
  | "bonus"
  | "bps"
  | "cleanSheets"
  | "goalsConceded"
  | "saves"
  | "defensiveContribution"
  | "clearancesBlocksInterceptions";

const HISTORY_METRIC_LABELS: Record<HistoryMetric, string> = {
  points: "Pts",
  minutes: "Min",
  goals: "G",
  assists: "A",
  xG: "xG",
  xA: "xA",
  xGC: "xGC",
  bonus: "Bonus",
  bps: "BPS",
  cleanSheets: "Clean sheets",
  goalsConceded: "Goals conceded",
  saves: "Saves",
  defensiveContribution: "Defensive contributions",
  clearancesBlocksInterceptions: "Clearances / blocks / interceptions",
};

function makeColumns(
  expandedPlayerId: number | null,
  selectedIds: number[],
  togglePlayer: (playerId: number) => void,
  toggleSelection: (playerId: number) => void,
  options: { includeSelect?: boolean; includeExpander?: boolean } = {},
) {
  const { includeSelect = true, includeExpander = true } = options;
  return columnHelper.columns([
    ...(includeSelect
      ? [
          columnHelper.display({
            id: "select",
            header: "Compare",
            enableHiding: false,
            enableSorting: false,
            cell: (info) => {
              const player = info.row.original;
              const selected = selectedIds.includes(player.id);
              const limitReached =
                selectedIds.length >= MAX_COMPARISON_PLAYERS && !selected;
              return (
                <input
                  type="checkbox"
                  className={styles.compareSelectCheckbox}
                  checked={selected}
                  aria-label={
                    selected
                      ? `Remove ${player.webName} from comparison`
                      : limitReached
                        ? `Comparison limit reached; remove a player to add ${player.webName}`
                        : `Select ${player.webName} for comparison`
                  }
                  title={
                    selected
                      ? "Selected for comparison"
                      : limitReached
                        ? "Comparison limit reached. Remove a player to add another."
                        : `Select ${player.webName} for comparison`
                  }
                  disabled={limitReached}
                  onChange={() => toggleSelection(player.id)}
                />
              );
            },
          }),
        ]
      : []),
    ...(includeExpander
      ? [
          columnHelper.display({
            id: "expander",
            header: "",
            enableHiding: false,
            enableSorting: false,
            cell: (info) => {
              const player = info.row.original;
              const isExpanded = expandedPlayerId === player.id;
              return (
                <button
                  type="button"
                  className={styles.expandButton}
                  title={`${isExpanded ? "Collapse" : "Expand"} ${player.webName} history`}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${player.webName} history`}
                  aria-expanded={isExpanded}
                  onClick={() => togglePlayer(player.id)}
                >
                  <span
                    className={`${styles.caret} ${isExpanded ? styles.caretExpanded : ""}`}
                    aria-hidden="true"
                  />
                </button>
              );
            },
          }),
        ]
      : []),
    columnHelper.accessor((player) => player.webName, {
      id: "player",
      header: "Player",
      enableHiding: false,
      cell: (info) => {
        const player = info.row.original;
        const isUnavailable = player.status !== "a";
        return (
          <span className={styles.playerCell}>
            <span className={styles.playerName}>
              {player.webName}
              {isUnavailable && (
                <span
                  className={styles.statusDot}
                  data-status={player.status}
                  title={STATUS_LABELS[player.status]}
                  aria-label={STATUS_LABELS[player.status]}
                />
              )}
            </span>
          </span>
        );
      },
    }),
    columnHelper.accessor("position", {
      id: "position",
      header: "Pos",
      enableHiding: false,
      enableSorting: false,
      cell: (info) => (
        <span className={styles.position}>{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("team", {
      id: "team",
      header: "Team",
      enableHiding: false,
      enableSorting: false,
    }),
    columnHelper.accessor((player) => player.nextFixtures.length, {
      id: "fixtures",
      header: "Fixtures",
      enableSorting: false,
      cell: (info) => (
        <FixtureStrip fixtures={info.row.original.nextFixtures} />
      ),
    }),
    ...STAT_COLUMNS.map((column) =>
      columnHelper.accessor((player) => player[column.key] as number, {
        id: column.key,
        header: column.label,
        cell: (info) => formatStat(column, info.getValue()),
        meta: {
          description: "description" in column ? column.description : undefined,
        },
      }),
    ),
  ]);
}

function SortableHeader({
  column,
  label,
  description,
  sortCount,
}: {
  column: Column<Features, Player, unknown>;
  label: string;
  description?: string;
  sortCount: number;
}) {
  const direction = column.getIsSorted();
  const sortIndex = direction ? column.getSortIndex() : -1;
  const showSortHelp = column.id === "points";
  const sortHelpMessage =
    "Tip: Shift + click a column to add another sort level.";

  return (
    <span className={styles.sortHeader}>
      {showSortHelp && (
        <span
          className={styles.sortHelpIcon}
          aria-label={sortHelpMessage}
          tabIndex={0}
          role="img"
        >
          <Image src="/info.svg" alt="" width={16} height={16} priority />
        </span>
      )}
      <button
        type="button"
        className={`${styles.sortButton} ${column.getCanSort() ? "" : styles.sortButtonNotSortable}`}
        title={description}
        onClick={column.getToggleSortingHandler()}
      >
        {label}
        {direction && (
          <span className={styles.sortIndicator}>
            {direction === "desc" ? "↓" : "↑"}
            {sortCount > 1 && <sup>{sortIndex + 1}</sup>}
          </span>
        )}
      </button>
    </span>
  );
}

export function PlayerGrid({ players }: { players: Player[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialUrlState = parseGridUrlState(searchParams);

  const [filters, setFilters] = useState<PlayerFilters>(
    initialUrlState.filters,
  );
  const [sorting, setSorting] = useState<SortRule[]>(initialUrlState.sorting);
  const [comparisonSorting, setComparisonSorting] = useState<SortRule[]>([
    { id: "points", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      initialUrlState.hiddenColumns.map((key) => [key, false]),
    ),
  );
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<number[]>([]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState<
    Record<number, PlayerSummary>
  >({});
  const [comparisonHistoryErrors, setComparisonHistoryErrors] = useState<
    Record<number, string>
  >({});
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);

  const teams = useMemo(
    () =>
      [
        ...new Map(
          players.map((player) => [player.teamId, player.team]),
        ).entries(),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [players],
  );

  const playerById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => playerById.get(id))
        .filter((player): player is Player => Boolean(player)),
    [playerById, selectedIds],
  );

  const teamNameById = useMemo(
    () => new Map(teams.map(([id, name]) => [id, name])),
    [teams],
  );

  const toggleExpandedPlayer = useCallback((playerId: number) => {
    setExpandedPlayerIds((current) => {
      if (current.includes(playerId)) {
        return current;
      }
      return [...current, playerId];
    });

    setExpandedPlayerId((current) => (current === playerId ? null : playerId));
  }, []);

  const toggleSelectedPlayer = useCallback(
    (playerId: number) => {
      const nextSelectedIds = toggleComparisonSelection(selectedIds, playerId);
      setSelectedIds(nextSelectedIds);
      if (nextSelectedIds.length < 2) setComparisonOpen(false);
    },
    [selectedIds],
  );

  const removeSelectedPlayer = useCallback(
    (playerId: number) => {
      const nextSelectedIds = selectedIds.filter((id) => id !== playerId);
      setSelectedIds(nextSelectedIds);
      if (nextSelectedIds.length < 2) setComparisonOpen(false);
    },
    [selectedIds],
  );

  const clearSelectedPlayers = useCallback(() => {
    setSelectedIds([]);
    setComparisonOpen(false);
  }, []);

  const filteredPlayers = useMemo(
    () => filterPlayers(players, filters),
    [players, filters],
  );
  const rows = useMemo(
    () => sortPlayers(filteredPlayers, sorting),
    [filteredPlayers, sorting],
  );
  const columns = useMemo(
    () =>
      makeColumns(
        expandedPlayerId,
        selectedIds,
        toggleExpandedPlayer,
        toggleSelectedPlayer,
      ),
    [expandedPlayerId, selectedIds, toggleExpandedPlayer, toggleSelectedPlayer],
  );
  const comparisonColumns = useMemo(
    () =>
      makeColumns(
        null,
        [],
        () => undefined,
        () => undefined,
        { includeSelect: false, includeExpander: false },
      ),
    [],
  );
  const comparisonRows = useMemo(
    () => sortPlayers(selectedPlayers, comparisonSorting),
    [selectedPlayers, comparisonSorting],
  );

  useEffect(() => {
    if (!dialogRef.current) return;
    if (comparisonOpen) {
      try {
        if (!dialogRef.current.open) dialogRef.current.showModal();
      } catch {
        dialogRef.current.setAttribute("open", "open");
      }
      return;
    }
    if (dialogRef.current.open) dialogRef.current.close();
  }, [comparisonOpen]);

  useEffect(() => {
    const closeFilterMenus = (event: PointerEvent) => {
      const grid = gridRef.current;
      if (!grid) return;

      const target = event.target;
      const clickedElement = target instanceof Element ? target : null;
      const clickedDropdown = clickedElement?.closest("details");

      grid.querySelectorAll("details[open]").forEach((dropdown) => {
        if (dropdown !== clickedDropdown) dropdown.removeAttribute("open");
      });
    };

    document.addEventListener("pointerdown", closeFilterMenus);
    return () => document.removeEventListener("pointerdown", closeFilterMenus);
  }, []);

  useEffect(() => {
    const hiddenColumns = Object.entries(columnVisibility)
      .filter(([, visible]) => visible === false)
      .map(([key]) => key);
    const params = buildGridSearchParams({ filters, sorting, hiddenColumns });
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [filters, sorting, columnVisibility, pathname, router]);

  const pendingComparisonIds = useMemo(
    () =>
      selectedPlayers
        .filter(
          (player) =>
            !comparisonHistory[player.id] &&
            !comparisonHistoryErrors[player.id] &&
            !comparisonSummaryRequests.has(player.id),
        )
        .map((player) => player.id),
    [comparisonHistory, comparisonHistoryErrors, selectedPlayers],
  );

  useEffect(() => {
    if (pendingComparisonIds.length === 0) return;

    const loadSummary = async (player: Player) => {
      const response = await fetch(`/api/players/${player.id}`);
      if (!response.ok) throw new Error("History request failed");
      return (await response.json()) as PlayerSummary;
    };

    pendingComparisonIds.forEach((playerId) => {
      const player = playerById.get(playerId);
      if (!player) return;

      const request = loadSummary(player);
      comparisonSummaryRequests.set(playerId, request);

      void request
        .then((summary) => {
          setComparisonHistory((current) => ({
            ...current,
            [playerId]: summary,
          }));
        })
        .catch(() => {
          setComparisonHistoryErrors((current) => ({
            ...current,
            [playerId]: `Unable to load recent history for ${player.webName}.`,
          }));
        })
        .finally(() => {
          comparisonSummaryRequests.delete(playerId);
        });
    });
  }, [pendingComparisonIds, playerById]);

  const openComparison = () => {
    if (selectedPlayers.length >= 2) setComparisonOpen(true);
  };

  const closeComparison = () => {
    setComparisonOpen(false);
    if (dialogRef.current?.open) dialogRef.current.close();
  };

  function toggleListFilter<K extends "positions" | "teamIds" | "statuses">(
    key: K,
    value: PlayerFilters[K][number],
  ) {
    setFilters((current) => {
      const list = current[key] as Array<typeof value>;
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...current, [key]: next };
    });
  }

  function setRange(key: RangeFilterKey, bound: "min" | "max", raw: string) {
    const value = raw === "" ? null : Number(raw);
    setFilters((current) => ({
      ...current,
      ranges: {
        ...current.ranges,
        [key]: {
          min: current.ranges[key]?.min ?? null,
          max: current.ranges[key]?.max ?? null,
          [bound]: value,
        },
      },
    }));
  }

  function removeRange(key: RangeFilterKey) {
    setFilters((current) => {
      const ranges = { ...current.ranges };
      delete ranges[key];
      return { ...current, ranges };
    });
  }

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    for (const position of filters.positions) {
      chips.push({
        id: `position-${position}`,
        label: `Position: ${position}`,
        onRemove: () => toggleListFilter("positions", position),
      });
    }
    for (const teamId of filters.teamIds) {
      const teamName = teamNameById.get(teamId) ?? teamId;
      chips.push({
        id: `team-${teamId}`,
        label: `Team: ${teamName}`,
        onRemove: () => toggleListFilter("teamIds", teamId),
      });
    }
    for (const status of filters.statuses) {
      chips.push({
        id: `status-${status}`,
        label: `Status: ${STATUS_LABELS[status]}`,
        onRemove: () => toggleListFilter("statuses", status),
      });
    }
    for (const key of RANGE_FILTER_KEYS) {
      const range = filters.ranges[key];
      if (!range || (range.min === null && range.max === null)) continue;
      const label =
        range.min !== null && range.max !== null
          ? `${statByKey.get(key)?.label ?? key}: ${range.min}–${range.max}`
          : range.min !== null
            ? `${statByKey.get(key)?.label ?? key} ≥ ${range.min}`
            : `${statByKey.get(key)?.label ?? key} ≤ ${range.max}`;
      chips.push({
        id: `range-${key}`,
        label,
        onRemove: () => removeRange(key),
      });
    }
    return chips;
  }, [filters, teamNameById]);

  const filtersActive = hasActiveFilters(filters);
  const visibleColumnCount = useMemo(
    () =>
      4 +
      STAT_COLUMNS.length -
      Object.values(columnVisibility).filter((visible) => visible === false)
        .length,
    [columnVisibility],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    state: { sorting, columnVisibility },
    manualSorting: true,
    onSortingChange: (updater) =>
      setSorting((current) =>
        typeof updater === "function" ? updater(current) : updater,
      ),
    onColumnVisibilityChange: (updater) =>
      setColumnVisibility((current) =>
        typeof updater === "function" ? updater(current) : updater,
      ),
    enableMultiSort: true,
    getRowId: (player) => String(player.id),
  });

  const comparisonTable = useTable({
    features,
    columns: comparisonColumns,
    data: comparisonRows,
    state: { sorting: comparisonSorting, columnVisibility: {} },
    manualSorting: true,
    onSortingChange: (updater) =>
      setComparisonSorting((current) =>
        typeof updater === "function" ? updater(current) : updater,
      ),
    enableMultiSort: true,
    getRowId: (player) => String(player.id),
  });

  return (
    <main ref={gridRef} className="app-shell">
      <header className="app-header">
        <div>
          <div className="heading-lockup">
            <Image
              src="/logo.svg"
              alt=""
              width={72}
              height={68}
              className="heading-logo"
            />
            <div className="heading-copy">
              <h1>FPL Player Grid</h1>
              <p className="heading-tagline">
                A better way to compare FPL players
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.controlsBar}>
        <section className={styles.searchBar}>
          <input
            type="search"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
            placeholder="Search players..."
            aria-label="Search players"
          />
        </section>

        <section className={styles.filterBar} aria-label="Player filters">
          <details className={styles.dropdown}>
            <summary>
              Position
              {filters.positions.length > 0 && (
                <span className={styles.badge}>{filters.positions.length}</span>
              )}
            </summary>
            <div className={styles.filterMenu}>
              {POSITIONS.map((position) => (
                <label key={position}>
                  <input
                    type="checkbox"
                    checked={filters.positions.includes(position)}
                    onChange={() => toggleListFilter("positions", position)}
                  />
                  {position}
                </label>
              ))}
            </div>
          </details>

          <details className={styles.dropdown}>
            <summary>
              Team
              {filters.teamIds.length > 0 && (
                <span className={styles.badge}>{filters.teamIds.length}</span>
              )}
            </summary>
            <div className={`${styles.filterMenu} ${styles.scrollMenu}`}>
              {teams.map(([id, name]) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={filters.teamIds.includes(id)}
                    onChange={() => toggleListFilter("teamIds", id)}
                  />
                  {name}
                </label>
              ))}
            </div>
          </details>

          <details className={styles.dropdown}>
            <summary>
              Status
              {filters.statuses.length > 0 && (
                <span className={styles.badge}>{filters.statuses.length}</span>
              )}
            </summary>
            <div className={styles.filterMenu}>
              {(Object.keys(STATUS_LABELS) as PlayerStatus[]).map((status) => (
                <label key={status}>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => toggleListFilter("statuses", status)}
                  />
                  {STATUS_LABELS[status]}
                </label>
              ))}
            </div>
          </details>

          <details className={styles.dropdown}>
            <summary>Price</summary>
            <div className={styles.rangeMenu}>
              <label>
                Min{" "}
                <input
                  type="number"
                  step="0.1"
                  value={filters.ranges.price?.min ?? ""}
                  onChange={(event) =>
                    setRange("price", "min", event.target.value)
                  }
                />
              </label>
              <label>
                Max{" "}
                <input
                  type="number"
                  step="0.1"
                  value={filters.ranges.price?.max ?? ""}
                  onChange={(event) =>
                    setRange("price", "max", event.target.value)
                  }
                />
              </label>
            </div>
          </details>

          <details className={styles.dropdown}>
            <summary>More filters</summary>
            <div className={`${styles.rangeMenu} ${styles.rangeMenuGrid}`}>
              {RANGE_FILTER_KEYS.filter((key) => key !== "price").map((key) => (
                <fieldset key={key}>
                  <legend>
                    <span
                      className={styles.filterLabel}
                      title={getStatDescription(key)}
                      tabIndex={getStatDescription(key) ? 0 : undefined}
                    >
                      {statByKey.get(key)?.label ?? key}
                    </span>
                  </legend>
                  <label>
                    Min{" "}
                    <input
                      type="number"
                      step="0.1"
                      value={filters.ranges[key]?.min ?? ""}
                      onChange={(event) =>
                        setRange(key, "min", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Max{" "}
                    <input
                      type="number"
                      step="0.1"
                      value={filters.ranges[key]?.max ?? ""}
                      onChange={(event) =>
                        setRange(key, "max", event.target.value)
                      }
                    />
                  </label>
                </fieldset>
              ))}
            </div>
          </details>
        </section>
      </div>

      {(activeChips.length > 0 || filtersActive) && (
        <section className={styles.activeFilters} aria-label="Active filters">
          {activeChips.map((chip) => (
            <button key={chip.id} type="button" onClick={chip.onRemove}>
              {chip.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          {filtersActive && (
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear all
            </button>
          )}
        </section>
      )}

      <section className={styles.gridMeta}>
        <div>
          <strong>{rows.length}</strong> players match{" "}
          <span className={styles.muted}>of {players.length}</span>
        </div>
        <div className={styles.sortState} aria-label="Sort order">
          {sorting.length === 0 && (
            <span className={styles.muted}>Not sorted</span>
          )}
          {sorting.map((rule, index) => (
            <button
              key={rule.id}
              type="button"
              onClick={() =>
                setSorting((current) =>
                  current.filter((item) => item.id !== rule.id),
                )
              }
            >
              {statByKey.get(rule.id as PlayerStatKey)?.label ??
                (rule.id === "player" ? "Player" : rule.id)}{" "}
              {rule.desc ? "↓" : "↑"} <sup>{index + 1}</sup>{" "}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {sorting.length > 0 && (
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => setSorting([])}
            >
              Clear sort
            </button>
          )}
        </div>
      </section>

      <section className={styles.toolbar}>
        <details className={styles.dropdown}>
          <summary>
            Columns{" "}
            <span className={styles.muted}>{visibleColumnCount} shown</span>
            <span className={styles.columnSummaryHint}>
              Choose which stats appear in the player table.
            </span>
          </summary>
          <div className={`${styles.filterMenu} ${styles.columnMenu}`}>
            {STAT_GROUPS.map((group) => (
              <div key={group} className={styles.columnGroup}>
                <p className={styles.columnGroupLabel}>
                  {STAT_GROUP_LABELS[group]}
                </p>
                {STAT_COLUMNS.filter((column) => column.group === group).map(
                  (column) => (
                    <label
                      key={column.key}
                      title={
                        "description" in column ? column.description : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={columnVisibility[column.key] !== false}
                        onChange={() =>
                          setColumnVisibility((current) => ({
                            ...current,
                            [column.key]: current[column.key] === false,
                          }))
                        }
                      />
                      {column.label}
                    </label>
                  ),
                )}
              </div>
            ))}
          </div>
        </details>
      </section>

      {selectedIds.length > 0 && (
        <aside className={styles.comparisonTray} aria-label="Comparison tray">
          <div className={styles.comparisonTrayHeader}>
            <div>
              <span className="eyebrow">PLAYER COMPARISON</span>
              <strong>{selectedIds.length} selected</strong>
            </div>
            <button
              type="button"
              className={styles.clearAll}
              onClick={clearSelectedPlayers}
            >
              Clear
            </button>
          </div>
          <div className={styles.selectedPlayers}>
            {selectedPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                className={styles.selectionChip}
                onClick={() => removeSelectedPlayer(player.id)}
              >
                {player.webName} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
          {selectedIds.length >= MAX_COMPARISON_PLAYERS && (
            <p className={styles.selectionNote}>
              Comparison limit reached. Remove a player to add another.
            </p>
          )}
          <button
            type="button"
            className={styles.compareButton}
            onClick={openComparison}
            disabled={selectedIds.length < 2}
          >
            Compare Players
          </button>
        </aside>
      )}

      {rows.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No players match your filters.</p>
          <p className={styles.muted}>
            Try removing a filter or changing your search.
          </p>
          {(filtersActive || filters.query) && (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={
                        header.column.id === "player"
                          ? styles.playerColumn
                          : header.column.id === "expander"
                            ? styles.expanderColumn
                            : header.column.id === "select"
                              ? styles.selectionColumn
                              : undefined
                      }
                    >
                      {header.column.id === "select" ? (
                        <span className={styles.compareHeaderLabel}>
                          Compare
                        </span>
                      ) : (
                        header.column.id !== "expander" && (
                          <SortableHeader
                            column={header.column}
                            label={
                              statByKey.get(header.column.id as PlayerStatKey)
                                ?.label ??
                              (header.column.id === "player"
                                ? "Player"
                                : header.column.id === "position"
                                  ? "Pos"
                                  : header.column.id === "fixtures"
                                    ? "Fixtures"
                                    : "Team")
                            }
                            description={(() => {
                              const stat = statByKey.get(
                                header.column.id as PlayerStatKey,
                              );
                              return stat && "description" in stat
                                ? stat.description
                                : undefined;
                            })()}
                            sortCount={sorting.length}
                          />
                        )
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={
                          cell.column.id === "player"
                            ? styles.playerColumn
                            : cell.column.id === "expander"
                              ? styles.expanderColumn
                              : cell.column.id === "select"
                                ? styles.selectionColumn
                                : undefined
                        }
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                  {expandedPlayerIds.includes(row.original.id) && (
                    <PlayerHistory
                      playerId={row.original.id}
                      playerName={row.original.name}
                      isExpanded={expandedPlayerId === row.original.id}
                    />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className={styles.comparisonDialog}
        onClose={() => setComparisonOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeComparison();
          }
        }}
      >
        <div className={styles.comparisonDialogInner}>
          <div className={styles.comparisonHeader}>
            <div className={styles.comparisonHeaderLockup}>
              <p className="eyebrow">PLAYER COMPARISON</p>
              <span className={styles.comparisonHeaderSubtitle}>
                See how your selected players stack up, side by side
              </span>
            </div>
            <button
              type="button"
              className={styles.dialogCloseButton}
              aria-label="Close comparison"
              onClick={closeComparison}
            >
              ×
            </button>
          </div>

          <section className={styles.sectionBlock}>
            <h3>Player Totals</h3>
            <div className={styles.comparisonTableWrap}>
              <table className={styles.comparisonTable}>
                <thead>
                  {comparisonTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={
                            header.column.id === "player"
                              ? styles.playerColumn
                              : undefined
                          }
                        >
                          {!header.isPlaceholder && (
                            <SortableHeader
                              column={header.column}
                              label={
                                statByKey.get(header.column.id as PlayerStatKey)
                                  ?.label ??
                                (header.column.id === "player"
                                  ? "Player"
                                  : header.column.id === "position"
                                    ? "Pos"
                                    : header.column.id === "fixtures"
                                      ? "Fixtures"
                                      : "Team")
                              }
                              description={(() => {
                                const stat = statByKey.get(
                                  header.column.id as PlayerStatKey,
                                );
                                return stat && "description" in stat
                                  ? stat.description
                                  : undefined;
                              })()}
                              sortCount={comparisonSorting.length}
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {comparisonTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={
                            cell.column.id === "player"
                              ? styles.playerColumn
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
          </section>

          <section className={styles.sectionBlock}>
            <h3>Last 3 Gameweeks</h3>
            <div className={styles.comparisonTableWrap}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    {(
                      Object.keys(HISTORY_METRIC_LABELS) as HistoryMetric[]
                    ).map((metric) => (
                      <th key={metric} scope="col">
                        {HISTORY_METRIC_LABELS[metric]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedPlayers.map((player) => {
                    const summary = comparisonHistory[player.id];
                    return (
                      <tr key={player.id}>
                        <th scope="row" className={styles.playerColumn}>
                          {player.webName}
                        </th>
                        {(
                          Object.keys(HISTORY_METRIC_LABELS) as HistoryMetric[]
                        ).map((metric) => {
                          const total = summary
                            ? summary.history
                                .slice(-3)
                                .reduce(
                                  (sum, entry) => sum + Number(entry[metric]),
                                  0,
                                )
                            : null;
                          return (
                            <td key={`${player.id}-${metric}`}>
                              {formatComparisonValue(metric, total)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {Object.values(comparisonHistoryErrors).some(Boolean) && (
            <div className={styles.historyErrors}>
              {Object.values(comparisonHistoryErrors)
                .filter(Boolean)
                .map((message) => (
                  <p key={message}>{message}</p>
                ))}
            </div>
          )}
        </div>
      </dialog>
      <BackToTop />
    </main>
  );
}
