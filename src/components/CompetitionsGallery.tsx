"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import { normalizeCompetitionDoc } from "@/lib/adapters/competition";
import { dateSortKey, dateYear, isThlonKey } from "@/lib/results/utils";

type CompetitionMeta = {
  id: string;
  name?: string;
  date?: string;
  categoryCount: number;
  participantCount: number;
};

type SerieMeta = { id: string; name?: string; year?: number; type?: string; competitionIds: string[] };

// Newest year first, unknown ("—") last. Inputs are already sorted within a year.
function yearGroups(competitions: CompetitionMeta[], series: SerieMeta[]) {
  const groups = new Map<string, { series: SerieMeta[]; comps: CompetitionMeta[] }>();
  const get = (y: string) => groups.get(y) ?? groups.set(y, { series: [], comps: [] }).get(y)!;
  for (const s of series) get(s.year ? String(s.year) : "—").series.push(s);
  for (const c of competitions) get(dateYear(c.date)).comps.push(c);
  return [...groups].sort(([a], [b]) => (Number(b) || -Infinity) - (Number(a) || -Infinity));
}

export default function CompetitionsGallery() {
  const t = useT();
  const [competitions, setCompetitions] = useState<CompetitionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<SerieMeta[]>([]);
  const seriesByComp = useMemo(() => {
    const m = new Map<string, SerieMeta[]>();
    for (const s of series)
      for (const cid of s.competitionIds) (m.get(cid) ?? m.set(cid, []).get(cid)!).push(s);
    return m;
  }, [series]);

  // separate listener: a series failure shouldn't hide the competitions
  useEffect(() => {
    return onSnapshot(
      collection(db, "Series"),
      (snap) => {
        const data: SerieMeta[] = snap.docs.map((d) => {
          const { name, year, type, competitionIds } = d.data();
          return { id: d.id, name, year, type, competitionIds: competitionIds ?? [] };
        });
        data.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (a.name ?? "").localeCompare(b.name ?? ""));
        setSeries(data);
      },
      (err) => console.error("Series:", err)
    );
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "Competitions"),
      (snap) => {
        const data: CompetitionMeta[] = snap.docs.map((doc) => {
          const d = normalizeCompetitionDoc(doc.data());
          let participantCount = 0;
          let categoryCount = 0;
          for (const key of Object.keys(d)) {
            if (!isThlonKey(key)) continue;
            for (const arr of Object.values(d[key])) {
              if (arr.length > 0) {
                categoryCount++;
                participantCount += arr.length;
              }
            }
          }
          return {
            id: doc.id,
            name: d.name,
            date: d.date,
            categoryCount,
            participantCount,
          };
        });
        data.sort((a, b) => dateSortKey(b.date) - dateSortKey(a.date));
        setCompetitions(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">{t("Ładowanie zawodów…")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">{t("Błąd")}: {error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">{t("Castingsport - wyniki")}</h1>
      <p className="text-gray-500 text-sm mb-8">{t("Wybierz zawody, aby zobaczyć wyniki")}</p>

      {competitions.length === 0 && series.length === 0 ? (
        <p className="text-gray-500 mt-12 text-center">{t("Brak zawodów")}</p>
      ) : (
        yearGroups(competitions, series).map(([year, { series: yearSeries, comps }]) => (
          <section key={year} className="mb-8">
            <h2 className="text-gray-400 text-sm font-semibold mb-3">{year}</h2>
            {yearSeries.length > 0 && (
              <>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{t("Serie")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  {yearSeries.map((s) => (
                    <Link
                      key={s.id}
                      href={`/series/${s.id}`}
                      className="group block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-emerald-400 transition-colors">
                          {s.name ?? t("Serie")}
                        </h3>
                        <span className="text-emerald-400 text-lg ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </div>
                      {s.type && <p className="text-gray-500 text-xs">{t(s.type)}</p>}
                    </Link>
                  ))}
                </div>
                {comps.length > 0 && (
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{t("Zawody")}</p>
                )}
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comps.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/competition/${comp.id}`}
                  className="group block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-500 hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                      {comp.name ?? t("Zawody")}
                    </h3>
                    <span className="text-blue-400 text-lg ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                  {comp.date && (
                    <p className="text-gray-500 text-xs mb-3">{comp.date}</p>
                  )}
                  {seriesByComp.has(comp.id) && (
                    <div className="flex flex-wrap gap-1.5">
                      {seriesByComp.get(comp.id)!.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-full text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                        >
                          {s.name ?? t("Serie")}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
