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

export const TAB_ORDER = ["3boj", "5boj", "7boj", "9boj", "multi", "distance"];

export const CATEGORY_ORDER = ["Kadet", "Junior", "Juniorka", "Mężczyzna", "Kobieta"];

export function isStaticResultKey(k: string): boolean {
  return TAB_ORDER.includes(k);
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
