import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetCampaigns(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { status?: string; name?: string }
) {
  return client.request("/campaigns", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, status: filters.status, name: filters.name }
  });
}
