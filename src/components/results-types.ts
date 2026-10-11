export type Competitor = {
  id: string;
  name: string;
  number: number;
  category: string;
  club: string;
  girl: boolean;
  isNew: boolean;
  total: number;
  place: number;
  [key: string]: string | number | boolean;
};

export type ResultsData = {
  [tab: string]: {
    [category: string]: Competitor[];
  };
};

export type TeamMember = {
  name: string;
  total: number;
};

export type TeamResult = {
  id: string;
  name: string;
  category: string;
  members: TeamMember[];
  total: number;
  place: number;
};

export type TeamsData = {
  [category: string]: TeamResult[];
};

export type CompetitionDoc = ResultsData & {
  name?: string;
  date?: string;
  teams?: TeamsData;
};

export const TEAMS_TAB = "teams";

export const TEAM_CATEGORY_ORDER = ["Młodzieży", "Seniorów", "Kobiet"];

export const TAB_ORDER = ["3boj", "5boj", "7boj", "9boj", "multi", "distance"];

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `contest-${from + i}`);

export const TAB_CONTESTS: Record<string, string[]> = {
  "3boj": range(3, 5),
  "5boj": range(1, 5),
  "7boj": range(1, 7),
  "9boj": range(1, 9),
  multi: range(8, 9),
  distance: range(6, 7),
};

export const CATEGORY_ORDER = ["Kadet", "Junior", "Juniorka", "Mężczyzna", "Kobieta"];

export function isStaticResultKey(k: string): boolean {
  return TAB_ORDER.includes(k);
}

export function contestNum(k: string): number {
  const m = k.match(/^contest-(\d+)$/);
  return m ? parseInt(m[1], 10) : Infinity;
}

export function sortCategories(cats: string[], order: string[] = CATEGORY_ORDER): string[] {
  return [...cats].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function firstNonEmpty(tabData: Record<string, unknown[]>): string {
  return (
    Object.keys(tabData).find((k) => tabData[k].length > 0) ??
    Object.keys(tabData)[0] ??
    ""
  );
}

// Series/{id}: written whole by the desktop app's "Sync to cloud".
export type Placement = {
  competitionName: string;
  place: number;
  score: number;
};

export type SerieEntry = {
  id: string;
  name: string;
  club?: string; // contestants only
  category: string;
  placements: Placement[];
  total: number;
  place: number; // sum of placements' places ("Punkty")
  seriePlace: number;
};

export type SerieDoc = {
  name: string;
  year: number;
  type: "Puchar" | "Tury";
  competitions: string[];
  competitionIds: string[];
  "5boj": Record<string, SerieEntry[]>;
  "9boj": Record<string, SerieEntry[]>;
  multi: Record<string, SerieEntry[]>;
  distance: Record<string, SerieEntry[]>;
  teams: Record<string, SerieEntry[]>;
};

export const SERIE_TAB_ORDER = ["5boj", "9boj", "multi", "distance"] as const;
