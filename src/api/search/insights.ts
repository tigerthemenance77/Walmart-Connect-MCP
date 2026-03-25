import type { WalmartApiClient } from "../client.js";
import { createSnapshot, downloadSnapshot, getSnapshotStatus } from "./snapshots.js";
import { McpToolError } from "../../utils/validation.js";

export async function getTopSearchTrends(client: WalmartApiClient, format?: string) {
  return client.request("/api/v1/insights/topSearchTrends", {
    method: "GET",
    query: { format }
  });
}

export async function getItemRecommendations(
  client: WalmartApiClient,
  advertiserId: number,
  startDate: string,
  endDate: string
) {
  return getRecommendationSnapshot(client, advertiserId, "itemRecommendations", startDate, endDate);
}

export async function getKeywordRecommendations(
  client: WalmartApiClient,
  advertiserId: number,
  startDate: string,
  endDate: string
) {
  return getRecommendationSnapshot(client, advertiserId, "keywordRecommendations", startDate, endDate);
}

export async function getCampaignRecommendations(
  client: WalmartApiClient,
  advertiserId: number,
  startDate: string,
  endDate: string
) {
  return getRecommendationSnapshot(client, advertiserId, "outOfBudgetRecommendations", startDate, endDate);
}

async function getRecommendationSnapshot(
  client: WalmartApiClient,
  advertiserId: number,
  insightType: "itemRecommendations" | "keywordRecommendations" | "outOfBudgetRecommendations",
  startDate: string,
  endDate: string
) {
  const created = await createSnapshot(client, advertiserId, insightType, startDate, endDate);
  const status = await waitForCompletion(client, created.snapshotId);
  if (!status.downloadUrl) {
    throw new McpToolError("API_ERROR", "Recommendation snapshot completed without download URL.");
  }
  const rows = await downloadSnapshot(client, status.downloadUrl);
  return { snapshotId: created.snapshotId, jobStatus: status.jobStatus, rows };
}

async function waitForCompletion(client: WalmartApiClient, snapshotId: string) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = await getSnapshotStatus(client, snapshotId);
    if (status.jobStatus === "done") return status;
    if (status.jobStatus === "failed") throw new McpToolError("API_ERROR", "Recommendation snapshot failed.");
    if (status.jobStatus === "expired") throw new McpToolError("SNAPSHOT_EXPIRED", "Recommendation snapshot expired.");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new McpToolError("API_ERROR", "Timed out waiting for recommendation snapshot.");
}
