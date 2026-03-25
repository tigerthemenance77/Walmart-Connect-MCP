import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetAdGroups(client: WalmartApiClient, advertiserId: number, campaignId?: string) {
  return client.request("/adGroups", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, campaignId }
  });
}
