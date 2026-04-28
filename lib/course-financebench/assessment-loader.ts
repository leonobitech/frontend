// ─── Financial RAG Evaluation Suite — Loader del assessment (server-only) ───
//
// NO importar desde Client Components. Usa `node:fs` para leer el JSON.
// El schema + scoring vive en `./assessment.ts` (client-safe).

import { promises as fs } from "node:fs";
import path from "node:path";

import { assessmentSchema, type Assessment } from "./assessment";

const ASSESSMENT_PATH = path.join(
  process.cwd(),
  "content",
  "financebench",
  "assessment.json",
);

export async function loadAssessment(): Promise<Assessment> {
  const raw = await fs.readFile(ASSESSMENT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return assessmentSchema.parse(parsed);
}
