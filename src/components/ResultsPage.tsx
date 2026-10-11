"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import {
  CompetitionDoc,
  ResultsData,
  TAB_ORDER,
  isStaticResultKey,
  contestNum,
  firstNonEmpty,
  TeamsData,
  TEAMS_TAB,
} from "./results-types";
import StaticResultsView from "./StaticResultsView";
import TeamResultsView from "./TeamResultsView";
import ContestResultsView, { buildContestTabData } from "./ContestResultsView";

export type { Competitor, ResultsData, CompetitionDoc } from "./results-types";

export default function ResultsPage({ id }: { id: string }) {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);

  const [data, setData] = useState<CompetitionDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

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

  const teams: TeamsData = useMemo(() => data?.teams ?? {}, [data]);
  const hasTeams = Object.values(teams).some((list) => list.length > 0);

  const tabs = useMemo(
    () => [
      ...TAB_ORDER.filter((k) => k in results),
      ...(hasTeams ? [TEAMS_TAB] : []),
      ...contestKeys,
    ],
    [results, hasTeams, contestKeys]
  );

  function getTabData(tab: string): Record<string, unknown[]> {
    if (tab === TEAMS_TAB) return teams;
    if (/^contest-\d+$/.test(tab)) return buildContestTabData(results, tab);
    return results[tab] ?? {};
  }

  useEffect(() => {
    if (tabs.length === 0) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const urlTab = searchParams.get("tab") ?? "";
      const urlCategory = searchParams.get("category") ?? "";
      const tabToUse = urlTab && tabs.includes(urlTab) ? urlTab : tabs[0];
      const tabData = getTabData(tabToUse);
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
      setActiveCategory(firstNonEmpty(getTabData(first)));
      return first;
    });
  }, [tabs, results, teams]);

  function syncUrl(tab: string, category: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("category", category);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const cat = firstNonEmpty(getTabData(tab));
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
        <p className="text-gray-400 text-sm animate-pulse">{t("Ładowanie wyników…")}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">{t("Błąd")}: {t(error)}</p>
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
          ← {t("Zawody")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {data?.name ?? id}
        </h1>
        {data?.date && (
          <span className="text-gray-500 text-sm">{data.date}</span>
        )}
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="mb-6 flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        {t(activeTab)}
      </button>

      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto scrollbar-thin transition-transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label={t("Zamknij")}
            className="text-gray-400 hover:text-white text-xl leading-none px-2"
          >
            ×
          </button>
        </div>
        {[
          {
            label: "Wieloboje",
            items: [...TAB_ORDER.filter((k) => k in results), ...(hasTeams ? [TEAMS_TAB] : [])],
          },
          { label: "Konkurencje", items: contestKeys },
        ].filter((group) => group.items.length > 0).map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t(group.label)}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((tab) => (
                <button
                  key={tab}
                  tabIndex={drawerOpen ? 0 : -1}
                  onClick={() => {
                    handleTabChange(tab);
                    setDrawerOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {activeTab === TEAMS_TAB ? (
        <TeamResultsView
          teams={teams}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      ) : isContestTab ? (
        <ContestResultsView
          results={results}
          contestKey={activeTab}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      ) : (
        <StaticResultsView
          tab={activeTab}
          tabData={results[activeTab] ?? {}}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </main>
  );
}
