import type { WalmartApiClient } from "../client.js";
import type { SnapshotStatus } from "./types.js";
import { McpToolError, parseCsv } from "../../utils/validation.js";

export async function createSnapshot(
  client: WalmartApiClient,
  advertiserId: number,
  reportType:
    | "campaign"
    | "adGroup"
    | "keyword"
    | "adItem"
    | "placement"
    | "platform"
    | "pageType"
    | "brand"
    | "category"
    | "itemHealth"
    | "searchImpression"
    | "outOfBudgetRecommendations"
    | "attributedPurchases"
    | "videoCampaigns"
    | "videoKeywords"
    | "advancedInsights"
    | "entitySnapshot"
    | "auditSnapshot"
    | "itemRecommendations"
    | "keywordRecommendations",
  startDate: string,
  endDate: string
): Promise<{ snapshotId: string }> {
  const result = (await client.request("/api/v1/insights/snapshot", {
    method: "POST",
    body: {
      advertiserId,
      insightType: reportType,
      startDate,
      endDate
    }
  })) as { snapshotId?: string };

  if (!result?.snapshotId) {
    throw new McpToolError("API_ERROR", "Snapshot creation response did not include snapshotId.");
  }

  return { snapshotId: result.snapshotId };
}

export async function createAdvertiserAttributesSnapshot(client: WalmartApiClient): Promise<{ snapshotId: string }> {
  const result = (await client.request("/api/v1/insights/snapshot", {
    method: "POST",
    body: { insightType: "advertiserAttributesV2" }
  })) as { snapshotId?: string };

  if (!result?.snapshotId) {
    throw new McpToolError("API_ERROR", "Advertiser attributes snapshot request failed.");
  }

  return { snapshotId: result.snapshotId };
}

export async function getSnapshotStatus(client: WalmartApiClient, snapshotId: string): Promise<SnapshotStatus> {
  const status = (await client.request("/api/v1/insights/snapshot", {
    method: "GET",
    query: { snapshotId }
  })) as SnapshotStatus;

  if (!status?.jobStatus || !status.snapshotId) {
    throw new McpToolError("API_ERROR", "Snapshot status payload is missing required fields.");
  }
  return status;
}

export async function downloadSnapshot(client: WalmartApiClient, downloadUrl: string) {
  const csv = (await client.request(downloadUrl, { method: "GET", rawUrl: downloadUrl })) as string;
  if (typeof csv !== "string") {
    throw new McpToolError("API_ERROR", "Snapshot download did not return CSV text.");
  }
  return parseCsv(csv);
}
