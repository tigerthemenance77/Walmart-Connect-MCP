import { z } from "zod";

export class McpToolError extends Error {
  constructor(
    public readonly code:
      | "NO_ACCOUNT_SET"
      | "ACCOUNT_NOT_FOUND"
      | "AUTH_FAILED"
      | "RATE_LIMITED"
      | "API_ERROR"
      | "SNAPSHOT_EXPIRED"
      | "INVALID_INPUT",
    message: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
  }
}

export const emptyInputSchema = z.object({}).strict();

export const snapshotTypeSchema = z.enum([
  "campaign",
  "adGroup",
  "keyword",
  "adItem",
  "placement",
  "platform",
  "pageType",
  "brand",
  "category",
  "itemHealth",
  "searchImpression",
  "outOfBudgetRecommendations",
  "attributedPurchases",
  "videoCampaigns",
  "videoKeywords",
  "advancedInsights",
  "entitySnapshot",
  "auditSnapshot"
]);

export const displaySnapshotTypeSchema = z.enum(["campaign", "adGroup", "keyword", "bid", "creative", "pageType", "platform"]);

export function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const row = splitCsvLine(line);
    return header.reduce<Record<string, string>>((acc, key, idx) => {
      acc[key] = row[idx] ?? "";
      return acc;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  out.push(current.trim());
  return out;
}

export function toolText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function formatError(error: unknown): string {
  if (error instanceof McpToolError) return error.message;
  if (error instanceof Error) return `Unexpected error: ${error.message}`;
  return "Unexpected unknown error.";
}
