import { CATEGORY_ORDER, DISTANCE_CONTESTS, DOUBLE_CONTESTS, TAB_ORDER, TIME_CONTESTS } from "./constants";
import type { Competitor } from "./types";

// --- contest keys ("contest-3") ---

const CONTEST_KEY = /^contest-(\d+)$/;

export function isContestKey(key: string): boolean {
  return CONTEST_KEY.test(key);
}

// "contest-3" -> 3; anything else -> Infinity, so it sorts last
export function contestNum(key: string): number {
  const match = key.match(CONTEST_KEY);
  return match ? Number(match[1]) : Infinity;
}

export function isThlonKey(key: string): boolean {
  return TAB_ORDER.includes(key);
}

// The thlon whose table holds every competitor of the contest
export function thlonForContest(contest: number): string {
  if (contest >= 8) return "multi";
  if (contest >= 6) return "distance";
  if (contest >= 3) return "3boj";
  return "5boj";
}

// Value a contest is ranked by: the time score, both attempts added up, or the distance points
export function contestScore(competitor: Competitor, contestKey: string): number {
  const contest = contestNum(contestKey);
  const [first, second] = String(competitor[contestKey] ?? "").split(" ").map(Number);

  let score = NaN;
  if (TIME_CONTESTS.includes(contest)) score = first;
  else if (DOUBLE_CONTESTS.includes(contest)) score = first + second;
  else if (DISTANCE_CONTESTS.includes(contest)) score = second;

  return Number.isNaN(score) ? 0 : score;
}

// --- times ("01:23:450") ---

const NO_TIME = "—";

// Synced "MM.SS.mmm" -> printed "MM:SS:mmm"; empty -> dash
export function formatTime(time: string): string {
  return time ? time.replaceAll(".", ":") : NO_TIME;
}

// "01:23:450" -> 83.45; a missing time counts as 0
export function timeToSeconds(time?: string): number {
  if (!time || time === NO_TIME) return 0;
  const [m = 0, s = 0, ms = 0] = time.split(/[.:]/).map(Number);
  return m * 60 + s + ms / 1000;
}

// Time of a timed contest ("95 01:23:450" -> "01:23:450"); undefined in v1/v2 or other contests
export function contestTime(competitor: Competitor, contestKey: string): string | undefined {
  if (!TIME_CONTESTS.includes(contestNum(contestKey))) return undefined;
  return String(competitor[contestKey] ?? "").split(" ")[1];
}

// --- categories ---

// Known categories in the given order, unknown ones after them alphabetically
export function sortCategories(categories: string[], order: string[] = CATEGORY_ORDER): string[] {
  const rank = (category: string) => {
    const i = order.indexOf(category);
    return i === -1 ? order.length : i;
  };
  return [...categories].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

// First category with results, or the first one if all are empty
export function firstNonEmpty(byCategory: Record<string, unknown[]>): string {
  const categories = Object.keys(byCategory);
  return categories.find((c) => byCategory[c].length > 0) ?? categories[0] ?? "";
}

export function hasResults(byCategory?: Record<string, unknown[]>): boolean {
  return !!byCategory && Object.values(byCategory).some((list) => list.length > 0);
}

// --- dates ("10-12 sierpnia 2026") ---

// 3-letter prefixes match both nominative (sierpień) and genitive (sierpnia) forms
const MONTH_PREFIXES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

const POLISH_DATE = /(\d+)(?:\s*-\s*\d+)?\s+([a-zżźćńółęąś]+)\s+(\d{4})/;

// Timestamp of the first day; missing or unreadable dates sort last
export function dateSortKey(date?: string): number {
  const match = date?.toLowerCase().match(POLISH_DATE);
  if (!match) return -Infinity;

  const [, day, monthName, year] = match;
  const month = Math.max(0, MONTH_PREFIXES.indexOf(monthName.slice(0, 3)));
  return new Date(Number(year), month, Number(day)).getTime();
}

export function dateYear(date?: string): string {
  return date?.match(/\d{4}/)?.[0] ?? "—";
}
