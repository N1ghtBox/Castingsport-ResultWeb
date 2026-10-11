"use client";

import { Fragment, useMemo } from "react";
import { TEAM_CATEGORY_ORDER } from "@/lib/results/constants";
import type { SerieEntry } from "@/lib/results/types";
import { sortCategories } from "@/lib/results/utils";
import { useT } from "@/lib/i18n";

type Props = {
  tabData: Record<string, SerieEntry[]>;
  competitions: string[];
  isTeams: boolean;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

export default function SeriesResultsView({ tabData, competitions, isTeams, activeCategory, onCategoryChange }: Props) {
  const t = useT();
  const nonEmptyCategories = useMemo(
    () => sortCategories(
      Object.keys(tabData).filter((c) => tabData[c].length > 0),
      isTeams ? TEAM_CATEGORY_ORDER : undefined
    ),
    [tabData, isTeams]
  );

  // arrays arrive sorted and ranked by the desktop app
  const rows = tabData[activeCategory] ?? [];

  return (
    <>
      {nonEmptyCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {nonEmptyCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === cat
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
                <th rowSpan={2} className="col-place py-3 text-center">{t("Miejsce")}</th>
                <th rowSpan={2} className="col-name py-3 text-left">{t(isTeams ? "Drużyna" : "Zawodnik")}</th>
                {!isTeams && (
                  <>
                    <th rowSpan={2} className="px-3 py-3 text-left hidden sm:table-cell">{t("Klub")}</th>
                    <th rowSpan={2} className="px-3 py-3 text-left hidden md:table-cell">{t("Kategoria")}</th>
                  </>
                )}
                {competitions.map((c) => (
                  <th
                    key={c}
                    colSpan={2}
                    className="px-3 pt-3 pb-1 text-center font-medium normal-case border-l border-gray-700 hidden lg:table-cell"
                  >
                    {c}
                  </th>
                ))}
                <th rowSpan={2} className="px-3 py-3 text-right">{t("Łączny wynik")}</th>
                <th rowSpan={2} className="px-3 py-3 text-right font-bold">{t("Punkty")}</th>
              </tr>
              <tr className="bg-gray-800 text-gray-500 text-[10px] uppercase tracking-wide">
                {competitions.map((c) => (
                  <Fragment key={c}>
                    <th className="px-3 pb-2 text-right font-medium border-l border-gray-700 hidden lg:table-cell">{t("Miejsce")}</th>
                    <th className="px-3 pb-2 text-right font-medium hidden lg:table-cell">{t("Wynik")}</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-t border-gray-800 transition-colors hover:bg-gray-800 ${
                    i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"
                  }`}
                >
                  <td className="col-place py-3 text-center text-gray-400">{row.seriePlace}</td>
                  <td className="col-name py-3 font-medium text-white">{row.name}</td>
                  {!isTeams && (
                    <>
                      <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{row.club}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {/* the entry's own category; may differ from the bucket it's ranked in */}
                        <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                          {t(row.category)}
                        </span>
                      </td>
                    </>
                  )}
                  {competitions.map((c) => {
                    const p = row.placements.find((pl) => pl.competitionName === c);
                    return (
                      <Fragment key={c}>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-400 border-l border-gray-800 hidden lg:table-cell">
                          {p?.place ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-300 whitespace-nowrap hidden lg:table-cell">
                          {p ? (isTeams ? p.score.toFixed() : p.score.toFixed(2)) : "—"}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="px-3 py-3 text-right tabular-nums text-gray-300">
                    {isTeams ? row.total.toFixed() : row.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-white">{row.place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
