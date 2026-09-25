export type Position = "GKP" | "DEF" | "MID" | "FWD";
export type PlayerStatus = "a" | "d" | "i" | "s" | "u";

export interface Fixture {
  id: number;
  gameweek: number;
  opponent: string;
  opponentId: number;
  isHome: boolean;
  difficulty: number;
  finished: boolean;
  kickoffTime: string | null;
}

export interface Player {
  id: number;
  name: string;
  webName: string;
  position: Position;
  teamId: number;
  team: string;
  price: number;
  status: PlayerStatus;
  points: number;
  form: number;
  pointsPerGame: number;
  minutes: number;
  starts: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  xGI: number;
  xG90: number;
  xA90: number;
  xGI90: number;
  bonus: number;
  bps: number;
  cleanSheets: number;
  goalsConceded: number;
  saves: number;
  penaltiesSaved: number;
  defensiveContribution: number;
  clearancesBlocksInterceptions: number;
  tackles: number;
  recoveries: number;
  influence: number;
  creativity: number;
  threat: number;
  ictIndex: number;
  ownership: number;
  transfersIn: number;
  transfersOut: number;
  transfersBalance: number;
  priceChange: number;
  nextFixtures: Fixture[];
}

export interface PlayerSummary {
  history: PlayerHistoryEntry[];
  fixtures: Fixture[];
}

export interface PlayerHistoryEntry {
  gameweek: number;
  opponent: string;
  isHome: boolean;
  price?: number;
  form?: number;
  minutes: number;
  starts?: number;
  pointsPerGame?: number;
  goals: number;
  assists: number;
  points: number;
  bonus: number;
  bps: number;
  xG: number;
  xA: number;
  xGC: number;
  xGI?: number;
  xG90?: number;
  xA90?: number;
  xGI90?: number;
  cleanSheets: number;
  goalsConceded: number;
  saves: number;
  penaltiesSaved?: number;
  defensiveContribution: number;
  clearancesBlocksInterceptions: number;
  tackles?: number;
  recoveries?: number;
  influence?: number;
  creativity?: number;
  threat?: number;
  ictIndex?: number;
  ownership?: number;
  transfersIn?: number;
  transfersOut?: number;
  transfersBalance?: number;
  priceChange?: number;
}
