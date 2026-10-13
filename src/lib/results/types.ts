// Shapes the views render. Competitions/{id} is converted into these by
// lib/adapters/competition.ts, whatever version the desktop app wrote.

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
  // "contest-N": formatted score, e.g. "95", "95 01:23:450", "12.50 10.00" or "40 60.00"
  [key: string]: string | number | boolean;
};

// thlon tab ("5boj", ...) -> category -> ranked competitors
export type ResultsData = {
  [tab: string]: {
    [category: string]: Competitor[];
  };
};

export type TeamMember = {
  name: string;
  total: number;
};

export type TeamResult = {
  id: string;
  name: string;
  category: string;
  members: TeamMember[];
  total: number;
  place: number;
};

export type TeamsData = {
  [category: string]: TeamResult[];
};

export type FinalEntry = {
  id: string;
  name: string;
  club: string;
  place: number;
  score: number; // points in timed contests, distance otherwise
  time?: string; // timed contests only: "01:23:450", or "—" if missing
};

// "contest-N" -> category -> finalists by place
export type FinalsData = {
  [contestKey: string]: {
    [category: string]: FinalEntry[];
  };
};

export type CompetitionDoc = ResultsData & {
  name?: string;
  date?: string;
  teams?: TeamsData;
  finals?: FinalsData;
};

// Series/{id}: written whole by the desktop app's "Sync to cloud".
export type Placement = {
  competitionName: string;
  place: number;
  score: number;
};

export type SerieEntry = {
  id: string;
  name: string;
  club?: string; // contestants only
  category: string;
  placements: Placement[];
  total: number;
  place: number; // sum of placements' places ("Punkty")
  seriePlace: number;
};

export type SerieDoc = {
  name: string;
  year: number;
  type: "Puchar" | "Tury";
  competitions: string[];
  competitionIds: string[];
  "5boj": Record<string, SerieEntry[]>;
  "9boj": Record<string, SerieEntry[]>;
  multi: Record<string, SerieEntry[]>;
  distance: Record<string, SerieEntry[]>;
  teams: Record<string, SerieEntry[]>;
};
