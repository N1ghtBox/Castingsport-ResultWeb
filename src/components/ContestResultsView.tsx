"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n";
import type { Competitor, FinalEntry, FinalsData, ResultsData } from "@/lib/results/types";
import { contestNum, contestScore, contestTime, sortCategories, thlonForContest, timeToSeconds } from "@/lib/results/utils";
import Nation from "./Nation";

type Props = {
  results: ResultsData;
  finals: FinalsData;
  contestKey: string;
  showNation: boolean;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

type Row = {
  id: string;
  name: string;
  club: string;
  nation?: string;
  category: string;
  place: number;
  score: string; // contest score without the time
  time?: string;
  final?: FinalEntry;
};

const NO_FINALISTS: FinalEntry[] = [];

// Competitors who took part in the contest, by category, best score first
// (in timed contests, equal scores by shorter time)
export function buildContestTabData(
  results: ResultsData,
  contestKey: string
): Record<string, Competitor[]> {
  const byCategory: Record<string, Competitor[]> = {};
  const thlon = results[thlonForContest(contestNum(contestKey))] ?? {};

  for (const [category, competitors] of Object.entries(thlon)) {
    const tookPart = competitors.filter((c) => contestKey in c);
    if (tookPart.length === 0) continue;
    byCategory[category] = tookPart.sort(
      (a, b) =>
        contestScore(b, contestKey) - contestScore(a, contestKey) ||
        timeToSeconds(contestTime(a, contestKey)) - timeToSeconds(contestTime(b, contestKey))
    );
  }

  return byCategory;
}

// Like the printed results: finalists first by final place, then everyone else in the contest ranking
function buildRows(ranking: Competitor[], finalists: FinalEntry[], contestKey: string, category: string): Row[] {
  const byId = new Map(ranking.map((c) => [c.id, c]));
  const finalIds = new Set(finalists.map((f) => f.id));

  const toRow = (c: Competitor | undefined, place: number): Omit<Row, "id" | "name" | "club" | "nation"> => {
    const raw = String(c?.[contestKey] ?? "");
    const time = c && contestTime(c, contestKey);
    return {
      category: c?.category ?? category,
      place,
      score: time === undefined ? raw : raw.split(" ")[0],
      time,
    };
  };

  return [
    ...finalists.map((f) => ({ id: f.id, name: f.name, club: f.club, nation: f.nation, ...toRow(byId.get(f.id), f.place), final: f })),
    ...ranking
      .filter((c) => !finalIds.has(c.id))
      .map((c, i) => ({ id: c.id, name: c.name, club: c.club, nation: c.nation, ...toRow(c, finalists.length + i + 1) })),
  ];
}

export default function ContestResultsView({
  results,
  finals,
  contestKey,
  showNation,
  activeCategory,
  onCategoryChange,
}: Props) {
  const t = useT();
  const tabData = useMemo(
    () => buildContestTabData(results, contestKey),
    [results, contestKey]
  );

  const nonEmptyCategories = useMemo(
    () => sortCategories(Object.keys(tabData).filter((c) => tabData[c].length > 0)),
    [tabData]
  );

  const finalists = finals[contestKey]?.[activeCategory] ?? NO_FINALISTS;
  const rows = useMemo(
    () => buildRows(tabData[activeCategory] ?? [], finalists, contestKey, activeCategory),
    [tabData, finalists, contestKey, activeCategory]
  );

  const hasTimes = rows.some((r) => r.time !== undefined);
  const hasFinals = finalists.length > 0;

  return (
    <>
      {nonEmptyCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {nonEmptyCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${activeCategory === cat
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
                }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">{t("Brak wyników")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-gray-900">
            <thead>
              <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wide">
                <th className="px-3 py-3 text-center w-10">{t("Miejsce")}</th>
                <th className="col-name py-3 text-left">{t("Zawodnik")}</th>
                {showNation && <th className="px-3 py-3 text-left">{t("Kraj")}</th>}
                <th className="px-3 py-3 text-left hidden sm:table-cell">{t("Klub")}</th>
                <th className="px-3 py-3 text-left hidden md:table-cell">{t("Kategoria")}</th>
                <th className="px-3 py-3 text-right font-bold">{t("Wynik")}</th>
                {hasTimes && <th className="px-3 py-3 text-right">{t("Czas")}</th>}
                {hasFinals && <th className="px-3 py-3 text-right font-bold">{t("Finał")}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-t transition-colors hover:bg-gray-800 ${hasFinals && i === finalists.length
                    ? "border-t-2 border-emerald-500/60"
                    : "border-gray-800"
                    } ${i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"}`}
                >
                  <td className="px-3 py-3 text-center text-gray-400">{row.place}</td>
                  <td className="col-name py-3 font-medium text-white">{row.name}</td>
                  {showNation && <td className="px-3 py-3 text-gray-300 tabular-nums"><Nation code={row.nation} /></td>}
                  <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{row.club}</td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                      {t(row.category)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-white whitespace-nowrap">
                    {row.score || "—"}
                  </td>
                  {hasTimes && (
                    <td className="px-3 py-3 text-right tabular-nums text-gray-300 whitespace-nowrap">
                      {row.time || "—"}
                    </td>
                  )}
                  {hasFinals && (
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-emerald-400 whitespace-nowrap">
                      {row.final ? [row.final.score, row.final.time].filter((v) => v !== undefined).join(" ") : ""}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
