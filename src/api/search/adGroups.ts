import type { WalmartApiClient } from "../client.js";

export async function getAdGroups(client: WalmartApiClient, advertiserId: number, campaignId?: string) {
  return client.request("/api/v1/adGroups", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}
