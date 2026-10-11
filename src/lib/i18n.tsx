"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ponytail: flat dict, t() falls back to the key. Keys double as Polish source
// for data-driven labels (tab keys, category names straight from Firestore).
const DICT: Record<string, Record<string, string>> = {
  pl: {},
  en: {
    // gallery
    "Castingsport - wyniki": "Castingsport - results",
    "Zawody": "Competitions",
    "Ładowanie zawodów…": "Loading competitions…",
    "Wybierz zawody, aby zobaczyć wyniki": "Pick a competition to see results",
    "Brak zawodów": "No competitions",
    "Błąd": "Error",
    // series
    "Serie": "Series",
    "Nie znaleziono serii.": "Series not found.",
    "Puchar": "Cup",
    "Tury": "Rounds",
    "Łączny wynik": "Total score",
    "Punkty": "Points",
    // settings
    "Ustawienia": "Settings",
    "Język": "Language",
    // results page
    "Ładowanie wyników…": "Loading results…",
    "Nie znaleziono zawodów.": "Competition not found.",
    "Brak wyników": "No results",
    "Wieloboje": "Combined events",
    "Konkurencje": "Events",
    "Zamknij": "Close",
    "Drużyna": "Team",
    "Zawodnicy": "Members",
    "teams": "Teams",
    // team categories
    "Młodzieży": "Youth",
    "Seniorów": "Seniors",
    "Kobiet": "Women",
    // table
    "Miejsce": "Place",
    "Zawodnik": "Competitor",
    "Klub": "Club",
    "Kategoria": "Category",
    "Suma": "Total",
    "Wynik": "Score",
    // tabs
    "3boj": "Triathlon",
    "5boj": "Pentathlon",
    "7boj": "Heptathlon",
    "9boj": "Allround",
    "multi": "Multi",
    "distance": "Distance",
    "contest-1": "Fly accuracy",
    "contest-2": "Fly distance",
    "contest-3": "Arenberg",
    "contest-4": "Skish",
    "contest-5": "Distance 7.5g",
    "contest-6": "Fly distance two-handed",
    "contest-7": "Distance two-handed",
    "contest-8": "Multi skish",
    "contest-9": "Multi distance",
    // categories (values come from Firestore)
    "Kadet": "Cadet",
    "Junior": "Boys",
    "Juniorka": "Girls",
    "Mężczyzna": "Men",
    "Kobieta": "Woman",
  },
};

// Polish labels for keys that aren't Polish text already.
const PL_LABELS: Record<string, string> = {
  "3boj": "3-bój",
  "5boj": "5-bój",
  "7boj": "7-bój",
  "9boj": "9-bój",
  multi: "2-bój multi",
  distance: "2-bój odległościowy",
  teams: "Drużyny",
  "contest-1": "Mucha cel",
  "contest-2": "Mucha odległość",
  "contest-3": "Arenberg",
  "contest-4": "Skish",
  "contest-5": "Odległość 7.5g",
  "contest-6": "Mucha odległość oburącz",
  "contest-7": "Odległość oburącz",
  "contest-8": "Multi skish",
  "contest-9": "Multi odległość",
};

const LANGS = ["pl", "en"] as const;
type Lang = (typeof LANGS)[number];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "pl",
  setLang: () => { },
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("pl");

  // read after mount so SSR and first client render match
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "pl") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useT() {
  const { lang } = useContext(Ctx);
  return (key: string) => DICT[lang][key] ?? PL_LABELS[key] ?? key;
}

export function LangSwitcher() {
  const { lang, setLang } = useContext(Ctx);
  return (
    <div className="flex gap-1 rounded-full bg-gray-950 border border-gray-800 p-1">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase transition-colors ${lang === l
            ? "bg-blue-500 text-white"
            : "text-gray-400 hover:text-white"
            }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
