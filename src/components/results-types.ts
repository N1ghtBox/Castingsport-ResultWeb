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

export type CompetitionDoc = ResultsData & {
  name?: string;
  date?: string;
};

export const TAB_LABELS: Record<string, string> = {
  "3boj": "3-bój",
  "5boj": "5-bój",
  "7boj": "7-bój",
  "9boj": "9-bój",
  multi: "Multi",
  distance: "Odległość",
};

export const CONTEST_LABELS: Record<string, string> = {
  "contest-1": "Mucha cel",
  "contest-2": "Mucha odlegość",
  "contest-3": "Arenberg",
  "contest-4": "Skish",
  "contest-5": "Odległość 7.5g",
  "contest-6": "Mucha odlegość oburącz",
  "contest-7": "Odległość oburącz",
  "contest-8": "Multi skish",
  "contest-9": "Multi odległość",
};

export const TAB_ORDER = ["3boj", "5boj", "7boj", "9boj", "multi", "distance"];

export const CATEGORY_ORDER = ["Kadet", "Junior", "Juniorka", "Mężczyzna", "Kobieta"];

export function isStaticResultKey(k: string): boolean {
  return TAB_ORDER.includes(k);
}

export function getTabLabel(tab: string): string {
  return TAB_LABELS[tab] ?? CONTEST_LABELS[tab] ?? tab;
}

export function contestNum(k: string): number {
  const m = k.match(/^contest-(\d+)$/);
  return m ? parseInt(m[1], 10) : Infinity;
}

export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function firstNonEmpty(tabData: Record<string, Competitor[]>): string {
  return (
    Object.keys(tabData).find((k) => tabData[k].length > 0) ??
    Object.keys(tabData)[0] ??
    ""
  );
}
