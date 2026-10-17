import { collection, documentId, query, where, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Competitions/{docId}: <competitionId> for a competition without subcategories,
// otherwise <competitionId>-<subcategoryId> per subcategory. Both ids are 36-character UUIDs.
// A subcategory doc's name is the subcategory's; the competition's own name is only in a
// <competitionId> doc, which may be left over from before the split and is no longer updated.

const ID_LENGTH = 36;

export function competitionIdOf(docId: string): string {
  return docId.slice(0, ID_LENGTH);
}

export function isSubcategoryDoc(docId: string): boolean {
  return docId.length > ID_LENGTH;
}

// The <competitionId> doc and all its <competitionId>-<subcategoryId> docs ("." sorts right after "-")
export function competitionDocsQuery(competitionId: string) {
  return query(
    collection(db, "Competitions"),
    where(documentId(), ">=", competitionId),
    where(documentId(), "<", `${competitionId}.`)
  );
}

export type CompetitionEntry = { id: string; name?: string; date?: string; debugOnly?: boolean };

export type CompetitionGroup = {
  id: string; // competition id
  name?: string; // from the <competitionId> doc, if there is one
  date?: string;
  docs: CompetitionEntry[]; // to link to: one per subcategory, or else the <competitionId> doc
};

// `next dev` lists debug syncs too
const LIST_DEBUG = process.env.NODE_ENV === "development";

// Docs to list publicly: debug syncs are left out (they stay reachable by link), except `keep`
export function listedEntries(snap: QuerySnapshot, keep?: string): CompetitionEntry[] {
  return snap.docs
    .filter((d) => LIST_DEBUG || d.id === keep || !d.data().debugOnly)
    .map((d) => {
      const { name, date, debugOnly } = d.data();
      return { id: d.id, name, date, debugOnly: !!debugOnly };
    });
}

export function groupCompetitions(entries: CompetitionEntry[]): CompetitionGroup[] {
  const byId = new Map<string, { main?: CompetitionEntry; subs: CompetitionEntry[] }>();
  for (const entry of entries) {
    const cid = competitionIdOf(entry.id);
    const group = byId.get(cid) ?? byId.set(cid, { subs: [] }).get(cid)!;
    if (isSubcategoryDoc(entry.id)) group.subs.push(entry);
    else group.main = entry;
  }

  return [...byId].map(([id, { main, subs }]) => {
    subs.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const docs = subs.length > 0 ? subs : [main!];
    return { id, name: main?.name, date: docs[0].date, docs };
  });
}

export function isSubdivided(group: CompetitionGroup): boolean {
  return group.docs[0].id !== group.id;
}
