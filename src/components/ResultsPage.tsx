"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import { normalizeCompetitionDoc } from "@/lib/adapters/competition";
import {
  competitionDocsQuery,
  competitionIdOf,
  groupCompetitions,
  isSubdivided,
  listedEntries,
  type CompetitionGroup,
} from "@/lib/competitions";
import { TAB_ORDER, TEAMS_TAB } from "@/lib/results/constants";
import type { CompetitionDoc, FinalsData, ResultsData, TeamsData } from "@/lib/results/types";
import { contestNum, firstNonEmpty, isContestKey, isThlonKey } from "@/lib/results/utils";
import StaticResultsView from "./StaticResultsView";
import TeamResultsView from "./TeamResultsView";
import ContestResultsView, { buildContestTabData } from "./ContestResultsView";
import TabDrawer from "./TabDrawer";

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
  const [series, setSeries] = useState<{ id: string; name: string }[]>([]);
  const [group, setGroup] = useState<CompetitionGroup | null>(null);
  const competitionId = competitionIdOf(id);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "Series"), where("competitionIds", "array-contains", competitionId)),
      (snap) => setSeries(snap.docs.map((d) => ({ id: d.id, name: d.data().name ?? d.id }))),
      (err) => console.error("Series:", err)
    );
  }, [competitionId]);

  // the other subcategories of the competition, also reached from an outdated <competitionId> doc
  useEffect(() => {
    return onSnapshot(
      competitionDocsQuery(competitionId),
      (snap) => setGroup(groupCompetitions(listedEntries(snap, id))[0] ?? null),
      (err) => console.error("Subcategories:", err)
    );
  }, [competitionId, id]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "Competitions", id),
      (snap) => {
        if (!snap.exists()) {
          setError("Nie znaleziono zawodów.");
          setLoading(false);
          return;
        }
        setData(normalizeCompetitionDoc(snap.data()));
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
      Object.entries(data).filter(([k]) => isThlonKey(k))
    ) as ResultsData;
  }, [data]);

  const contestKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const tabData of Object.values(results)) {
      for (const comps of Object.values(tabData)) {
        for (const c of comps) {
          for (const k of Object.keys(c)) {
            if (isContestKey(k)) keys.add(k);
          }
        }
      }
    }
    return [...keys].sort((a, b) => contestNum(a) - contestNum(b));
  }, [results]);

  const teams: TeamsData = useMemo(() => data?.teams ?? {}, [data]);
  const finals: FinalsData = useMemo(() => data?.finals ?? {}, [data]);
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
    if (isContestKey(tab)) return buildContestTabData(results, tab);
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

  // keeps the tab and category; ones the subcategory doesn't have fall back to its first
  const subcategoryLinks = group && isSubdivided(group) && (
    <div className="flex flex-wrap gap-2">
      {group.docs.map((d) => (
        <Link
          key={d.id}
          href={`/competition/${d.id}?${searchParams.toString()}`}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${d.id === id
            ? "bg-blue-500 text-white border-blue-500"
            : "text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500"
            }`}
        >
          {d.name ?? d.id}
        </Link>
      ))}
    </div>
  );

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col gap-4 items-center justify-center">
        <p className="text-red-400 text-sm">{t("Błąd")}: {t(error)}</p>
        {subcategoryLinks}
      </main>
    );
  }

  const isContestTab = isContestKey(activeTab);
  const showNation = !!data?.isInternational;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <div className={`${subcategoryLinks ? "mb-3" : "mb-6"} flex items-center gap-3 flex-wrap`}>
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← {t("Zawody")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {group?.name ?? data?.name ?? id}
        </h1>
        {data?.debugOnly && (
          <span className="px-2 py-0.5 rounded-full text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30">
            {t("Debug")}
          </span>
        )}
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/series/${s.id}`}
            className="px-2 py-0.5 rounded-full text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            {s.name}
          </Link>
        ))}
      </div>

      {subcategoryLinks && <div className="mb-6">{subcategoryLinks}</div>}

      <TabDrawer
        groups={[
          {
            label: "Wieloboje",
            items: [...TAB_ORDER.filter((k) => k in results), ...(hasTeams ? [TEAMS_TAB] : [])],
          },
          { label: "Konkurencje", items: contestKeys },
        ]}
        activeTab={activeTab}
        onSelect={handleTabChange}
      />

      {activeTab === TEAMS_TAB ? (
        <TeamResultsView
          teams={teams}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      ) : isContestTab ? (
        <ContestResultsView
          results={results}
          finals={finals}
          contestKey={activeTab}
          showNation={showNation}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      ) : (
        <StaticResultsView
          tab={activeTab}
          tabData={results[activeTab] ?? {}}
          showNation={showNation}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}
    </main>
  );
}
