"use client";

import { useMemo } from "react";
import { Competitor, sortCategories } from "./results-types";

type Props = {
  tabData: Record<string, Competitor[]>;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

export default function StaticResultsView({ tabData, activeCategory, onCategoryChange }: Props) {
  const nonEmptyCategories = useMemo(
    () => sortCategories(Object.keys(tabData).filter((c) => tabData[c].length > 0)),
    [tabData]
  );

  const rows = useMemo(() => tabData[activeCategory] ?? [], [tabData, activeCategory]);

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
              {cat}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">Brak wyników</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm bg-gray-900">
            <thead>
              <tr className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wide">
                <th className="px-3 py-3 text-center w-10">Miejsce</th>
                <th className="px-3 py-3 text-left">Zawodnik</th>
                <th className="px-3 py-3 text-left hidden sm:table-cell">Klub</th>
                <th className="px-3 py-3 text-left hidden md:table-cell">Kategoria</th>
                <th className="px-3 py-3 text-right font-bold">Suma</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((competitor, i) => (
                <tr
                  key={competitor.id}
                  className={`border-t border-gray-800 transition-colors hover:bg-gray-800 ${
                    i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"
                  }`}
                >
                  <td className="px-3 py-3 text-center text-gray-400">{competitor.place}</td>
                  <td className="px-3 py-3 font-medium text-white">{competitor.name}</td>
                  <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{competitor.club}</td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                      {competitor.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-white">
                    {competitor.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
