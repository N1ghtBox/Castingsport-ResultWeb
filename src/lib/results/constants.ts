export const TEAMS_TAB = "teams";

// Thlon tabs in display order
export const TAB_ORDER = ["3boj", "5boj", "7boj", "9boj", "multi", "distance"];

export const SERIE_TAB_ORDER = ["5boj", "9boj", "multi", "distance"] as const;

export const CATEGORY_ORDER = ["Kadet", "Junior", "Juniorka", "Mężczyzna", "Kobieta"];

export const TEAM_CATEGORY_ORDER = ["Młodzieży", "Seniorów", "Kobiet"];

export const GIRL_CATEGORIES = ["Juniorka", "Kobieta"];

// Contest numbers by how their score is stored and shown
export const TIME_CONTESTS = [1, 3, 4, 8]; // one value, e.g. "95"
export const DOUBLE_CONTESTS = [2, 6]; // two attempts, e.g. "12.50 10.00"
export const DISTANCE_CONTESTS = [5, 7, 9]; // distance and its points, e.g. "40 60.00"

// Points for a distance contest = distance * this. Same as ProgramConsts.DistanceMultiplier in the desktop app.
export const DISTANCE_MULTIPLIER = 1.5;

// Contests (first to last, inclusive) that make up each thlon
const THLON_RANGES: Record<string, [number, number]> = {
  "3boj": [3, 5],
  "5boj": [1, 5],
  "7boj": [1, 7],
  "9boj": [1, 9],
  multi: [8, 9],
  distance: [6, 7],
};

export const TAB_CONTESTS: Record<string, string[]> = Object.fromEntries(
  Object.entries(THLON_RANGES).map(([tab, [first, last]]) => [
    tab,
    Array.from({ length: last - first + 1 }, (_, i) => `contest-${first + i}`),
  ])
);
