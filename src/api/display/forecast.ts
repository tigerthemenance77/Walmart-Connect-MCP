import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetReachEstimate(
  client: WalmartApiClient,
  advertiserId: number,
  targeting?: string,
  startDate?: string,
  endDate?: string
) {
  return client.request("/forecast/reach", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, targeting, startDate, endDate }
  });
}

export async function displayGetDeliveryEstimate(
  client: WalmartApiClient,
  advertiserId: number,
  budget?: number,
  targeting?: string
) {
  return client.request("/forecast/delivery", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, budget, targeting }
  });
}
