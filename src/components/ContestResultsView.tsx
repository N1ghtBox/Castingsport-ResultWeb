"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n";
import type { Competitor, ResultsData } from "@/lib/results/types";
import { contestNum, contestScore, sortCategories, thlonForContest } from "@/lib/results/utils";

type Props = {
  results: ResultsData;
  contestKey: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

// Competitors who took part in the contest, by category, best score first
export function buildContestTabData(
  results: ResultsData,
  contestKey: string
): Record<string, Competitor[]> {
  const byCategory: Record<string, Competitor[]> = {};
  const thlon = results[thlonForContest(contestNum(contestKey))] ?? {};

  for (const [category, competitors] of Object.entries(thlon)) {
    const tookPart = competitors.filter((c) => contestKey in c);
    if (tookPart.length === 0) continue;
    byCategory[category] = tookPart.sort((a, b) => contestScore(b, contestKey) - contestScore(a, contestKey));
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

  const rows = tabData[activeCategory] ?? [];

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
                    <td className="col-name py-3 font-medium text-white">{competitor.name}</td>
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
