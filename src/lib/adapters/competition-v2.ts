import { DISTANCE_MULTIPLIER, GIRL_CATEGORIES, TAB_ORDER, TIME_CONTESTS } from "@/lib/results/constants";
import type { CompetitionDoc, Competitor, FinalsData, ResultsData, TeamsData } from "@/lib/results/types";
import { formatTime } from "@/lib/results/utils";

// Competitions/{id} v2 and v3, written by the desktop app's generateSyncData.
// Each contestant is stored once; rankings and team members point to them by id.
// v3 adds the time to timed contests, the finals, isInternational, debugOnly and nations.
// A v3 doc can also hold one subcategory of a competition (see lib/competitions.ts).

// number: single contests (and timed ones in v2); [score, second_score]: double contests;
// [score, "MM.SS.mmm"]: timed contests in v3, "" when there is no time
type V2Score = number | [number, number] | [number, string];

type V3FinalEntry = { id: string; place: number; score: number; time?: string };

type V2Contestant = {
  name: string;
  club: string;
  number: number;
  nation?: string; // v3: only when isInternational and a nation is set
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
  v: 2 | 3;
  name: string;
  date: string;
  isInternational?: boolean; // v3
  debugOnly?: true; // v3: only on debug syncs
  contestants: Record<string, V2Contestant>;
  results: Record<string, Record<string, V2RankingEntry[]>>; // thlon -> category -> ranking
  teams: Record<string, V2Team[]>; // team category -> ranking
  finals?: Record<string, Record<string, V3FinalEntry[]>>; // v3: contest number -> category -> by place
};

export function isV2(raw: Record<string, unknown>): raw is V2CompetitionDoc {
  return raw.v === 2 || raw.v === 3;
}

// Converts a v2 document into the shape the views render
export function fromV2(doc: V2CompetitionDoc): CompetitionDoc {
  return {
    ...toResults(doc),
    name: doc.name,
    date: doc.date,
    isInternational: doc.isInternational ?? false,
    debugOnly: doc.debugOnly ?? false,
    teams: toTeams(doc),
    finals: toFinals(doc),
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
    nation: contestant?.nation,
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

function toFinals(doc: V2CompetitionDoc): FinalsData {
  const finals: FinalsData = {};

  for (const [contest, byCategory] of Object.entries(doc.finals ?? {})) {
    const key = `contest-${contest}`;
    finals[key] = {};
    for (const [category, entries] of Object.entries(byCategory)) {
      finals[key][category] = entries.map(({ id, place, score, time }) => ({
        id,
        name: doc.contestants[id]?.name ?? "",
        club: doc.contestants[id]?.club ?? "",
        nation: doc.contestants[id]?.nation,
        place,
        score,
        time: TIME_CONTESTS.includes(Number(contest)) ? formatTime(time ?? "") : undefined,
      }));
    }
  }

  return finals;
}

// Same text the desktop app wrote in v1 (its getSyncFormatContestResults),
// plus the time in v3 timed contests: "95 01:23:450"
function formatScore(contest: number, score: V2Score): string {
  if (Array.isArray(score) && typeof score[1] === "string") {
    return `${score[0]} ${formatTime(score[1])}`;
  }
  if (Array.isArray(score)) {
    const [first, second] = score as [number, number];
    return `${first.toFixed(2)} ${second.toFixed(2)}`;
  }
  if (TIME_CONTESTS.includes(contest)) return String(score);

  const points = score * DISTANCE_MULTIPLIER;
  return `${score} ${points.toFixed(2)}`;
}
