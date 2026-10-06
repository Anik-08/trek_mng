import fs from "fs";
import path from "path";

export interface TrekSection {
  heading: string;
  content: string[];
  subsections: TrekSection[];
}

export interface TrekData {
  sourceFile: string;
  title: string;
  sections: TrekSection[];
}

let _cache: TrekData[] | null = null;

export function getAllTreks(): TrekData[] {
  if (_cache) return _cache;

  const publicPath = path.join(process.cwd(), "public", "data", "cleaned.json");
  const extractedPath = path.join(process.cwd(), "extracted", "trek_sections_clean.json");

  const targetPath = fs.existsSync(publicPath) ? publicPath : extractedPath;
  const raw = fs.readFileSync(targetPath, "utf-8");
  _cache = JSON.parse(raw) as TrekData[];
  return _cache;
}

export function getTrekSlug(trek: TrekData): string {
  return trek.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function getTrekBySlug(slug: string): TrekData | null {
  const treks = getAllTreks();
  const normalizedSlug = slug.toLowerCase().trim();
  return (
    treks.find(
      (t) =>
        getTrekSlug(t) === normalizedSlug ||
        t.sourceFile.replace(/\.txt$/, "") === normalizedSlug ||
        t.title.toLowerCase().trim() === normalizedSlug
    ) ?? null
  );
}

export function getTrekSections(trek: TrekData): TrekSection[] {
  return trek.sections || [];
}

export function getSection(trek: TrekData, keyword: string): TrekSection | null {
  return (
    trek.sections.find((s) =>
      s.heading.toLowerCase().includes(keyword.toLowerCase())
    ) ?? null
  );
}

export function getIntroText(trek: TrekData): string {
  const first = trek.sections[0];
  if (!first) return "";
  if (first.content && first.content.length > 0) return first.content[0];
  for (const sub of first.subsections || []) {
    if (sub.content && sub.content.length > 0) return sub.content[0];
  }
  return "";
}
