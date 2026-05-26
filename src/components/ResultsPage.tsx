"use client";

import { useState, useMemo, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

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

const TAB_LABELS: Record<string, string> = {
  "3boj": "3-bój",
  "5boj": "5-bój",
  "7boj": "7-bój",
  "9boj": "9-bój",
  multi: "Multi",
  distance: "Odległość",
};

const TAB_ORDER = ["3boj", "5boj", "7boj", "9boj", "multi", "distance"];
const RESULT_KEYS = new Set(TAB_ORDER);

const CATEGORY_ORDER = ["Kadet", "Junior", "Juniorka", "Mężczyzna", "Kobieta"];

function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function firstNonEmpty(tabData: Record<string, Competitor[]>): string {
  return (
    Object.keys(tabData).find((k) => tabData[k].length > 0) ??
    Object.keys(tabData)[0] ??
    ""
  );
}

export default function ResultsPage({ id }: { id: string }) {
  const [data, setData] = useState<CompetitionDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "Competitions", id),
      (snap) => {
        if (!snap.exists()) {
          setError("Nie znaleziono zawodów.");
          setLoading(false);
          return;
        }
        const d = snap.data() as CompetitionDoc;
        setData(d);
        setLoading(false);
        setActiveTab((prev) => {
          const tabs = TAB_ORDER.filter((k) => RESULT_KEYS.has(k) && k in d);
          if (prev && tabs.includes(prev)) return prev;
          const first = tabs[0] ?? "";
          setActiveCategory(firstNonEmpty((d[first] as Record<string, Competitor[]>) ?? {}));
          return first;
        });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const results: ResultsData = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      Object.entries(data).filter(([k]) => RESULT_KEYS.has(k))
    ) as ResultsData;
  }, [data]);

  const tabs = TAB_ORDER.filter((k) => k in results);
  const tabData = results[activeTab] ?? {};

  const nonEmptyCategories = useMemo(
    () => sortCategories(Object.keys(tabData).filter((c) => tabData[c].length > 0)),
    [tabData]
  );

  const rows = useMemo(() => tabData[activeCategory] ?? [], [tabData, activeCategory]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setActiveCategory(firstNonEmpty(results[tab] ?? {}));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Ładowanie wyników…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">Błąd: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Zawody
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {data?.name ?? id}
        </h1>
        {data?.date && (
          <span className="text-gray-500 text-sm">{data.date}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab
                ? "bg-blue-500 text-white shadow"
                : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
          >
            {TAB_LABELS[tab] ?? tab}
          </button>
        ))}
      </div>

      {/* Category filters */}
      {nonEmptyCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {nonEmptyCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${activeCategory === cat
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
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
              {rows.map((competitor, i) => {
                return (
                  <tr
                    key={competitor.id}
                    className={`border-t border-gray-800 transition-colors hover:bg-gray-800 ${i % 2 === 0 ? "bg-gray-900" : "bg-[#111827]"
                      }`}
                  >
                    <td className={`px-3 py-3 text-center text-gray-400`}>
                      {competitor.place}
                    </td>
                    <td className="px-3 py-3 font-medium text-white">{competitor.name}</td>
                    <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">
                      {competitor.club}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                        {competitor.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-white">
                      {competitor.total.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
