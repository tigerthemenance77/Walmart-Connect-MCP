import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetKeywords(client: WalmartApiClient, advertiserId: number, adGroupId?: string) {
  return client.request("/keywords", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, adGroupId }
  });
}
