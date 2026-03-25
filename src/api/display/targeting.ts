import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetTargeting(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { tactic?: string; audienceType?: string }
) {
  return client.request("/targeting", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, tactic: filters.tactic, audienceType: filters.audienceType }
  });
}

export async function displayGetGeoLocations(client: WalmartApiClient, advertiserId: number, search?: string) {
  return client.request("/targeting/geo", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, search }
  });
}
