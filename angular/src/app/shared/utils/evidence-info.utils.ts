/**
 * Shared evidence citation utilities
 * Used by ACWR and Readiness services to avoid duplication
 */

import type { ResearchCitation } from "../../core/config/evidence-config";

export interface EvidenceCitation {
  authors: string;
  year: number;
  title: string;
  doi?: string;
}

/**
 * Maps research citations to display format
 */
export function mapEvidenceCitations(
  citations: ResearchCitation[],
): EvidenceCitation[] {
  return citations.map((c) => ({
    authors: c.authors,
    year: c.year,
    title: c.title,
    doi: c.doi ?? "",
  }));
}

/**
 * Formats preset name and version for display
 */
export function getPresetDisplay(preset: {
  name: string;
  version: string;
}): string {
  return `${preset.name} (${preset.version})`;
}
