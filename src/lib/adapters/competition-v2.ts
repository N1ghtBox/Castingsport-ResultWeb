import { DISTANCE_MULTIPLIER, GIRL_CATEGORIES, TAB_ORDER, TIME_CONTESTS } from "@/lib/results/constants";
import type { CompetitionDoc, Competitor, ResultsData, TeamsData } from "@/lib/results/types";

// Competitions/{id} v2, written by the desktop app's generateSyncData.
// Each contestant is stored once; rankings and team members point to them by id.

type V2Score = number | [number, number]; // [score, second_score] for double contests

type V2Contestant = {
  name: string;
  club: string;
  number: number;
  contests: Record<string, V2Score>; // keyed by contest number
};

type V2RankingEntry = { id: string; total: number; place: number };

type V2Team = {
  name: string;
  total: number;
  place: number;
  members: { id: string; total: number }[];
};

export type V2CompetitionDoc = {
  v: 2;
  name: string;
  date: string;
  contestants: Record<string, V2Contestant>;
  results: Record<string, Record<string, V2RankingEntry[]>>; // thlon -> category -> ranking
  teams: Record<string, V2Team[]>; // team category -> ranking
};

export function isV2(raw: Record<string, unknown>): raw is V2CompetitionDoc {
  return raw.v === 2;
}

// Converts a v2 document into the shape the views render
export function fromV2(doc: V2CompetitionDoc): CompetitionDoc {
  return {
    ...toResults(doc),
    name: doc.name,
    date: doc.date,
    teams: toTeams(doc),
  } as CompetitionDoc;
}

function toResults(doc: V2CompetitionDoc): ResultsData {
  const results: ResultsData = {};

  for (const tab of TAB_ORDER) {
    const byCategory = doc.results?.[tab];
    if (!byCategory) continue;

    results[tab] = {};
    for (const [category, ranking] of Object.entries(byCategory)) {
      results[tab][category] = ranking.map((entry) => toCompetitor(doc, entry, category));
    }
  }

  return results;
}

function toCompetitor(doc: V2CompetitionDoc, { id, total, place }: V2RankingEntry, category: string): Competitor {
  const contestant = doc.contestants[id];

  const competitor: Competitor = {
    id,
    name: contestant?.name ?? "",
    club: contestant?.club ?? "",
    number: contestant?.number ?? 0,
    category,
    girl: GIRL_CATEGORIES.includes(category),
    isNew: false, // not synced in v2, and no view uses it
    total,
    place,
  };

  for (const [contest, score] of Object.entries(contestant?.contests ?? {})) {
    competitor[`contest-${contest}`] = formatScore(Number(contest), score);
  }

  return competitor;
}

function toTeams(doc: V2CompetitionDoc): TeamsData {
  const teams: TeamsData = {};

  for (const [category, ranking] of Object.entries(doc.teams ?? {})) {
    teams[category] = ranking.map((team, i) => ({
      id: `${category}-${i}`, // v2 teams have no id; only used as a React key
      name: team.name,
      category,
      total: team.total,
      place: team.place,
      members: team.members.map((member) => ({
        name: doc.contestants[member.id]?.name ?? "",
        total: member.total,
      })),
    }));
  }

  return teams;
}

// Same text the desktop app wrote in v1 (its getSyncFormatContestResults)
function formatScore(contest: number, score: V2Score): string {
  if (Array.isArray(score)) {
    const [first, second] = score;
    return `${first.toFixed(2)} ${second.toFixed(2)}`;
  }
  if (TIME_CONTESTS.includes(contest)) return String(score);

  const points = score * DISTANCE_MULTIPLIER;
  return `${score} ${points.toFixed(2)}`;
}
