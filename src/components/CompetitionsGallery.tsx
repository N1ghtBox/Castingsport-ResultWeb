"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type CompetitionMeta = {
  id: string;
  name?: string;
  date?: string;
  categoryCount: number;
  participantCount: number;
};

const RESULT_KEYS = new Set(["3boj", "5boj", "7boj", "9boj", "multi", "distance"]);

export default function CompetitionsGallery() {
  const [competitions, setCompetitions] = useState<CompetitionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "Competitions"),
      (snap) => {
        const data: CompetitionMeta[] = snap.docs.map((doc) => {
          const d = doc.data();
          let participantCount = 0;
          let categoryCount = 0;
          for (const key of Object.keys(d)) {
            if (!RESULT_KEYS.has(key)) continue;
            const tab = d[key] as Record<string, unknown[]>;
            for (const arr of Object.values(tab)) {
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
        <p className="text-gray-400 text-sm animate-pulse">Ładowanie zawodów…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">Błąd: {error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Zawody</h1>
      <p className="text-gray-500 text-sm mb-8">Wybierz zawody, aby zobaczyć wyniki</p>

      {competitions.length === 0 ? (
        <p className="text-gray-500 mt-12 text-center">Brak zawodów</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/competition/${comp.id}`}
              className="group block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-500 hover:bg-gray-800 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                  {comp.name ?? "Zawody"}
                </h2>
                <span className="text-blue-400 text-lg ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
              {comp.date && (
                <p className="text-gray-500 text-xs mb-3">{comp.date}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
