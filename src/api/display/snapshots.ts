import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";
import { McpToolError, parseCsv } from "../../utils/validation.js";

export async function displayCreateSnapshot(
  client: WalmartApiClient,
  advertiserId: number,
  insightType: "campaign" | "adGroup" | "keyword",
  startDate?: string,
  endDate?: string
): Promise<{ snapshotId: string }> {
  const result = (await client.request("/insights/snapshot", {
    method: "POST",
    baseUrl: DISPLAY_BASE_URL,
    body: { advertiserId, insightType, startDate, endDate }
  })) as { snapshotId?: string };

  if (!result.snapshotId) {
    throw new McpToolError("API_ERROR", "Display snapshot create did not return snapshotId.");
  }

  return { snapshotId: result.snapshotId };
}

export async function displayGetSnapshotStatus(client: WalmartApiClient, snapshotId: string) {
  return client.request("/insights/snapshot", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { snapshotId }
  });
}

export async function displayDownloadSnapshot(client: WalmartApiClient, downloadUrl: string) {
  const csv = (await client.request(downloadUrl, { method: "GET", rawUrl: downloadUrl })) as string;
  if (typeof csv !== "string") {
    throw new McpToolError("API_ERROR", "Display snapshot download did not return CSV text.");
  }
  return parseCsv(csv);
}
