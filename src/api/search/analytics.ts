import type { WalmartApiClient } from "../client.js";

export async function searchItems(
  client: WalmartApiClient,
  advertiserId: number,
  query?: string,
  itemIds?: string[]
) {
  return client.request("/api/v1/itemSearch", {
    method: "POST",
    body: { advertiserId, query, itemIds }
  });
}

export async function getKeywordAnalytics(client: WalmartApiClient, advertiserId: number, itemIds: string[]) {
  return client.request("/api/v1/keywordAnalytics", {
    method: "POST",
    body: { advertiserId, itemIds }
  });
}

export async function getSuggestedKeywords(client: WalmartApiClient, advertiserId: number, itemIds: string[]) {
  return client.request("/api/v1/keywords/suggested", {
    method: "GET",
    query: { advertiserId, itemIds: itemIds.join(",") }
  });
}

export async function getApiUsage(client: WalmartApiClient, advertiserId: number) {
  return client.request("/api/v1/api_usage_analyze", {
    method: "GET",
    query: { advertiserId }
  });
}

export async function getLatestReportDate(client: WalmartApiClient, advertiserId: number) {
  const result = (await client.request("/api/v1/api_usage_analyze", {
    method: "GET",
    query: { advertiserId }
  })) as { latestReportDate?: string };

  return {
    latestReportDate: result.latestReportDate ?? null,
    raw: result
  };
}
