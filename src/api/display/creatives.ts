import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetCreatives(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { folderId?: string; name?: string }
) {
  return client.request("/creatives", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, folderId: filters.folderId, name: filters.name }
  });
}

export async function displayGetCreativePreview(client: WalmartApiClient, advertiserId: number, creativeId: string) {
  return client.request(`/creatives/${creativeId}/preview`, {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId }
  });
}

export async function displayGetCreativeAssociations(
  client: WalmartApiClient,
  advertiserId: number,
  adGroupId?: string
) {
  return client.request("/creativeAssociations", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, adGroupId }
  });
}
