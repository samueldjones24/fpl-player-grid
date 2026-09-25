import type {
  Fixture,
  Player,
  PlayerStatus,
  Position,
  PlayerSummary,
} from "./types";

const API_URL = "https://fantasy.premierleague.com/api";
export type RawTeam = { id: number; name: string; short_name: string };
type RawPosition = { id: number; singular_name_short: Position };
// The bulk /fixtures/ endpoint reports difficulty per side rather than from a single player's perspective.
type RawFixtureBulk = {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
};
// The per-player /element-summary/ endpoint already resolves difficulty and home/away from that player's side.
type RawFixtureForPlayer = {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  is_home: boolean;
  difficulty?: number;
  kickoff_time: string | null;
  finished: boolean;
};
export type RawElement = Record<string, string | number | null | boolean> & {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  status: PlayerStatus;
};
type Bootstrap = {
  elements: RawElement[];
  teams: RawTeam[];
  element_types: RawPosition[];
  events: Array<{ id: number; is_current: boolean }>;
};

const numberValue = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const optionalNumberValue = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
};

export function normalizePlayer(
  element: RawElement,
  teams: Map<number, RawTeam>,
  positions: Map<number, Position>,
  nextFixtures: Fixture[],
): Player {
  const minutes = numberValue(element.minutes);
  const xG = numberValue(element.expected_goals);
  const xA = numberValue(element.expected_assists);
  const xGI = numberValue(element.expected_goal_involvements);
  return {
    id: element.id,
    name: `${element.first_name} ${element.second_name}`,
    webName: element.web_name,
    position: positions.get(element.element_type) ?? "MID",
    teamId: element.team,
    team: teams.get(element.team)?.short_name ?? "---",
    price: numberValue(element.now_cost) / 10,
    status: element.status,
    points: numberValue(element.total_points),
    form: numberValue(element.form),
    pointsPerGame: numberValue(element.points_per_game),
    minutes,
    starts: numberValue(element.starts),
    goals: numberValue(element.goals_scored),
    assists: numberValue(element.assists),
    xG,
    xA,
    xGI,
    xG90: minutes ? (xG / minutes) * 90 : 0,
    xA90: minutes ? (xA / minutes) * 90 : 0,
    xGI90: minutes ? (xGI / minutes) * 90 : 0,
    bonus: numberValue(element.bonus),
    bps: numberValue(element.bps),
    cleanSheets: numberValue(element.clean_sheets),
    goalsConceded: numberValue(element.goals_conceded),
    saves: numberValue(element.saves),
    penaltiesSaved: numberValue(element.penalties_saved),
    defensiveContribution: numberValue(element.defensive_contribution),
    clearancesBlocksInterceptions: numberValue(
      element.clearances_blocks_interceptions,
    ),
    tackles: numberValue(element.tackles),
    recoveries: numberValue(element.recoveries),
    influence: numberValue(element.influence),
    creativity: numberValue(element.creativity),
    threat: numberValue(element.threat),
    ictIndex: numberValue(element.ict_index),
    ownership: numberValue(element.selected_by_percent),
    transfersIn: numberValue(element.transfers_in),
    transfersOut: numberValue(element.transfers_out),
    transfersBalance:
      numberValue(element.transfers_in) - numberValue(element.transfers_out),
    priceChange: numberValue(element.cost_change_event) / 10,
    nextFixtures,
  };
}

const makeFixtureFromBulk = (
  raw: RawFixtureBulk,
  teamId: number,
  teams: Map<number, RawTeam>,
): Fixture | null => {
  if (!raw.event) return null;
  const isHome = raw.team_h === teamId;
  const opponentId = isHome ? raw.team_a : raw.team_h;
  return {
    id: raw.id,
    gameweek: raw.event,
    opponent: teams.get(opponentId)?.short_name ?? "---",
    opponentId,
    isHome,
    difficulty: (isHome ? raw.team_h_difficulty : raw.team_a_difficulty) ?? 0,
    finished: raw.finished,
    kickoffTime: raw.kickoff_time,
  };
};

const makeFixtureForPlayer = (
  raw: RawFixtureForPlayer,
  teams: Map<number, RawTeam>,
): Fixture | null => {
  if (!raw.event) return null;
  const opponentId = raw.is_home ? raw.team_a : raw.team_h;
  return {
    id: raw.id,
    gameweek: raw.event,
    opponent: teams.get(opponentId)?.short_name ?? "---",
    opponentId,
    isHome: raw.is_home,
    difficulty: raw.difficulty ?? 0,
    finished: raw.finished,
    kickoffTime: raw.kickoff_time,
  };
};

export async function getBootstrap(): Promise<Bootstrap> {
  // bootstrap-static is ~2.3MB and Next refuses to cache payloads above 2MB.
  // Keep it uncached so the request still succeeds without logging a cache warning.
  const response = await fetch(`${API_URL}/bootstrap-static/`);
  if (!response.ok)
    throw new Error(`FPL bootstrap request failed (${response.status})`);
  return response.json();
}

export async function getFixtures(): Promise<RawFixtureBulk[]> {
  const response = await fetch(`${API_URL}/fixtures/?future=1`, {
    next: { revalidate: 300 },
  });
  if (!response.ok)
    throw new Error(`FPL fixtures request failed (${response.status})`);
  return response.json();
}

export async function getPlayers(): Promise<Player[]> {
  const [data, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);
  const teams = new Map(data.teams.map((team) => [team.id, team]));
  const positions = new Map(
    data.element_types.map((position) => [
      position.id,
      position.singular_name_short,
    ]),
  );
  const currentGameweek =
    data.events.find((event) => event.is_current)?.id ?? 1;
  const fixturesByTeam = new Map<number, Fixture[]>();
  for (const rawFixture of fixtures) {
    if (!rawFixture.event) continue;
    for (const teamId of [rawFixture.team_h, rawFixture.team_a]) {
      const fixture = makeFixtureFromBulk(rawFixture, teamId, teams);
      if (!fixture || fixture.gameweek < currentGameweek) continue;
      fixturesByTeam.set(teamId, [
        ...(fixturesByTeam.get(teamId) ?? []),
        fixture,
      ]);
    }
  }
  return data.elements.map((element) => {
    return normalizePlayer(
      element,
      teams,
      positions,
      (fixturesByTeam.get(element.team) ?? []).slice(0, 5),
    );
  });
}

export async function getPlayerSummary(id: number): Promise<PlayerSummary> {
  const response = await fetch(`${API_URL}/element-summary/${id}/`, {
    next: { revalidate: 900 },
  });
  if (!response.ok)
    throw new Error(`FPL player summary request failed (${response.status})`);
  const data = await response.json();
  const bootstrap = await getBootstrap();
  const teams = new Map(bootstrap.teams.map((team) => [team.id, team]));
  return {
    fixtures: data.fixtures
      .map((fixture: RawFixtureForPlayer) =>
        makeFixtureForPlayer(fixture, teams),
      )
      .filter(
        (fixture: Fixture | null): fixture is Fixture => fixture !== null,
      ),
    history: data.history.map((entry: Record<string, unknown>) => ({
      gameweek: numberValue(entry.round),
      opponent:
        teams.get(numberValue(entry.opponent_team))?.short_name ?? "---",
      isHome: Boolean(entry.was_home),
      price:
        optionalNumberValue(entry.value) === undefined
          ? undefined
          : optionalNumberValue(entry.value)! / 10,
      minutes: numberValue(entry.minutes),
      starts: optionalNumberValue(entry.starts),
      pointsPerGame: optionalNumberValue(entry.points_per_game),
      form: optionalNumberValue(entry.form),
      goals: numberValue(entry.goals_scored),
      assists: numberValue(entry.assists),
      points: numberValue(entry.total_points),
      bonus: numberValue(entry.bonus),
      bps: numberValue(entry.bps),
      xG: numberValue(entry.expected_goals),
      xA: numberValue(entry.expected_assists),
      xGC: numberValue(entry.expected_goals_conceded),
      xGI: optionalNumberValue(entry.expected_goal_involvements),
      cleanSheets: numberValue(entry.clean_sheets),
      goalsConceded: numberValue(entry.goals_conceded),
      saves: numberValue(entry.saves),
      penaltiesSaved: optionalNumberValue(entry.penalties_saved),
      defensiveContribution: numberValue(entry.defensive_contribution),
      clearancesBlocksInterceptions: numberValue(
        entry.clearances_blocks_interceptions,
      ),
      tackles: optionalNumberValue(entry.tackles),
      recoveries: optionalNumberValue(entry.recoveries),
      influence: optionalNumberValue(entry.influence),
      creativity: optionalNumberValue(entry.creativity),
      threat: optionalNumberValue(entry.threat),
      ictIndex: optionalNumberValue(entry.ict_index),
      ownership: optionalNumberValue(entry.selected_by_percent),
      transfersIn: optionalNumberValue(entry.transfers_in),
      transfersOut: optionalNumberValue(entry.transfers_out),
      transfersBalance: optionalNumberValue(entry.transfers_balance),
      priceChange:
        optionalNumberValue(entry.cost_change_event) === undefined
          ? undefined
          : optionalNumberValue(entry.cost_change_event)! / 10,
    })),
  };
}
