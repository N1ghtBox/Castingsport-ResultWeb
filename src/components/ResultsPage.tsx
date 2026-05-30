"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  CompetitionDoc,
  ResultsData,
  TAB_ORDER,
  isStaticResultKey,
  getTabLabel,
  contestNum,
  firstNonEmpty,
} from "./results-types";
import StaticResultsView from "./StaticResultsView";
import ContestResultsView, { buildContestTabData } from "./ContestResultsView";

export type { Competitor, ResultsData, CompetitionDoc } from "./results-types";

export default function ResultsPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);

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
        setData(snap.data() as CompetitionDoc);
        setLoading(false);
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
      Object.entries(data).filter(([k]) => isStaticResultKey(k))
    ) as ResultsData;
  }, [data]);

  const contestKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const tabData of Object.values(results)) {
      for (const comps of Object.values(tabData)) {
        for (const c of comps) {
          for (const k of Object.keys(c)) {
            if (/^contest-\d+$/.test(k)) keys.add(k);
          }
        }
      }
    }
    return [...keys].sort((a, b) => contestNum(a) - contestNum(b));
  }, [results]);

  const tabs = useMemo(
    () => [...TAB_ORDER.filter((k) => k in results), ...contestKeys],
    [results, contestKeys]
  );

  useEffect(() => {
    if (tabs.length === 0) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const urlTab = searchParams.get("tab") ?? "";
      const urlCategory = searchParams.get("category") ?? "";
      const tabToUse = urlTab && tabs.includes(urlTab) ? urlTab : tabs[0];
      const tabData = /^contest-\d+$/.test(tabToUse)
        ? buildContestTabData(results, tabToUse)
        : (results[tabToUse] ?? {});
      const catToUse =
        urlCategory && urlCategory in tabData
          ? urlCategory
          : firstNonEmpty(tabData);
      setActiveTab(tabToUse);
      setActiveCategory(catToUse);
      return;
    }

    setActiveTab((prev) => {
      if (prev && tabs.includes(prev)) return prev;
      const first = tabs[0];
      const firstTabData = /^contest-\d+$/.test(first)
        ? buildContestTabData(results, first)
        : (results[first] ?? {});
      setActiveCategory(firstNonEmpty(firstTabData));
      return first;
    });
  }, [tabs, results]);

  function syncUrl(tab: string, category: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("category", category);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const nextTabData = /^contest-\d+$/.test(tab)
      ? buildContestTabData(results, tab)
      : (results[tab] ?? {});
    const cat = firstNonEmpty(nextTabData);
    setActiveCategory(cat);
    syncUrl(tab, cat);
  }

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    syncUrl(activeTab, category);
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

  const isContestTab = /^contest-\d+$/.test(activeTab);

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

      <div className="flex flex-col gap-2 mb-6">
        {[
          TAB_ORDER.filter((k) => k in results),
          contestKeys,
        ].filter((group) => group.length > 0).map((group, gi) => (
          <div key={gi} className="flex flex-wrap gap-2">
            {group.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-500 text-white shadow"
                    : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {isContestTab ? (
        <ContestResultsView
          results={results}
          contestKey={activeTab}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      ) : (
        <StaticResultsView
          tabData={results[activeTab] ?? {}}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </main>
  );
}
