export type StatGroup =
  "core" | "attacking" | "defending" | "bonus" | "ict" | "ownership";
export type StatType = "number" | "percentage" | "currency";

export type PlayerStatKey =
  | "price"
  | "points"
  | "form"
  | "minutes"
  | "starts"
  | "pointsPerGame"
  | "goals"
  | "assists"
  | "xG"
  | "xA"
  | "xGI"
  | "xG90"
  | "xA90"
  | "xGI90"
  | "cleanSheets"
  | "goalsConceded"
  | "saves"
  | "penaltiesSaved"
  | "defensiveContribution"
  | "clearancesBlocksInterceptions"
  | "tackles"
  | "recoveries"
  | "bonus"
  | "bps"
  | "influence"
  | "creativity"
  | "threat"
  | "ictIndex"
  | "ownership"
  | "transfersIn"
  | "transfersOut"
  | "transfersBalance"
  | "priceChange";

export interface PlayerStatDefinition {
  key: PlayerStatKey;
  label: string;
  group: StatGroup;
  type: StatType;
  sortable: boolean;
  filterable: boolean;
  source: "api" | "calculated";
  decimals?: number;
  description?: string;
}

export const PLAYER_STAT_DEFINITIONS = [
  {
    key: "price",
    label: "Price",
    group: "core",
    type: "currency",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
  },
  {
    key: "points",
    label: "Points",
    group: "core",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "form",
    label: "Form",
    group: "core",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
  },
  {
    key: "minutes",
    label: "Minutes",
    group: "core",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "starts",
    label: "Starts",
    group: "core",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "pointsPerGame",
    label: "Pts/Game",
    group: "core",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
  },
  {
    key: "goals",
    label: "Goals",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "assists",
    label: "Assists",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "xG",
    label: "xG",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 2,
    description: "Expected goals.",
  },
  {
    key: "xA",
    label: "xA",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 2,
    description: "Expected assists.",
  },
  {
    key: "xGI",
    label: "xGI",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 2,
    description: "Expected goal involvements, supplied by FPL.",
  },
  {
    key: "xG90",
    label: "xG/90",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "calculated",
    decimals: 2,
    description:
      "Expected goals per 90 minutes, calculated from xG and minutes.",
  },
  {
    key: "xA90",
    label: "xA/90",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "calculated",
    decimals: 2,
    description:
      "Expected assists per 90 minutes, calculated from xA and minutes.",
  },
  {
    key: "xGI90",
    label: "xGI/90",
    group: "attacking",
    type: "number",
    sortable: true,
    filterable: true,
    source: "calculated",
    decimals: 2,
    description:
      "Expected goal involvements per 90 minutes, calculated from xGI and minutes.",
  },
  {
    key: "cleanSheets",
    label: "Clean Sheets",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "goalsConceded",
    label: "Goals Conceded",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "saves",
    label: "Saves",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "penaltiesSaved",
    label: "Penalties Saved",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "defensiveContribution",
    label: "Defensive Contributions",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    description: "Official FPL defensive contribution total.",
  },
  {
    key: "clearancesBlocksInterceptions",
    label: "Clearances / Blocks / Interceptions",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    description: "Combined FPL clearances, blocks and interceptions field.",
  },
  {
    key: "tackles",
    label: "Tackles",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "recoveries",
    label: "Recoveries",
    group: "defending",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "bonus",
    label: "Bonus",
    group: "bonus",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    description: "FPL bonus points earned.",
  },
  {
    key: "bps",
    label: "BPS",
    group: "bonus",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    description: "Bonus Points System score.",
  },
  {
    key: "influence",
    label: "Influence",
    group: "ict",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
    description: "FPL Influence metric.",
  },
  {
    key: "creativity",
    label: "Creativity",
    group: "ict",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
    description: "FPL Creativity metric.",
  },
  {
    key: "threat",
    label: "Threat",
    group: "ict",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
    description: "FPL Threat metric.",
  },
  {
    key: "ictIndex",
    label: "ICT Index",
    group: "ict",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
    description: "FPL Influence, Creativity and Threat index.",
  },
  {
    key: "ownership",
    label: "Selected %",
    group: "ownership",
    type: "percentage",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
  },
  {
    key: "transfersIn",
    label: "Transfers In",
    group: "ownership",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "transfersOut",
    label: "Transfers Out",
    group: "ownership",
    type: "number",
    sortable: true,
    filterable: true,
    source: "api",
  },
  {
    key: "transfersBalance",
    label: "Net Transfers",
    group: "ownership",
    type: "number",
    sortable: true,
    filterable: true,
    source: "calculated",
    description:
      "Transfers in minus transfers out. Positive values indicate net buying; negative values indicate net selling.",
  },
  {
    key: "priceChange",
    label: "Price Change",
    group: "ownership",
    type: "currency",
    sortable: true,
    filterable: true,
    source: "api",
    decimals: 1,
  },
] as const satisfies readonly PlayerStatDefinition[];

export const RANGE_FILTER_KEYS = PLAYER_STAT_DEFINITIONS.filter(
  (stat) => stat.filterable,
).map((stat) => stat.key) as PlayerStatKey[];
export const STAT_GROUP_LABELS: Record<StatGroup, string> = {
  core: "Core",
  attacking: "Attacking",
  defending: "Defending",
  bonus: "Bonus",
  ict: "ICT",
  ownership: "Ownership / Transfers",
};
