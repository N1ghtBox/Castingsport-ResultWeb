"use client";

import { useMemo } from "react";
import { Competitor, ResultsData, sortCategories } from "./results-types";
import { useT } from "@/lib/i18n";

const SINGLE_SCORE_CONTESTS = [1, 3, 4, 8]
const DOUBLE_SCORE_CONTESTS = [2, 6]
const DISTANCE_SCORE_CONTESTS = [5, 7, 9]

type Props = {
  results: ResultsData;
  contestKey: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

function getBoj(contestId: number): keyof ResultsData {
  // pick the tab that contains every competitor of the contest
  if (contestId > 7) return 'multi'
  if (contestId > 5) return 'distance'
  if (contestId < 3) return '5boj'
  return '3boj'
}

function getTotalScore(competitor: Competitor, contestId: string): number {
  const [_, id] = contestId.split('-')

  if (Number.isNaN(Number(id))) return 0;
  if (SINGLE_SCORE_CONTESTS.includes(Number(id))) {
    if (Number.isNaN(Number(competitor[contestId]))) return 0;
    return Number(competitor[contestId])
  }
  if (DOUBLE_SCORE_CONTESTS.includes(Number(id))) {
    const [first, second] = competitor[contestId].toString().split(' ')

    if (Number.isNaN(Number(first))) return 0;
    if (Number.isNaN(Number(second))) return 0;

    return Number(first) + Number(second);
  }
  if (DISTANCE_SCORE_CONTESTS.includes(Number(id))) {
    const [_, second] = competitor[contestId].toString().split(' ')

    if (Number.isNaN(Number(second))) return 0;

    return Number(second);
  }
  return 0;
}

export function buildContestTabData(
  results: ResultsData,
  contestKey: string
): Record<string, Competitor[]> {
  const byCategory: Record<string, Competitor[]> = {};
  const id = Number.parseInt(contestKey[contestKey.length - 1])
  const tabData = results[getBoj(id)] ?? {}
  for (const [cat, comps] of Object.entries(tabData)) {
    const withScore = comps.filter((c) => contestKey in c);
    if (withScore.length === 0) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(...withScore);
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort(
      (a, b) => (b[contestKey] as number) - (a[contestKey] as number)
    );
  }
  return byCategory;
}

export default function ContestResultsView({
  results,
  contestKey,
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

  const rows = useMemo(() => tabData[activeCategory].sort((a, b) =>
    getTotalScore(b, contestKey) - getTotalScore(a, contestKey)) ?? [], [tabData, activeCategory]);

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
                <th className="px-3 py-3 text-left">{t("Zawodnik")}</th>
                <th className="px-3 py-3 text-left hidden sm:table-cell">{t("Klub")}</th>
                <th className="px-3 py-3 text-left hidden md:table-cell">{t("Kategoria")}</th>
                <th className="px-3 py-3 text-right font-bold">{t("Wynik")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((competitor, i) => {
                const score = competitor[contestKey] as number;
                return (
                  <tr
                    key={competitor.id}
                    className={`border-t border-gray-800 transition-colors hover:bg-gray-800 ${i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"
                      }`}
                  >
                    <td className="px-3 py-3 text-center text-gray-400">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-white">{competitor.name}</td>
                    <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{competitor.club}</td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                        {t(competitor.category)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-white">
                      {score ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
