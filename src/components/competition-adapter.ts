import { CompetitionDoc, Competitor, ResultsData, TeamsData, TAB_ORDER } from "./results-types";

// Competitions/{id} v2: written by the desktop app's generateSyncData.
// Contestants are stored once; rankings and team members reference them by id.
type V2Score = number | [number, number]; // [score, second_score] for double contests

type V2Contestant = {
  name: string;
  club: string;
  number: number;
  contests: Record<string, V2Score>; // keyed by contest number
};

type V2CompetitionDoc = {
  v: 2;
  name: string;
  date: string;
  contestants: Record<string, V2Contestant>;
  results: Record<string, Record<string, { id: string; total: number; place: number }[]>>;
  teams: Record<string, { name: string; total: number; place: number; members: { id: string; total: number }[] }[]>;
};

export const TIME_CONTESTS = [1, 3, 4, 8];
export const DOUBLE_CONTESTS = [2, 6];
export const DISTANCE_CONTESTS = [5, 7, 9];

// Same as ProgramConsts.DistanceMultiplier in the desktop app
const DISTANCE_MULTIPLIER = 1.5;

const GIRL_CATEGORIES = ["Juniorka", "Kobieta"];

// Mirrors the desktop app's old getSyncFormatContestResults, so the views keep parsing strings
function formatScore(contest: number, score: V2Score): string {
  if (Array.isArray(score)) return `${score[0].toFixed(2)} ${score[1].toFixed(2)}`;
  if (TIME_CONTESTS.includes(contest)) return score.toString();
  return `${score} ${(score * DISTANCE_MULTIPLIER).toFixed(2)}`;
}

function isV2(raw: Record<string, unknown>): raw is V2CompetitionDoc {
  return raw.v === 2;
}

// Converts any stored version into the v1 shape the views render
export function normalizeCompetitionDoc(raw: Record<string, unknown>): CompetitionDoc {
  if (!isV2(raw)) return raw as CompetitionDoc;

  const competitor = (id: string, category: string, total: number, place: number): Competitor => {
    const c = raw.contestants[id];
    const row: Competitor = {
      id,
      name: c?.name ?? "",
      club: c?.club ?? "",
      number: c?.number ?? 0,
      category,
      girl: GIRL_CATEGORIES.includes(category),
      isNew: false,
      total,
      place,
    };
    for (const [contest, score] of Object.entries(c?.contests ?? {})) {
      row[`contest-${contest}`] = formatScore(Number(contest), score);
    }
    return row;
  };

  const results: ResultsData = {};
  for (const tab of TAB_ORDER) {
    const byCategory = raw.results?.[tab];
    if (!byCategory) continue;
    results[tab] = Object.fromEntries(
      Object.entries(byCategory).map(([cat, list]) => [
        cat,
        list.map(({ id, total, place }) => competitor(id, cat, total, place)),
      ])
    );
  }

  const teams: TeamsData = Object.fromEntries(
    Object.entries(raw.teams ?? {}).map(([cat, list]) => [
      cat,
      list.map((team, i) => ({
        id: `${cat}-${i}`,
        name: team.name,
        category: cat,
        total: team.total,
        place: team.place,
        members: team.members.map((m) => ({ name: raw.contestants[m.id]?.name ?? "", total: m.total })),
      })),
    ])
  );

  return { ...results, name: raw.name, date: raw.date, teams } as CompetitionDoc;
}
