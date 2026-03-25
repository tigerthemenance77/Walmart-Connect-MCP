import type { WalmartApiClient } from "../client.js";

export async function getCampaigns(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { status?: string; name?: string }
) {
  return client.request("/api/v1/campaigns", {
    method: "GET",
    query: { advertiserId, status: filters.status, name: filters.name }
  });
}
