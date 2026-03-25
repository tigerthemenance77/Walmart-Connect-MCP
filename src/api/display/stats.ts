import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetRealtimeStats(
  client: WalmartApiClient,
  advertiserId: number,
  campaignIds?: string[],
  adGroupIds?: string[]
) {
  const data = await client.request("/stats", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: {
      advertiserId,
      campaignIds: campaignIds?.join(","),
      adGroupIds: adGroupIds?.join(",")
    }
  });

  return {
    asOf: new Date().toISOString(),
    data
  };
}
