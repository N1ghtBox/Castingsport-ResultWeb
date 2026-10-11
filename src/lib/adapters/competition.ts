import type { CompetitionDoc } from "@/lib/results/types";
import { fromV2, isV2 } from "./competition-v2";

// Reads Competitions/{id} in any version the desktop app has written.
// v1 is already the shape the views render; newer versions are converted to it.
export function normalizeCompetitionDoc(raw: Record<string, unknown>): CompetitionDoc {
  if (isV2(raw)) return fromV2(raw);
  return raw as CompetitionDoc;
}
