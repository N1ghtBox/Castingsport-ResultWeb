"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import { SERIE_TAB_ORDER, TEAMS_TAB } from "@/lib/results/constants";
import type { SerieDoc, SerieEntry } from "@/lib/results/types";
import { firstNonEmpty, hasResults } from "@/lib/results/utils";
import TabDrawer from "./TabDrawer";
import SeriesResultsView from "./SeriesResultsView";

export default function SeriesPage({ id }: { id: string }) {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<SerieDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "Series", id),
      (snap) => {
        if (!snap.exists()) {
          setError("Nie znaleziono serii.");
          setLoading(false);
          return;
        }
        setData(snap.data() as SerieDoc);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  // competitionIds aren't aligned with competitions[], so labels come from the docs themselves
  const idsKey = (data?.competitionIds ?? []).join(",");
  useEffect(() => {
    if (!idsKey) return setLinked([]);
    let cancelled = false;
    Promise.all(
      idsKey.split(",").map(async (cid) => {
        const snap = await getDoc(doc(db, "Competitions", cid));
        return snap.exists() ? { id: cid, name: (snap.data().name as string) ?? cid } : null;
      })
    ).then((res) => {
      if (!cancelled) setLinked(res.filter((r) => r !== null));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [idsKey]);

  const tabs = useMemo(() => {
    if (!data) return [];
    return [
      ...SERIE_TAB_ORDER.filter((k) => hasResults(data[k])),
      ...(hasResults(data.teams) ? [TEAMS_TAB] : []),
    ];
  }, [data]);

  const tabData = (tab: string): Record<string, SerieEntry[]> =>
    (data?.[tab as keyof SerieDoc] as Record<string, SerieEntry[]>) ?? {};

  // pick tab/category from the URL once data arrives, keep the current one on later syncs
  useEffect(() => {
    if (tabs.length === 0) return;
    setActiveTab((prev) => {
      if (prev && tabs.includes(prev)) return prev;
      const urlTab = searchParams.get("tab") ?? "";
      const urlCat = searchParams.get("category") ?? "";
      const tab = !prev && tabs.includes(urlTab) ? urlTab : tabs[0];
      const d = tabData(tab);
      setActiveCategory(!prev && urlCat in d ? urlCat : firstNonEmpty(d));
      return tab;
    });
  }, [tabs]);

  function syncUrl(tab: string, category: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("category", category);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleTabChange(tab: string) {
    const cat = firstNonEmpty(tabData(tab));
    setActiveTab(tab);
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

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← {t("Zawody")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">{data?.name ?? id}</h1>
        {data?.type && (
          <span className="px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300">
            {t(data.type)}
          </span>
        )}
      </div>

      {linked.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {linked.map((c) => (
            <Link
              key={c.id}
              href={`/competition/${c.id}`}
              className="px-3 py-1 rounded-full text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {tabs.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">{t("Brak wyników")}</p>
      ) : (
        <>
          <TabDrawer
            groups={[{ label: "Wieloboje", items: tabs }]}
            activeTab={activeTab}
            onSelect={handleTabChange}
          />
          <SeriesResultsView
            tabData={tabData(activeTab)}
            competitions={data?.competitions ?? []}
            isTeams={activeTab === TEAMS_TAB}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </>
      )}
    </main>
  );
}
