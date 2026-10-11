"use client";

import { useMemo } from "react";
import { TEAM_CATEGORY_ORDER } from "@/lib/results/constants";
import type { TeamsData } from "@/lib/results/types";
import { sortCategories } from "@/lib/results/utils";
import { useT } from "@/lib/i18n";

type Props = {
  teams: TeamsData;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

export default function TeamResultsView({ teams, activeCategory, onCategoryChange }: Props) {
  const t = useT();
  const nonEmptyCategories = useMemo(
    () => sortCategories(Object.keys(teams).filter((c) => teams[c].length > 0), TEAM_CATEGORY_ORDER),
    [teams]
  );

  const rows = useMemo(() => teams[activeCategory] ?? [], [teams, activeCategory]);

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
                <th className="px-3 py-3 text-center w-10">{t("Miejsce")}</th>
                <th className="col-name py-3 text-left">{t("Drużyna")}</th>
                <th className="px-3 py-3 text-left hidden md:table-cell">{t("Zawodnicy")}</th>
                <th className="px-3 py-3 text-right font-bold">{t("Suma")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team, i) => {
                const members = (
                  <ul className="flex flex-col gap-0.5">
                    {team.members.map((m, mi) => (
                      <li key={mi} className="flex justify-between gap-4 text-xs text-gray-400">
                        <span>{m.name || "—"}</span>
                        <span className="tabular-nums">{m.total.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                );
                return (
                  <tr
                    key={team.id}
                    className={`border-t border-gray-800 align-middle transition-colors hover:bg-gray-800 ${
                      i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"
                    }`}
                  >
                    <td className="px-3 py-3 text-center text-gray-400">{team.place}</td>
                    <td className="col-name py-3">
                      <p className="font-medium text-white">{team.name}</p>
                      <div className="mt-1 md:hidden">{members}</div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="max-w-xs">{members}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-white">
                      {team.total.toFixed(2)}
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
