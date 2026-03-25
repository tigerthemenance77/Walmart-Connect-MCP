import type { WalmartApiClient } from "../client.js";

export async function getPlacements(client: WalmartApiClient, advertiserId: number, campaignId: string) {
  return client.request("/api/v1/placements", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}

export async function getPlacementMultipliers(client: WalmartApiClient, advertiserId: number, campaignId: string) {
  return client.request("/api/v1/multipliers/placements", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}

export async function getPlatformMultipliers(client: WalmartApiClient, advertiserId: number, campaignId: string) {
  return client.request("/api/v1/multipliers/platforms", {
    method: "GET",
    query: { advertiserId, campaignId }
  });
}
