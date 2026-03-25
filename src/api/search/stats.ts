import type { WalmartApiClient } from "../client.js";

export async function getRealtimeStats(client: WalmartApiClient, advertiserId: number, campaignId?: string) {
  return client.request("/api/v1/stats/campaigns", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}
