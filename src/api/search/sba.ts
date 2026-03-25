import type { WalmartApiClient } from "../client.js";

export async function getSbaProfile(
  client: WalmartApiClient,
  advertiserId: number,
  campaignId: string,
  adGroupId: string
) {
  return client.request("/api/v1/sba_profile", {
    method: "GET",
    query: { advertiserId, campaignId, adGroupId }
  });
}

export async function getReviewStatus(client: WalmartApiClient, advertiserId: number) {
  return client.request("/api/v1/reviewStatus", {
    method: "GET",
    query: { advertiserId }
  });
}

export async function getMedia(client: WalmartApiClient, advertiserId: number) {
  return client.request("/api/v1/media", {
    method: "GET",
    query: { advertiserId }
  });
}
