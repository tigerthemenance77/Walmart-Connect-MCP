import type { WalmartApiClient } from "../client.js";

export async function getKeywords(client: WalmartApiClient, advertiserId: number, campaignId?: string) {
  return client.request("/api/v1/keywords", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}
